import { useState, useEffect, useRef } from "react";
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
import type {
  AnonymizedDonor,
  BloodType,
} from "@/types";
import {
  BLOOD_TYPES,
  COMPATIBLE_DONORS,
} from "@/types";

// --------------------- Leaflet / OpenStreetMap ---------------------
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default Leaflet marker icons breaking under bundlers (Vite/webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MOCK_DONORS: AnonymizedDonor[] = [
  {
    display_id: "Donor #101",
    blood_type: "O+",
    distance_km: 0.6,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.3078,
    fuzzed_lng: 123.3050,
    last_active: "2026-07-21T08:15:00Z",
  },
  {
    display_id: "Donor #102",
    blood_type: "A+",
    distance_km: 0.9,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 9.3096,
    fuzzed_lng: 123.3015,
    last_active: "2026-07-21T07:42:00Z",
  },
  {
    display_id: "Donor #103",
    blood_type: "B+",
    distance_km: 1.2,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.3124,
    fuzzed_lng: 123.3027,
    last_active: "2026-07-20T18:10:00Z",
  },
  {
    display_id: "Donor #104",
    blood_type: "O-",
    distance_km: 1.5,
    availability_status: "resting",
    verification_badge: true,
    fuzzed_lat: 9.3168,
    fuzzed_lng: 123.3048,
    last_active: "2026-07-21T09:03:00Z",
  },
  {
    display_id: "Donor #105",
    blood_type: "AB+",
    distance_km: 1.8,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 9.3048,
    fuzzed_lng: 123.3091,
    last_active: "2026-07-20T20:15:00Z",
  },
  {
    display_id: "Donor #106",
    blood_type: "A-",
    distance_km: 2.0,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.3205,
    fuzzed_lng: 123.3060,
    last_active: "2026-07-21T06:55:00Z",
  },
  {
    display_id: "Donor #107",
    blood_type: "O+",
    distance_km: 2.3,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.3241,
    fuzzed_lng: 123.3042,
    last_active: "2026-07-20T17:12:00Z",
  },
  {
    display_id: "Donor #108",
    blood_type: "B-",
    distance_km: 2.6,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 9.3187,
    fuzzed_lng: 123.2984,
    last_active: "2026-07-19T15:30:00Z",
  },
  {
    display_id: "Donor #109",
    blood_type: "A+",
    distance_km: 2.9,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.3142,
    fuzzed_lng: 123.2956,
    last_active: "2026-07-21T08:47:00Z",
  },
  {
    display_id: "Donor #110",
    blood_type: "O-",
    distance_km: 3.2,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 9.3027,
    fuzzed_lng: 123.2987,
    last_active: "2026-07-20T21:40:00Z",
  },
  {
    display_id: "Donor #111",
    blood_type: "AB-",
    distance_km: 3.5,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.2998,
    fuzzed_lng: 123.3019,
    last_active: "2026-07-19T22:15:00Z",
  },
  {
    display_id: "Donor #112",
    blood_type: "B+",
    distance_km: 3.8,
    availability_status: "resting",
    verification_badge: false,
    fuzzed_lat: 9.2962,
    fuzzed_lng: 123.3058,
    last_active: "2026-07-21T05:48:00Z",
  },
  {
    display_id: "Donor #113",
    blood_type: "O+",
    distance_km: 4.1,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.2941,
    fuzzed_lng: 123.2995,
    last_active: "2026-07-20T16:22:00Z",
  },
  {
    display_id: "Donor #114",
    blood_type: "A+",
    distance_km: 4.5,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 9.3275,
    fuzzed_lng: 123.3005,
    last_active: "2026-07-18T13:50:00Z",
  },
  {
    display_id: "Donor #115",
    blood_type: "O-",
    distance_km: 4.9,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.3298,
    fuzzed_lng: 123.3078,
    last_active: "2026-07-21T07:11:00Z",
  },
  {
    display_id: "Donor #116",
    blood_type: "B+",
    distance_km: 5.3,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 9.2915,
    fuzzed_lng: 123.3090,
    last_active: "2026-07-20T11:30:00Z",
  },
  {
    display_id: "Donor #117",
    blood_type: "AB+",
    distance_km: 5.8,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.3332,
    fuzzed_lng: 123.3035,
    last_active: "2026-07-21T08:30:00Z",
  },
  {
    display_id: "Donor #118",
    blood_type: "A-",
    distance_km: 6.2,
    availability_status: "resting",
    verification_badge: false,
    fuzzed_lat: 9.2887,
    fuzzed_lng: 123.3008,
    last_active: "2026-07-19T12:45:00Z",
  },
  {
    display_id: "Donor #119",
    blood_type: "O+",
    distance_km: 6.8,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 9.3361,
    fuzzed_lng: 123.3089,
    last_active: "2026-07-21T09:15:00Z",
  },
  {
    display_id: "Donor #120",
    blood_type: "B-",
    distance_km: 7.3,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 9.2865,
    fuzzed_lng: 123.3041,
    last_active: "2026-07-20T14:20:00Z",
  },
];

// --------------------- Animation Variants ---------------------
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

// --------------------- Section Wrapper ---------------------
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

// --------------------- Main Landing Page ---------------------
export default function LandingPage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | "">("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  // Get user location on mount with proper permission handling
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationError(true);
        setLocationLoading(false);
        setLocationPermission("denied");
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      // Check permission status
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' })
          .then((result) => {
            setLocationPermission(result.state as "granted" | "denied" | "prompt");

            if (result.state === 'denied') {
              setLocationError(true);
              setLocationLoading(false);
              toast.error('Location permission denied. Please enable location in your browser settings.');
              return;
            }
          })
          .catch(() => {
            // Permission API not supported, proceed with getCurrentPosition
          });
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLocationError(false);
          setLocationLoading(false);
          setLocationPermission("granted");
          toast.success('Location detected successfully!');
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(true);
          setLocationLoading(false);
          setLocationPermission("denied");

          // Handle different error types
          switch(error.code) {
            case error.PERMISSION_DENIED:
              toast.error('Location access denied. Please allow location access in your browser settings.');
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error('Location information is unavailable. Please try again.');
              break;
            case error.TIMEOUT:
              toast.error('Location request timed out. Please try again.');
              break;
            default:
              toast.error('Failed to get your location. Please try again.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    };

    getLocation();
  }, []);

  // Filter donors by blood type compatibility
  const compatibleTypes = selectedBloodType
    ? COMPATIBLE_DONORS[selectedBloodType]
    : BLOOD_TYPES;

  const filteredDonors = MOCK_DONORS.filter(
    (d) =>
      compatibleTypes.includes(d.blood_type) &&
      d.distance_km <= radiusKm &&
      d.availability_status !== "unavailable"
  );

  // Sort by distance
  const sortedDonors = [...filteredDonors].sort((a, b) => a.distance_km - b.distance_km);

  return (
    <div className="overflow-hidden">
      {/* Hero + Map Section */}
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
        setLocationPermission={setLocationPermission}
        setUserLocation={setUserLocation}
        setLocationError={setLocationError}
        setLocationLoading={setLocationLoading}
      />

      {/* Problem Section */}
      <ProblemSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works */}
      <WorkflowSection />

      {/* Comparison */}
      <ComparisonSection />

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <CTASection />
    </div>
  );
}

// --------------------- Hero + Map/List Search Section ---------------------
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
  setLocationPermission,
  setUserLocation,
  setLocationError,
  setLocationLoading,
}: {
  viewMode: "map" | "list";
  setViewMode: (m: "map" | "list") => void;
  selectedBloodType: BloodType | "";
  setSelectedBloodType: (b: BloodType | "") => void;
  radiusKm: number;
  setRadiusKm: (r: number) => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
  donors: AnonymizedDonor[];
  userLocation: { lat: number; lng: number } | null;
  locationError: boolean;
  locationLoading: boolean;
  locationPermission: "granted" | "denied" | "prompt";
  setLocationPermission: (p: "granted" | "denied" | "prompt") => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setLocationError: (err: boolean) => void;
  setLocationLoading: (loading: boolean) => void;
}) {

  // Function to request location permission manually
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationError(false);
        setLocationLoading(false);
        setLocationPermission("granted");
        toast.success('Location access granted! Showing donors near you.');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(true);
        setLocationLoading(false);
        setLocationPermission("denied");

        switch(error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location in your browser settings and refresh the page.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information is unavailable. Please try again.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out. Please try again.');
            break;
          default:
            toast.error('Failed to get your location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

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
                    max={50}
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

        {/* Location status with permission handling */}
        <div className="text-center mb-4">
          {locationLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500"
            >
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
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
                      toast.info('Please enable location in your browser settings and refresh the page.');
                      // Open browser settings or show instructions
                      if (navigator.userAgent.includes('Chrome')) {
                        toast.info('Chrome: Click the lock icon in the address bar → Site settings → Location → Allow');
                      } else if (navigator.userAgent.includes('Firefox')) {
                        toast.info('Firefox: Click the shield icon → Clear cookies and site data → Reload');
                      } else if (navigator.userAgent.includes('Safari')) {
                        toast.info('Safari: Safari → Preferences → Websites → Location → Allow');
                      }
                    }}
                  >
                    How to enable
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary"
                    onClick={requestLocationPermission}
                  >
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
                <Button
                  size="sm"
                  className="mt-2 bg-primary"
                  onClick={requestLocationPermission}
                >
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
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Location detected! Showing donors near you.</span>
                <button
                  className="text-xs text-primary underline ml-2"
                  onClick={() => {
                    toast.success(`📍 Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
                  }}
                >
                  View coordinates
                </button>
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

        {/* View: Map or List */}
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

// --------------------- Leaflet helpers ---------------------

// Custom colored-dot marker for donors (avoids default Leaflet pin)
function donorIcon(available: boolean, verified: boolean) {
  return L.divIcon({
    className: "custom-donor-marker",
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="
          width:16px;height:16px;border-radius:50%;
          background:${available ? "#E63946" : "#9CA3AF"};
          border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);
        "></div>
        ${verified ? `<span style="position:absolute;top:-6px;right:-6px;font-size:10px;">✓</span>` : ""}
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Re-centers the map when the user's location updates
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Auto-zoom based on radius
function AutoZoomMap({ radiusKm }: { radiusKm: number }) {
  const map = useMap();

  useEffect(() => {
    let zoom = 13;
    if (radiusKm > 30) zoom = 9;
    else if (radiusKm > 20) zoom = 10;
    else if (radiusKm > 10) zoom = 11;
    else if (radiusKm > 5) zoom = 12;
    else if (radiusKm > 2) zoom = 13;
    else zoom = 14;

    map.setZoom(zoom);
  }, [radiusKm, map]);

  return null;
}

// --------------------- Map View (OpenStreetMap via Leaflet) ---------------------
function MapView({
  donors,
  userLocation,
  radiusKm,
}: {
  donors: AnonymizedDonor[];
  userLocation: { lat: number; lng: number } | null;
  radiusKm: number;
}) {
  const centerLat = 9.3116757;
  const centerLng = 123.306241;

  // Group donors by location (fuzzed to the same coordinates)
  const groupedDonors = donors.reduce((acc, donor) => {
    const key = `${donor.fuzzed_lat.toFixed(4)},${donor.fuzzed_lng.toFixed(4)}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(donor);
    return acc;
  }, {} as Record<string, AnonymizedDonor[]>);

  // Component to render radius circles with fixed geographic size
  function RadiusMarkerCluster({
    lat,
    lng,
    donors: donorGroup,
    centerLat,
    centerLng
  }: {
    lat: number;
    lng: number;
    donors: AnonymizedDonor[];
    centerLat: number;
    centerLng: number;
  }) {
    const count = donorGroup.length;
    const hasAvailable = donorGroup.some(d => d.availability_status === 'available');
    const hasVerified = donorGroup.some(d => d.verification_badge);
    const avgDistance = donorGroup.reduce((sum, d) => sum + d.distance_km, 0) / count;

    // Fixed geographic radius of 300 meters (0.3km)
    const radiusMeters = 300;

    // Calculate position relative to center for display
    const position = [lat, lng] as [number, number];

    return (
      <>
        {/* Fixed geographic radius circle */}
        <Circle
          center={position}
          radius={radiusMeters}
          pathOptions={{
            color: hasAvailable ? '#E63946' : '#9CA3AF',
            fillColor: hasAvailable ? '#E63946' : '#9CA3AF',
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.6,
          }}
        />

        {/* Center marker with count */}
        <Marker
          position={position}
          icon={L.divIcon({
            className: "custom-radius-marker",
            html: `
              <div style="
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
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
                  ${hasVerified ? '<span style="position:absolute;top:-4px;right:-4px;font-size:10px;background:green;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">✓</span>' : ''}
                </div>
                ${hasAvailable ? `
                  <div style="
                    position: absolute;
                    width: 200%;
                    height: 200%;
                    border-radius: 50%;
                    background: rgba(230, 57, 70, 0.1);
                    animation: pulse 2s ease-in-out infinite;
                  "></div>
                ` : ''}
              </div>
            `,
            className: "radius-marker",
            iconSize: [50, 50],
            iconAnchor: [25, 25],
          })}
        >
          <Popup className="donor-popup" maxWidth={300}>
            <div className="text-sm p-1">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-dark">
                  {count} donor{count > 1 ? 's' : ''} at this location
                </strong>
                {hasVerified && (
                  <Badge variant="success" className="text-xs gap-1">
                    <BadgeCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {donorGroup.map((donor, idx) => (
                  <div key={idx} className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0">
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
                            {donor.availability_status === 'available'
                              ? 'Available now'
                              : donor.availability_status === 'resting'
                              ? 'Resting'
                              : 'Unavailable'}
                          </span>
                          {donor.verification_badge && (
                            <BadgeCheck className="h-3 w-3 text-success" />
                          )}
                        </div>
                      </div>
                      <Link to={`/seeker/request/${donor.display_id.replace("Donor #", "")}`}>
                        <Button
                          size="sm"
                          disabled={donor.availability_status !== 'available'}
                          className={donor.availability_status === 'available' ? 'bg-primary ml-2 flex-shrink-0' : 'bg-gray-300 ml-2 flex-shrink-0'}
                        >
                          Request
                        </Button>
                      </Link>
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      <div className="relative" style={{ height: "450px" }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <>
              <RecenterMap lat={centerLat} lng={centerLng} />
              <AutoZoomMap radiusKm={radiusKm} />
              <Circle
                center={[centerLat, centerLng]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "#3B82F6",
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: "5, 5",
                }}
              />
              <Marker
                position={[centerLat, centerLng]}
                icon={L.divIcon({
                  className: "user-marker",
                  html: `<div style="width:14px;height:14px;border-radius:50%;background:#3B82F6;border:2px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7],
                })}
              />
            </>
          )}

          {/* Render grouped donors as fixed geographic radius circles */}
          {Object.entries(groupedDonors).map(([key, donorGroup]) => {
            const [lat, lng] = key.split(',').map(Number);
            return (
              <RadiusMarkerCluster
                key={key}
                lat={lat}
                lng={lng}
                donors={donorGroup}
                centerLat={centerLat}
                centerLng={centerLng}
              />
            );
          })}
        </MapContainer>

        {/* Add CSS animations for pulse effect */}
        <style>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.1;
            }
            100% {
              transform: scale(1);
              opacity: 0.5;
            }
          }
        `}</style>

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-lg p-3 shadow text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/15 inline-block" />
            Available Donors
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-400/15 inline-block" />
            Resting Donors
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary inline-block" />
            {radiusKm} km Search Radius
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200 mt-1">
            <span className="text-xs text-gray-500">Each circle = 300m radius</span>
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>
              <span className="font-semibold text-primary">{donors.length}</span> donors in {Object.keys(groupedDonors).length} locations
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --------------------- List View ---------------------
function ListView({ donors }: { donors: AnonymizedDonor[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
    >
      {donors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Droplets className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No donors match your criteria.</p>
          <p className="text-sm">Try adjusting your filters.</p>
        </div>
      ) : (
        donors.map((donor) => (
          <DonorCard key={donor.display_id} donor={donor} />
        ))
      )}
    </motion.div>
  );
}

// --------------------- Donor Card ---------------------
function DonorCard({ donor }: { donor: AnonymizedDonor }) {
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
        <Link to={`/seeker/request/${donor.display_id.replace("Donor #", "")}`}>
          <Button
            size="sm"
            disabled={!isAvailable}
            className={isAvailable ? "bg-primary" : "bg-gray-300"}
          >
            Request
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// --------------------- Problem Section ---------------------
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

// --------------------- Features Section ---------------------
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

// --------------------- Workflow Section ---------------------
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

// --------------------- Comparison Section ---------------------
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

// --------------------- FAQ Section ---------------------
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

// --------------------- CTA Section ---------------------
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
