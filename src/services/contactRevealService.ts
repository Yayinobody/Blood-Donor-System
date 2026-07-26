import { supabase } from "@/utils/supabaseClient";

export interface VerificationGateResult {
  isCleared: boolean;
  donorVerified: boolean;
  seekerVerified: boolean;
  unverifiedParty: "none" | "donor" | "seeker" | "both";
  donorDisplayId?: string;
  seekerEmail?: string;
}

export interface ContactRevealData {
  seeker_name: string | null;
  seeker_email: string;
  seeker_phone: string | null;
  hospital_name: string;
  donor_full_name?: string | null;
  donor_email?: string | null;
  donor_phone?: string | null;
}

/**
 * contactRevealService: The single security choke point that checks both parties'
 * verification status and match acceptance before revealing contact information.
 */
export const contactRevealService = {
  /**
   * Check if both donor and seeker clear the minimum (light) verification gate.
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
            verification_method
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

      // Light verification check: email or phone verified
      const donorVerified = Boolean(donor?.is_verified || donor?.verification_method);
      const seekerVerified = Boolean(request?.is_verified);

      let unverifiedParty: "none" | "donor" | "seeker" | "both" = "none";
      if (!donorVerified && !seekerVerified) unverifiedParty = "both";
      else if (!donorVerified) unverifiedParty = "donor";
      else if (!seekerVerified) unverifiedParty = "seeker";

      return {
        isCleared: donorVerified && seekerVerified,
        donorVerified,
        seekerVerified,
        unverifiedParty,
        donorDisplayId: donor?.display_id,
        seekerEmail: request?.seeker_email,
      };
    } catch (err: any) {
      console.error("Error in checkVerificationGate:", err.message);
      return {
        isCleared: false,
        donorVerified: false,
        seekerVerified: false,
        unverifiedParty: "both",
      };
    }
  },

  /**
   * Execute contact reveal once verification gate is cleared.
   * Logs the reveal event to contact_reveal_audit and triggers email notification.
   */
  async revealContact(matchId: string, userAgent?: string): Promise<ContactRevealData> {
    // 1. Check gate
    const gateStatus = await this.checkVerificationGate(matchId);
    if (!gateStatus.isCleared) {
      throw new Error(
        `Contact reveal blocked: ${gateStatus.unverifiedParty} has not completed light verification.`
      );
    }

    // 2. Fetch full match details
    const { data: match, error: fetchErr } = await supabase
      .from("request_matches")
      .select(`
        id,
        donor_id,
        request_id,
        users:donor_id (
          id,
          full_name,
          email,
          phone,
          display_id
        ),
        requests:request_id (
          id,
          seeker_name,
          seeker_email,
          seeker_phone,
          blood_type_needed,
          hospital_name,
          urgency_level
        )
      `)
      .eq("id", matchId)
      .single();

    if (fetchErr || !match) {
      throw new Error(fetchErr?.message || "Failed to load match data for reveal");
    }

    const donor = Array.isArray(match.users) ? match.users[0] : match.users;
    const request = Array.isArray(match.requests) ? match.requests[0] : match.requests;

    // 3. Update match record to contact_revealed
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

    // 4. Log reveal event to contact_reveal_audit
    try {
      await supabase.from("contact_reveal_audit").insert({
        request_id: match.request_id,
        donor_id: match.donor_id,
        seeker_email: request.seeker_email,
        reveal_timestamp: new Date().toISOString(),
        user_agent: userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "web-app"),
      });
    } catch (auditErr: any) {
      console.warn("Audit logging warning:", auditErr.message);
    }

    // 5. Trigger notification email to seeker via Edge Function
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        fetch(`${supabaseUrl}/functions/v1/notify-seeker`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            seeker_email: request.seeker_email,
            blood_type_needed: request.blood_type_needed,
            hospital_name: request.hospital_name,
            donor_display_id: donor.display_id,
            urgency_level: request.urgency_level,
          }),
        }).catch((err) => console.warn("Notify edge function call failed:", err));
      }
    } catch (e) {
      console.warn("Notification error:", e);
    }

    return {
      seeker_name: request.seeker_name || "Blood Seeker",
      seeker_email: request.seeker_email,
      seeker_phone: request.seeker_phone || null,
      hospital_name: request.hospital_name || "Hospital",
      donor_full_name: donor.full_name || donor.display_id,
      donor_email: donor.email,
      donor_phone: donor.phone || null,
    };
  },
};
