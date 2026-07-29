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
  Lock,
  Info,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { supabase } from "@/utils/supabaseClient";
import { contactRevealService, type ContactRevealData } from "@/services/contactRevealService";
import { verificationService } from "@/services/verificationService";
import { useAuth } from "@/context/AuthContext";

type Step = "pending" | "verification_required" | "awaiting_seeker" | "revealed" | "fulfilled";

export default function ConnectScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [step, setStep] = useState<Step>("pending");
  const [matchData, setMatchData] = useState<any>(null);
  const [revealedData, setRevealedData] = useState<ContactRevealData | null>(null);
  const [loading, setLoading] = useState(true);

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sendingToSeeker, setSendingToSeeker] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from("request_matches")
          .select(`
            id, status, contact_revealed, donor_id, request_id,
            requests (
              id, seeker_name, seeker_email, seeker_phone,
              blood_type_needed, urgency_level, hospital_name, notes, status
            ),
            users:donor_id (
              id, full_name, email, phone, display_id, is_verified
            )
          `)
          .eq("id", matchId)
          .single();

        if (error) throw error;
        setMatchData(data);

        // If already contact_revealed, show the revealed step
        if (data.contact_revealed) {
          const req = Array.isArray(data.requests) ? data.requests[0] : data.requests;
          setRevealedData({
            seeker_name: req?.seeker_name || null,
            seeker_email: req?.seeker_email,
            seeker_phone: req?.seeker_phone || null,
            hospital_name: req?.hospital_name || "Hospital",
          });
          setStep("revealed");
        }
      } catch (err: any) {
        console.error("Error loading match:", err.message);
        toast.error("Could not load request details.");
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  /** Step 1: Send OTP to the donor's email */
  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Could not find your email address.");
        return;
      }
      await verificationService.requestVerificationOtp(
        user.email,
        "donor_verification",
        user.id
      );
      setOtpSent(true);
      toast.success(`Verification code sent to ${user.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setSendingOtp(false);
    }
  };

  /** Step 2: Verify the OTP → then send seeker their "Accept" email */
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4 || !matchId) return;
    setVerifyingOtp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email || !user?.id) throw new Error("Not authenticated.");

      // Verify OTP — marks donor as is_verified in public.users
      await verificationService.verifyEmailOtp(
        user.email,
        otpCode,
        user.id,
        "donor_verification",
        user.id
      );

      toast.success("Identity verified! Notifying seeker…");
      setVerifyingOtp(false);
      setSendingToSeeker(true);

      // Fetch request + donor details for the seeker email
      const req = Array.isArray(matchData?.requests) ? matchData.requests[0] : matchData?.requests;
      const donor = Array.isArray(matchData?.users) ? matchData.users[0] : matchData?.users;

      // Generate seeker accept token + send "Accept" email to seeker
      await verificationService.generateSeekerAcceptToken(
        matchId,
        req?.seeker_email,
        req?.seeker_name,
        req?.hospital_name,
        req?.blood_type_needed,
        donor?.display_id
      );

      setStep("awaiting_seeker");
      toast.success("Seeker has been notified — waiting for their confirmation.");
    } catch (err: any) {
      console.error("OTP Verification Error:", err.message);
      toast.error(err.message || "Invalid or expired verification code.");
    } finally {
      setVerifyingOtp(false);
      setSendingToSeeker(false);
    }
  };

  const handleMarkFulfilled = async () => {
    try {
      const donorId = matchData?.donor_id;
      if (!matchId || !donorId) throw new Error("Missing match or donor information.");
      await contactRevealService.completeDonation(matchId, donorId);
      await refreshProfile();
      setStep("fulfilled");
      toast.success("Donation marked as fulfilled. Thank you!");
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err: any) {
      console.error("Fulfill error:", err.message);
      toast.error(err.message || "Failed to mark as fulfilled.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const request = Array.isArray(matchData?.requests) ? matchData.requests[0] : matchData?.requests;

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
          {/* ── STEP 1: PENDING — show details + trigger OTP ── */}
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
                    You accepted this blood request. Verify your identity below — we'll then
                    notify the seeker so they can confirm and receive your contact details.
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

              {/* Flow explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
                <p className="font-semibold">📋 What happens next:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>You receive a 6-digit verification code by email</li>
                  <li>You enter it to confirm your identity</li>
                  <li>Seeker gets an email with an "Accept" button</li>
                  <li>Seeker clicks it → they receive your contact details</li>
                </ol>
              </div>

              <Button
                onClick={() => setStep("verification_required")}
                className="w-full bg-primary gap-2"
                size="lg"
              >
                <Lock className="h-5 w-5" /> Verify My Identity & Notify Seeker
              </Button>
            </motion.div>
          )}

          {/* ── STEP 2: OTP VERIFICATION ── */}
          {step === "verification_required" && (
            <motion.div
              key="verification_required"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Lock className="h-12 w-12 text-primary mx-auto mb-2" />
                    <h2 className="text-xl font-bold text-dark">Identity Verification</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      We'll send a 6-digit code to your registered email address.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-sm mx-auto">
                    {!otpSent ? (
                      <Button
                        onClick={handleSendOtp}
                        className="w-full bg-primary gap-2"
                        disabled={sendingOtp}
                      >
                        {sendingOtp
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending Code…</>
                          : <><Send className="h-4 w-4" /> Send Verification Code</>
                        }
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-center text-sm text-gray-500">
                          Code sent! Enter it below:
                        </p>
                        <Input
                          placeholder="Enter 6-digit code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="text-center text-2xl tracking-widest font-bold"
                          maxLength={6}
                        />
                        <Button
                          onClick={handleVerifyOtp}
                          disabled={otpCode.length < 6 || verifyingOtp || sendingToSeeker}
                          className="w-full bg-primary gap-2"
                        >
                          {verifyingOtp || sendingToSeeker
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> {sendingToSeeker ? "Notifying seeker…" : "Verifying…"}</>
                            : <><CheckCircle className="h-4 w-4" /> Verify & Notify Seeker</>
                          }
                        </Button>
                        <button
                          onClick={() => { setOtpSent(false); setOtpCode(""); }}
                          className="w-full text-xs text-gray-400 hover:text-primary text-center"
                        >
                          Resend code
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <button
                onClick={() => setStep("pending")}
                className="flex items-center text-sm text-gray-400 hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </button>
            </motion.div>
          )}

          {/* ── STEP 3: AWAITING SEEKER ── */}
          {step === "awaiting_seeker" && (
            <motion.div
              key="awaiting_seeker"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <Card>
                <CardContent className="p-8 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="flex justify-center mb-4"
                  >
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-10 w-10 text-primary" />
                    </div>
                  </motion.div>
                  <h2 className="text-xl font-bold text-dark">Waiting for Seeker</h2>
                  <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
                    ✅ Your identity is verified. The seeker has been emailed a confirmation link.
                    Once they click it, they'll receive your contact details automatically.
                  </p>

                  <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-800">
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <Clock className="h-4 w-4" /> What to expect
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-amber-700">
                      <li>Seeker has 24 hours to click their confirmation link</li>
                      <li>They'll receive your email address once they accept</li>
                      <li>You can come back here anytime to check status</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </motion.div>
          )}

          {/* ── REVEALED: shown if seeker already accepted ── */}
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
                <h2 className="text-lg font-bold text-dark">Seeker Confirmed!</h2>
                <p className="text-sm text-gray-600 mt-1">
                  The seeker accepted and has received your contact details. Coordinate directly.
                </p>
              </div>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Seeker Contact Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Email</p>
                        <a
                          href={`mailto:${revealedData?.seeker_email || request?.seeker_email}`}
                          className="font-medium text-dark hover:text-primary"
                        >
                          {revealedData?.seeker_email || request?.seeker_email || "—"}
                        </a>
                      </div>
                    </div>

                    {(revealedData?.seeker_phone || request?.seeker_phone) && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                          <a
                            href={`tel:${revealedData?.seeker_phone || request?.seeker_phone}`}
                            className="font-medium text-dark hover:text-primary"
                          >
                            {revealedData?.seeker_phone || request?.seeker_phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Hospital / Facility</p>
                        <span className="font-medium text-dark">
                          {revealedData?.hospital_name || request?.hospital_name || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Liability Notice */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-xs">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 text-gray-600">
                  <p className="font-semibold text-dark text-sm">Platform Scope & Safety Reminder</p>
                  <p>
                    <strong>AnonBlood's role ends here.</strong> We do not screen donors, coordinate with hospitals, handle blood collection, or take responsibility for any arrangements between parties.
                  </p>
                  <p>Please meet in safe medical or hospital settings where healthcare professionals handle blood screening and collection.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </Button>
                <Button className="flex-1 bg-success hover:bg-success/90 gap-2" onClick={handleMarkFulfilled}>
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