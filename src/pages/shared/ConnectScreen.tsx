import { useState } from "react";
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
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

// Verification steps
type VerificationStep = "pending" | "verify_seeker" | "verify_donor" | "revealed" | "fulfilled";

export default function ConnectScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<VerificationStep>("pending");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Mock data — in real app, fetch from API
  const matchData = {
    id: matchId,
    donor: {
      display_id: "Donor #482",
      real_name: "Juan dela Cruz",
      email: "juan@example.com",
      phone: "+63 912 345 6789",
      blood_type: "O-",
      verification_level: "strong" as const,
    },
    seeker: {
      email: "maria@example.com",
      phone: "+63 917 987 6543",
      blood_type_needed: "O-",
      hospital: "PGH Blood Bank",
      hospital_area: "Ermita, Manila",
      urgency: "within_hours" as const,
    },
  };

  const handleSendOTP = () => {
    setOtpSent(true);
    toast.success("Verification code sent to your email");
  };

  const handleVerify = () => {
    if (otp.length < 4) {
      toast.error("Please enter the verification code");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep("revealed");
      toast.success("Verification successful! Contact info revealed.");
    }, 1500);
  };

  const handleMarkFulfilled = () => {
    setStep("fulfilled");
    toast.success("Donation marked as fulfilled. Thank you!");
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 to-accent/10 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-500 hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>

        <AnimatePresence mode="wait">
          {step === "pending" && (
            <PendingVerification
              key="pending"
              matchData={matchData}
              onStartVerification={() => setStep("verify_donor")}
            />
          )}

          {step === "verify_donor" && (
            <VerificationStep
              key="verify-donor"
              title="Verify Your Identity"
              description="As a donor, confirm your identity before contact info is exchanged."
              otpSent={otpSent}
              otp={otp}
              setOtp={setOtp}
              isVerifying={isVerifying}
              onSendOTP={handleSendOTP}
              onVerify={handleVerify}
            />
          )}

          {step === "revealed" && (
            <ContactRevealed
              key="revealed"
              matchData={matchData}
              onMarkFulfilled={handleMarkFulfilled}
              onCancel={() => navigate("/dashboard")}
            />
          )}

          {step === "fulfilled" && (
            <FulfilledScreen key="fulfilled" />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// --------------------- Pending Verification ---------------------
function PendingVerification({
  matchData,
  onStartVerification,
}: {
  matchData: any;
  onStartVerification: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-dark">Almost there!</h2>
          <p className="text-gray-500 mt-2">
            Before contact information is exchanged, both parties need to verify their identity.
            This keeps everyone safe.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="font-semibold text-dark mb-3">Request Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Blood type needed:</span>
              <span className="font-bold text-primary">{matchData.seeker.blood_type_needed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hospital:</span>
              <span>{matchData.seeker.hospital}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Area:</span>
              <span>{matchData.seeker.hospital_area}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Urgency:</span>
              <Badge variant="destructive">Within Hours</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onStartVerification} className="w-full bg-primary gap-2" size="lg">
        <Shield className="h-5 w-5" /> Verify & Reveal Contact
      </Button>
    </motion.div>
  );
}

// --------------------- Verification Step ---------------------
function VerificationStep({
  title,
  description,
  otpSent,
  otp,
  setOtp,
  isVerifying,
  onSendOTP,
  onVerify,
}: {
  title: string;
  description: string;
  otpSent: boolean;
  otp: string;
  setOtp: (v: string) => void;
  isVerifying: boolean;
  onSendOTP: () => void;
  onVerify: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="glass rounded-2xl p-8 shadow-xl border border-white/20"
    >
      <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
      <h2 className="text-xl font-bold text-dark text-center">{title}</h2>
      <p className="text-gray-500 text-center mt-1 mb-6">{description}</p>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-dark mb-2">
          <Mail className="h-4 w-4 inline mr-1" /> Email Verification
        </p>
        <p className="text-xs text-gray-500">
          We'll send a one-time code to your registered email address. No documents needed for light verification.
        </p>
      </div>

      {!otpSent ? (
        <Button onClick={onSendOTP} className="w-full" size="lg">
          <Mail className="h-4 w-4 mr-2" /> Send Verification Code
        </Button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            Enter the 6-digit code sent to your email
          </p>
          <Input
            type="text"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-2xl tracking-widest"
          />
          <Button
            onClick={onVerify}
            className="w-full bg-primary"
            disabled={isVerifying || otp.length < 4}
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
              </span>
            ) : (
              "Verify & Reveal Contact"
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// --------------------- Contact Revealed ---------------------
function ContactRevealed({
  matchData,
  onMarkFulfilled,
  onCancel,
}: {
  matchData: any;
  onMarkFulfilled: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Success banner */}
      <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
        <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
        <h2 className="text-lg font-bold text-dark">Contact Info Revealed</h2>
        <p className="text-sm text-gray-600">
          Both parties are verified. You can now coordinate directly.
        </p>
      </div>

      {/* Seeker contact card */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Seeker Contact Info
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{matchData.seeker.email}</span>
            </div>
            {matchData.seeker.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{matchData.seeker.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{matchData.seeker.hospital} — {matchData.seeker.hospital_area}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donor contact card */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Donor Contact Info (You)
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{matchData.donor.real_name}</span>
              <Badge variant="success" className="gap-1">
                <BadgeCheck className="h-3 w-3" /> Strongly Verified
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{matchData.donor.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{matchData.donor.phone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel Request
        </Button>
        <Button className="flex-1 bg-success hover:bg-success/90 gap-2" onClick={onMarkFulfilled}>
          <CheckCircle className="h-4 w-4" /> Mark as Fulfilled
        </Button>
      </div>
    </motion.div>
  );
}

// --------------------- Fulfilled ---------------------
function FulfilledScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <CheckCircle className="h-20 w-20 text-success mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-dark">Donation Fulfilled!</h2>
      <p className="text-gray-500 mt-2">
        Thank you for saving a life. Your availability will be updated.
      </p>
    </motion.div>
  );
}