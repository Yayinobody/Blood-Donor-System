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
      const restExpired = donor?.next_eligible_date ? new Date(donor.next_eligible_date) <= new Date() : true;
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
   * Execute atomic contact reveal via DB RPC `reveal_contact_and_log_atomically`.
   * Verifies gates, updates match status to 'contact_revealed', logs to contact_reveal_audit,
   * and triggers notify-seeker Edge Function.
   */
  async revealContact(matchId: string, userAgent?: string): Promise<ContactRevealData> {
    const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "web-app");

    // 1. Call atomic DB RPC
    const { data: rpcResult, error: rpcErr } = await supabase.rpc("reveal_contact_and_log_atomically", {
      p_match_id: matchId,
      p_user_agent: ua,
    });

    if (rpcErr || !rpcResult?.success) {
      throw new Error(rpcErr?.message || rpcResult?.message || "Failed to reveal contact information.");
    }

    const data = rpcResult.data;

    // 2. Trigger notification email to seeker via Edge Function
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey && data?.seeker_email) {
        fetch(`${supabaseUrl}/functions/v1/notify-seeker`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            seeker_email: data.seeker_email,
            hospital_name: data.hospital_name,
            donor_display_id: data.donor_display_id,
          }),
        }).catch((err) => console.warn("Notify edge function notice:", err));
      }
    } catch (e) {
      console.warn("Notification trigger error:", e);
    }

    return {
      seeker_name: data.seeker_name,
      seeker_email: data.seeker_email,
      seeker_phone: data.seeker_phone,
      hospital_name: data.hospital_name,
      donor_full_name: data.donor_full_name,
      donor_email: data.donor_email,
      donor_phone: data.donor_phone,
      donor_display_id: data.donor_display_id,
    };
  },

  /**
   * Complete donation atomically via DB RPC `complete_donation_atomically`.
   * Marks request fulfilled, match accepted, logs donation, and sets donor resting period (+84 days).
   */
  async completeDonation(
    matchId: string,
    donorId: string,
    notes?: string,
    volumeMl: number = 450
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc("complete_donation_atomically", {
      p_match_id: matchId,
      p_donor_id: donorId,
      p_notes: notes || null,
      p_volume_ml: volumeMl,
    });

    if (error || !data?.success) {
      throw new Error(error?.message || "Failed to complete donation atomically.");
    }

    return true;
  },
};
