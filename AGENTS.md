# AI Code Agent Guide — AnonBlood

## Project Overview

AnonBlood is a privacy-preserving blood donation coordination platform. It does **not** connect
blood seekers directly to individual donors. Instead, it acts as a **technology partner for
licensed facilities** — hospitals, hospital blood banks, Philippine Red Cross (PRC) chapters, and
LGU health offices — helping them broadcast verified blood needs and mobilize nearby eligible
donors to donate **at the facility itself**.

This shift matters for both legal and safety reasons: under **RA 7719** (National Blood Services
Act), the Philippine blood system is built around voluntary donation through licensed facilities.
Direct peer-to-peer matching — even unintentionally — creates risk of paid/coerced donation and
unscreened blood, and publishing a specific person's urgent need tied to a specific location
raises physical safety concerns for that person. Routing everything through a facility avoids
both problems and makes the project viable to pitch to PRC chapters, hospitals, or LGUs.

The system also integrates an AI-powered chatbot using Retrieval-Augmented Generation (RAG) to
answer blood donation questions based on a trusted knowledge base.

This document is the primary context for any AI coding agent working on this project. If a
section here conflicts with what you find in the actual codebase, the codebase wins — flag the
discrepancy and ask rather than silently picking one.

> **(demo/MVP scope):** the facility-routed model is confirmed as the only
> model to build — the direct-contact "connect" screen and `contactRevealService` from the
> build-prompt brief are **out of scope, not a fallback, not a fast-path for the demo**. To keep
> demo timelines realistic without touching that risk, facility onboarding itself is kept
> deliberately lightweight for now (see **Lightweight Facility Tier (Demo Scope)** below) rather
> than reaching for direct-contact as the shortcut. If a real hospital/PRC/LGU integration later
> needs something heavier than this tier, that's an additive change to facility verification, not
> a reason to reopen the contact-reveal question.

---

## Lightweight Facility Tier (Demo Scope)

Full facility verification (documentation review, formal PRC/hospital onboarding) is not
realistic on a demo timeline. For now:

- A facility account can be created with just: facility name, facility type, one admin contact
  email, and a manually-confirmed OTP on that email — no document upload, no admin review queue
  required to get a facility functional for the demo.
- This is a **real account tier**, not a stub/fake facility — it still gates request broadcasting
  (only requests linked to a facility account get sent to donors) and still keeps seeker contact
  info out of the donor pool. It just skips the heavier document-verification step for now.
- Mark this tier explicitly in the schema (e.g. `facility.verification_tier: "light" | "full"`)
  so it's easy to find and upgrade later — don't silently treat every facility as fully verified.
- Do not use this lighter bar as a reason to loosen any Privacy First rule — a light-tier facility
  still only sees what a facility role is allowed to see, same as a fully-verified one.
- When there's time post-demo, add the fuller facility verification track (documentation, admin
  review) described in Verified Facilities above — this tier is a stepping stone, not a
  replacement for it.

---

## Tech Stack

- **Backend:** Supabase (Postgres database, Auth, Row Level Security, and email handling all live
  here — see Notification System below).
- **RAG:** Zilliz (vector store) + OpenAI (embeddings and/or completion model).
- **Package manager:** npm.
- **Frontend framework/language:** Vite React
> Agent note: since Supabase provides Auth and Postgres directly, prefer Supabase's built-in
> mechanisms (RLS policies, Supabase Auth, Supabase client libraries) over hand-rolled
> auth/session/query logic. Don't introduce a second ORM or a competing auth layer — check for an
> existing Supabase client/service wrapper before adding a new one.

---

## System Actors

- **Seeker** — can browse anonymized, general blood-need context (e.g. facility locations with
  active needs) without an account; submitting a request requires at least an email to be
  reached back. Never required to create a full account unless a specific flow needs it.
- **Donor** — must sign up, log in, and pass at least light verification to appear in
  facility-broadcast matching.
- **Facility** — hospital, blood bank, PRC chapter, or LGU health office; must complete its own
  verification track before it can post/broadcast a request (see Verified Facilities).
- **Admin** (internal, not public-facing) — reviews strong verification submissions (donor ID
  uploads, facility documentation) and monitors abuse reports. Define this role's own dashboard
  and permissions rather than reusing facility or donor permission checks.
- **System** — background jobs: eligibility-window resets (flipping `availability_status` back to
  available after the medically-required interval), request expiry/fallback to the next
  compatible donor, notification dispatch.

---

## Project Objectives

The system aims to:

- Replace Facebook-based blood requests with a structured platform.
- Route blood requests through licensed facilities (hospitals, blood banks, PRC chapters, LGU
  health offices) rather than connecting seekers directly to individual donors.
- Protect donor and seeker privacy at every stage.
- Notify nearby verified donors of a facility's need, and direct them to donate at that facility.
- Provide AI assistance for blood donation information, including basic privacy/legal FAQs
  (see AI Safety below).
- Maintain a modern, secure, and scalable architecture.

---

## Core Principles

### Facility-Routed Model (not peer-to-peer)

- Seekers do not submit a request "into the open" for any donor to see and contact directly.
  A request is associated with a **partner facility** (hospital, blood bank, PRC chapter, or LGU
  health office) that the seeker selects or is routed to based on area/hospital.
- Donors are notified of a facility's need and, upon accepting, are directed to **donate at that
  facility** — not to meet or contact the seeker.
- The seeker never needs to be identifiable to the donor pool, and in the common case does not
  need to be identifiable to the individual donor at all, since the donation happens at the
  facility rather than between the two parties directly. Whether the facility itself needs the
  seeker's contact info (e.g. hospital confirming a specific patient's request) is a workflow
  detail to confirm with each partner — don't assume donor-facing contact reveal is required.
- If a future workflow genuinely requires seeker↔donor contact exchange (e.g. a facility opts
  into that model), treat it as an explicit opt-in exception per-facility, not the default — ask
  before building it, and re-read this section's assumptions before doing so.

### Privacy First

Never expose donor personal information to seekers, other donors, or the public. Before any
acceptance/confirmation step, the following must remain hidden:

- **Donor side** (never shown to seekers or other donors): name, email, phone number, address,
  personal profile.
- **Seeker side** (never shown to the general donor pool browsing/matched requests): the seeker's
  email and phone number collected on the Blood Request form. Donors see only the general request
  details routed through the facility (blood type, urgency, facility name, area/city, units
  needed, notes) — enough to decide whether to go donate, not enough to contact the seeker
  directly.
- **Facility side:** a facility account may need to see more request detail than an individual
  donor would (to actually process the request) — define this access level explicitly per
  facility role rather than reusing donor-level visibility rules.

Only general request information should ever be visible to donors browsing the map/dashboard —
blood type needed, urgency, general area, facility name — never an exact address or seeker
identity that would deanonymize them.

### Verified Donors

Only authenticated and verified donors should receive blood requests. Anonymous users cannot
access donor information. Verification is two-tiered:

- **Light verification** (minimum bar for everyone, ideally completed at signup rather than
  blocking mid-flow): confirm email or phone via a one-time code (OTP).
- **Strong verification** (optional, encouraged): ID upload reviewed by an admin, resulting in a
  "Verified ✓" badge shown on the donor's card/profile.

Facility-broadcast matching requires at least light verification. Whether strong verification is
ever required (vs. just badge-worthy) is a product decision to confirm before enforcing it as a
gate.

### Verified Facilities

Facility/partner accounts (hospital, blood bank, PRC chapter, LGU health office) require their
own verification step before they can post a request that gets broadcast to donors — this is a
separate verification track from donor verification and should not reuse the same checks or
flags.

### Data Privacy & Consent (RA 10173)

Blood type is health-related information and counts as **sensitive personal information** under
the Data Privacy Act (RA 10173), carrying heavier compliance requirements than ordinary fields
like name or email — this applies from first collection, even at prototype stage with real users.

- Sign-up must include a clear **Privacy Policy and Consent Form** explaining what data is
  collected, why, how it's stored, and who can access it (donor, seeker, and facility roles all
  need this, since each sees different data).
- If the platform collects IDs or selfies for verification, treat that as sensitive data too:
  define a storage plan and a deletion timeline post-approval — do not retain it indefinitely by
  default.
- Consult NPC (National Privacy Commission) guidelines when designing consent flows and data
  retention; document decisions here once confirmed rather than leaving them implicit in code.

### AI Safety

The chatbot is **only** a blood donation information assistant. It should answer questions about:

- Blood donation eligibility
- Blood compatibility
- Donation process, preparation, and recovery
- Blood types
- General blood donation FAQs
- At a basic, non-legal-advice level: what the Data Privacy Act and NPC guidelines mean for how
  the app handles blood type / health data, and how the verification process works — framed as
  general information, not a legal opinion

It must never:

- Diagnose diseases or interpret symptoms
- Recommend medications or dosages
- Replace medical professionals
- Give unsafe or individualized medical advice
- Give definitive legal advice on privacy compliance — point to the Privacy Policy or suggest
  contacting the platform's own compliance contact instead

**Emergency handling:** if a user's message suggests a medical emergency (e.g. active bleeding,
fainting, chest pain), the bot's first priority is to direct them to emergency services or a
medical professional immediately — it should not attempt to answer the donation question in that
turn.

**Out-of-scope handling:** if a question falls outside blood donation topics, the bot should say
so plainly and decline, rather than answering from general knowledge. Log/flag repeated
out-of-scope probing so it can be reviewed for prompt-injection attempts against the RAG context.

**Public mode (no login):** answers general, database-grounded questions (e.g. nearest partner
facility, blood type compatibility, minimum donation weight) grounded in the app's own
`blood_banks`/facility data and stored reference content (WHO/Red Cross/DOH guidance) — not the
model's general knowledge — so location-based answers stay accurate to actual registered
facilities. No access to any individual user's data in this mode.

**Authenticated mode (logged-in donor):** same general Q&A, plus personalized questions scoped
strictly to that donor's own record (e.g. "Can I donate next month?", "When was my last
donation?"). It must reuse the eligibility service's own logic/data (`last_donation_date`,
`next_eligible_date`) rather than re-deriving the rule, so the answer always matches what the
donor's own dashboard/availability toggle shows. It must never accept a request that could
return another user's data, even indirectly through a cleverly phrased question.

**aiAssistantService** (implementation shape): classifies whether a question needs public data,
personal data, or is out of scope; for personal-data questions, calls the same backend
services/endpoints a logged-in donor would use rather than a separate raw DB query path, so
permission checks stay centralized; for public questions, retrieves from `blood_banks`/facility
data and stored reference content. Log assistant queries and answers for review, same as other
request/match events.

---

## System Workflow

### Blood Seeker

Landing Page → Select or Confirm Partner Facility (hospital / blood bank / PRC chapter / LGU
health office) → Blood Request Form → Request Stored, Linked to Facility → Facility Verifies
Request → Matching Nearby Verified Donors Notified by Email ("Facility X needs blood type Y") →
Donor Accepts → Donor Directed to Donate at Facility → Facility Confirms Donation → Donation
History Updated

### Donor

Login → Dashboard → Incoming Requests (shown as facility + need, not seeker identity) → Accept /
Reject → Directed to Facility Location/Hours → Donation History Updated

### Facility / Partner (new role)

Facility Registration & Verification → Facility Dashboard → Post/Manage Blood Requests → View
Incoming Donor Acceptances → Confirm Completed Donations → Facility Profile Management

---

## Major Features

### Landing Page

- Interactive map, defaulting to the seeker's approximate location (browser geolocation, with
  manual city/area entry as a fallback if permission is denied).
- Display facility locations with active needs (not donor hotspots — donors are not
  individually pinpointed on a public map). Any location shown — facility or aggregate donor
  count — must be fuzzed to the nearest barangay/district centroid, never an exact coordinate.
- Show approximate count of verified donors in an area, if shown at all — never named/pinpointed
  donor identities; use a `display_id` (e.g. "Donor #482") anywhere an individual donor needs to
  be referenced pre-verification.
- A toggle between map view and a sortable table view (distance, blood type, last-active date)
  showing the same anonymized information.
- Filters: blood type needed — driving compatibility matching (e.g. a request for O+ also
  surfaces O- donors as compatible), not a literal string match — distance radius, availability
  status.
- Includes the AI assistant chat widget (public mode by default, personalized mode once logged
  in — see AI Safety / AI Assistant Implementation below).

### Authentication

Supports registration, login, logout for **two account types**: Donor and Facility. (Seekers may
or may not require a full account depending on final flow — confirm before assuming seeker
accounts exist as a third role.)

Donor registration requires: Full Name, Email, Blood Type, Password. Additional profile info can
be completed later.

Facility registration requires: Facility Name, Facility Type (hospital/blood bank/PRC
chapter/LGU health office), Contact Person, Email, Password, and documentation supporting
verification (specifics TBD — confirm before building the verification pipeline).

### Donor Dashboard

- Incoming Requests (facility + need details, no seeker identity)
- Nearby Requests
- Donation History
- Profile Management

### Facility Dashboard

- Active Requests Posted
- Donor Acceptances per Request
- Mark Donation Completed
- Facility Profile Management

### Blood Request

Fields: Blood Type Needed, Urgency Level, Facility (selected from verified partner list), Area/
City, Units Needed, Seeker Email, Seeker Phone Number, Additional Notes.

The seeker's Email and Phone Number are protected under the **Privacy First** rules above — never
included in any API response or UI view visible to the donor pool. Whether the linked facility
itself can see this field is a per-facility-role decision, not a default — confirm before
exposing it even at the facility level.

### Notification System

Email is handled through Supabase (Auth emails and/or Supabase Edge Functions triggering
outbound email — confirm which mechanism is actually wired up before extending it, and document
it here once confirmed). Do not add a separate raw Gmail SMTP/API integration alongside this
unless there's a specific reason Supabase's path can't cover it.

Triggers: new blood request created and verified by facility; donor accepts a request; facility
confirms a completed donation.

### Privacy Flow

**Seeker → Facility:** seeker's request (including contact info) goes to the linked facility;
contact info is never broadcast to the donor pool.
**Facility → Donor pool:** only general request details (blood type, urgency, facility, area,
units) are visible to matched donors.
**Donor → Facility:** upon acceptance, donor is directed to the facility to donate; facility
handles on-site verification and collection per its own existing processes.

---

## Backend Services

Named services to implement (agents: check for existing implementations under these or similar
names before creating new ones):

- **matchingService** — blood type compatibility matrix + distance/area filtering against
  facility-linked requests; falls back to the next closest compatible donor on decline/expiry.
- **eligibilityService** — computes and enforces `next_eligible_date` from WHO/DOH minimum
  donation-interval guidance (commonly ~12 weeks for whole blood); flips `availability_status`
  automatically via a scheduled job. Donors can manually mark themselves unavailable at any time
  but cannot override the medical eligibility window.
- **notificationService** — sends anonymized request/response emails (and push, if a PWA);
  templates must never include real names, emails, or phone numbers.
- **verificationService** — OTP generation/validation for light verification; ID/documentation
  upload intake + admin review queue for strong verification (donor and facility tracks kept
  separate).
- **rateLimiter middleware** — per-identifier (email/phone/IP) daily cap on request submissions;
  show a clear in-app message on the limit being hit rather than a silent failure.
- **aiAssistantService** — see AI Assistant Implementation Notes above.
- ~~**contactRevealService**~~ — the build-prompt brief's proposed choke point for revealing real
  contact info between seeker and donor post-verification. **Do not build this as specified** —
  it implements the direct-contact model that was explicitly decided against (see resolution note
  at the top of this document) in favor of the Facility-Routed Model. If a facility-routing
  equivalent is needed (e.g. surfacing seeker contact to the *facility*, not the donor), name and
  scope it separately and confirm the access rule with the product owner first.

---

## Data Model (key entities)

> Fill in once the schema exists; keep this current as migrations change it. At minimum list:

- **User** — shared auth identity for donors; likely fields: `id`, `role`, `full_name`, `email`,
  `phone`, `blood_type`, `location` (barangay/city + lat/long, fuzzed for any public-facing use),
  `availability_status`, `last_donation_date`, `next_eligible_date`, `is_verified`,
  `verification_method` (email/phone/id), `verified_at`, `display_id`.
- **Facility** (may be the same table as a `blood_banks` partner-facility list, or a distinct
  one — confirm before introducing a second table for the same concept) — facility type,
  verification status, location, contact person, active status.
- **BloodRequest** — linked facility (not linked directly to a specific donor for contact
  purposes), seeker contact info (protected per Privacy First), blood type, urgency, units
  needed, notes, status (open/matched/fulfilled/expired), `expires_at`.
- **RequestMatch** — links a request to a notified/accepting donor: `status`
  (notified/accepted/declined/expired), `notified_at`, `responded_at`, and facility confirmation
  of completed donation. Note: do **not** add a `contact_revealed`/`revealed_at` pair implying
  seeker↔donor contact reveal — that model was explicitly decided against (see resolution note
  at the top of this document).
- **DonationHistory** — past accepted/completed donations per donor, linked to facility:
  `donation_date`, `blood_bank_id`/`facility_id`, `volume_ml`.

Agents should search for the actual Supabase tables/migrations before assuming this shape — check
the `supabase/migrations` folder (or equivalent) rather than inferring schema from application
code. In particular, confirm whether a `Facility` table already exists or still needs to be
introduced as part of this architecture shift — this is a schema change from any prior
donor-to-seeker-direct design, so check migration history for what's actually been built so far.

---

## Environment & Secrets

- Never commit `.env` files, API keys, or service account credentials.
- Known secrets that must come from environment variables, never hardcoded:
  - Supabase URL + anon/public key (client-side safe) and Supabase service role key (server-side
    only — must never reach the frontend bundle or be used in client-callable code)
  - Zilliz endpoint + API key
  - OpenAI API key
- Use Supabase RLS policies as the actual enforcement layer for privacy rules (hidden donor/seeker
  fields, facility-only fields), not just conditional rendering in the frontend — the API/DB layer
  must refuse to return the data, not just the UI hide it.
- If a new integration needs a secret, add it to `.env.example` with a placeholder value and
  document it here — don't just wire it into code silently.

## Rate Limiting & Abuse Prevention

- Blood request submission should be rate-limited per seeker identifier (email/phone/IP) — e.g. a
  daily cap — to prevent spam requests flooding facility/donor inboxes. Show a clear in-app
  message when the cap is hit rather than a silent failure.
- Chatbot endpoints should be rate-limited to prevent scraping the knowledge base or abuse of the
  LLM API.
- Facility posting should be rate-limited/reviewed too, since a compromised or fake facility
  account posting requests is a new risk introduced by this model — verification alone may not
  be sufficient ongoing protection.
- If a donor takes no action on a notified match within a configurable window (e.g. 2 hours for
  urgent requests), the system should auto-expire that match and notify the next closest
  compatible donor — decide and document the actual window(s) here once confirmed.

---

## Expected AI Agent Behavior

When modifying code:

- Prefer extending existing components instead of rewriting them.
- Maintain current project architecture; follow existing naming conventions.
- Avoid introducing unnecessary dependencies; reuse services whenever possible.
- Keep components modular; do not duplicate business logic.
- Preserve backwards compatibility unless explicitly instructed otherwise.
- Explain significant architectural changes **before** implementing them.
- If requirements are ambiguous — especially anything touching privacy/visibility rules or the
  facility-routing model — ask for clarification instead of making assumptions.
- If existing code still implements direct donor-to-seeker contact reveal, flag it explicitly
  as inconsistent with this document rather than silently leaving it in place or silently
  removing it — this is a real architecture change and needs a deliberate migration, not a quiet
  patch.

## Code Style

Priorities: Readability → Maintainability → Type Safety → Security → Performance.

Prefer: small reusable functions, strong typing, clear variable names, early returns, consistent
formatting.

Avoid: large monolithic components, magic values, duplicate code, unnecessary nested conditionals.

## Security Rules

- Always validate authentication, authorization, and input data. Never trust client input.
- Sanitize search input, forms, and uploaded files.
- Protect email addresses, phone numbers, and user IDs — treat them as sensitive at the API and
  logging layer, not just the UI layer.
- Never leak sensitive information (donor/seeker/facility PII, tokens, stack traces) in logs or
  API responses.

## Database Rules

- Do not remove migrations or destructively modify production data.
- Prefer new migrations, soft deletes where appropriate, foreign key constraints, indexed lookup
  fields.

## API Guidelines

RESTful endpoints, consistent response format.

Success:
```json
{ "success": true, "message": "Request submitted successfully.", "data": {} }
```

Error:
```json
{ "success": false, "message": "Validation failed.", "errors": {} }
```

## Frontend Guidelines

Prioritize responsive design, accessibility (target at least WCAG 2.1 AA), clear loading states,
error handling, and skeleton loaders where appropriate. Avoid blocking UI operations.

## Git Guidelines

Prefer small, focused commits:

- `feat: add facility verification flow`
- `fix: correct request acceptance workflow`
- `refactor: simplify notification service`
- `docs: update API documentation`

PRs touching privacy/visibility logic, or the facility-routing model, must call that out
explicitly in the description.

## Performance

Avoid N+1 queries, duplicate API calls, unnecessary rerenders, large bundle increases. Use
pagination, lazy loading, query optimization, and caching where appropriate.

## Testing Expectations

New features should include validation tests, API tests, permission tests, happy-path tests, and
edge cases. Any feature touching donor/seeker/facility visibility rules must include a test that
verifies hidden fields are actually absent from the API response for the relevant role — not just
hidden in the UI. Facility-role tests should confirm a facility account cannot see another
facility's requests or another facility's donor acceptance data.

---

## AI Agent Checklist (before proposing changes)

1. Understand the existing architecture — search for existing implementations before creating new
   ones.
2. Reuse existing utilities whenever possible; follow project conventions.
3. Preserve the facility-routing model — requests are never broadcast for direct donor-to-seeker
   contact; donors donate at the facility.
4. Preserve privacy-first behavior — do not expose donor identity, seeker contact info, or
   facility-internal data to a role that shouldn't see it.
5. Keep the RAG chatbot limited to blood donation knowledge (plus basic, non-legal-advice privacy/
   verification FAQs); keep emergency/out-of-scope handling intact.
6. If requirements are ambiguous, ask for clarification instead of assuming — especially anything
   that would reintroduce direct donor-seeker contact.

When proposing code:

- Explain the reasoning.
- List affected files.
- Highlight potential side effects, especially around privacy/visibility, the facility-routing
  model, and notification triggers.
- Prefer incremental, reviewable changes over large rewrites.

## Screens to Build

1. Landing / discovery (map + table, public, no login) — includes the AI assistant chat widget.
2. Blood request form (seeker submits against a facility, not an individual donor).
3. Request confirmation (seeker-side, post-submit).
4. Donor signup / login (OTP-based).
5. Donor profile setup (blood type, location, availability).
6. Donor dashboard (incoming facility-broadcast requests, accept/decline, verification status,
   availability toggle, donation history).
7. Facility signup / login and verification submission.
8. Facility dashboard (post/manage requests, view donor acceptances, confirm completed donations).
9. Verification screen (OTP entry; ID/documentation upload for strong verification — donor and
   facility tracks separate).
10. Donation logging / fulfillment screen (facility confirms a donation happened).
11. (Internal) Admin review queue for strong verification submissions and abuse reports.

Note: the build-prompt brief's "contact exchange / connect screen" is **not** in this list, and
is not planned — see the resolution note at the top of this document. Do not build it, including
as a "temporary" demo shortcut.

## Build Priorities (suggested order — demo scope)

1. Anonymized discovery (map + table), no login.
2. Donor signup + light (OTP) verification + profile setup.
3. Facility signup at the **Lightweight Facility Tier** (see above) — name, type, admin email,
   OTP. Skip document upload/admin review for now; that's a post-demo addition, not a blocker.
4. Request submission (linked to facility) + matching + anonymized notification to donors.
5. Accept/decline handling, including fallback to the next donor on decline/expiry.
6. Eligibility service (donation interval enforcement) + rate limiting.
7. Donation logging and facility-side fulfillment flow.
8. AI assistant — public database-grounded Q&A first, then authenticated personalized eligibility
   Q&A once the eligibility service is stable.
9. *(post-demo)* Full facility verification tier (documentation upload + admin review queue) and
   donor strong verification (ID upload + admin review).

The direct-contact "connect" screen is not on this list at any priority level — see the
resolution note at the top of this document.

---

## Out of Scope (non-goals)

- The chatbot is not a substitute for medical triage or diagnosis, nor for legal advice on data
  privacy compliance.
- The platform does not store or process actual medical records beyond blood type and donation
  history.
- The platform does not facilitate direct donor-to-seeker contact or in-person meetups outside of
  a partner facility's premises.
