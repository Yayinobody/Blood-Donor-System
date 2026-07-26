import { supabase } from "@/utils/supabaseClient";

/** 12-week minimum donation interval in days (WHO/DOH guidance for whole blood) */
const DONATION_INTERVAL_DAYS = 84;

export const eligibilityService = {
  /**
   * Calculate next eligible donation date from a given donation date.
   * Returns an ISO string of next_eligible_date.
   */
  calcNextEligibleDate(donationDate: Date): Date {
    const next = new Date(donationDate);
    next.setDate(next.getDate() + DONATION_INTERVAL_DAYS);
    return next;
  },

  /**
   * Log a new self-reported donation:
   *  - Inserts into donations table
   *  - Updates user availability_status -> 'resting'
   *  - Sets last_donation_date and next_eligible_date on user profile
   */
  async logDonation(
    donorId: string,
    donationDate: Date,
    volumeMl: number = 450,
    notes?: string
  ): Promise<{ donationId: string; nextEligibleDate: Date }> {
    const nextEligibleDate = this.calcNextEligibleDate(donationDate);

    // 1. Insert donation record
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_id: donorId,
        donation_date: donationDate.toISOString(),
        volume_ml: volumeMl,
        status: "completed",
        notes: notes || null,
      })
      .select()
      .single();

    if (donationError) throw donationError;

    // 2. Update user: set resting + eligibility dates
    const { error: profileError } = await supabase
      .from("users")
      .update({
        availability_status: "resting",
        last_donation_date: donationDate.toISOString(),
        next_eligible_date: nextEligibleDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", donorId);

    if (profileError) throw profileError;

    return { donationId: donation.id, nextEligibleDate };
  },

  /**
   * Check if a donor is currently eligible to donate.
   * Returns true if next_eligible_date is null or in the past.
   */
  isEligibleNow(nextEligibleDate: string | null): boolean {
    if (!nextEligibleDate) return true;
    return new Date(nextEligibleDate) <= new Date();
  },

  /**
   * Manually reset a donor back to 'available' if their rest window has passed.
   * Called by the Edge Function scheduled job, but also useful for client-side refresh.
   */
  async resetAvailabilityIfEligible(donorId: string): Promise<boolean> {
    const { data: user, error } = await supabase
      .from("users")
      .select("availability_status, next_eligible_date")
      .eq("id", donorId)
      .single();

    if (error || !user) return false;

    if (
      user.availability_status === "resting" &&
      this.isEligibleNow(user.next_eligible_date)
    ) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ availability_status: "available", updated_at: new Date().toISOString() })
        .eq("id", donorId);

      return !updateError;
    }

    return false;
  },

  /**
   * Format the days remaining until a donor is eligible.
   */
  daysUntilEligible(nextEligibleDate: string | null): number {
    if (!nextEligibleDate) return 0;
    const diff = new Date(nextEligibleDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },
};
