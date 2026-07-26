# AnonBlood — Project Roadmap & To-Do List

> **Last Updated:** July 26, 2026  
> **Source of Truth:** [AGENTS.md](file:///home/arjay/Desktop/Work/Blood-Donor-System/AGENTS.md) & [TASK_STATUS.md](file:///home/arjay/Desktop/Work/Blood-Donor-System/TASK_STATUS.md)

---

## 📋 Prioritized To-Do List

### 🚨 Priority 0 — Core Architecture & Security Gate (✅ ALL DONE)
- [x] **Remove Out-of-Scope Hospital Features**: Delete hospital portal routes/pages and restrict scope to discovery and matchmaking only.
- [x] **Implement `contactRevealService` Backend Gate**: Require mutual light verification before contact information is disclosed.
- [x] **Write Supabase RLS Policies**: Enforce strict Row Level Security on `users`, `requests`, `request_matches`, `donations`, `verification_submissions`, and `contact_reveal_audit`.

---

### ⚡ Priority 1 — Core Functional Requirements & Database Automation (✅ ALL DONE)
- [x] **Implement & Maintain Supabase Database Functions via Migrations**:
  - Auto-create user profiles upon signup (`handle_new_user()`).
  - Auto-update timestamp (`update_updated_at_column()`).
  - Auto-update donor status and eligibility upon completed donation (`handle_new_donation()`).
  - Auto-update donor verification status upon admin submission approval (`handle_verification_submission_approval()`).
  - Automated donor eligibility window reset procedure (`reset_donor_eligibility()`).
  - Secure contact reveal & audit logging function (`reveal_contact_and_log()`).
  - Rate limiting check & logging helper (`check_and_log_rate_limit()`).
  - Expiry function for blood requests and unaccepted matches (`expire_requests_and_matches()`).
  - Spatial & blood-type compatible donor discovery function (`get_compatible_donors()`).
  - Automated background job scheduling via `pg_cron`.
- [x] **Wire Strong Verification Admin Review Queue**: Dedicated admin interface (`AdminVerifications.tsx`) for reviewing government ID uploads.
- [x] **Implement `eligibilityService` & Scheduled Job**: Log donations, enforce 84-day WHO/DOH minimum rest period, and automate eligibility status resets.
- [x] **Implement `rateLimiter` Middleware**: Enforce 3/day blood request limits per identifier and 50/day AI query limits; integrate with `RequestForm.tsx`.

---

### 🔧 Priority 2 — Enhancements & AI Scope (In Progress / Next)
- [ ] **Build AI Assistant Authenticated Mode**:
  - Update `RAG/api.py` to accept JWTs.
  - Classify `public` vs. `personal` queries.
  - Fetch donor's own `next_eligible_date` using standard backend service logic.
  - Audit and log queries in `ai_conversations`.
- [ ] **Automate Match Expiry & Fallback**:
  - Automatically expire unanswered matches after a configurable window (e.g. 2 hours for urgent requests).
  - Automatically notify and cascade to the next compatible donor.

---

### 🧪 Priority 3 — Testing & Tech Debt (Planned)
- [ ] **Add Unit & Integration Testing**: Implement Vitest and Playwright test suites for matching matrix, verification gate, and contact reveal.
- [ ] **Refactor Hardcoded Configurations**: Move hardcoded URLs (such as the RAG API URL in `AIChatWidget.tsx`) to `VITE_RAG_API_URL` environment variables.

---

## 💡 Recommended Execution Sequence

1. **Deploy & Apply Migration Files**: Apply database migrations (`20260726000000` through `20260726000003`) via `supabase db push`.
2. **Deploy `reset-eligibility` Edge Function**: Ensure background cron trigger calls `reset_donor_eligibility()`.
3. **Extend AI Assistant**: Complete authenticated personal query mode in `RAG/api.py`.
4. **Implement Automated Match Expiry**: Wire match expiry background job for cascading donor fallback.
