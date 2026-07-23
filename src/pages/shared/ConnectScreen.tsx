import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  Mail,
  Phone,
  User,
  MapPin,
  ArrowLeft,
  Loader2,
  Droplets,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/context/AuthContext";

type Step = "pending" | "revealed" | "fulfilled";

export default function ConnectScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<Step>("pending");
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) return;
      try {
        // Fetch match + joined request data
        const { data, error } = await supabase
          .from("request_matches")
          .select(`
            id,
            status,
            contact_revealed,
            donor_id,
            request_id,
            requests (
              id,
              seeker_email,
              seeker_phone,
              blood_type_needed,
              urgency_level,
              hospital_name,
              notes,
              status
            )
          `)
          .eq("id", matchId)
          .single();

        if (error) throw error;
        setMatchData(data);

        // If already revealed, jump straight to revealed step
        if (data.contact_revealed) setStep("revealed");
      } catch (err: any) {
        console.error("Error loading match:", err.message);
        toast.error("Could not load request details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  const handleRevealContact = async () => {
    setRevealing(true);
    try {
      const { error } = await supabase
        .from("request_matches")
        .update({
          status: "contact_revealed",
          contact_revealed: true,
          revealed_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (error) throw error;

      setMatchData((prev: any) => ({ ...prev, contact_revealed: true, status: "contact_revealed" }));
      setStep("revealed");
      toast.success("Contact info revealed!");

      // 🔔 Email seeker via Pipedream → Resend
      const request = matchData?.requests;
      const donorEmail = user?.email ?? "—";

      console.log("Sending email to:", request?.seeker_email, "from donor:", donorEmail);
      if (request?.seeker_email) {
        try {
          const res = await fetch("https://eon221bta0ofeq0.m.pipedream.net", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: request.seeker_email,
              subject: "🩸 A donor has accepted your blood request!",
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;line-height:1.6;">
                  <div style="background:linear-gradient(135deg,#e53e3e,#c53030);border-radius:12px;padding:32px;text-align:center;margin-bottom:24px;">
                    <h1 style="color:white;margin:0;font-size:28px;">Donor Match Found!</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;">
                      A donor has been located for your blood request. Please review the details below and get in touch with them as soon as possible.
                    </p>
                  </div>

                  <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:#2d3748;margin:0 0 12px;font-size:18px;">📋 Request Details</h3>
                    <p style="margin:6px 0;"><strong>Blood Type Needed:</strong> <span style="color:#e53e3e;font-weight:bold;">${request.blood_type_needed}</span></p>
                    <p style="margin:6px 0;"><strong>Hospital / Location:</strong> ${request.hospital_name}</p>
                    <p style="margin:6px 0;"><strong>Urgency:</strong> ${request.urgency_level?.replace(/_/g, " ")}</p>
                  </div>

                  <div style="background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:20px;margin-bottom:24px;">
                    <h3 style="color:#2b6cb0;margin:0 0 12px;font-size:18px;">👤 Donor Contact Info</h3>
                    <p style="margin:6px 0 16px;"><strong>Email:</strong> <a href="mailto:${donorEmail}" style="color:#3182ce;text-decoration:none;font-weight:500;">${donorEmail}</a></p>
                    
                    <div style="text-align:center;">
                      <a href="mailto:${donorEmail}" style="background-color:#3182ce;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                        📧 Send Email to Donor
                      </a>
                    </div>
                  </div>

                  <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;" />
                  <p style="color:#718096;font-size:13px;text-align:center;margin:0;">
                    Need help? Reply directly to this email for support.
                  </p>
                </div>
              `,
            }),
          });
          console.log("Pipedream response:", res.status);
          toast.success("Seeker notified by email! ✅");
        } catch (emailErr: any) {
          console.error("Email error:", emailErr);
        }
      }

    } catch (err: any) {
      console.error("Reveal error:", err.message);
      toast.error("Failed to reveal contact. Please try again.");
    } finally {
      setRevealing(false);
    }
  };

  const handleMarkFulfilled = async () => {
    try {
      // Update match status
      await supabase
        .from("request_matches")
        .update({ status: "accepted" })
        .eq("id", matchId);

      // Mark the request as fulfilled
      if (matchData?.request_id) {
        await supabase
          .from("requests")
          .update({ status: "fulfilled" })
          .eq("id", matchData.request_id);
      }

      setStep("fulfilled");
      toast.success("Donation marked as fulfilled. Thank you!");
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err: any) {
      console.error("Fulfill error:", err.message);
      toast.error("Failed to mark as fulfilled.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const request = matchData?.requests;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 to-accent/10 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-500 hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>

        <AnimatePresence mode="wait">
          {/* ── PENDING: show details + single confirm button ── */}
          {step === "pending" && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-5"
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-14 w-14 text-primary mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-dark">Request Accepted</h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    You accepted this blood request. Click below to reveal the seeker's contact info and coordinate the donation.
                  </p>
                </CardContent>
              </Card>

              {/* Request details */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-dark">Request Details</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500">Blood type needed</span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Droplets className="h-4 w-4" /> {request?.blood_type_needed ?? "—"}
                    </span>

                    <span className="text-gray-500">Hospital</span>
                    <span className="font-medium">{request?.hospital_name ?? "—"}</span>

                    <span className="text-gray-500">Urgency</span>
                    <span>
                      <Badge variant={request?.urgency_level === "within_hours" ? "destructive" : "warning"}>
                        {request?.urgency_level === "within_hours" && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                        {request?.urgency_level?.replace("_", " ") ?? "—"}
                      </Badge>
                    </span>

                    {request?.notes && (
                      <>
                        <span className="text-gray-500">Notes</span>
                        <span className="text-gray-700">{request.notes}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleRevealContact}
                className="w-full bg-primary gap-2"
                size="lg"
                disabled={revealing}
              >
                {revealing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Revealing...</>
                ) : (
                  <><Shield className="h-5 w-5" /> Confirm & Reveal Contact</>
                )}
              </Button>
            </motion.div>
          )}

          {/* ── REVEALED: show seeker contact info ── */}
          {step === "revealed" && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
                <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
                <h2 className="text-lg font-bold text-dark">Contact Info Revealed</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Coordinate directly with the seeker to arrange the donation.
                </p>
              </div>

              {/* Seeker contact */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Seeker Contact Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Email</p>
                        <a
                          href={`mailto:${request?.seeker_email}`}
                          className="font-medium text-dark hover:text-primary"
                        >
                          {request?.seeker_email ?? "—"}
                        </a>
                      </div>
                    </div>

                    {request?.seeker_phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                          <a
                            href={`tel:${request.seeker_phone}`}
                            className="font-medium text-dark hover:text-primary"
                          >
                            {request.seeker_phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Hospital</p>
                        <span className="font-medium text-dark">{request?.hospital_name ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to Dashboard
                </Button>
                <Button
                  className="flex-1 bg-success hover:bg-success/90 gap-2"
                  onClick={handleMarkFulfilled}
                >
                  <CheckCircle className="h-4 w-4" /> Mark as Fulfilled
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── FULFILLED ── */}
          {step === "fulfilled" && (
            <motion.div
              key="fulfilled"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <CheckCircle className="h-20 w-20 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-dark">Donation Fulfilled!</h2>
              <p className="text-gray-500 mt-2">
                Thank you for saving a life. Redirecting to your dashboard…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}