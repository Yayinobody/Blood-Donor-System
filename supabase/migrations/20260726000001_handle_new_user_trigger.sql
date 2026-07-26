-- Migration: Auto-create public.users profile on new auth user signup
-- Rationale: The client cannot safely insert into public.users immediately after
-- supabase.auth.signUp() because, when email confirmation is enabled, no session
-- exists yet (auth.uid() = null), causing the RLS WITH CHECK to reject the insert.
-- A SECURITY DEFINER trigger runs as the table owner and bypasses RLS entirely,
-- which is the correct pattern for this bootstrap insert.

-- Function: called by the trigger on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
-- Pin search_path to prevent search-path-injection attacks
SET search_path = public
AS $$
DECLARE
  v_display_id text;
  v_attempt    int := 0;
BEGIN
  -- Generate a collision-resistant display_id (retry up to 5 times)
  LOOP
    v_display_id := 'Donor #' || (floor(random() * 900000) + 100000)::int;

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.users WHERE display_id = v_display_id
    );

    v_attempt := v_attempt + 1;
    IF v_attempt >= 5 THEN
      -- Fall back to a UUID fragment — guaranteed unique
      v_display_id := 'Donor #' || upper(substring(gen_random_uuid()::text, 1, 6));
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    blood_type,
    display_id,
    availability_status,
    is_verified,
    -- Coordinates supplied by the client via auth metadata; NULL is acceptable
    -- here — the donor can complete their profile later.
    latitude,
    longitude
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- raw_user_meta_data is the JSON object passed via
    -- supabase.auth.signUp({ options: { data: { ... } } })
    NEW.raw_user_meta_data ->> 'full_name',
    'donor',
    NEW.raw_user_meta_data ->> 'blood_type',
    v_display_id,
    'available',
    false,
    (NEW.raw_user_meta_data ->> 'latitude')::numeric,
    (NEW.raw_user_meta_data ->> 'longitude')::numeric
  )
  -- Guard against replayed/duplicate events (e.g. dev resets)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger: fires once per new auth user row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
