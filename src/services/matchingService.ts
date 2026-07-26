import { supabase } from "@/utils/supabaseClient";
import type { BloodType, AnonymizedDonor } from "@/types";
import { COMPATIBLE_DONORS } from "@/types";

export const matchingService = {
  /**
   * Calculate distance between two coordinate pairs using Haversine formula (in km).
   */
  calculateDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  },

  /**
   * Check if a donor blood type can give to a recipient blood type.
   */
  isCompatible(donorType: BloodType, recipientType: BloodType): boolean {
    const compatibleDonorList = COMPATIBLE_DONORS[recipientType] || [];
    return compatibleDonorList.includes(donorType);
  },

  /**
   * Find compatible, available donors sorted by distance.
   */
  async findCompatibleDonors(
    neededType: BloodType,
    seekerLat: number,
    seekerLng: number,
    maxRadiusKm: number = 10
  ): Promise<AnonymizedDonor[]> {
    const { data: donors, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "donor")
      .eq("availability_status", "available");

    if (error || !donors) {
      console.error("Error fetching matching donors:", error?.message);
      return [];
    }

    const compatibleList = COMPATIBLE_DONORS[neededType] || [];

    const matched = donors
      .filter((d) => d.blood_type && compatibleList.includes(d.blood_type as BloodType))
      .map((d) => {
        const dLat = Number(d.latitude) || seekerLat;
        const dLng = Number(d.longitude) || seekerLng;
        const distance = this.calculateDistanceKm(seekerLat, seekerLng, dLat, dLng);

        return {
          id: d.id,
          display_id: d.display_id || `Donor #${d.id.slice(0, 4)}`,
          blood_type: d.blood_type as BloodType,
          distance_km: distance,
          availability_status: d.availability_status || "available",
          verification_badge: Boolean(d.is_verified),
          fuzzed_lat: dLat,
          fuzzed_lng: dLng,
          last_active: d.created_at || new Date().toISOString(),
        } as AnonymizedDonor;
      })
      .filter((d) => d.distance_km <= maxRadiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);

    return matched;
  },
};
