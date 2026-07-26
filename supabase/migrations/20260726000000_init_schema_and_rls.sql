-- Initial Database Schema and Row Level Security (RLS) Policies for AnonBlood
-- Project: Blood Donor Discovery & Matchmaking Platform

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES DEFINITIONS

-- Users (Donors, Seekers, Admins)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role character varying CHECK (role::text = ANY (ARRAY['donor'::character varying, 'seeker'::character varying, 'admin'::character varying]::text[])),
  full_name character varying,
  email character varying NOT NULL UNIQUE,
  phone character varying UNIQUE,
  blood_type character varying CHECK (blood_type::text = ANY (ARRAY['A+'::character varying, 'A-'::character varying, 'B+'::character varying, 'B-'::character varying, 'AB+'::character varying, 'AB-'::character varying, 'O+'::character varying, 'O-'::character varying]::text[])),
  birthdate date,
  gender character varying,
  weight_kg numeric,
  barangay character varying,
  city character varying,
  latitude numeric,
  longitude numeric,
  availability_status character varying DEFAULT 'available'::character varying CHECK (availability_status::text = ANY (ARRAY['available'::character varying, 'resting'::character varying, 'unavailable'::character varying]::text[])),
  last_donation_date timestamp with time zone,
  next_eligible_date timestamp with time zone,
  is_verified boolean DEFAULT false,
  verification_method character varying CHECK (verification_method::text = ANY (ARRAY['email'::character varying, 'phone'::character varying, 'id'::character varying]::text[])),
  verified_at timestamp with time zone,
  display_id character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Blood Requests (Seeker requests)
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_name character varying,
  seeker_email character varying NOT NULL,
  seeker_phone character varying,
  blood_type_needed character varying NOT NULL,
  units_needed integer DEFAULT 1,
  urgency_level character varying CHECK (urgency_level::text = ANY (ARRAY['emergency'::character varying, 'within_hours'::character varying, 'within_day'::character varying, 'planning'::character varying]::text[])),
  hospital_name character varying,
  notes text,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'fulfilled'::character varying, 'cancelled'::character varying, 'expired'::character varying]::text[])),
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp with time zone,
  ip_address inet,
  user_agent text
);

-- Request Matches
CREATE TABLE IF NOT EXISTS public.request_matches (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  status character varying DEFAULT 'notified'::character varying CHECK (status::text = ANY (ARRAY['notified'::character varying, 'accepted'::character varying, 'declined'::character varying, 'expired'::character varying, 'contact_revealed'::character varying]::text[])),
  notified_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  responded_at timestamp with time zone,
  contact_revealed boolean DEFAULT false,
  revealed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Self-reported Donations History
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  donation_date timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  volume_ml integer DEFAULT 450,
  status character varying DEFAULT 'completed'::character varying CHECK (status::text = ANY (ARRAY['completed'::character varying, 'deferred'::character varying, 'cancelled'::character varying]::text[])),
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Verification Submissions (Strong ID Uploads)
CREATE TABLE IF NOT EXISTS public.verification_submissions (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  verification_type character varying CHECK (verification_type::text = ANY (ARRAY['light'::character varying, 'strong'::character varying]::text[])),
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  id_document_url text,
  id_document_type character varying,
  submitted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  metadata jsonb
);

-- AI Assistant Conversations Audit
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  session_id uuid NOT NULL,
  query text NOT NULL,
  response text NOT NULL,
  query_type character varying CHECK (query_type::text = ANY (ARRAY['public'::character varying, 'personal'::character varying, 'out_of_scope'::character varying]::text[])),
  context jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Rate Limiting Logs
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier character varying NOT NULL,
  request_type character varying,
  timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  blocked boolean DEFAULT false
);

-- Reference Content for AI RAG Grounding
CREATE TABLE IF NOT EXISTS public.reference_content (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  category character varying NOT NULL,
  title character varying NOT NULL,
  content text NOT NULL,
  source character varying CHECK (source::text = ANY (ARRAY['WHO'::character varying, 'Red_Cross'::character varying, 'DOH_Philippines'::character varying]::text[])),
  tags text[],
  last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Contact Reveal Audit Log
CREATE TABLE IF NOT EXISTS public.contact_reveal_audit (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  seeker_email character varying NOT NULL,
  reveal_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  ip_address inet,
  user_agent text
);


-- 3. ROW LEVEL SECURITY (RLS) POLICIES (DISABLED FOR DEVELOPMENT)

-- Disable RLS on all sensitive tables for development
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_reveal_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations DISABLE ROW LEVEL SECURITY;

-- USERS POLICIES (Commented out for dev, restore for production)
-- Anyone (anonymized public) can view active donors' anonymized discovery data
-- CREATE POLICY "Public anonymized donor discovery" ON public.users
--   FOR SELECT
--   USING (role = 'donor' AND availability_status != 'unavailable');

-- Users can view and edit their own profile details
-- CREATE POLICY "Users view own profile" ON public.users
--   FOR SELECT
--   USING (auth.uid() = id);

-- CREATE POLICY "Users update own profile" ON public.users
--   FOR UPDATE
--   USING (auth.uid() = id);

-- CREATE POLICY "Users insert profile on signup" ON public.users
--   FOR INSERT
--   WITH CHECK (auth.uid() = id);

-- REQUESTS POLICIES (Commented out for dev, restore for production)
-- Seekers can view their own requests
-- CREATE POLICY "Seekers view own requests" ON public.requests
--   FOR SELECT
--   USING (seeker_email = (auth.jwt() ->> 'email') OR auth.uid() IS NOT NULL);

-- Anyone can submit a request (anonymized seeker request submission)
-- CREATE POLICY "Public submit request" ON public.requests
--   FOR INSERT
--   WITH CHECK (true);

-- Matched donors can view requests assigned to them
-- CREATE POLICY "Matched donors view request" ON public.requests
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.request_matches
--       WHERE request_matches.request_id = requests.id
--       AND request_matches.donor_id = auth.uid()
--     )
--   );

-- REQUEST_MATCHES POLICIES (Commented out for dev, restore for production)
-- Donors can view matches sent to them
-- CREATE POLICY "Donors view assigned matches" ON public.request_matches
--   FOR SELECT
--   USING (donor_id = auth.uid());

-- Donors can update status of their matches (accept/decline)
-- CREATE POLICY "Donors update assigned matches" ON public.request_matches
--   FOR UPDATE
--   USING (donor_id = auth.uid());

-- Seekers can view matches on their requests
-- CREATE POLICY "Seekers view request matches" ON public.request_matches
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.requests
--       WHERE requests.id = request_matches.request_id
--       AND requests.seeker_email = (auth.jwt() ->> 'email')
--     )
--   );

-- VERIFICATION SUBMISSIONS POLICIES (Commented out for dev, restore for production)
-- CREATE POLICY "Users view own verification submissions" ON public.verification_submissions
--   FOR SELECT
--   USING (user_id = auth.uid());

-- CREATE POLICY "Users create verification submission" ON public.verification_submissions
--   FOR INSERT
--   WITH CHECK (user_id = auth.uid());

-- CONTACT REVEAL AUDIT POLICIES (Commented out for dev, restore for production)
-- CREATE POLICY "Donors/Seekers view own reveal audit" ON public.contact_reveal_audit
--   FOR SELECT
--   USING (donor_id = auth.uid() OR seeker_email = (auth.jwt() ->> 'email'));

-- CREATE POLICY "System insert reveal audit" ON public.contact_reveal_audit
--   FOR INSERT
--   WITH CHECK (true);

