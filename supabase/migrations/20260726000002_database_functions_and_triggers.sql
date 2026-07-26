-- Supabase Migration: Database Functions, Triggers, and Automations
-- Project: Blood Donor Discovery & Matchmaking Platform (AnonBlood)

-- ============================================================================
-- 1. AUTOMATED TIMESTAMP MANAGEMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 2. DONATION LOGGING & ELIGIBILITY WINDOW AUTOMATION
-- ============================================================================
-- Automatically sets donor status to 'resting' and computes next_eligible_date
-- (84 days / 12 weeks per WHO/DOH minimum interval guidance) upon completed donation.

CREATE OR REPLACE FUNCTION public.handle_new_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_eligible timestamp with time zone;
BEGIN
  IF NEW.status = 'completed' THEN
    v_next_eligible := NEW.donation_date + INTERVAL '84 days';

    UPDATE public.users
    SET availability_status = 'resting',
        last_donation_date = NEW.donation_date,
        next_eligible_date = v_next_eligible,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.donor_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_donation_created ON public.donations;
CREATE TRIGGER on_donation_created
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_donation();


-- ============================================================================
-- 3. STRONG VERIFICATION SUBMISSION APPROVAL AUTOMATION
-- ============================================================================
-- Automatically updates user verification status and badge when an admin approves an ID submission.

CREATE OR REPLACE FUNCTION public.handle_verification_submission_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.users
    SET is_verified = true,
        verification_method = COALESCE(NEW.verification_type, 'id'),
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_verification_submission_approved ON public.verification_submissions;
CREATE TRIGGER on_verification_submission_approved
  AFTER UPDATE ON public.verification_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_verification_submission_approval();


-- ============================================================================
-- 4. DONOR ELIGIBILITY RESET PROCEDURE
-- ============================================================================
-- Flips resting donors back to 'available' once their 84-day rest period has passed.

CREATE OR REPLACE FUNCTION public.reset_donor_eligibility()
RETURNS TABLE (
  id uuid,
  display_id character varying,
  was_eligible_since timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.users
  SET availability_status = 'available',
      updated_at = CURRENT_TIMESTAMP
  WHERE availability_status = 'resting'
    AND next_eligible_date <= CURRENT_TIMESTAMP
  RETURNING users.id, users.display_id, users.next_eligible_date AS was_eligible_since;
END;
$$;


-- ============================================================================
-- 5. CONTACT REVEAL & AUDIT LOGGING RPC
-- ============================================================================
-- Gated procedure verifying light verification on both sides before revealing contact info.

CREATE OR REPLACE FUNCTION public.reveal_contact_and_log(
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
  v_seeker_email character varying;
BEGIN
  -- Fetch match & verification details
  SELECT rm.donor_id, rm.request_id, r.seeker_email, 
         (u.is_verified OR u.verification_method IS NOT NULL) AS donor_v,
         COALESCE(r.is_verified, false) AS seeker_v
  INTO v_donor_id, v_request_id, v_seeker_email, v_donor_verified, v_seeker_verified
  FROM public.request_matches rm
  JOIN public.users u ON u.id = rm.donor_id
  JOIN public.requests r ON r.id = rm.request_id
  WHERE rm.id = p_match_id;

  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'Match not found for id: %', p_match_id;
  END IF;

  -- Verification gate enforcement
  IF NOT (v_donor_verified AND v_seeker_verified) THEN
    RAISE EXCEPTION 'Contact reveal blocked: Both donor and seeker must clear light verification.';
  END IF;

  -- Update request match status
  UPDATE public.request_matches
  SET status = 'contact_revealed',
      contact_revealed = true,
      revealed_at = CURRENT_TIMESTAMP,
      responded_at = COALESCE(responded_at, CURRENT_TIMESTAMP)
  WHERE id = p_match_id;

  -- Audit log insertion
  INSERT INTO public.contact_reveal_audit (
    request_id,
    donor_id,
    seeker_email,
    reveal_timestamp,
    user_agent
  )
  VALUES (
    v_request_id,
    v_donor_id,
    v_seeker_email,
    CURRENT_TIMESTAMP,
    p_user_agent
  );

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'revealed_at', CURRENT_TIMESTAMP
  );
END;
$$;


-- ============================================================================
-- 6. RATE LIMITING CHECK & ATTEMPT LOGGING HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_and_log_rate_limit(
  p_identifier text,
  p_request_type text DEFAULT 'blood_request',
  p_max_requests integer DEFAULT 3,
  p_window_hours integer DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_allowed boolean;
  v_remaining integer;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := CURRENT_TIMESTAMP - (p_window_hours || ' hours')::interval;

  SELECT COUNT(*)::integer
  INTO v_count
  FROM public.rate_limit_logs
  WHERE identifier = p_identifier
    AND request_type = p_request_type
    AND timestamp >= v_window_start;

  v_remaining := GREATEST(0, p_max_requests - v_count);
  v_allowed := (v_remaining > 0);

  INSERT INTO public.rate_limit_logs (
    identifier,
    request_type,
    timestamp,
    blocked
  ) VALUES (
    p_identifier,
    p_request_type,
    CURRENT_TIMESTAMP,
    NOT v_allowed
  );

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'used', v_count,
    'limit', p_max_requests
  );
END;
$$;


-- ============================================================================
-- 7. AUTO-EXPIRY MAINTENANCE PROCEDURE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.expire_requests_and_matches()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_requests integer := 0;
  v_expired_matches integer := 0;
BEGIN
  WITH expired_reqs AS (
    UPDATE public.requests
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= CURRENT_TIMESTAMP
    RETURNING id
  )
  SELECT COUNT(*)::integer INTO v_expired_requests FROM expired_reqs;

  WITH expired_m AS (
    UPDATE public.request_matches
    SET status = 'expired'
    WHERE status = 'notified'
      AND notified_at <= (CURRENT_TIMESTAMP - INTERVAL '2 hours')
    RETURNING id
  )
  SELECT COUNT(*)::integer INTO v_expired_matches FROM expired_m;

  RETURN jsonb_build_object(
    'success', true,
    'expired_requests', v_expired_requests,
    'expired_matches', v_expired_matches
  );
END;
$$;


-- ============================================================================
-- 8. ANONYMIZED & FUZZED COMPATIBLE DONOR DISCOVERY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_compatible_donors(
  p_needed_type text,
  p_seeker_lat numeric DEFAULT NULL,
  p_seeker_lng numeric DEFAULT NULL,
  p_radius_km numeric DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  display_id character varying,
  blood_type character varying,
  availability_status character varying,
  is_verified boolean,
  distance_km numeric,
  fuzzed_lat numeric,
  fuzzed_lng numeric,
  last_active timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH compatible_matrix (recipient_type, compatible_donor_type) AS (
    VALUES
      ('O-', ARRAY['O-']),
      ('O+', ARRAY['O-', 'O+']),
      ('B-', ARRAY['O-', 'B-']),
      ('B+', ARRAY['O-', 'O+', 'B-', 'B+']),
      ('A-', ARRAY['O-', 'A-']),
      ('A+', ARRAY['O-', 'O+', 'A-', 'A+']),
      ('AB-', ARRAY['O-', 'B-', 'A-', 'AB-']),
      ('AB+', ARRAY['O-', 'O+', 'B-', 'B+', 'A-', 'A+', 'AB-', 'AB+'])
  )
  SELECT
    u.id,
    u.display_id,
    u.blood_type,
    u.availability_status,
    u.is_verified,
    CASE
      WHEN p_seeker_lat IS NOT NULL AND p_seeker_lng IS NOT NULL AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL THEN
        ROUND(
          (6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(p_seeker_lat)) * cos(radians(u.latitude)) *
              cos(radians(u.longitude) - radians(p_seeker_lng)) +
              sin(radians(p_seeker_lat)) * sin(radians(u.latitude))
            ))
          ))::numeric, 1
        )
      ELSE 0.0
    END AS distance_km,
    COALESCE(ROUND(u.latitude, 2), p_seeker_lat) AS fuzzed_lat,
    COALESCE(ROUND(u.longitude, 2), p_seeker_lng) AS fuzzed_lng,
    COALESCE(u.updated_at, u.created_at) AS last_active
  FROM public.users u
  JOIN compatible_matrix cm ON cm.recipient_type = p_needed_type
  WHERE u.role = 'donor'
    AND u.availability_status = 'available'
    AND u.blood_type = ANY(cm.compatible_donor_type)
    AND (
      p_seeker_lat IS NULL OR p_seeker_lng IS NULL OR u.latitude IS NULL OR u.longitude IS NULL OR
      (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_seeker_lat)) * cos(radians(u.latitude)) *
          cos(radians(u.longitude) - radians(p_seeker_lng)) +
          sin(radians(p_seeker_lat)) * sin(radians(u.latitude))
        ))
      )) <= p_radius_km
    )
  ORDER BY distance_km ASC;
END;
$$;


-- ============================================================================
-- 9. PERMISSIONS GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_donation() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_verification_submission_approval() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_donor_eligibility() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reveal_contact_and_log(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_and_log_rate_limit(text, text, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_requests_and_matches() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_compatible_donors(text, numeric, numeric, numeric) TO anon, authenticated, service_role;
