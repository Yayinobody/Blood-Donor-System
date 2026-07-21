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
  X,
  MessageCircle,
  Send,
  Shield,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  Loader2,
  Navigation,
  Clock,
  BadgeCheck,
  Users,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type {
  AnonymizedDonor,
  BloodType,
  AssistantMessage,
} from "@/types";
import {
  BLOOD_TYPES,
  COMPATIBLE_DONORS,
} from "@/types";

// --------------------- Mock Data ---------------------
const MOCK_DONORS: AnonymizedDonor[] = [
  {
    display_id: "Donor #482",
    blood_type: "O-",
    distance_km: 1.2,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 14.5995,
    fuzzed_lng: 120.9842,
    last_active: "2026-07-19T10:30:00Z",
  },
  {
    display_id: "Donor #291",
    blood_type: "O+",
    distance_km: 2.5,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 14.6012,
    fuzzed_lng: 120.9820,
    last_active: "2026-07-19T09:15:00Z",
  },
  {
    display_id: "Donor #105",
    blood_type: "A+",
    distance_km: 3.1,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 14.5970,
    fuzzed_lng: 120.9875,
    last_active: "2026-07-18T14:00:00Z",
  },
  {
    display_id: "Donor #763",
    blood_type: "B+",
    distance_km: 4.0,
    availability_status: "resting",
    verification_badge: false,
    fuzzed_lat: 14.6030,
    fuzzed_lng: 120.9790,
    last_active: "2026-07-17T08:45:00Z",
  },
  {
    display_id: "Donor #518",
    blood_type: "O-",
    distance_km: 5.2,
    availability_status: "available",
    verification_badge: true,
    fuzzed_lat: 14.5955,
    fuzzed_lng: 120.9900,
    last_active: "2026-07-19T11:00:00Z",
  },
  {
    display_id: "Donor #340",
    blood_type: "AB+",
    distance_km: 6.8,
    availability_status: "available",
    verification_badge: false,
    fuzzed_lat: 14.6060,
    fuzzed_lng: 120.9760,
    last_active: "2026-07-19T07:30:00Z",
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
  const [chatOpen, setChatOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => setLocationError(true),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      setLocationError(true);
    }
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

      {/* AI Chat Widget */}
      <AIChatWidget chatOpen={chatOpen} setChatOpen={setChatOpen} />

      {/* Footer is in MainLayout */}
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

        {/* Location status */}
        {locationError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4"
          >
            <p className="text-sm text-gray-500">
              <Navigation className="h-4 w-4 inline mr-1" />
              Showing donors near Manila.{" "}
              <button className="text-primary underline" onClick={() => toast.success("Location access granted (demo)")}>
                Enable location
              </button>
            </p>
          </motion.div>
        )}

        {/* Results count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500 mb-6"
        >
          {donors.length} donor{donors.length !== 1 ? "s" : ""} found
          {selectedBloodType && ` compatible with ${selectedBloodType}`}
        </motion.p>

        {/* View: Map or List */}
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <MapView key="map" donors={donors} userLocation={userLocation} />
          ) : (
            <ListView key="list" donors={donors} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// --------------------- Map View (Simplified SVG Map) ---------------------
function MapView({
  donors,
  userLocation,
}: {
  donors: AnonymizedDonor[];
  userLocation: { lat: number; lng: number } | null;
}) {
  // Simple SVG map representation of Manila area
  const centerLat = userLocation?.lat || 14.5995;
  const centerLng = userLocation?.lng || 120.9842;

  const toSVGCoords = (lat: number, lng: number) => {
    const x = ((lng - 120.97) / 0.03) * 600 + 50;
    const y = ((14.61 - lat) / 0.02) * 400 + 30;
    return { x, y };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      <div className="relative" style={{ height: "450px" }}>
        <svg viewBox="0 0 700 460" className="w-full h-full">
          {/* Background */}
          <rect width="700" height="460" fill="#f0f4f8" rx="16" />

          {/* Grid lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 57.5}
              x2="700"
              y2={i * 57.5}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* Simple roads */}
          <line x1="100" y1="230" x2="600" y2="230" stroke="#d1d5db" strokeWidth="2" />
          <line x1="350" y1="30" x2="350" y2="430" stroke="#d1d5db" strokeWidth="2" />

          {/* Manila label */}
          <text x="350" y="50" textAnchor="middle" className="text-xs" fill="#9ca3af" fontWeight="600">
            MANILA
          </text>

          {/* User location */}
          {userLocation && (
            <>
              <circle
                cx={toSVGCoords(centerLat, centerLng).x}
                cy={toSVGCoords(centerLat, centerLng).y}
                r="8"
                fill="#3B82F6"
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={toSVGCoords(centerLat, centerLng).x}
                cy={toSVGCoords(centerLat, centerLng).y}
                r="16"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="1"
                opacity="0.4"
              />
            </>
          )}

          {/* Donor pins */}
          {donors.map((donor) => {
            const { x, y } = toSVGCoords(donor.fuzzed_lat, donor.fuzzed_lng);
            const isAvailable = donor.availability_status === "available";
            return (
              <g key={donor.display_id} className="cursor-pointer">
                <circle cx={x} cy={y} r="12" fill={isAvailable ? "#E63946" : "#9CA3AF"} opacity="0.2" />
                <circle cx={x} cy={y} r="6" fill={isAvailable ? "#E63946" : "#9CA3AF"} stroke="white" strokeWidth="2" />
                {donor.verification_badge && (
                  <text x={x + 8} y={y - 8} fontSize="10" fill="#22C55E">
                    ✓
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary inline-block" /> Available
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Resting
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-3 w-3 text-success" /> Verified
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

// --------------------- AI Chat Widget (Public Mode) ---------------------
function AIChatWidget({
  chatOpen,
  setChatOpen,
}: {
  chatOpen: boolean;
  setChatOpen: (o: boolean) => void;
}) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm the AnonBlood assistant. I can help with blood donation questions, compatibility info, and finding donation centers. How can I help?",
      timestamp: new Date(),
      scope: "public",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: AssistantMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const lower = userMsg.content.toLowerCase();
      let response: string;
      let scope: "public" | "personal" | "out_of_scope" = "public";

      if (lower.includes("nearest") || lower.includes("donation center") || lower.includes("blood bank")) {
        response = `Based on our database, the nearest blood donation centers are:\n\n1. **Philippine Red Cross - Manila** — Bonifacio Drive, Port Area\n2. **PGH Blood Bank** — Taft Avenue, Ermita\n3. **St. Luke's Medical Center** — Quezon City\n\nWould you like directions to any of these?`;
      } else if (lower.includes("compatible") || lower.includes("donate to")) {
        response = `Blood type compatibility:\n\n- **O-** can donate to: all types (universal donor)\n- **O+** can donate to: O+, A+, B+, AB+\n- **A-** can donate to: A-, A+, AB-, AB+\n- **B-** can donate to: B-, B+, AB-, AB+\n- **AB+** can donate to: AB+ only (universal recipient)\n\nWhich type are you asking about?`;
      } else if (lower.includes("weight") || lower.includes("eligible")) {
        response = `According to WHO and DOH guidelines, to donate blood you generally need to:\n\n- Be at least 17 years old\n- Weigh at least 50 kg (110 lbs)\n- Be in good health\n- Not have donated whole blood in the last 12 weeks\n\nSpecific conditions may affect eligibility. Would you like more details?`;
      } else if (lower.includes("personal") || lower.includes("my") || lower.includes("account")) {
        response = `I can't access personal account information in public mode. Please log in to ask questions about your specific eligibility or donation history.`;
        scope = "out_of_scope";
      } else {
        response = `Good question! For the most accurate information, I recommend checking the WHO blood donation guidelines or speaking with a medical professional. Is there something specific about blood donation I can help clarify?`;
      }

      const aiMsg: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        scope,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
      >
        {chatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">AnonBlood Assistant</span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                <Shield className="h-3 w-3 inline mr-1" /> Public mode — no personal data
              </p>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white border text-dark rounded-bl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.scope === "out_of_scope" && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        (Out of scope — login required)
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-md px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about blood donation..."
                  className="flex-1 text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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