import { useState } from "react";
import { Navigation, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { locationService } from "@/services/locationService";
import { useAuth } from "@/context/AuthContext";

interface CalibrateLocationButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: (lat: number, lng: number) => void;
}

export function CalibrateLocationButton({
  variant = "outline",
  size = "sm",
  className = "",
  onSuccess,
}: CalibrateLocationButtonProps) {
  const { user, refreshProfile } = useAuth();
  const [calibrating, setCalibrating] = useState(false);

  const handleCalibrate = async () => {
    if (!user) {
      toast.error("Please log in to calibrate your location.");
      return;
    }

    setCalibrating(true);
    try {
      const res = await locationService.calibrateDonorLocation(user.id);
      await refreshProfile();

      toast.success(res.message, {
        icon: <CheckCircle2 className="h-5 w-5 text-success" />,
        duration: 4000,
      });

      if (onSuccess) {
        onSuccess(res.latitude, res.longitude);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not calibrate location", {
        icon: <AlertCircle className="h-5 w-5 text-error" />,
        duration: 5000,
      });
    } finally {
      setCalibrating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCalibrate}
      disabled={calibrating}
      className={`gap-2 ${className}`}
      title="Update and calibrate your GPS coordinates for donor discovery"
    >
      {calibrating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Calibrating GPS...</span>
        </>
      ) : (
        <>
          <Navigation className="h-4 w-4 text-primary" />
          <span>Calibrate Location</span>
        </>
      )}
    </Button>
  );
}
