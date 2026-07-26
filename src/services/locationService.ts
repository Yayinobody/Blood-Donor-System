import { supabase } from "@/utils/supabaseClient";

export interface CalibrateLocationResult {
  success: boolean;
  latitude: number;
  longitude: number;
  message: string;
}

export const locationService = {
  /**
   * Request high-accuracy geolocation from browser and update donor profile in DB.
   */
  async calibrateDonorLocation(userId: string): Promise<CalibrateLocationResult> {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by your browser.");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = Math.round(position.coords.latitude * 100000) / 100000;
            const longitude = Math.round(position.coords.longitude * 100000) / 100000;

            // Call Supabase RPC update_donor_location
            const { error } = await supabase.rpc("update_donor_location", {
              p_user_id: userId,
              p_latitude: latitude,
              p_longitude: longitude,
            });

            if (error) {
              // Direct table update fallback
              const { error: updateErr } = await supabase
                .from("users")
                .update({
                  latitude,
                  longitude,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", userId);

              if (updateErr) throw updateErr;
            }

            resolve({
              success: true,
              latitude,
              longitude,
              message: `Location successfully calibrated (${latitude.toFixed(4)}, ${longitude.toFixed(4)}).`,
            });
          } catch (err: any) {
            reject(new Error(err.message || "Failed to save calibrated location to database."));
          }
        },
        (error) => {
          let errorMessage = "Unable to retrieve your current location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please check your GPS signal.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  },
};
