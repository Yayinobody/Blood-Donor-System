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
  Loader2,
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
import type { RequestMatch, UrgencyLevel, BloodType } from "@/types";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import {
  parseHospitalArea,
  urgencyFromDb,
  matchStatusFromDb,
} from "@/utils/requestHelpers";

interface RequestWithDetails extends RequestMatch {
  blood_type_needed: BloodType;
  hospital_area: string;
  hospital_name: string;
  urgency: UrgencyLevel;
  units: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DonorDashboard() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [donationTrend, setDonationTrend] = useState([{ month: "—", donations: 0 }]);
  const [stats, setStats] = useState({
    livesHelped: 0,
    totalDonations: 0,
    nextEligible: "—",
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) {
        setLoadingRequests(false);
        return;
      }

      setLoadingRequests(true);

      try {
        const { data, error } = await supabase
          .from("request_matches")
          .select(`
            id,
            request_id,
            donor_id,
            status,
            notified_at,
            responded_at,
            revealed_at,
            created_at,
            requests (
              blood_type_needed,
              hospital_name,
              notes,
              urgency_level,
              units_needed
            )
          `)
          .eq("donor_id", user.id)
          .in("status", ["notified", "accepted"])
          .order("notified_at", { ascending: false });

        if (error) throw error;

        const mapped: RequestWithDetails[] = (data ?? []).map((row: any) => ({
          id: row.id,
          request_id: row.request_id,
          donor_id: row.donor_id,
          status: matchStatusFromDb(row.status),
          distance_km: 1.5,
          notified_at: row.notified_at || row.created_at || new Date().toISOString(),
          responded_at: row.responded_at,
          revealed_at: row.revealed_at,
          blood_type_needed: row.requests?.blood_type_needed ?? "O-",
          hospital_name: row.requests?.hospital_name ?? "Hospital",
          hospital_area: parseHospitalArea(row.requests?.notes),
          urgency: urgencyFromDb(row.requests?.urgency_level),
          units: row.requests?.units_needed ?? 1,
        }));

        setRequests(mapped);

        const { count: donationCount } = await supabase
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("donor_id", user.id)
          .eq("status", "completed");

        const { count: fulfilledCount } = await supabase
          .from("request_matches")
          .select("*", { count: "exact", head: true })
          .eq("donor_id", user.id)
          .in("status", ["contact_revealed", "accepted"]);

        setStats({
          totalDonations: donationCount ?? 0,
          livesHelped: fulfilledCount ?? 0,
          nextEligible: profile?.next_eligible_date
            ? new Date(profile.next_eligible_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            : "—",
        });

        const { data: donations } = await supabase
          .from("donations")
          .select("donation_date")
          .eq("donor_id", user.id)
          .eq("status", "completed")
          .order("donation_date", { ascending: true });

        if (donations?.length) {
          const byMonth: Record<string, number> = {};
          for (const d of donations) {
            const month = new Date(d.donation_date).toLocaleString("en", { month: "short" });
            byMonth[month] = (byMonth[month] ?? 0) + 1;
          }
          setDonationTrend(
            Object.entries(byMonth).map(([month, donationsCount]) => ({
              month,
              donations: donationsCount,
            }))
          );
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoadingRequests(false);
      }
    }

    loadDashboardData();
  }, [user?.id, profile?.next_eligible_date]);

  const handleAccept = async (matchId: string) => {
    const respondedAt = new Date().toISOString();

    setRequests((prev) =>
      prev.map((r) =>
        r.id === matchId
          ? { ...r, status: "accepted" as const, responded_at: respondedAt }
          : r
      )
    );

    const { error } = await supabase
      .from("request_matches")
      .update({ status: "accepted", responded_at: respondedAt })
      .eq("id", matchId);

    if (error) {
      console.error("Error updating match accept:", error);
      toast.error("Could not accept request.");
      return;
    }

    toast.success("Request accepted! Proceed to verification.");
  };

  const handleDecline = async (matchId: string) => {
    const respondedAt = new Date().toISOString();

    setRequests((prev) =>
      prev.map((r) =>
        r.id === matchId
          ? { ...r, status: "declined" as const, responded_at: respondedAt }
          : r
      )
    );

    const { error } = await supabase
      .from("request_matches")
      .update({ status: "declined", responded_at: respondedAt })
      .eq("id", matchId);

    if (error) {
      console.error("Error updating match decline:", error);
      toast.error("Could not decline request.");
      return;
    }

    toast.success("Request declined.");
  };

  const pendingCount = requests.filter((r) => r.status === "notified").length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">
            Welcome back,{" "}
            <span className="text-primary">{profile?.display_id ?? "Donor"}</span>
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />{" "}
              {profile?.availability_status ?? "available"}
            </Badge>
            Blood type:{" "}
            <span className="font-semibold text-primary">{profile?.blood_type ?? "—"}</span>
          </p>
        </div>
        <Link to="/donor/profile">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" /> Manage Availability
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bell} label="Pending Requests" value={pendingCount} color="warning" />
        <StatCard icon={CheckCircle} label="Lives Helped" value={stats.livesHelped} color="success" />
        <StatCard icon={Droplets} label="Total Donations" value={stats.totalDonations} color="primary" />
        <StatCard icon={Clock} label="Next Eligible" value={stats.nextEligible} color="blue" />
      </div>

      {/* Incoming Requests */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-dark">Incoming Requests</h2>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingCount} new
            </Badge>
          )}
        </div>

        {loadingRequests ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
              <p>Loading incoming requests...</p>
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
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
  request: RequestWithDetails;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const isNotified = request.status === "notified";
  const isAccepted = request.status === "accepted";
  const isDeclined = request.status === "declined";

  const urgencyConfig = {
    within_hours: { variant: "destructive" as const, icon: AlertTriangle, label: "Urgent" },
    within_day: { variant: "warning" as const, icon: Clock, label: "Within a Day" },
    planning_ahead: { variant: "outline" as const, icon: Clock, label: "Planning Ahead" },
  };
  const uc = urgencyConfig[request.urgency];

  return (
    <Card
      className={cn(
        "border-l-4 transition-all",
        request.urgency === "within_hours"
          ? "border-l-warning"
          : request.urgency === "within_day"
            ? "border-l-primary"
            : "border-l-gray-300"
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg text-primary">{request.blood_type_needed}</span>
              <Badge variant={uc.variant}>
                <uc.icon className="h-3 w-3 mr-1" />
                {uc.label}
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
                {new Date(request.notified_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
