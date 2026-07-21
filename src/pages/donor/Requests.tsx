import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import type { RequestMatch, UrgencyLevel, BloodType } from "@/types";

interface RequestWithDetails extends RequestMatch {
  blood_type_needed: BloodType;
  hospital_name: string;
  hospital_area: string;
  urgency: UrgencyLevel;
  units: number;
  seeker_anonymous_id: string;
}

const MOCK_ALL_REQUESTS: RequestWithDetails[] = [
  {
    id: "match-001",
    request_id: "req-001",
    donor_id: "donor-482",
    status: "notified",
    distance_km: 1.2,
    notified_at: "2026-07-21T08:00:00Z",
    blood_type_needed: "O-",
    hospital_name: "PGH Blood Bank",
    hospital_area: "Ermita, Manila",
    urgency: "within_hours",
    units: 2,
    seeker_anonymous_id: "Seeker #A7X2",
  },
  {
    id: "match-002",
    request_id: "req-002",
    donor_id: "donor-482",
    status: "notified",
    distance_km: 3.5,
    notified_at: "2026-07-21T09:30:00Z",
    blood_type_needed: "O-",
    hospital_name: "St. Luke's Medical Center",
    hospital_area: "Quezon City",
    urgency: "within_day",
    units: 1,
    seeker_anonymous_id: "Seeker #B3K9",
  },
  {
    id: "match-003",
    request_id: "req-003",
    donor_id: "donor-482",
    status: "accepted",
    distance_km: 2.0,
    notified_at: "2026-07-20T14:00:00Z",
    responded_at: "2026-07-20T14:30:00Z",
    blood_type_needed: "O-",
    hospital_name: "Manila Doctors Hospital",
    hospital_area: "Malate, Manila",
    urgency: "within_hours",
    units: 3,
    seeker_anonymous_id: "Seeker #C1M4",
  },
  {
    id: "match-004",
    request_id: "req-004",
    donor_id: "donor-482",
    status: "declined",
    distance_km: 8.0,
    notified_at: "2026-07-18T11:00:00Z",
    responded_at: "2026-07-18T11:15:00Z",
    blood_type_needed: "O-",
    hospital_name: "East Avenue Medical Center",
    hospital_area: "Diliman, Quezon City",
    urgency: "planning_ahead",
    units: 1,
    seeker_anonymous_id: "Seeker #D5R8",
  },
  {
    id: "match-005",
    request_id: "req-005",
    donor_id: "donor-482",
    status: "revealed",
    distance_km: 1.5,
    notified_at: "2026-07-19T10:00:00Z",
    responded_at: "2026-07-19T10:20:00Z",
    revealed_at: "2026-07-19T10:30:00Z",
    blood_type_needed: "O-",
    hospital_name: "PGH Blood Bank",
    hospital_area: "Ermita, Manila",
    urgency: "within_hours",
    units: 2,
    seeker_anonymous_id: "Seeker #E2P7",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function DonorRequests() {
  const [requests, setRequests] = useState(MOCK_ALL_REQUESTS);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined" | "revealed">("all");
  const [search, setSearch] = useState("");

  const handleAccept = (matchId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === matchId
          ? { ...r, status: "accepted" as const, responded_at: new Date().toISOString() }
          : r
      )
    );
    toast.success("Request accepted! Proceed to verification.");
  };

  const handleDecline = (matchId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === matchId
          ? { ...r, status: "declined" as const, responded_at: new Date().toISOString() }
          : r
      )
    );
    toast.success("Request declined. Next donor will be notified.");
  };

  const filtered = requests.filter((r) => {
    if (filter === "pending") return r.status === "notified";
    if (filter !== "all") return r.status === filter;
    return true;
  }).filter((r) =>
    search
      ? r.hospital_name.toLowerCase().includes(search.toLowerCase()) ||
        r.hospital_area.toLowerCase().includes(search.toLowerCase()) ||
        r.seeker_anonymous_id.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const pendingCount = requests.filter((r) => r.status === "notified").length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          Blood Requests
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse ml-2">
              {pendingCount} pending
            </Badge>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          Manage incoming blood donation requests from seekers near you.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by hospital or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "pending", "accepted", "revealed", "declined"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f ? "bg-white shadow text-dark" : "text-gray-500 hover:text-dark"
              }`}
            >
              {f === "all" ? "All" : f}
              {f === "pending" && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Request list */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500"
          >
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No requests found.</p>
            <p className="text-sm">Try changing your filter or search.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <motion.div key={req.id} variants={item} layout>
                <RequestCard
                  request={req}
                  onAccept={() => handleAccept(req.id)}
                  onDecline={() => handleDecline(req.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
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
  const isRevealed = request.status === "revealed";

  const urgencyConfig = {
    within_hours: { color: "destructive" as const, icon: AlertTriangle, label: "Urgent — Within Hours" },
    within_day: { color: "warning" as const, icon: Clock, label: "Within a Day" },
    planning_ahead: { color: "outline" as const, icon: Clock, label: "Planning Ahead" },
  };

  const uc = urgencyConfig[request.urgency];

  return (
    <Card
      className={`border-l-4 transition-all ${
        request.urgency === "within_hours"
          ? "border-l-warning"
          : request.urgency === "within_day"
          ? "border-l-primary"
          : "border-l-gray-300"
      } ${isDeclined ? "opacity-60" : ""}`}
    >
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1">
            {/* Header row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-bold text-lg text-primary">{request.blood_type_needed}</span>
              <Badge variant={uc.color}>
                <uc.icon className="h-3 w-3 mr-1" />
                {uc.label}
              </Badge>
              {isAccepted && <Badge variant="secondary">Accepted</Badge>}
              {isDeclined && <Badge variant="secondary">Declined</Badge>}
              {isRevealed && <Badge variant="success">Contact Revealed</Badge>}
            </div>

            {/* Details */}
            <p className="text-sm text-gray-600">
              <MapPin className="h-4 w-4 inline mr-1" />
              {request.hospital_name} — {request.hospital_area}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
              <span>
                <Droplets className="h-3 w-3 inline mr-1" />
                {request.units} unit{request.units > 1 ? "s" : ""}
              </span>
              <span>
                <MapPin className="h-3 w-3 inline mr-1" />
                {request.distance_km.toFixed(1)} km
              </span>
              <span>
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(request.notified_at).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-gray-400">From: {request.seeker_anonymous_id}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isNotified && (
              <>
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
              </>
            )}
            {isAccepted && (
              <Link to={`/connect/${request.id}`}>
                <Button size="sm" className="bg-primary gap-2">
                  <Shield className="h-4 w-4" /> Verify & Connect
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {isRevealed && (
              <Link to={`/connect/${request.id}`}>
                <Button size="sm" variant="outline" className="gap-2">
                  <CheckCircle className="h-4 w-4" /> View Connection
                </Button>
              </Link>
            )}
            {isDeclined && (
              <span className="text-xs text-gray-400 italic">Declined</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}