-- Supabase Migration: Background Task Scheduling via pg_cron
-- Project: Blood Donor Discovery & Matchmaking Platform (AnonBlood)

DO $$
BEGIN
  -- Attempt to enable pg_cron extension if available
  CREATE EXTENSION IF NOT EXISTS "pg_cron";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension could not be enabled automatically. Manual enabling in Supabase Dashboard may be required if using pg_cron.';
END;
$$;

-- Schedule daily midnight eligibility reset (if pg_cron is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule existing job if re-running
    PERFORM cron.unschedule('reset-donor-eligibility-job');
    
    PERFORM cron.schedule(
      'reset-donor-eligibility-job',
      '0 0 * * *', -- Midnight UTC daily
      'SELECT public.reset_donor_eligibility()'
    );

    -- Unschedule existing request expiry job if re-running
    PERFORM cron.unschedule('expire-requests-matches-job');
    
    PERFORM cron.schedule(
      'expire-requests-matches-job',
      '*/30 * * * *', -- Every 30 minutes
      'SELECT public.expire_requests_and_matches()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Cron schedule setup skipped: pg_cron is not enabled or available in this environment.';
END;
$$;
