# AI Code Agent Guide — AnonBlood

## Project Overview

AnonBlood is a privacy-preserving blood donor management web application that connects blood
seekers with verified donors without exposing personal information until a donor accepts a
request.

The system also integrates an AI-powered chatbot using Retrieval-Augmented Generation (RAG) to
answer blood donation questions based on a trusted knowledge base.

This document is the primary context for any AI coding agent working on this project. If a
section here conflicts with what you find in the actual codebase, the codebase wins — flag the
discrepancy and ask rather than silently picking one.

---

## Tech Stack

- **Backend:** Supabase (Postgres database, Auth, Row Level Security, and email handling all live
  here — see Notification System below).
- **RAG:** Zilliz (vector store) + OpenAI (embeddings and/or completion model).
- **Package manager:** npm.
- **Frontend framework/language:** not yet specified — fill in once confirmed.
- **Hosting / deployment target:** not yet specified — fill in once confirmed.

> Agent note: since Supabase provides Auth and Postgres directly, prefer Supabase's built-in
> mechanisms (RLS policies, Supabase Auth, Supabase client libraries) over hand-rolled
> auth/session/query logic. Don't introduce a second ORM or a competing auth layer — check for an
> existing Supabase client/service wrapper before adding a new one.

---

## Project Objectives

The system aims to:

- Replace Facebook-based blood requests with a structured platform.
- Protect donor and seeker privacy.
- Match nearby verified donors.
- Notify donors through Gmail.
- Provide AI assistance for blood donation information.
- Maintain a modern, secure, and scalable architecture.

---

## Core Principles

### Privacy First

Never expose donor information before the donor explicitly accepts a blood request. **This
protection is symmetric: the seeker's contact information is held back on the same terms.**

Before acceptance, the following must remain hidden:

- **Donor side** (never shown to the seeker or to other donors): name, email, phone number,
  address, personal profile.
- **Seeker side** (never shown to donors browsing/matched to the request): the seeker's email and
  phone number collected on the Blood Request form. Donors see only the general request details
  (blood type, urgency, hospital, area/city, units needed, notes) — enough to decide whether to
  accept, not enough to contact the seeker directly.

After a donor accepts a specific request, both sides' contact information is revealed to each
other simultaneously — this is the only point at which either party's identity/contact details
become visible.

Only general request information should be visible to donors browsing the map/dashboard before
acceptance (blood type needed, urgency, general area, hospital) — not exact address if that would
deanonymize the seeker.

### Verified Donors

Only authenticated and verified donors should receive blood requests. Anonymous users cannot
access donor information. Define what "verified" means concretely (e.g. email verification only,
or ID/medical verification) — this affects what the verification pipeline needs to check.

### AI Safety

The chatbot is **only** a blood donation information assistant. It should answer questions about:

- Blood donation eligibility
- Blood compatibility
- Donation process, preparation, and recovery
- Blood types
- General blood donation FAQs

It must never:

- Diagnose diseases or interpret symptoms
- Recommend medications or dosages
- Replace medical professionals
- Give unsafe or individualized medical advice

**Emergency handling:** if a user's message suggests a medical emergency (e.g. active bleeding,
fainting, chest pain), the bot's first priority is to direct them to emergency services or a
medical professional immediately — it should not attempt to answer the donation question in that
turn.

**Out-of-scope handling:** if a question falls outside blood donation topics, the bot should say
so plainly and decline, rather than answering from general knowledge. Log/flag repeated
out-of-scope probing so it can be reviewed for prompt-injection attempts against the RAG context.

---

## System Workflow

### Blood Seeker

Landing Page → Interactive Donor Hotspot Map → Select Area → Blood Request Form → Request Stored
→ Matching Donors Notified by Email → Waiting for Acceptance → Donor Accepts → Reveal Contact
Information → Communication Begins

### Donor

Login → Dashboard → Incoming Requests → Accept / Reject → Donation History Updated

---

## Major Features

### Landing Page

- Interactive map
- Display donor hotspots
- Show approximate donor count
- Show verified donor indicators
- Never expose donor identities

### Authentication

Supports registration, login, logout.

Registration requires: Full Name, Email, Blood Type, Password. Additional profile info can be
completed later.

### Donor Dashboard

- Incoming Requests
- Nearby Requests
- Donation History
- Profile Management

### Blood Request

Fields: Blood Type Needed, Urgency Level, Hospital, Area/City, Units Needed, Email, Phone Number,
Additional Notes.

The Email and Phone Number fields belong to the seeker and are protected under the same
before-acceptance privacy rule as donor contact info — see **Privacy First** above. They must not
be included in any API response or UI view visible to donors before that specific donor accepts
the request.

After submission:

- Store request
- Find nearby compatible donors
- Send Gmail notifications

### Notification System

Email is handled through Supabase (Auth emails and/or Supabase Edge Functions triggering
outbound email — confirm which mechanism is actually wired up before extending it, and document
it here once confirmed). Do not add a separate raw Gmail SMTP/API integration alongside this
unless there's a specific reason Supabase's path can't cover it.

Triggers: new blood request created; donor accepts a request.

### Privacy Flow

**Before acceptance:** seeker (contact info hidden) → request (general details only, visible to
matched donors) → anonymous donor pool (identity hidden).
**After acceptance:** seeker ↔ donor, personal information visible to each other only from this
point, and only between that seeker/donor pair.

---

## Data Model (key entities)

> Fill in once the schema exists; keep this current as migrations change it. At minimum list:

- **User** — shared auth identity for seekers/donors
- **DonorProfile** — verification status, blood type, location, availability
- **BloodRequest** — requester info, blood type, urgency, area, status (open/matched/fulfilled/expired)
- **RequestMatch / Acceptance** — links a request to an accepting donor, timestamp, reveals contact info
- **DonationHistory** — past accepted/completed donations per donor

Agents should search for the actual Supabase tables/migrations before assuming this shape — check
the `supabase/migrations` folder (or equivalent) rather than inferring schema from application code.

---

## Environment & Secrets

- Never commit `.env` files, API keys, or service account credentials.
- Known secrets that must come from environment variables, never hardcoded:
  - Supabase URL + anon/public key (client-side safe) and Supabase service role key (server-side
    only — must never reach the frontend bundle or be used in client-callable code)
  - Zilliz endpoint + API key
  - OpenAI API key
- Use Supabase RLS policies as the actual enforcement layer for privacy rules (hidden donor/seeker
  fields), not just conditional rendering in the frontend — the API/DB layer must refuse to return
  the data, not just the UI hide it.
- If a new integration needs a secret, add it to `.env.example` with a placeholder value and
  document it here — don't just wire it into code silently.

## Rate Limiting & Abuse Prevention

- Blood request submission should be rate-limited per user/IP to prevent spam requests flooding
  donor inboxes.
- Chatbot endpoints should be rate-limited to prevent scraping the knowledge base or abuse of the
  LLM API.

---

## Expected AI Agent Behavior

When modifying code:

- Prefer extending existing components instead of rewriting them.
- Maintain current project architecture; follow existing naming conventions.
- Avoid introducing unnecessary dependencies; reuse services whenever possible.
- Keep components modular; do not duplicate business logic.
- Preserve backwards compatibility unless explicitly instructed otherwise.
- Explain significant architectural changes **before** implementing them.
- If requirements are ambiguous — especially anything touching privacy/visibility rules — ask for
  clarification instead of making assumptions.

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
- Never leak sensitive information (donor/seeker PII, tokens, stack traces) in logs or API
  responses.

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

- `feat: add donor hotspot clustering`
- `fix: correct request acceptance workflow`
- `refactor: simplify notification service`
- `docs: update API documentation`

PRs touching privacy/visibility logic should call that out explicitly in the description.

## Performance

Avoid N+1 queries, duplicate API calls, unnecessary rerenders, large bundle increases. Use
pagination, lazy loading, query optimization, and caching where appropriate.

## Testing Expectations

New features should include validation tests, API tests, permission tests, happy-path tests, and
edge cases. Any feature touching donor/seeker visibility rules must include a test that verifies
hidden fields are actually absent from the API response pre-acceptance — not just hidden in the UI.

---

## AI Agent Checklist (before proposing changes)

1. Understand the existing architecture — search for existing implementations before creating new ones.
2. Reuse existing utilities whenever possible; follow project conventions.
3. Preserve privacy-first behavior — do not expose donor identity or seeker contact info before
   that specific donor's acceptance of the request.
4. Keep the RAG chatbot limited to blood donation knowledge; keep emergency/out-of-scope handling intact.
5. If requirements are ambiguous, ask for clarification instead of assuming.

When proposing code:

- Explain the reasoning.
- List affected files.
- Highlight potential side effects, especially around privacy/visibility and notification triggers.
- Prefer incremental, reviewable changes over large rewrites.

## Out of Scope (non-goals)

- The chatbot is not a substitute for medical triage or diagnosis.
- The platform does not store or process actual medical records beyond blood type and donation
  history.
