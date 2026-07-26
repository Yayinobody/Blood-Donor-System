import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Supabase Edge Function: reset-eligibility
 *
 * Called by a pg_cron schedule (daily) or manually to flip all donors
 * whose next_eligible_date has passed back from 'resting' to 'available'.
 *
 * Schedule with pg_cron in Supabase SQL editor:
 *   SELECT cron.schedule(
 *     'reset-donor-eligibility',
 *     '0 0 * * *',   -- midnight UTC every day
 *     $$
 *       SELECT net.http_post(
 *         url := current_setting('app.supabase_url') || '/functions/v1/reset-eligibility',
 *         headers := jsonb_build_object(
 *           'Authorization', 'Bearer ' || current_setting('app.supabase_service_key'),
 *           'Content-Type', 'application/json'
 *         ),
 *         body := '{}'::jsonb
 *       );
 *     $$
 *   );
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role client so we can update across all rows (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    // Find all donors who are 'resting' but whose next_eligible_date has passed
    const { data: eligibleDonors, error: fetchError } = await supabase
      .from("users")
      .select("id, display_id, next_eligible_date")
      .eq("availability_status", "resting")
      .lte("next_eligible_date", now);

    if (fetchError) throw fetchError;

    if (!eligibleDonors || eligibleDonors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, reset: 0, message: "No donors needed resetting." }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const donorIds = eligibleDonors.map((d: { id: string }) => d.id);

    // Batch-update to available
    const { error: updateError } = await supabase
      .from("users")
      .update({ availability_status: "available", updated_at: now })
      .in("id", donorIds);

    if (updateError) throw updateError;

    console.log(`[reset-eligibility] Reset ${donorIds.length} donor(s) to available.`);

    return new Response(
      JSON.stringify({
        success: true,
        reset: donorIds.length,
        donors: eligibleDonors.map((d: { id: string; display_id: string; next_eligible_date: string }) => ({
          id: d.id,
          display_id: d.display_id,
          was_eligible_since: d.next_eligible_date,
        })),
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[reset-eligibility] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
