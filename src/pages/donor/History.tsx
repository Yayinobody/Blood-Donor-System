import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Droplets,
  Heart,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { eligibilityService } from "@/services/eligibilityService";

interface DonationRecord {
  id: string;
  donation_date: string;
  volume_ml: number;
  status: "completed" | "cancelled" | "deferred";
  notes?: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

export default function DonorHistory() {
  const { user, profile, refreshProfile } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Log donation form state
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logVolume, setLogVolume] = useState(450);
  const [logNotes, setLogNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDonations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("donor_id", user.id)
        .order("donation_date", { ascending: false });

      if (error) throw error;
      setDonations((data as DonationRecord[]) || []);
    } catch (err: any) {
      console.error("Error fetching donations:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    // Also reset eligibility status if eligible now
    if (user) eligibilityService.resetAvailabilityIfEligible(user.id);
  }, [user]);

  const handleLogDonation = async () => {
    if (!user || !logDate) {
      toast.error("Please select a donation date");
      return;
    }

    const donationDate = new Date(logDate);
    if (donationDate > new Date()) {
      toast.error("Donation date cannot be in the future");
      return;
    }

    setSubmitting(true);
    try {
      const { nextEligibleDate } = await eligibilityService.logDonation(
        user.id,
        donationDate,
        logVolume,
        logNotes || undefined
      );

      toast.success(
        `Donation logged! You'll be eligible to donate again on ${nextEligibleDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}.`
      );
      setShowLogModal(false);
      setLogDate(new Date().toISOString().split("T")[0]);
      setLogVolume(450);
      setLogNotes("");
      await fetchDonations();
      await refreshProfile();
    } catch (err: any) {
      console.error("Error logging donation:", err.message);
      toast.error(err.message || "Failed to log donation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = donations.filter((d) =>
    filter === "all" ? true : d.status === filter
  );

  const completedCount = donations.filter((d) => d.status === "completed").length;
  const totalMl = donations
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + (d.volume_ml || 0), 0);
  const lastDonation = donations[0]?.donation_date;

  const daysLeft = eligibilityService.daysUntilEligible(profile?.next_eligible_date ?? null);
  const isEligible = eligibilityService.isEligibleNow(profile?.next_eligible_date ?? null);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Donation History</h1>
          <p className="text-gray-500 mt-1">Your self-reported donation log. Platform-verified only.</p>
        </div>
        <Button
          onClick={() => setShowLogModal(true)}
          className="bg-primary gap-2"
          disabled={!isEligible}
          title={!isEligible ? `Eligible in ${daysLeft} days` : "Log a new donation"}
        >
          <Plus className="h-4 w-4" /> Log Donation
        </Button>
      </div>

      {/* Eligibility status banner */}
      <AnimatePresence>
        {!isEligible && profile?.next_eligible_date && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex gap-3 items-center"
          >
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-dark">Resting Period Active — </span>
              <span className="text-gray-600">
                You are eligible to donate again in{" "}
                <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> (
                {new Date(profile.next_eligible_date).toLocaleDateString("en-PH", {
                  month: "long",
                  day: "numeric",
                })}
                ). WHO/DOH guidelines require a minimum 12-week rest between whole blood donations.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <p className="text-2xl font-bold text-dark">{(totalMl / 1000).toFixed(1)}L</p>
            <p className="text-xs text-gray-500">Blood Donated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-lg font-bold text-dark">
              {lastDonation
                ? new Date(lastDonation).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                : "—"}
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
            <Clock className="h-5 w-5 text-primary" /> All Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Droplets className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No donation records yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Use the "Log Donation" button to record a self-reported donation.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6">
                {filtered.map((donation) => (
                  <motion.div key={donation.id} variants={item} className="relative pl-12">
                    <div
                      className={`absolute left-3.5 h-4 w-4 rounded-full border-2 border-white ${
                        donation.status === "completed" ? "bg-success" : "bg-error"
                      }`}
                    />
                    <div
                      className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedId(expandedId === donation.id ? null : donation.id)}
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
                            <p className="font-medium text-dark">
                              {new Date(donation.donation_date).toLocaleDateString("en-PH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-gray-500">{donation.volume_ml}mL whole blood</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={donation.status === "completed" ? "success" : "destructive"}>
                            {donation.status}
                          </Badge>
                          {expandedId === donation.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedId === donation.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm"
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-500">Volume donated:</span>
                            <span className="font-medium">{donation.volume_ml}mL</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <Badge variant={donation.status === "completed" ? "success" : "destructive"}>
                              {donation.status}
                            </Badge>
                          </div>
                          {donation.notes && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Notes:</span>
                              <span className="text-gray-700 text-right max-w-[60%]">{donation.notes}</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 pt-1">
                            ⚠️ Self-reported — not verified by the platform.
                          </p>
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

      {/* Log Donation Modal */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent>
          <div className="space-y-5 p-2">
            <div>
              <h2 className="text-lg font-bold text-dark">Log a Donation</h2>
              <p className="text-sm text-gray-500 mt-1">
                This is self-reported and not verified by AnonBlood. Your availability will be set to{" "}
                <strong>Resting</strong> for 12 weeks per WHO/DOH guidelines.
              </p>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-2 text-xs">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-gray-600">
                Only log actual donations. The 12-week rest window will be applied immediately and cannot be manually overridden.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donation Date *</label>
                <Input
                  type="date"
                  value={logDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setLogDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume (mL) — default 450mL for whole blood
                </label>
                <Input
                  type="number"
                  min={100}
                  max={600}
                  value={logVolume}
                  onChange={(e) => setLogVolume(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <Input
                  placeholder="Any notes about this donation..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary gap-2"
                onClick={handleLogDonation}
                disabled={submitting || !logDate}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirm Log
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}