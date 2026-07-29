import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useAnimation,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  MapPin,
  List,
  Map as MapIcon,
  Droplets,
  Search,
  SlidersHorizontal,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Navigation,
  Clock,
  BadgeCheck,
  Users,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { supabase } from "@/utils/supabaseClient";
import type { AnonymizedDonor, BloodType } from "@/types";
import { BLOOD_TYPES, COMPATIBLE_DONORS } from "@/types";

// Leaflet / OpenStreetMap
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ============================================================
// 1. TYPES
// ============================================================
type AvailabilityStatus = "available" | "resting" | "unavailable";
type ViewMode = "map" | "list";
type LocationPermission = "granted" | "denied" | "prompt";

interface Coordinates {
  lat: number;
  lng: number;
}

// ============================================================
// 2. CONSTANTS
// ============================================================
const DEFAULT_CENTER: Coordinates = { lat: 9.3116757, lng: 123.306241 };
const DEFAULT_RADIUS = 5; // increased from 1 to show more donors
const MAX_RADIUS = 100;
const RADIUS_STEP = 1;

// ============================================================
// 3. UTILITY FUNCTIONS
// ============================================================
/**
 * Calculate distance in kilometers between two coordinates using Haversine formula.
 */
export function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Group donors by fuzzed location (same lat/lng rounded to 4 decimals).
 */
function groupDonorsByLocation(donors: AnonymizedDonor[]): Record<string, AnonymizedDonor[]> {
  return donors.reduce((acc, donor) => {
    const key = `${donor.fuzzed_lat.toFixed(4)},${donor.fuzzed_lng.toFixed(4)}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(donor);
    return acc;
  }, {} as Record<string, AnonymizedDonor[]>);
}

/**
 * Compute zoom level based on search radius.
 */
function getZoomForRadius(radiusKm: number): number {
  if (radiusKm > 30) return 9;
  if (radiusKm > 20) return 10;
  if (radiusKm > 10) return 11;
  if (radiusKm > 5) return 12;
  if (radiusKm > 2) return 13;
  return 14;
}

// ============================================================
// 4. CUSTOM HOOKS
// ============================================================

/**
 * Handles geolocation with permission management and error handling.
 */
function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [permission, setPermission] = useState<LocationPermission>("prompt");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setError(true);
      setLoading(false);
      setPermission("denied");
      return;
    }

    setLoading(true);
    setError(false);

    // Check permission status if available
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermission(result.state as LocationPermission);
        if (result.state === "denied") {
          setError(true);
          setLoading(false);
          toast.error("Location permission denied. Please enable it in browser settings.");
          return;
        }
      }).catch(() => {
        // Permission API not supported, proceed with getCurrentPosition
      });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setError(false);
        setLoading(false);
        setPermission("granted");
        toast.success("Location detected successfully!");
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(true);
        setLoading(false);
        setPermission("denied");

        const messages: Record<number, string> = {
          1: "Location access denied. Please allow location in your browser settings.",
          2: "Location information is unavailable. Please try again.",
          3: "Location request timed out. Please try again.",
        };
        toast.error(messages[err.code] || "Failed to get your location. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, []);

  // Auto‑request on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { location, error, loading, permission, requestLocation };
}

/**
 * Fetches real donors from Supabase and computes distances relative to user location.
 */
function useDonors(userLocation: Coordinates | null) {
  const [donors, setDonors] = useState<AnonymizedDonor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("role", "donor");

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: AnonymizedDonor[] = data.map((u, idx) => {
            const donorLat = Number(u.latitude) || 9.3075 + idx * 0.003;
            const donorLng = Number(u.longitude) || 123.305 + idx * 0.003;
            const donorCoords: Coordinates = { lat: donorLat, lng: donorLng };

            const distance = userLocation
              ? haversineDistance(userLocation, donorCoords)
              : 1.0;

            return {
              id: u.id,
              display_id: u.display_id || `Donor #${u.id.slice(0, 4)}`,
              blood_type: (u.blood_type || "O+") as BloodType,
              distance_km: distance,
              availability_status: (u.availability_status || "available") as AvailabilityStatus,
              verification_badge: u.is_verified || false,
              fuzzed_lat: donorLat,
              fuzzed_lng: donorLng,
              last_active: u.created_at || new Date().toISOString(),
            };
          });
          setDonors(mapped);
        }
      } catch (err: any) {
        console.error("Error fetching donors:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDonors();
  }, [userLocation]);

  return { donors, loading };
}

// ============================================================
// 5. ANIMATION VARIANTS
// ============================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

// ============================================================
// 6. REUSABLE COMPONENTS
// ============================================================

function SectionWrapper({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView, controls]);

  return (
    <motion.section
      id={id}
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={controls}
      className={cn("py-20 md:py-28", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </motion.section>
  );
}

// ===================== FIXED DonorCard =====================
const DonorCard = memo(function DonorCard({ donor }: { donor: AnonymizedDonor }) {
  const isAvailable = donor.availability_status === "available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
              isAvailable ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
            )}
          >
            {donor.blood_type}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-dark">{donor.display_id}</span>
              {donor.verification_badge && (
                <Badge variant="success" className="gap-1 text-xs">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {donor.distance_km.toFixed(1)} km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{" "}
                {isAvailable
                  ? "Available now"
                  : donor.availability_status === "resting"
                  ? "Resting"
                  : "Unavailable"}
              </span>
            </div>
          </div>
        </div>
        {/* FIX: Only render Link if available, else just a disabled button */}
        {isAvailable ? (
          <Link to={`/seeker/request/${donor.id || donor.display_id}`}>
            <Button size="sm" className="bg-primary">
              Request
            </Button>
          </Link>
        ) : (
          <Button size="sm" disabled className="bg-gray-300">
            Request
          </Button>
        )}
      </div>
    </motion.div>
  );
});

// ============================================================
// 7. MAP COMPONENTS
// ============================================================

// Auto-zoom based on radius – also flies to the user location smoothly
function AutoZoomMap({ center, radiusKm }: { center: Coordinates; radiusKm: number }) {
  const map = useMap();

  useEffect(() => {
    const zoom = getZoomForRadius(radiusKm);
    map.flyTo([center.lat, center.lng], zoom, { duration: 1 });
  }, [center, radiusKm, map]);

  return null;
}

// Cluster marker with fixed geographic radius (300m)
function RadiusMarkerCluster({
  lat,
  lng,
  donors: donorGroup,
}: {
  lat: number;
  lng: number;
  donors: AnonymizedDonor[];
}) {
  const count = donorGroup.length;
  const hasAvailable = donorGroup.some((d) => d.availability_status === "available");
  const hasVerified = donorGroup.some((d) => d.verification_badge);
  const position: [number, number] = [lat, lng];
  const radiusMeters = 300;

  const markerIcon = L.divIcon({
    className: "custom-radius-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="
          background: ${hasAvailable ? '#E63946' : '#9CA3AF'};
          color: white;
          border-radius: 50%;
          width: ${Math.min(36 + count * 2, 50)}px;
          height: ${Math.min(36 + count * 2, 50)}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${count > 9 ? '11px' : '14px'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid white;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${count}
          ${
            hasVerified
              ? '<span style="position:absolute;top:-4px;right:-4px;font-size:10px;background:green;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">✓</span>'
              : ''
          }
        </div>
        ${
          hasAvailable
            ? `
          <div style="
            position: absolute;
            width: 200%;
            height: 200%;
            border-radius: 50%;
            background: rgba(230, 57, 70, 0.1);
            animation: pulse 2s ease-in-out infinite;
          "></div>`
            : ""
        }
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });

  return (
    <>
      <Circle
        center={position}
        radius={radiusMeters}
        pathOptions={{
          color: hasAvailable ? "#E63946" : "#9CA3AF",
          fillColor: hasAvailable ? "#E63946" : "#9CA3AF",
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.6,
        }}
      />
      <Marker position={position} icon={markerIcon}>
        <Popup className="donor-popup" maxWidth={300}>
          <div className="text-sm p-1">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-dark">
                {count} donor{count > 1 ? "s" : ""} at this location
              </strong>
              {hasVerified && (
                <Badge variant="success" className="text-xs gap-1">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {donorGroup.map((donor, idx) => (
                <div
                  key={idx}
                  className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{donor.display_id}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {donor.blood_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {donor.distance_km.toFixed(1)} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {donor.availability_status === "available"
                            ? "Available now"
                            : donor.availability_status === "resting"
                            ? "Resting"
                            : "Unavailable"}
                        </span>
                        {donor.verification_badge && (
                          <BadgeCheck className="h-3 w-3 text-success" />
                        )}
                      </div>
                    </div>
                    {/* ✅ FIXED: Only link when available */}
                    {donor.availability_status === "available" ? (
                      <Link to={`/seeker/request/${donor.id || donor.display_id}`}>
                        <Button size="sm" className="bg-primary ml-2 flex-shrink-0">
                          Request
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" disabled className="bg-gray-300 ml-2 flex-shrink-0">
                        Request
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

function MapView({
  donors,
  userLocation,
  radiusKm,
}: {
  donors: AnonymizedDonor[];
  userLocation: Coordinates | null;
  radiusKm: number;
}) {
  const center = userLocation || DEFAULT_CENTER;
  const groupedDonors = useMemo(() => groupDonorsByLocation(donors), [donors]);

  // Force a fresh Leaflet instance when userLocation changes
  const mapKey = userLocation ? `map-${userLocation.lat}-${userLocation.lng}` : "map-default";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      <div className="relative" style={{ height: "800px" }}>
        <MapContainer
          key={mapKey}
          center={[center.lat, center.lng]}
          zoom={getZoomForRadius(radiusKm)}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <>
              <AutoZoomMap center={userLocation} radiusKm={radiusKm} />
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "#3B82F6",
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: "5, 5",
                }}
              />
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  className: "user-marker",
                  html: `<div style="width:14px;height:14px;border-radius:50%;background:#3B82F6;border:2px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7],
                })}
              />
            </>
          )}

          {Object.entries(groupedDonors).map(([key, donorGroup]) => {
            const [lat, lng] = key.split(",").map(Number);
            return (
              <RadiusMarkerCluster
                key={key}
                lat={lat}
                lng={lng}
                donors={donorGroup}
              />
            );
          })}
        </MapContainer>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0.1; }
            100% { transform: scale(1); opacity: 0.5; }
          }
        `}</style>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/15" />
            Available Donors
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-400/15" />
            Resting Donors
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            {radiusKm} km Search Radius
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200 mt-1">
            <span className="text-xs text-gray-500">Each circle = 300m radius</span>
          </div>
        </div>

        {/* Info */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>
              <span className="font-semibold text-primary">{donors.length}</span> donors in{" "}
              {Object.keys(groupedDonors).length} locations
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 8. LIST VIEW
// ============================================================
function ListView({ donors }: { donors: AnonymizedDonor[] }) {
  if (donors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Droplets className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No donors match your criteria.</p>
        <p className="text-sm">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
    >
      {donors.map((donor) => (
        <DonorCard key={donor.display_id} donor={donor} />
      ))}
    </motion.div>
  );
}

// ============================================================
// 9. HERO SEARCH SECTION
// ============================================================
function HeroSearchSection({
  viewMode,
  setViewMode,
  selectedBloodType,
  setSelectedBloodType,
  radiusKm,
  setRadiusKm,
  showFilters,
  setShowFilters,
  donors,
  userLocation,
  locationError,
  locationLoading,
  locationPermission,
  requestLocation,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedBloodType: BloodType | "";
  setSelectedBloodType: (type: BloodType | "") => void;
  radiusKm: number;
  setRadiusKm: (r: number) => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
  donors: AnonymizedDonor[];
  userLocation: Coordinates | null;
  locationError: boolean;
  locationLoading: boolean;
  locationPermission: LocationPermission;
  requestLocation: () => void;
}) {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4"
          >
            <Zap className="h-4 w-4" /> Find Blood Donors Near You
          </motion.div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-dark">
            Urgent Blood Needed?{" "}
            <span className="bg-gradient-to-r from-primary to-red-700 bg-clip-text text-transparent">
              Find a Donor Now
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Browse nearby blood donors anonymously. No account needed to search.
            Donors stay private until both sides are verified.
          </p>
        </motion.div>

        {/* Search / Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2">
            <Search className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
            <select
              value={selectedBloodType}
              onChange={(e) => setSelectedBloodType(e.target.value as BloodType | "")}
              className="flex-1 bg-transparent border-0 text-sm focus:ring-0 py-2"
            >
              <option value="">Any blood type</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10 text-primary" : ""}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "map" ? "bg-white shadow text-dark" : "text-gray-500"
                }`}
              >
                <MapIcon className="h-4 w-4 inline mr-1" /> Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list" ? "bg-white shadow text-dark" : "text-gray-500"
                }`}
              >
                <List className="h-4 w-4 inline mr-1" /> List
              </button>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mt-2 overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Distance:</label>
                  <input
                    type="range"
                    min={1}
                    max={MAX_RADIUS}
                    step={RADIUS_STEP}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-semibold text-primary w-16 text-right">
                    {radiusKm} km
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Location status */}
        <div className="text-center mb-4">
          {locationLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500"
            >
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Detecting your location...
              </div>
            </motion.div>
          ) : locationError && locationPermission === "denied" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm"
            >
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
                <p className="text-yellow-700 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  <span>Location access is blocked.</span>
                </p>
                <div className="mt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast(
                        "Please enable location in your browser settings and refresh the page."
                      );
                    }}
                  >
                    How to enable
                  </Button>
                  <Button size="sm" className="bg-primary" onClick={requestLocation}>
                    Try Again
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : locationError && locationPermission === "prompt" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
                <p className="text-blue-700 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  <span>Allow location to find donors near you.</span>
                </p>
                <Button size="sm" className="mt-2 bg-primary" onClick={requestLocation}>
                  Allow Location Access
                </Button>
              </div>
            </motion.div>
          ) : userLocation ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-600"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Location detected! Showing donors near you.</span>
              </div>
            </motion.div>
          ) : null}
        </div>

        {/* Results count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500 mb-6"
        >
          {donors.length} donor{donors.length !== 1 ? "s" : ""} found
          {selectedBloodType && ` compatible with ${selectedBloodType}`}
          {userLocation && ` within ${radiusKm}km`}
        </motion.p>

        {/* View */}
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <MapView
              key="map"
              donors={donors}
              userLocation={userLocation}
              radiusKm={radiusKm}
            />
          ) : (
            <ListView key="list" donors={donors} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ============================================================
// 10. OTHER SECTIONS
// ============================================================

function ProblemSection() {
  return (
    <SectionWrapper id="problem" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">The Challenge</h2>
        <p className="mt-4 text-lg text-gray-600">
          Finding a blood donor in an emergency is hard. Current systems expose personal
          data, lack verification, and don't respect privacy.
        </p>
      </motion.div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Shield, title: "Privacy at Risk", desc: "Donors and seekers both expose personal contact info to strangers." },
          { icon: Clock, title: "Slow Matching", desc: "No real-time availability tracking — donors may be unreachable." },
          { icon: Users, title: "No Verification", desc: "Anyone can claim to be a donor without proof of eligibility." },
        ].map((item, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-dark">{item.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function FeaturesSection() {
  const features = [
    { icon: MapPin, title: "Map-Based Search", desc: "Browse donors near you on an interactive map. No account needed." },
    { icon: Shield, title: "Mutual Verification", desc: "Both parties verify their identity before contact info is ever exchanged." },
    { icon: Brain, title: "AI Assistant", desc: "Get instant answers about eligibility, compatibility, and nearby blood banks." },
    { icon: Lock, title: "Anonymized Profiles", desc: "Donors appear only by pseudonym until both sides pass verification." },
  ];

  return (
    <SectionWrapper id="features" className="bg-background">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">How AnonBlood Helps</h2>
      </motion.div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
            className="flex gap-4 bg-white rounded-xl border p-5 shadow-sm"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-dark">{f.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function WorkflowSection() {
  const steps = [
    { step: "01", title: "Search Anonymously", desc: "Seekers browse donors on the map. No login needed. Donors appear as pseudonyms." },
    { step: "02", title: "Send a Request", desc: "Seeker submits a request with their contact info (hidden from donor for now)." },
    { step: "03", title: "Donor Responds", desc: "Donor accepts or declines. If accepted, both sides complete light verification." },
    { step: "04", title: "Mutual Reveal", desc: "Only after verification do both parties see each other's real contact details." },
  ];

  return (
    <SectionWrapper id="workflow" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">How It Works</h2>
      </motion.div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <motion.div key={i} variants={fadeInUp} className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
              {s.step}
            </div>
            <h3 className="mt-4 font-semibold text-dark">{s.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function ComparisonSection() {
  return (
    <SectionWrapper id="comparison" className="bg-background">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">AnonBlood vs. Traditional</h2>
      </motion.div>
      <div className="mt-12 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4">Feature</th>
              <th className="py-3 px-4 text-primary font-bold">AnonBlood</th>
              <th className="py-3 px-4 text-gray-500">Traditional</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Search", "No account needed", "Login required"],
              ["Privacy", "Pseudonyms until verified", "Real names exposed"],
              ["Verification", "Mutual OTP + ID check", "None or one-sided"],
              ["Matching", "Map + compatibility filter", "Manual posts/groups"],
            ].map((row, i) => (
              <tr key={i} className="border-b">
                <td className="py-3 px-4 font-medium">{row[0]}</td>
                <td className="py-3 px-4 text-primary">{row[1]}</td>
                <td className="py-3 px-4 text-gray-500">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}

function FAQSection() {
  const faqs = [
    { q: "Do I need an account to search for donors?", a: "No. Anyone can browse the map and list of donors without creating an account." },
    { q: "When does a donor see my contact info?", a: "Only after both you and the donor have completed light verification (email/phone OTP)." },
    { q: "How is donor location protected?", a: "Donor pins are fuzzed to the nearest barangay/district centroid — never their real address." },
  ];

  return (
    <SectionWrapper id="faq" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">FAQ</h2>
      </motion.div>
      <div className="mt-12 max-w-2xl mx-auto space-y-3">
        {faqs.map((faq, i) => (
          <motion.div key={i} variants={fadeInUp} className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold">{faq.q}</h3>
            <p className="text-sm text-gray-600 mt-1">{faq.a}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-red-700 text-white text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-4"
      >
        <h2 className="text-3xl font-bold sm:text-4xl">Ready to Become a Donor?</h2>
        <p className="mt-4 text-white/80">
          Sign up now to appear on the map and start saving lives anonymously.
        </p>
        <Link to="/register">
          <Button size="lg" variant="secondary" className="mt-6 bg-white text-primary hover:bg-gray-100">
            Register as Donor <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}

// ============================================================
// 11. MAIN LANDING PAGE
// ============================================================
export default function LandingPage() {
  // Geolocation
  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
    permission: locationPermission,
    requestLocation,
  } = useGeolocation();

  // Donors
  const { donors: dbDonors } = useDonors(userLocation);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | "">("");
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS);
  const [showFilters, setShowFilters] = useState(false);

  // Compute compatible types and filter donors
  const compatibleTypes = selectedBloodType
    ? COMPATIBLE_DONORS[selectedBloodType]
    : BLOOD_TYPES;

  const filteredDonors = useMemo(() => {
    return dbDonors.filter(
      (d) =>
        compatibleTypes.includes(d.blood_type) &&
        d.distance_km <= radiusKm &&
        d.availability_status !== "unavailable"
    );
  }, [dbDonors, compatibleTypes, radiusKm]);

  // Sort by distance
  const sortedDonors = useMemo(
    () => [...filteredDonors].sort((a, b) => a.distance_km - b.distance_km),
    [filteredDonors]
  );

  return (
    <div className="overflow-hidden">
      <HeroSearchSection
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedBloodType={selectedBloodType}
        setSelectedBloodType={setSelectedBloodType}
        radiusKm={radiusKm}
        setRadiusKm={setRadiusKm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        donors={sortedDonors}
        userLocation={userLocation}
        locationError={locationError}
        locationLoading={locationLoading}
        locationPermission={locationPermission}
        requestLocation={requestLocation}
      />

      <ProblemSection />
      <FeaturesSection />
      <WorkflowSection />
      <ComparisonSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
