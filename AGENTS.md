# AI Code Agent Guide — AnonBlood

## Project Overview

AnonBlood is a blood donor **discovery and matchmaking** platform. Its scope is deliberately
narrow: help a blood seeker find and get introduced to a compatible, willing donor. Everything
that happens after that introduction — arranging the actual donation, coordinating with the
seeker's hospital, screening, logistics, any exchange between the two parties — happens outside
the platform and is **not the platform's responsibility**.

This is a common real-world pattern in the Philippines: a patient's hospital often requires the
patient/family to bring in a replacement donor when blood bank stock is low. The seeker typically
already has a hospital relationship — what they're missing is a donor. This platform exists to
solve exactly that gap: **find the donor, introduce them to the seeker, stop there.** The
seeker takes it from there — including introducing the donor to their own hospital, where the
hospital (not this platform) handles screening, cross-matching, and the actual collection.

The system also integrates an AI-powered chatbot using Retrieval-Augmented Generation (RAG) to
answer blood donation questions based on a trusted knowledge base.

This document is the primary context for any AI coding agent working on this project. If a
section here conflicts with what you find in the actual codebase, the codebase wins — flag the
discrepancy and ask rather than silently picking one.

> **Scope decision (confirmed):** the platform is discovery/matchmaking only. Contact between a
> verified seeker and a verified donor **is** revealed once both sides opt in / accept — this is
> the intended core function, not a risk to design around. What happens after that reveal
> (whether/how the donor is introduced to the seeker's hospital, whether the donation happens at
> all, any arrangement between the two parties) is explicitly out of scope for the platform to
> track, mediate, or take responsibility for. Do not build hospital/facility accounts, facility
> verification, or facility dashboards — "hospital" is just a free-text field the seeker fills in
> about their own situation, not a platform-managed partner entity.

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

- **Seeker** — can browse anonymized donor discovery (map or table) without an account. Submitting
  a request requires at least an email to be reached back. Full account optional unless a
  specific flow needs it.
- **Donor** — must sign up, log in, and pass at least light verification to appear in discovery
  results and receive requests.
- **Admin** (internal, not public-facing) — reviews strong verification submissions (donor ID
  uploads) and monitors abuse reports.
- **System** — background jobs: eligibility-window resets (flipping `availability_status` back to
  available after the medically-required interval), request expiry/fallback to the next
  compatible donor, notification dispatch.

There is no Facility/partner actor or account type in this platform. A hospital name on a request
is descriptive text the seeker provides about their own situation, not a verified or managed
entity.

---

## Project Objectives

The system aims to:

- Replace Facebook-based blood requests with a structured discovery/matchmaking platform.
- Let a seeker find and get introduced to a compatible, willing donor.
- Protect both parties' privacy up until mutual verification and acceptance, at which point
  contact is intentionally revealed so they can coordinate directly.
- Provide AI assistance for general blood donation information.
- Maintain a modern, secure, and scalable architecture.
- Stay explicitly out of anything past the introduction — no responsibility for the donation
  itself, hospital coordination, or what the two parties arrange between themselves.

---

## Core Principles

### Discovery & Matchmaking Only

- The platform's job ends at introduction. It does not manage, verify, or take responsibility for
  hospitals, the actual blood donation, screening, or any arrangement between seeker and donor
  after contact is revealed.
- Don't build features that imply platform oversight of what happens post-match (e.g. a
  "donation confirmed by hospital" status, hospital accounts, facility dashboards) — those belong
  to a different product scope than this one.
- This scope should be reflected in user-facing copy too (e.g. Terms of Service, a short notice
  before contact reveal) — see **Liability & User Notices** below — so it's stated to users, not
  just implied by what the platform omits.

### Privacy Before Match, Contact Reveal After

- **Before a donor accepts a request:** neither side's real name, email, or phone number is
  shown to the other. Donors browsing discovery see only anonymized info (blood type, approximate
  distance/area, availability, verification badge). Seekers see only anonymized donor cards
  (`display_id`, blood type, distance, availability, verification badge) — no name or contact info.
- **Once a donor accepts a specific request (and both sides have at least light verification):**
  real contact info (name, email, phone) is revealed to both parties — this is the platform doing
  its job, not a leak to prevent. Log the reveal event (who, whom, when) for auditability, since
  it's still sensitive data changing hands even though the reveal itself is intended behavior.
- Never expose exact coordinates for either party — always fuzz to barangay/district centroid on
  the map and in any API response, even post-reveal (the reveal is about identity/contact info,
  not GPS-precise location).

### Verified Donors

Only authenticated and verified donors appear in discovery/matching. Verification is two-tiered:

- **Light verification** (minimum bar for everyone, ideally completed at signup rather than
  blocking mid-flow): confirm email or phone via a one-time code (OTP).
- **Strong verification** (optional, encouraged, badge-worthy): ID upload reviewed by an admin,
  resulting in a "Verified ✓" badge shown on the donor's card/profile.

Contact reveal requires at least light verification on **both** sides (seeker and donor) — this
is the platform's one real safety gate, so don't skip or weaken it even though the reveal itself
is intended.

### Data Privacy & Consent (RA 10173)

Blood type is health-related information and counts as **sensitive personal information** under
the Data Privacy Act (RA 10173), carrying heavier compliance requirements than ordinary fields
like name or email — this applies from first collection, even at prototype stage with real users.

- Sign-up must include a clear **Privacy Policy and Consent Form** explaining what data is
  collected, why, how it's stored, who can access it, and — specifically for this platform —
  that contact info *will* be shared with a matched counterpart once both sides verify and
  accept. Consent should cover that reveal explicitly, not just data collection in general.
- If the platform collects IDs or selfies for strong verification, treat that as sensitive data
  too: define a storage plan and a deletion timeline post-approval — do not retain it
  indefinitely by default.
- Consult NPC (National Privacy Commission) guidelines when designing consent flows and data
  retention; document decisions here once confirmed rather than leaving them implicit in code.

### Liability & User Notices

Since the platform takes zero responsibility for anything after contact reveal, that needs to be
stated to users, not just true in the architecture:

- Terms of Service should plainly state the platform's role ends at introduction — it does not
  vet, screen, supervise, or take responsibility for the actual donation, any in-person meeting,
  any hospital coordination, or any arrangement (including payment) between seeker and donor.
- Show a brief, plain-language notice at the contact-reveal step itself (not just buried in ToS)
  — e.g. reminding both parties that the platform's involvement ends here, and pointing to basic
  safety guidance (meet in safe/public or hospital settings, donation should happen through
  proper medical screening). This is a UX/copy requirement, not a legal opinion — get the actual
  wording reviewed by whoever owns legal/compliance for the project before shipping it.
- Don't let "zero responsibility" become an excuse to skip basic safety-oriented UX (the notice
  above, the verification gate, logging reveal events) — those are what make "matchmaking only"
  a defensible scope in the first place.

### AI Safety

The chatbot is **only** a blood donation information assistant. It should answer questions about:

- Blood donation eligibility
- Blood compatibility
- Donation process, preparation, and recovery
- Blood types
- General blood donation FAQs
- At a basic, non-legal-advice level: how the platform's verification and contact-reveal process
  works, framed as general information, not a legal opinion

It must never:

- Diagnose diseases or interpret symptoms
- Recommend medications or dosages
- Replace medical professionals
- Give unsafe or individualized medical advice
- Give definitive legal advice — point to the Privacy Policy/Terms or suggest contacting the
  platform's own compliance contact instead
- Imply the platform takes responsibility for what happens after a match (e.g. don't let it tell
  a user "the hospital will confirm this for you" or similar — that's outside what the platform
  actually does)

**Emergency handling:** if a user's message suggests a medical emergency (e.g. active bleeding,
fainting, chest pain), the bot's first priority is to direct them to emergency services or a
medical professional immediately — it should not attempt to answer the donation question in that
turn.

**Out-of-scope handling:** if a question falls outside blood donation topics, the bot should say
so plainly and decline, rather than answering from general knowledge. Log/flag repeated
out-of-scope probing so it can be reviewed for prompt-injection attempts against the RAG context.

**Public mode (no login):** answers general, database-grounded questions (e.g. blood type
compatibility, minimum donation weight, how the platform works) grounded in stored reference
content (WHO/Red Cross/DOH guidance) — not the model's general knowledge. No access to any
individual user's data in this mode.

**Authenticated mode (logged-in donor):** same general Q&A, plus personalized questions scoped
strictly to that donor's own record (e.g. "Can I donate next month?", "When was my last
donation?"). It must reuse the eligibility service's own logic/data (`last_donation_date`,
`next_eligible_date`) rather than re-deriving the rule, so the answer always matches what the
donor's own dashboard/availability toggle shows. It must never accept a request that could
return another user's data, even indirectly through a cleverly phrased question.

**aiAssistantService** (implementation shape): classifies whether a question needs public data,
personal data, or is out of scope; for personal-data questions, calls the same backend
services/endpoints a logged-in donor would use rather than a separate raw DB query path, so
permission checks stay centralized; for public questions, retrieves from stored reference
content. Log assistant queries and answers for review, same as other request/match events.

---

## System Workflow

### Seeker

Landing Page (anonymized map/table discovery, no login required) → Select a Donor → Request Form
→ Request Sent (anonymized) → Donor Accepts → Both Sides Verification-Gated (if not already
light-verified) → Contact Revealed → Seeker and Donor coordinate directly (including any hospital
introduction) — **platform's role ends here**.

### Donor

Login → Dashboard → Incoming Requests (anonymized seeker/request info) → Accept / Decline →
(if accepted) Verification Gate → Contact Revealed → Coordinates directly with seeker — platform's
role ends here. Optionally logs a completed donation afterward for their own history/eligibility
tracking.

---

## Major Features

### Landing Page

- Interactive map, defaulting to the seeker's approximate location (browser geolocation, with
  manual city/area entry as a fallback if permission is denied).
- Donors within a default radius (e.g. 10 km) render as anonymized pins, color-coded by blood
  type or availability — never by exact address. Pin position is fuzzed to the nearest
  barangay/district centroid, not the donor's real coordinates.
- A toggle between map view and a sortable table view (distance, blood type, last-active date)
  showing the same anonymized information.
- Filters: blood type needed — driving compatibility matching (e.g. a request for O+ also
  surfaces O- donors as compatible), not a literal string match — distance radius, availability
  status.
- Each donor card/pin shows: `display_id` (e.g. "Donor #482"), blood type, approximate distance,
  availability status, verification badge if strongly verified. No name, no contact info, no
  exact location.
- Includes the AI assistant chat widget (public mode by default, personalized mode once logged
  in — see AI Safety above).

### Authentication

Supports registration, login, logout for donors (OTP-based). Seekers may browse and submit a
request without a full account — confirm before assuming seekers need one for anything beyond
being reachable by email.

Donor registration requires: Full Name, Email, Blood Type, Password. Additional profile info can
be completed later.

### Donor Dashboard

- Incoming Requests (anonymized, pre-acceptance)
- Accept / Decline actions
- Verification status (light / strong)
- Availability toggle
- Donation History (self-logged, optional)
- Profile Management

### Blood Request

Fields: Blood Type Needed, Urgency Level, Hospital/Facility Name (free text — the seeker's own,
not a platform entity), Area/City, Units Needed, Seeker Email, Seeker Phone Number, Additional
Notes.

The seeker's Email and Phone Number are hidden from the donor **until that donor accepts the
specific request and both sides clear the verification gate** — see Privacy Before Match, Contact
Reveal After.

### Notification System

Email is handled through Supabase (Auth emails and/or Supabase Edge Functions triggering
outbound email — confirm which mechanism is actually wired up before extending it, and document
it here once confirmed). Do not add a separate raw Gmail SMTP/API integration alongside this
unless there's a specific reason Supabase's path can't cover it.

Triggers: new request submitted (anonymized notification to the matched donor); donor
accepts/declines; contact revealed to both parties.

### Verification Gate

- Applies once a donor accepts a specific request.
- If either party hasn't completed at least light verification yet, prompt them to complete it
  now (OTP entry) — this should feel like a quick, low-friction step, not a wall.
- Once both sides clear light verification, proceed to contact reveal. Log the reveal event (who,
  whom, when) for auditability.

### Contact Exchange

- Both seeker and donor now see each other's real name, email, and phone on a dedicated screen —
  this is the only screen in the app where this data is shown.
- Include the plain-language notice described in **Liability & User Notices** on this screen.
- Provide a "Mark as fulfilled" / "Cancel request" action so both sides can close out the request
  and free the donor back to "available." The platform does not verify that the donation actually
  happened — this is a self-reported status for the users' own convenience (e.g. donor's own
  history), not a claim the platform is vouching for.

### Post-Donation Eligibility Reset

- If a donor logs a donation, the system calculates their next-eligible date based on WHO/DOH
  minimum interval guidance (commonly ~12 weeks for whole blood) and sets `availability_status`
  to "resting" until that date passes, at which point a background job flips them back to
  "available."
- Donor can manually override their availability status at any time (e.g. temporarily
  unavailable for personal reasons), but cannot override the medical eligibility window.
- This is entirely self-reported by the donor — the platform has no way to confirm a donation
  happened and isn't trying to; it's a convenience feature for the donor's own tracking.

---

## Backend Services

Named services to implement (agents: check for existing implementations under these or similar
names before creating new ones):

- **matchingService** — blood type compatibility matrix + distance/area filtering; falls back to
  the next closest compatible donor on decline/expiry.
- **eligibilityService** — computes and enforces `next_eligible_date` from WHO/DOH minimum
  donation-interval guidance; flips `availability_status` automatically via a scheduled job.
- **notificationService** — sends anonymized request/response emails (and push, if a PWA);
  templates must never include real names, emails, or phone numbers pre-reveal.
- **verificationService** — OTP generation/validation for light verification; ID upload intake +
  admin review queue for strong verification.
- **rateLimiter middleware** — per-identifier (email/phone/IP) daily cap on request submissions;
  show a clear in-app message on the limit being hit rather than a silent failure.
- **contactRevealService** — the single choke point that checks both parties' verification status
  and match acceptance before returning real contact fields; all other services/endpoints must
  never expose these fields directly. This service's *purpose* is to reveal contact info once
  gates are cleared — it is intended platform behavior here, not something to avoid building.
- **aiAssistantService** — see AI Safety above.

---

## Data Model (key entities)

> Fill in once the schema exists; keep this current as migrations change it. At minimum list:

- **User** — shared auth identity for donors: `id`, `role`, `full_name`, `email`, `phone`,
  `blood_type`, `location` (barangay/city + lat/long, fuzzed for any public-facing use),
  `availability_status`, `last_donation_date`, `next_eligible_date`, `is_verified`,
  `verification_method` (email/phone/id), `verified_at`, `display_id`.
- **Request** — `seeker_name`, `seeker_email`, `seeker_phone` (protected pre-reveal),
  `blood_type_needed`, `units_needed`, `urgency_level`, `hospital_name` (free text), `notes`,
  `status`, `created_at`, `expires_at`.
- **RequestMatch** — links a request to a donor: `status` (notified/accepted/declined/expired),
  `notified_at`, `responded_at`, `contact_revealed` (bool), `revealed_at`.
- **DonationHistory** — self-logged past donations per donor: `donation_date`, `blood_bank_name`
  (free text, optional), `volume_ml`. Explicitly self-reported, not platform-verified.

Agents should search for the actual Supabase tables/migrations before assuming this shape — check
the `supabase/migrations` folder (or equivalent) rather than inferring schema from application
code. There is no `Facility`/partner table in this model — if one exists in the codebase from an
earlier direction, flag it rather than silently removing or silently keeping it wired in.

---

## Environment & Secrets

- Never commit `.env` files, API keys, or service account credentials.
- Known secrets that must come from environment variables, never hardcoded:
  - Supabase URL + anon/public key (client-side safe) and Supabase service role key (server-side
    only — must never reach the frontend bundle or be used in client-callable code)
  - Zilliz endpoint + API key
  - OpenAI API key
- Use Supabase RLS policies as the actual enforcement layer for privacy rules (hidden fields
  pre-reveal), not just conditional rendering in the frontend — the API/DB layer must refuse to
  return the data, not just the UI hide it.
- If a new integration needs a secret, add it to `.env.example` with a placeholder value and
  document it here — don't just wire it into code silently.

## Rate Limiting & Abuse Prevention

- Request submission should be rate-limited per seeker identifier (email/phone/IP) — e.g. a daily
  cap — to prevent spam requests flooding donor inboxes. Show a clear in-app message when the cap
  is hit rather than a silent failure.
- Chatbot endpoints should be rate-limited to prevent scraping the knowledge base or abuse of the
  LLM API.
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
  verification gate — ask for clarification instead of making assumptions.
- Don't reintroduce facility accounts/dashboards/verification — that's a different product scope
  than this one. If you find remnants of that direction in the codebase, flag it rather than
  silently removing or silently keeping it wired in.

## Code Style

Priorities: Readability → Maintainability → Type Safety → Security → Performance.

Prefer: small reusable functions, strong typing, clear variable names, early returns, consistent
formatting.

Avoid: large monolithic components, magic values, duplicate code, unnecessary nested conditionals.

## Security Rules

- Always validate authentication, authorization, and input data. Never trust client input.
- Sanitize search input, forms, and uploaded files.
- Protect email addresses, phone numbers, and user IDs — treat them as sensitive at the API and
  logging layer pre-reveal, not just the UI layer.
- Never leak sensitive information (PII, tokens, stack traces) in logs or API responses.

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

- `feat: add contact reveal verification gate`
- `fix: correct request acceptance workflow`
- `refactor: simplify notification service`
- `docs: update API documentation`

PRs touching privacy/visibility logic or the contact-reveal flow must call that out explicitly in
the description.

## Performance

Avoid N+1 queries, duplicate API calls, unnecessary rerenders, large bundle increases. Use
pagination, lazy loading, query optimization, and caching where appropriate.

## Testing Expectations

New features should include validation tests, API tests, permission tests, happy-path tests, and
edge cases. Any feature touching visibility rules must include a test that verifies hidden fields
are actually absent from the API response pre-reveal — not just hidden in the UI. Include a test
confirming contact fields are returned only after both verification and acceptance conditions are
met, and only through `contactRevealService`.

---

## AI Agent Checklist (before proposing changes)

1. Understand the existing architecture — search for existing implementations before creating new
   ones.
2. Reuse existing utilities whenever possible; follow project conventions.
3. Preserve the discovery/matchmaking scope — contact reveal after mutual verification and
   acceptance is intended behavior; the platform does not track or manage what happens after.
4. Preserve privacy-before-match behavior — do not expose donor or seeker identity/contact info
   before the verification-and-acceptance gate clears.
5. Keep the RAG chatbot limited to blood donation knowledge (plus basic, non-legal-advice notes on
   how the platform's own process works); keep emergency/out-of-scope handling intact.
6. If requirements are ambiguous, ask for clarification instead of assuming — especially anything
   that would add facility accounts/oversight or platform responsibility for post-match events.

When proposing code:

- Explain the reasoning.
- List affected files.
- Highlight potential side effects, especially around privacy/visibility and the verification/
  contact-reveal flow.
- Prefer incremental, reviewable changes over large rewrites.

## Screens to Build

1. Landing / discovery (map + table, public, no login) — includes the AI assistant chat widget.
2. Request form (seeker submits against a selected anonymized donor).
3. Request confirmation (seeker-side, post-submit).
4. Donor signup / login (OTP-based).
5. Donor profile setup (blood type, location, availability).
6. Donor dashboard (incoming requests, accept/decline, verification status, availability toggle,
   donation history).
7. Verification screen (OTP entry; ID upload for strong verification).
8. Contact exchange screen (only reachable post-verification and post-accept) — includes the
   plain-language "platform's role ends here" notice.
9. Optional fulfillment / self-logged donation screen.
10. (Internal) Admin review queue for strong verification submissions and abuse reports.

## Build Priorities (suggested order)

1. Anonymized discovery (map + table), no login.
2. Donor signup + light (OTP) verification + profile setup.
3. Request submission, matching, and anonymized notification to donor.
4. Accept/decline handling, including fallback to next donor on decline/expiry.
5. Verification gate + contactRevealService + contact exchange screen (with the required notice).
6. Eligibility service (donation interval enforcement, self-logged) + rate limiting.
7. Strong verification (ID upload/admin review) — later phase.
8. AI assistant — public database-grounded Q&A first, then authenticated personalized eligibility
   Q&A once the eligibility service is stable.

---

## Out of Scope (non-goals)

- The platform does not manage, verify, or take responsibility for hospitals, blood banks, or any
  facility — "hospital" is a free-text field the seeker provides about their own situation.
- The platform does not verify, supervise, or take responsibility for the actual blood donation,
  any in-person meeting between seeker and donor, or any arrangement (including payment) between
  them once contact is revealed.
- The chatbot is not a substitute for medical triage, diagnosis, or legal advice.
- The platform does not store or process actual medical records beyond blood type and
  self-logged donation history.
