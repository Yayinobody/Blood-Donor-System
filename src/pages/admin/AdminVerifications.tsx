import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldX,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  RefreshCw,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { supabase } from "@/utils/supabaseClient";

type SubmissionStatus = "pending" | "approved" | "rejected";

interface VerificationSubmission {
  id: string;
  user_id: string;
  id_type: string;
  id_image_url: string;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewer_notes?: string | null;
  // Joined from users table
  user_full_name?: string;
  user_email?: string;
  user_blood_type?: string;
  user_display_id?: string;
}

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { color: "warning" | "success" | "destructive"; icon: React.ElementType; label: string }
> = {
  pending: { color: "warning", icon: Clock, label: "Pending Review" },
  approved: { color: "success", icon: CheckCircle, label: "Approved" },
  rejected: { color: "destructive", icon: XCircle, label: "Rejected" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function AdminVerifications() {
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SubmissionStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VerificationSubmission | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Join verification_submissions with users for display
      const { data, error } = await supabase
        .from("verification_submissions")
        .select(
          `
          id,
          user_id,
          id_type,
          id_image_url,
          status,
          submitted_at,
          reviewed_at,
          reviewer_notes,
          users:user_id (
            full_name,
            email,
            blood_type,
            display_id
          )
        `
        )
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      const shaped = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        id_type: row.id_type,
        id_image_url: row.id_image_url,
        status: row.status as SubmissionStatus,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        reviewer_notes: row.reviewer_notes,
        user_full_name: row.users?.full_name,
        user_email: row.users?.email,
        user_blood_type: row.users?.blood_type,
        user_display_id: row.users?.display_id,
      }));

      setSubmissions(shaped);
    } catch (err: any) {
      console.error("[AdminVerifications] fetch error:", err.message);
      toast.error("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleReview = async (submissionId: string, decision: "approved" | "rejected") => {
    if (!selected) return;
    setReviewing(true);
    try {
      const now = new Date().toISOString();

      // 1. Update verification_submissions row
      const { error: subError } = await supabase
        .from("verification_submissions")
        .update({
          status: decision,
          reviewed_at: now,
          reviewer_notes: reviewNotes || null,
        })
        .eq("id", submissionId);

      if (subError) throw subError;

      // 2. If approved, flip user's verification fields
      if (decision === "approved") {
        const { error: userError } = await supabase
          .from("users")
          .update({
            is_verified: true,
            verification_method: "id",
            verified_at: now,
            updated_at: now,
          })
          .eq("id", selected.user_id);

        if (userError) throw userError;
      }

      toast.success(
        decision === "approved"
          ? `Verification approved — ${selected.user_display_id ?? "Donor"} is now Verified ✓`
          : "Submission rejected."
      );

      setSelected(null);
      setReviewNotes("");
      await fetchSubmissions();
    } catch (err: any) {
      console.error("[AdminVerifications] review error:", err.message);
      toast.error(err.message || "Review action failed.");
    } finally {
      setReviewing(false);
    }
  };

  const filtered = submissions.filter((s) => {
    const matchesFilter = filter === "all" || s.status === filter;
    const matchesSearch =
      !search ||
      s.user_display_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      s.user_full_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Verification Review Queue
            {pendingCount > 0 && (
              <Badge variant="destructive" className="animate-pulse ml-1">
                {pendingCount} pending
              </Badge>
            )}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Review donor ID submissions for strong verification badges.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={fetchSubmissions}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or display ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f ? "bg-white shadow text-dark" : "text-gray-500 hover:text-dark"
              }`}
            >
              {f}
              {f === "pending" && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No submissions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((sub) => {
              const cfg = STATUS_CONFIG[sub.status];
              const StatusIcon = cfg.icon;
              return (
                <motion.div key={sub.id} variants={item} layout>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Donor info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-dark truncate">
                              {sub.user_full_name ?? "—"}
                              {sub.user_blood_type && (
                                <span className="ml-2 text-xs font-bold text-primary">
                                  {sub.user_blood_type}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {sub.user_display_id} · {sub.user_email}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              ID Type: <strong>{sub.id_type}</strong> · Submitted:{" "}
                              {new Date(sub.submitted_at).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Status + actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={cfg.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>

                          {sub.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => {
                                setSelected(sub);
                                setReviewNotes("");
                              }}
                            >
                              <Eye className="h-4 w-4" /> Review
                            </Button>
                          )}
                          {sub.status !== "pending" && sub.reviewer_notes && (
                            <button
                              onClick={() => setSelected(sub)}
                              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
                            >
                              <FileText className="h-3.5 w-3.5" /> Notes
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <div className="space-y-5 p-2">
              <div>
                <h2 className="text-lg font-bold text-dark">Review Submission</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selected.user_display_id} · {selected.user_full_name}
                </p>
              </div>

              {/* ID image */}
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                {selected.id_image_url ? (
                  <img
                    src={selected.id_image_url}
                    alt="Submitted ID"
                    className="w-full max-h-72 object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                    No image available
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">ID Type:</span> {selected.id_type}
                </p>
                <p>
                  <span className="font-medium">Submitted:</span>{" "}
                  {new Date(selected.submitted_at).toLocaleString("en-PH")}
                </p>
              </div>

              {selected.status === "pending" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reviewer Notes (optional)
                    </label>
                    <Input
                      placeholder="Reason for rejection or any notes..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      disabled={reviewing}
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 text-error border-error hover:bg-error/5 gap-2"
                      onClick={() => handleReview(selected.id, "rejected")}
                      disabled={reviewing}
                    >
                      {reviewing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldX className="h-4 w-4" />
                      )}
                      Reject
                    </Button>
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 gap-2"
                      onClick={() => handleReview(selected.id, "approved")}
                      disabled={reviewing}
                    >
                      {reviewing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-700 mb-1">Review completed</p>
                  <p className="text-gray-500">{selected.reviewer_notes || "No notes added."}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
