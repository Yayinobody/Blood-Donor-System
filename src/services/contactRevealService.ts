import { supabase } from "@/utils/supabaseClient";

export interface VerificationGateResult {
  isCleared: boolean;
  donorVerified: boolean;
  seekerVerified: boolean;
  donorEligible: boolean;
  unverifiedParty: "none" | "donor" | "seeker" | "both";
  donorDisplayId?: string;
  seekerEmail?: string;
  reason?: string;
}

export interface ContactRevealData {
  seeker_name: string | null;
  seeker_email: string;
  seeker_phone: string | null;
  hospital_name: string;
  donor_full_name?: string | null;
  donor_email?: string | null;
  donor_phone?: string | null;
  donor_display_id?: string;
}

/**
 * contactRevealService: The security choke point enforcing mutual light verification,
 * donor medical eligibility, atomic DB reveal, and audit logging.
 * All DB operations use direct Supabase queries (no custom RPCs needed).
 */
export const contactRevealService = {
  /**
   * Check if both donor and seeker clear minimum light verification and eligibility conditions.
   */
  async checkVerificationGate(matchId: string): Promise<VerificationGateResult> {
    try {
      const { data: match, error } = await supabase
        .from("request_matches")
        .select(`
          id,
          donor_id,
          request_id,
          users:donor_id (
            id,
            display_id,
            is_verified,
            verification_method,
            availability_status,
            next_eligible_date
          ),
          requests:request_id (
            id,
            seeker_email,
            is_verified
          )
        `)
        .eq("id", matchId)
        .single();

      if (error || !match) {
        throw new Error(error?.message || "Match not found");
      }

      const donor = Array.isArray(match.users) ? match.users[0] : match.users;
      const request = Array.isArray(match.requests) ? match.requests[0] : match.requests;

      // Light verification check
      const donorVerified = Boolean(donor?.is_verified || donor?.verification_method);
      const seekerVerified = Boolean(request?.is_verified);

      // Eligibility check
      const isResting = donor?.availability_status === "resting";
      const restExpired = donor?.next_eligible_date
        ? new Date(donor.next_eligible_date) <= new Date()
        : true;
      const donorEligible = !isResting || restExpired;

      let unverifiedParty: "none" | "donor" | "seeker" | "both" = "none";
      if (!donorVerified && !seekerVerified) unverifiedParty = "both";
      else if (!donorVerified) unverifiedParty = "donor";
      else if (!seekerVerified) unverifiedParty = "seeker";

      let reason = "";
      if (!donorEligible) {
        reason = "Donor is currently in a mandatory medical rest period.";
      } else if (!donorVerified || !seekerVerified) {
        reason = `Light verification required for: ${unverifiedParty}.`;
      }

      return {
        isCleared: donorVerified && seekerVerified && donorEligible,
        donorVerified,
        seekerVerified,
        donorEligible,
        unverifiedParty,
        donorDisplayId: donor?.display_id,
        seekerEmail: request?.seeker_email,
        reason,
      };
    } catch (err: any) {
      console.error("Error in checkVerificationGate:", err.message);
      return {
        isCleared: false,
        donorVerified: false,
        seekerVerified: false,
        donorEligible: false,
        unverifiedParty: "both",
        reason: err.message,
      };
    }
  },

  /**
   * Reveal contact information between seeker and donor.
   * Steps:
   *  1. Fetch full match + request + donor data
   *  2. Mark match as contact_revealed in request_matches
   *  3. Log reveal event to contact_reveal_audit
   *  4. Send seeker notification email via Pipedream → Brevo
   */
  async revealContact(matchId: string): Promise<ContactRevealData> {
    // 1. Fetch full match data
    const { data: match, error: fetchErr } = await supabase
      .from("request_matches")
      .select(`
        id,
        donor_id,
        request_id,
        requests:request_id (
          id,
          seeker_name,
          seeker_email,
          seeker_phone,
          hospital_name,
          blood_type_needed,
          urgency_level
        ),
        users:donor_id (
          id,
          full_name,
          email,
          phone,
          display_id
        )
      `)
      .eq("id", matchId)
      .single();

    if (fetchErr || !match) {
      throw new Error(fetchErr?.message || "Match not found");
    }

    const request = Array.isArray(match.requests) ? match.requests[0] : match.requests;
    const donor = Array.isArray(match.users) ? match.users[0] : match.users;

    if (!request || !donor) {
      throw new Error("Could not load request or donor details.");
    }

    // 2. Mark match as contact_revealed
    const { error: updateErr } = await supabase
      .from("request_matches")
      .update({
        status: "contact_revealed",
        contact_revealed: true,
        revealed_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateErr) {
      throw new Error(`Failed to update match status: ${updateErr.message}`);
    }

    // 3. Log to contact_reveal_audit
    await supabase
      .from("contact_reveal_audit")
      .insert({
        request_id: match.request_id,
        donor_id: match.donor_id,
        seeker_email: request.seeker_email,
        reveal_timestamp: new Date().toISOString(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "web-app",
      })
      .then(({ error }) => {
        if (error) console.warn("Audit log warning:", error.message);
      });

    // 4. Notify seeker via Pipedream → Brevo
    try {
      const pipedreamUrl = import.meta.env.VITE_PIPEDREAM_NOTIFY_URL;
      if (pipedreamUrl && request.seeker_email) {
        fetch(pipedreamUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seeker_email: request.seeker_email,
            seeker_name: request.seeker_name || "Blood Seeker",
            hospital_name: request.hospital_name || "your hospital",
            donor_display_id: donor.display_id,
            donor_email: donor.email,
            blood_type: request.blood_type_needed,
            urgency: request.urgency_level,
          }),
        }).catch((err) => console.warn("Seeker notification error:", err));
      }
    } catch (e) {
      console.warn("Notification trigger error:", e);
    }

    return {
      seeker_name: request.seeker_name,
      seeker_email: request.seeker_email,
      seeker_phone: request.seeker_phone,
      hospital_name: request.hospital_name || "Hospital",
      donor_full_name: donor.full_name,
      donor_email: donor.email,
      donor_phone: donor.phone,
      donor_display_id: donor.display_id,
    };
  },

  /**
   * Mark a donation as fulfilled.
   * Steps:
   *  1. Mark the request as fulfilled
   *  2. Log the donation in public.donations
   *  3. Set donor availability to "resting" for 84 days (WHO 12-week minimum interval)
   */
  async completeDonation(
    matchId: string,
    donorId: string,
    notes?: string,
    volumeMl: number = 450
  ): Promise<boolean> {
    try {
      // Fetch match to get request_id
      const { data: match, error: matchErr } = await supabase
        .from("request_matches")
        .select("request_id")
        .eq("id", matchId)
        .single();

      if (matchErr || !match) throw new Error("Match not found");

      // Mark request fulfilled
      const { error: reqErr } = await supabase
        .from("requests")
        .update({ status: "fulfilled" })
        .eq("id", match.request_id);

      if (reqErr) throw new Error(`Failed to update request: ${reqErr.message}`);

      // Log donation
      const donationDate = new Date().toISOString();
      const { error: donErr } = await supabase
        .from("donations")
        .insert({
          donor_id: donorId,
          donation_date: donationDate,
          volume_ml: volumeMl,
          status: "completed",
          notes: notes || null,
        });

      if (donErr) console.warn("Donation log warning:", donErr.message);

      // Set donor resting period (84 days = WHO 12-week minimum)
      const nextEligibleDate = new Date();
      nextEligibleDate.setDate(nextEligibleDate.getDate() + 84);

      await supabase
        .from("users")
        .update({
          availability_status: "resting",
          last_donation_date: donationDate,
          next_eligible_date: nextEligibleDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", donorId);

      return true;
    } catch (err: any) {
      console.error("completeDonation error:", err.message);
      throw err;
    }
  },
};
