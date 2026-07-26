# AnonBlood — Blood Donor Matchmaking Platform

AnonBlood is a blood donor discovery and matchmaking platform designed to help blood seekers find and get introduced to compatible, willing voluntary donors in their area (focused on Dumaguete City and nearby municipalities in Negros Oriental, Philippines).

> [!WARNING]
> **DEVELOPMENT NOTICE: Row Level Security (RLS) Disabled**  
> Row Level Security (RLS) is currently **DISABLED** across all database tables (`users`, `requests`, `request_matches`, `donations`, `verification_submissions`, `contact_reveal_audit`, `ai_conversations`) for local development and testing purposes.  
> `CREATE POLICY` statements in `supabase/migrations/20260726000000_init_schema_and_rls.sql` have been commented out so they can be easily restored before deploying to production.

---

## 🛠️ Database Setup & Migrations

### Option A: Using Supabase CLI (Recommended)

1. **Start local Supabase services:**
   ```bash
   npx supabase start
   ```

2. **Apply migrations and seed data:**
   ```bash
   npx supabase db reset
   ```
   *Note: `supabase db reset` automatically applies all migrations in `supabase/migrations/` in chronological order and populates the database using `supabase/seed.sql`.*

3. **Or run seeding individually:**
   ```bash
   npx supabase db seed
   ```

---

### Option B: Using Supabase Web Dashboard / Remote Database

If executing migrations manually via the Supabase Dashboard SQL Editor or via `psql`:

1. **Run migration scripts in sequential order:**
   - `supabase/migrations/20260726000000_init_schema_and_rls.sql`
   - `supabase/migrations/20260726000001_handle_new_user_trigger.sql`
   - `supabase/migrations/20260726000002_database_functions_and_triggers.sql`
   - `supabase/migrations/20260726000003_cron_jobs.sql`

2. **Seed the database:**
   - Run `supabase/seed.sql` in the SQL Editor or via `psql`.

---

## 🌾 Seed Data Overview

The seed script (`supabase/seed.sql`) populates realistic development data for testing:

- **1 Admin user** (`admin@anonblood.ph`)
- **30 Donors** with realistic Filipino names, blood types, verification statuses, and availability statuses
- **15 Seekers** with requests submitted
- **Geographic Coverage:** Dumaguete City and nearby municipalities (Bacong, Sibulan, Valencia, Dauin, San Jose) with validated inland coordinates (no coordinates in the sea)
- **Requests & Matches:** Active, fulfilled, and expired blood requests along with corresponding donor matches and audit logs
- **Reference Content:** Grounding knowledge base documents for AI RAG assistant
- **Idempotency:** Safe to run multiple times without duplicating data

---

## 🚀 Running the Web Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` (or set up `.env`) with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Launch local dev server:**
   ```bash
   npm run dev
   ```

---

## 🔍 Code Linting & Build

- **Lint code:** `npm run lint`
- **Type check & Build production bundle:** `npm run build`
