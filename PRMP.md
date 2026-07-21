# Build prompt: blood donor matching app

Copy everything below into your AI web builder as the project brief. Our tech stack is already decided — build against it, this prompt covers the full system flow, screens, states, and rules.

---

## Project overview

Build a web application that connects people who urgently need blood ("seekers") with nearby registered blood donors. Seekers can open the app without an account and browse donors on a map or in a table. Donors must sign up and log in to appear in search results. Both parties stay anonymous until they are mutually verified — no real name, email, or phone number is shown to the other party until then.

Guiding reference sources for medical/eligibility logic: WHO blood donation guidelines, Red Cross donor eligibility criteria, and Philippine DOH blood donation standards.

---

## System actors

- **Seeker** — unauthenticated by default; can optionally verify to build trust.
- **Donor** — must sign up, log in, and pass at least light verification to appear in search results.
- **Admin** (internal, not public-facing in v1) — reviews strong verification submissions, monitors abuse reports.
- **System** — background jobs: eligibility resets, request expiry, notification dispatch.

---

## Full end-to-end flow

### 1. Seeker lands on the app (no login)
- Landing page loads a map centered on the seeker's approximate location (browser geolocation, with manual city/area entry as a fallback if permission is denied).
- Donors within the default radius (e.g. 10 km) render as anonymized pins, color-coded by blood type or availability — never by exact address. Pin position is fuzzed to the nearest barangay/district centroid, not the donor's real coordinates.
- A toggle switches between map view and table view. Table view shows the same anonymized donor list sortable by distance, blood type, and last-active date.
- Filters: blood type needed (drives a compatibility match, not a literal string match — e.g. a request for O+ also surfaces O- donors), distance radius, availability status.
- Each donor card/pin shows: `display_id` (e.g. "Donor #482"), blood type, approximate distance, availability status, verification badge if strongly verified. No name, no contact info, no exact location.

### 2. Seeker submits a request
- Seeker taps "Request" on a donor card → opens a request form.
- Form fields: seeker email (required — this is how they'll be reached back), seeker phone (optional), urgency level (e.g. within hours / within a day / planning ahead), hospital or facility name, units needed, short note.
- On submit: system creates a `requests` row and a `request_matches` row linking it to the selected donor, status `notified`. The seeker is NOT shown the donor's contact info at this point, and the donor is NOT shown the seeker's contact info either — only anonymized request details.
- Rate limiting: cap requests per seeker identifier (email/phone/IP) per day to block spam. If exceeded, show a clear in-app message rather than a silent failure.
- Confirmation screen tells the seeker their request was sent and that they'll be notified by email when the donor responds. No further action needed from the seeker at this stage.

### 3. Donor receives a notification
- Donor gets an email (and push notification if the PWA is installed) containing only anonymized info: blood type needed, urgency level, general hospital area, distance band (e.g. "within 3 km") — never the seeker's name or contact details.
- Notification links to the donor's dashboard, where the pending request appears as a card with Accept / Decline actions.
- If the donor takes no action within a configurable window (e.g. 2 hours for urgent requests), the system can auto-expire that match and notify the next closest compatible donor — decide and document this fallback behavior explicitly in the build.

### 4. Donor responds
- **Decline:** `request_matches.status` → `declined`. Seeker is not notified of who declined, only that the system is trying the next available donor (avoids exposing donor identity even indirectly).
- **Accept:** `request_matches.status` → `accepted`. This does NOT immediately reveal contact info — it moves both accounts into the verification gate (step 5).

### 5. Verification gate
- Before any contact info is exchanged, check both the seeker's and the donor's verification status.
- **Light verification** (minimum bar for everyone, ideally completed at signup/first request rather than blocking mid-flow): confirm email or phone via a one-time code.
- **Strong verification** (optional, donor-recommended): ID upload or manual admin review, resulting in a "Verified ✓" badge.
- If either party hasn't completed at least light verification yet, prompt them to complete it now before proceeding — this should feel like a quick, low-friction step (OTP entry), not a wall.
- Once both sides clear light verification, proceed to contact reveal. Log the reveal event (who, whom, when) for auditability.

### 6. Contact exchange
- Both seeker and donor now see each other's real name, email, and phone in a dedicated "connect" screen — this is the only screen in the app where this data is ever shown.
- Provide a "Mark as fulfilled" or "Cancel request" action so both sides can close out the request and free the donor back to "available" once the donation is arranged or completed.
- On fulfillment, prompt the donor to log the donation (date, blood bank if known) — this feeds the eligibility service.

### 7. Post-donation eligibility reset
- When a donation is logged, the system calculates the donor's next-eligible date based on WHO/DOH minimum interval guidance (commonly ~12 weeks for whole blood) and automatically sets `availability_status` to "resting" until that date passes, at which point a background job flips them back to "available".
- Donor can manually override their availability status at any time (e.g. temporarily unavailable for personal reasons), but cannot override the medical eligibility window.

---

## AI assistant (landing page)

Add a chat widget on the landing page, available to everyone, with two modes depending on auth state.

### Public mode (no login)
- Answers general, database-grounded questions — e.g. "Where's the nearest blood donation center?", "What blood types can O- donate to?", "What's the minimum weight to donate?"
- Answers must be grounded in the app's own data (the `blood_banks` table) and vetted reference content (WHO/Red Cross/DOH guidelines you've stored, not the model's general knowledge), so location-based answers stay accurate to actual centers in the database rather than invented ones.
- The assistant has no access to any individual user's data in this mode — it cannot look up or discuss a specific person's donation history, requests, or account status here.

### Authenticated mode (logged-in donor)
- Same general Q&A, plus personalized questions scoped strictly to the logged-in user's own record — e.g. "Can I donate blood next month?", "When was my last donation?", "Am I eligible right now?"
- To answer eligibility questions, the assistant looks up that user's `last_donation_date` and `next_eligible_date` from the `users` table and reasons over it against the donation-interval rule already enforced by the eligibility service — it should reuse that same logic/service rather than re-deriving the rule itself, so the answer always matches what the rest of the app shows (e.g. their availability toggle state).
- The assistant must only ever query the data of the user who is currently logged in — never accept a request that could return another user's blood type, donation history, or verification status, even indirectly through a cleverly phrased question.
- If asked something outside its scope (medical diagnosis, anything about another named user, anything requiring real-time external info it doesn't have), it should say so plainly rather than guessing.

### Implementation notes
- Add an `aiAssistantService` that: (1) classifies whether a question needs public data, personal data, or is out of scope; (2) for personal-data questions, calls the same backend services/endpoints a logged-in user would use (not a separate raw DB query path) so permission checks stay centralized; (3) for public questions, retrieves from `blood_banks` and a stored reference-content table rather than answering from unguided model knowledge.
- Log assistant queries and answers for review, same as other request/match events, so mistakes can be audited.

---

## Data model

**users**
`id (uuid, PK)`, `role (donor/seeker/admin)`, `full_name`, `email`, `phone`, `blood_type`, `birthdate`, `gender`, `weight_kg`, `barangay`, `city`, `latitude`, `longitude`, `availability_status`, `last_donation_date`, `next_eligible_date`, `is_verified` (bool), `verification_method` (email/phone/id), `verified_at`, `display_id`, `created_at`

**requests**
`id (uuid, PK)`, `seeker_name`, `seeker_email`, `seeker_phone`, `blood_type_needed`, `units_needed`, `urgency_level`, `hospital_name`, `notes`, `status`, `is_verified` (bool, seeker), `created_at`, `expires_at`

**request_matches**
`id (uuid, PK)`, `request_id (FK)`, `donor_id (FK)`, `status` (notified/accepted/declined/expired), `notified_at`, `responded_at`, `contact_revealed` (bool), `revealed_at`

**donations**
`id (uuid, PK)`, `donor_id (FK)`, `blood_bank_id (FK, nullable)`, `donation_date`, `volume_ml`

**blood_banks** (optional, later phase)
`id (uuid, PK)`, `name`, `type`, `address`, `contact_email`, `contact_phone`

---

## Backend services to implement

- **matchingService** — blood type compatibility matrix + distance radius filtering; falls back to the next closest compatible donor on decline/expiry.
- **eligibilityService** — computes and enforces `next_eligible_date`; flips `availability_status` automatically via a scheduled job.
- **notificationService** — sends anonymized request/response emails and push notifications; templates must never include real names, emails, or phone numbers pre-verification.
- **verificationService** — OTP generation/validation for light verification; ID upload intake + admin review queue for strong verification.
- **rateLimiter middleware** — per-identifier daily request cap.
- **contactRevealService** — the single choke point that checks both parties' verification status and match acceptance before returning real contact fields; all other services/endpoints must never expose these fields directly.
- **aiAssistantService** — handles landing-page chat; routes public questions to `blood_banks`/reference content, routes personal questions through existing authenticated services (never a raw DB shortcut), and refuses anything scoped to another user or outside its remit.

---

## Screens to build

1. Landing / donor discovery (map + table, public, no login) — includes the AI assistant chat widget, public mode by default and personalized mode when logged in.
2. Request form (submitted against a selected anonymized donor).
3. Request confirmation (seeker-side, post-submit).
4. Donor signup / login (OTP-based).
5. Donor profile setup (blood type, location, availability).
6. Donor dashboard (incoming requests, accept/decline, current verification status, availability toggle, donation history).
7. Verification screen (OTP entry; ID upload for strong verification).
8. Contact exchange / "connect" screen (only reachable post-verification and post-accept).
9. Fulfillment / donation logging screen.
10. (Internal) Admin review queue for strong verification submissions and abuse reports.

---

## Anonymization and safety rules (must-follow, apply to every endpoint and screen)

- Never expose exact coordinates — always fuzz to barangay/district centroid on the map and in any API response.
- Never return `full_name`, `email`, or `phone` in any API response unless the request comes from the `contactRevealService` after both verification and acceptance checks pass.
- Use `display_id` everywhere in public or pre-verification views, on both the donor and seeker side.
- Log every contact-reveal event for auditability.
- Treat blood type, donation history, and location as sensitive data — restrict at the query layer, not just the UI layer, so this can't be bypassed via direct API calls.

---

## Build priorities (in order)

1. Anonymized donor discovery (map + table), no login.
2. Donor signup + light (OTP) verification + profile setup.
3. Request submission, matching, and anonymized notification to donor.
4. Accept/decline handling, including fallback to next donor on decline/expiry.
5. Verification gate + contactRevealService + connect screen.
6. Eligibility service (donation interval enforcement) + rate limiting.
7. Donation logging and fulfillment flow.
8. Strong verification (ID upload/admin review) and blood bank ties — later phase.
9. AI assistant — public database-grounded Q&A first, then authenticated personalized eligibility Q&A once the eligibility service is stable.
