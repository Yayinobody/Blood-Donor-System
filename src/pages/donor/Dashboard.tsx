import { useState, useEffect, type ElementType } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Clock,
  MapPin,
  Droplets,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Shield,
  Settings,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import toast from "react-hot-toast";
import type { RequestMatch, UrgencyLevel } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";

// Mock incoming requests fallback
const MOCK_REQUESTS: (RequestMatch & {
  blood_type_needed: string;
  hospital_area: string;
  hospital_name: string;
  urgency: UrgencyLevel;
  units: number;
})[] = [
  {
    id: "match-001",
    request_id: "req-001",
    donor_id: "donor-482",
    status: "notified",
    distance_km: 1.2,
    notified_at: "2026-07-21T08:00:00Z",
    blood_type_needed: "O-",
    hospital_area: "Ermita, Manila",
    hospital_name: "PGH Blood Bank",
    urgency: "within_hours",
    units: 2,
  },
];

// Mock stats
const donationTrend = [
  { month: "May", donations: 1 },
  { month: "Jun", donations: 2 },
  { month: "Jul", donations: 1 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DonorDashboard() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<any[]>(MOCK_REQUESTS);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("request_matches")
          .select(`
            id,
            request_id,
            donor_id,
            status,
            notified_at,
            requests:request_id (
              blood_type_needed,
              hospital_name,
              units_needed,
              urgency_level
            )
          `)
          .eq("donor_id", user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map((m: any) => ({
            id: m.id,
            request_id: m.request_id,
            donor_id: m.donor_id,
            status: m.status,
            distance_km: 1.5,
            notified_at: m.notified_at,
            blood_type_needed: m.requests?.blood_type_needed || "O+",
            hospital_area: "Hospital Location",
            hospital_name: m.requests?.hospital_name || "General Hospital",
            urgency: m.requests?.urgency_level || "within_day",
            units: m.requests?.units_needed || 1,
          }));
          setRequests(mapped);
        }
      } catch (err: any) {
        console.error("Error fetching donor matches:", err.message);
      }
    };
    fetchMatches();
  }, [user]);

  const handleAccept = (matchId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === matchId ? { ...r, status: "accepted" as const } : r))
    );
    toast.success("Request accepted! Proceed to contact exchange.");
  };

  const handleDecline = (matchId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === matchId ? { ...r, status: "declined" as const } : r))
    );
    toast.success("Request declined.");
  };

  const displayName = profile?.full_name || profile?.display_id || user?.email || "Donor";
  const displayId = profile?.display_id || "Donor Profile";
  const bloodType = profile?.blood_type || "O+";
  const isAvailable = (profile?.availability_status || "available") === "available";

  // Calculate next eligible date formatting
  const nextEligibleText = profile?.next_eligible_date
    ? new Date(profile.next_eligible_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : "Eligible Now";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">
            Welcome back, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Badge variant={isAvailable ? "success" : "warning"} className="gap-1">
              <CheckCircle className="h-3 w-3" /> {isAvailable ? "Available" : "Resting"}
            </Badge>
            ID: <span className="font-medium text-gray-700">{displayId}</span> • Blood type: <span className="font-semibold text-primary">{bloodType}</span>
          </p>
        </div>
        <Link to="/donor/profile">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" /> Manage Profile
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bell} label="Pending Requests" value={requests.filter((r) => r.status === "notified").length} color="warning" />
        <StatCard icon={CheckCircle} label="Lives Helped" value={1} color="success" />
        <StatCard icon={Droplets} label="Total Donations" value={1} color="primary" />
        <StatCard icon={Clock} label="Next Eligible" value={nextEligibleText} color="blue" />
      </div>

      {/* Incoming Requests */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-dark">Incoming Requests</h2>
          {requests.filter((r) => r.status === "notified").length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {requests.filter((r) => r.status === "notified").length} new
            </Badge>
          )}
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No incoming requests right now.</p>
              <p className="text-sm">When someone needs your blood type, you'll be notified here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <motion.div key={req.id} variants={item}>
                <RequestCard
                  request={req}
                  onAccept={() => handleAccept(req.id)}
                  onDecline={() => handleDecline(req.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Donation trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Your Donation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={donationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="donations" stroke="#E63946" strokeWidth={3} dot={{ fill: "#E63946", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --------------------- Stat Card ---------------------
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  color: "primary" | "success" | "warning" | "blue";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-dark">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// --------------------- Request Card ---------------------
function RequestCard({
  request,
  onAccept,
  onDecline,
}: {
  request: (typeof MOCK_REQUESTS)[number];
  onAccept: () => void;
  onDecline: () => void;
}) {
  const isNotified = request.status === "notified";
  const isAccepted = request.status === "accepted";
  const isDeclined = request.status === "declined";

  return (
    <Card className={cn(
      "border-l-4 transition-all",
      request.urgency === "within_hours" ? "border-l-warning" : "border-l-primary"
    )}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg text-primary">{request.blood_type_needed}</span>
              <Badge variant={request.urgency === "within_hours" ? "destructive" : "warning"}>
                {request.urgency === "within_hours" ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                {request.urgency === "within_hours" ? "Urgent" : "Within a Day"}
              </Badge>
              {isAccepted && <Badge variant="success">Accepted</Badge>}
              {isDeclined && <Badge variant="secondary">Declined</Badge>}
            </div>
            <p className="text-sm text-gray-600">
              <MapPin className="h-4 w-4 inline mr-1" />
              {request.hospital_name} — {request.hospital_area}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>
                <Droplets className="h-3 w-3 inline mr-1" />
                {request.units} unit{request.units > 1 ? "s" : ""} needed
              </span>
              <span>
                <MapPin className="h-3 w-3 inline mr-1" />
                {request.distance_km.toFixed(1)} km away
              </span>
              <span>
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(request.notified_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* Actions */}
          {isNotified && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-error border-error hover:bg-error/5"
                onClick={onDecline}
              >
                <XCircle className="h-4 w-4 mr-1" /> Decline
              </Button>
              <Button size="sm" className="bg-success hover:bg-success/90" onClick={onAccept}>
                <CheckCircle className="h-4 w-4 mr-1" /> Accept
              </Button>
            </div>
          )}

          {isAccepted && (
            <div className="flex items-center">
              <Link to={`/connect/${request.id}`}>
                <Button size="sm" className="bg-primary gap-2">
                  <Shield className="h-4 w-4" /> Verify & Connect
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {isDeclined && (
            <p className="text-sm text-gray-400 italic">You declined this request</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}