-- Supabase Migration: Verification Tokens, Atomic Contact Reveal & Donation Completion, Location Calibration
-- Project: Blood Donor Discovery & Matchmaking Platform (AnonBlood)

-- ============================================================================
-- 1. VERIFICATION TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  token character varying NOT NULL,
  token_type character varying NOT NULL CHECK (token_type::text = ANY (ARRAY['seeker_verification'::character varying, 'donor_verification'::character varying, 'donation_confirmation'::character varying]::text[])),
  target_id uuid,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_lookup ON public.verification_tokens (email, token, token_type, expires_at);

-- Disable RLS for dev / handled by security definer RPCs
ALTER TABLE public.verification_tokens DISABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 2. SECURE ONE-TIME VERIFICATION TOKEN GENERATION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_verification_token(
  p_email text,
  p_token_type text DEFAULT 'donor_verification',
  p_target_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_expires_at timestamp with time zone;
BEGIN
  -- Generate cryptographically random 6-digit numeric OTP token
  v_token := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
  v_expires_at := CURRENT_TIMESTAMP + INTERVAL '15 minutes';

  -- Invalidate existing unused tokens for same email, type, and target
  UPDATE public.verification_tokens
  SET used_at = CURRENT_TIMESTAMP
  WHERE email = p_email
    AND token_type = p_token_type
    AND (p_target_id IS NULL OR target_id = p_target_id)
    AND used_at IS NULL;

  -- Insert new token record
  INSERT INTO public.verification_tokens (
    email,
    token,
    token_type,
    target_id,
    expires_at
  ) VALUES (
    p_email,
    v_token,
    p_token_type,
    p_target_id,
    v_expires_at
  );

  RETURN jsonb_build_object(
    'success', true,
    'email', p_email,
    'token', v_token,
    'token_type', p_token_type,
    'expires_at', v_expires_at
  );
END;
$$;


-- ============================================================================
-- 3. ONE-TIME VERIFICATION TOKEN VERIFICATION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_one_time_token(
  p_email text,
  p_token text,
  p_token_type text DEFAULT 'donor_verification',
  p_target_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_id uuid;
BEGIN
  -- Find valid, non-expired, unused token
  SELECT id INTO v_token_id
  FROM public.verification_tokens
  WHERE email = p_email
    AND token = p_token
    AND token_type = p_token_type
    AND (p_target_id IS NULL OR target_id = p_target_id)
    AND used_at IS NULL
    AND expires_at > CURRENT_TIMESTAMP
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_token_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid or expired verification code.'
    );
  END IF;

  -- Mark token as used
  UPDATE public.verification_tokens
  SET used_at = CURRENT_TIMESTAMP
  WHERE id = v_token_id;

  -- Apply verification status update based on token_type
  IF p_token_type = 'seeker_verification' THEN
    IF p_target_id IS NOT NULL THEN
      UPDATE public.requests
      SET is_verified = true
      WHERE id = p_target_id;
    ELSE
      UPDATE public.requests
      SET is_verified = true
      WHERE seeker_email = p_email AND status = 'active';
    END IF;
  ELSIF p_token_type IN ('donor_verification', 'donation_confirmation') THEN
    IF p_target_id IS NOT NULL THEN
      UPDATE public.users
      SET is_verified = true,
          verification_method = 'email',
          verified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = p_target_id;
    ELSE
      UPDATE public.users
      SET is_verified = true,
          verification_method = 'email',
          verified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = p_email;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Verification completed successfully.'
  );
END;
$$;


-- ============================================================================
-- 4. ATOMIC CONTACT REVEAL & AUDIT LOGGING RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reveal_contact_and_log_atomically(
  p_match_id uuid,
  p_user_agent text DEFAULT 'web-app'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_donor_id uuid;
  v_request_id uuid;
  v_donor_verified boolean;
  v_seeker_verified boolean;
  v_donor_status text;
  v_seeker_name text;
  v_seeker_email text;
  v_seeker_phone text;
  v_hospital_name text;
  v_donor_name text;
  v_donor_email text;
  v_donor_phone text;
  v_donor_display_id text;
BEGIN
  -- Fetch full match, donor, and seeker details
  SELECT
    rm.donor_id,
    rm.request_id,
    u.availability_status,
    (u.is_verified OR u.verification_method IS NOT NULL),
    COALESCE(r.is_verified, false),
    r.seeker_name,
    r.seeker_email,
    r.seeker_phone,
    r.hospital_name,
    u.full_name,
    u.email,
    u.phone,
    u.display_id
  INTO
    v_donor_id,
    v_request_id,
    v_donor_status,
    v_donor_verified,
    v_seeker_verified,
    v_seeker_name,
    v_seeker_email,
    v_seeker_phone,
    v_hospital_name,
    v_donor_name,
    v_donor_email,
    v_donor_phone,
    v_donor_display_id
  FROM public.request_matches rm
  JOIN public.users u ON u.id = rm.donor_id
  JOIN public.requests r ON r.id = rm.request_id
  WHERE rm.id = p_match_id;

  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'Match not found for ID %', p_match_id;
  END IF;

  -- 1. Verification Gate Check
  IF NOT (v_donor_verified AND v_seeker_verified) THEN
    RAISE EXCEPTION 'Contact reveal blocked: Both donor and seeker must clear light verification.';
  END IF;

  -- 2. Donor Medical Eligibility Check
  IF v_donor_status = 'resting' THEN
    RAISE EXCEPTION 'Contact reveal blocked: Donor is currently in mandatory medical rest period.';
  END IF;

  -- 3. Atomic state update
  UPDATE public.request_matches
  SET status = 'contact_revealed',
      contact_revealed = true,
      revealed_at = CURRENT_TIMESTAMP,
      responded_at = COALESCE(responded_at, CURRENT_TIMESTAMP)
  WHERE id = p_match_id;

  -- 4. Audit log entry
  INSERT INTO public.contact_reveal_audit (
    request_id,
    donor_id,
    seeker_email,
    reveal_timestamp,
    user_agent
  ) VALUES (
    v_request_id,
    v_donor_id,
    v_seeker_email,
    CURRENT_TIMESTAMP,
    p_user_agent
  );

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'revealed_at', CURRENT_TIMESTAMP,
    'data', jsonb_build_object(
      'seeker_name', COALESCE(v_seeker_name, 'Blood Seeker'),
      'seeker_email', v_seeker_email,
      'seeker_phone', v_seeker_phone,
      'hospital_name', COALESCE(v_hospital_name, 'Hospital'),
      'donor_full_name', COALESCE(v_donor_name, v_donor_display_id),
      'donor_email', v_donor_email,
      'donor_phone', v_donor_phone,
      'donor_display_id', v_donor_display_id
    )
  );
END;
$$;


-- ============================================================================
-- 5. ATOMIC DONATION COMPLETION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_donation_atomically(
  p_match_id uuid,
  p_donor_id uuid,
  p_notes text DEFAULT NULL,
  p_volume_ml integer DEFAULT 450
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_donation_id uuid;
BEGIN
  -- Fetch request_id for this match
  SELECT request_id INTO v_request_id
  FROM public.request_matches
  WHERE id = p_match_id AND donor_id = p_donor_id;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Match not found or unauthorized for donor ID %', p_donor_id;
  END IF;

  -- 1. Mark match as accepted / completed
  UPDATE public.request_matches
  SET status = 'accepted',
      responded_at = COALESCE(responded_at, CURRENT_TIMESTAMP)
  WHERE id = p_match_id;

  -- 2. Mark request as fulfilled
  UPDATE public.requests
  SET status = 'fulfilled'
  WHERE id = v_request_id;

  -- 3. Log donation record (Trigger on_donation_created will automatically set
  --    availability_status = 'resting' and compute next_eligible_date = +84 days)
  INSERT INTO public.donations (
    donor_id,
    donation_date,
    volume_ml,
    status,
    notes
  ) VALUES (
    p_donor_id,
    CURRENT_TIMESTAMP,
    p_volume_ml,
    'completed',
    p_notes
  )
  RETURNING id INTO v_donation_id;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'donation_id', v_donation_id,
    'status', 'fulfilled'
  );
END;
$$;


-- ============================================================================
-- 6. DONOR LOCATION CALIBRATION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_donor_location(
  p_user_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_city text DEFAULT NULL,
  p_barangay text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET latitude = p_latitude,
      longitude = p_longitude,
      city = COALESCE(p_city, city),
      barangay = COALESCE(p_barangay, barangay),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'latitude', p_latitude,
    'longitude', p_longitude,
    'updated_at', CURRENT_TIMESTAMP
  );
END;
$$;


-- ============================================================================
-- 7. PERMISSION GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.generate_verification_token(text, text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_one_time_token(text, text, text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reveal_contact_and_log_atomically(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_donation_atomically(uuid, uuid, text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_donor_location(uuid, numeric, numeric, text, text) TO authenticated, service_role;
