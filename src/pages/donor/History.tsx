import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Heart,
  CheckCircle,
  XCircle,
  Clock,
  Droplets,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DonationRecord {
  id: string;
  date: string;
  hospital: string;
  location: string;
  blood_type: string;
  units: number;
  status: "completed" | "cancelled" | "no_show";
  seeker_anonymous_id?: string;
  notes?: string;
}

const MOCK_HISTORY: DonationRecord[] = [
  {
    id: "don-001",
    date: "2026-04-20",
    hospital: "PGH Blood Bank",
    location: "Ermita, Manila",
    blood_type: "O-",
    units: 1,
    status: "completed",
    seeker_anonymous_id: "Seeker #E2P7",
    notes: "Routine donation. No complications.",
  },
  {
    id: "don-002",
    date: "2026-01-15",
    hospital: "Philippine Red Cross - Manila",
    location: "Port Area, Manila",
    blood_type: "O-",
    units: 1,
    status: "completed",
    seeker_anonymous_id: "Seeker #A1B3",
  },
  {
    id: "don-003",
    date: "2025-10-10",
    hospital: "St. Luke's Medical Center",
    location: "Quezon City",
    blood_type: "O-",
    units: 1,
    status: "completed",
    seeker_anonymous_id: "Seeker #F8G2",
  },
  {
    id: "don-004",
    date: "2025-07-05",
    hospital: "East Avenue Medical Center",
    location: "Diliman, Quezon City",
    blood_type: "O-",
    units: 1,
    status: "completed",
  },
  {
    id: "don-005",
    date: "2025-05-20",
    hospital: "Manila Doctors Hospital",
    location: "Malate, Manila",
    blood_type: "O-",
    units: 1,
    status: "cancelled",
    notes: "Donor unavailable at scheduled time.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

export default function DonorHistory() {
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = MOCK_HISTORY.filter((d) =>
    filter === "all" ? true : d.status === filter
  );

  const completedCount = MOCK_HISTORY.filter((d) => d.status === "completed").length;
  const totalUnits = MOCK_HISTORY.filter((d) => d.status === "completed").reduce(
    (sum, d) => sum + d.units,
    0
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-dark">Donation History</h1>
        <p className="text-gray-500 mt-1">
          Track your past donations and contributions.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-dark">{completedCount}</p>
            <p className="text-xs text-gray-500">Total Donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Droplets className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-dark">{totalUnits}</p>
            <p className="text-xs text-gray-500">Units Donated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-dark">
              {MOCK_HISTORY.length > 0 ? MOCK_HISTORY[0].date : "—"}
            </p>
            <p className="text-xs text-gray-500">Last Donation</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        {(["all", "completed", "cancelled"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            All Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No records found.</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {filtered.map((donation) => (
                  <motion.div
                    key={donation.id}
                    variants={item}
                    className="relative pl-12"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-3.5 h-4 w-4 rounded-full border-2 border-white ${
                        donation.status === "completed"
                          ? "bg-success"
                          : "bg-error"
                      }`}
                    />

                    {/* Card */}
                    <div
                      className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() =>
                        setExpandedId(expandedId === donation.id ? null : donation.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              donation.status === "completed"
                                ? "bg-success/10 text-success"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {donation.status === "completed" ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-dark">{donation.hospital}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {donation.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {donation.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">{donation.blood_type}</p>
                            <p className="text-xs text-gray-500">{donation.units} unit(s)</p>
                          </div>
                          <Badge
                            variant={
                              donation.status === "completed" ? "success" : "destructive"
                            }
                          >
                            {donation.status}
                          </Badge>
                          {expandedId === donation.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedId === donation.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm"
                        >
                          {donation.seeker_anonymous_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Matched with:</span>
                              <span className="font-medium">{donation.seeker_anonymous_id}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Blood type:</span>
                            <span className="font-medium">{donation.blood_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Units donated:</span>
                            <span className="font-medium">{donation.units}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <Badge
                              variant={
                                donation.status === "completed" ? "success" : "destructive"
                              }
                            >
                              {donation.status}
                            </Badge>
                          </div>
                          {donation.notes && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Notes:</span>
                              <span className="text-gray-700">{donation.notes}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}