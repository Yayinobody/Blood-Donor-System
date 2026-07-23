import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle,
  Mail,
  Loader2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function SeekerVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("match") || "unknown";
  const email = searchParams.get("email") || "your email";

  const [step, setStep] = useState<"intro" | "email_otp" | "verified">("intro");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendOTP = () => {
    setOtpSent(true);
    setStep("email_otp");
    toast.success("Verification code sent to " + email);
  };

  const handleVerify = () => {
    if (otp.length < 4) {
      toast.error("Please enter the verification code");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep("verified");
      toast.success("Verification successful! Contact info will be exchanged.");
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Step: Intro */}
        {step === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-8 shadow-xl border border-white/20"
          >
            <div className="text-center mb-6">
              <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-dark">Verify Your Identity</h2>
              <p className="text-gray-500 mt-2">
                The donor has accepted your request! Before contact info is exchanged,
                you need to complete a quick verification.
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-dark">Why verify?</p>
                  <p className="text-gray-600 mt-1">
                    Mutual verification protects both you and the donor. Your contact
                    info is only revealed after both sides confirm their identity.
                    This prevents spam and keeps the community safe.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-dark mb-2">
                <Mail className="h-4 w-4 inline mr-1" /> Email Verification
              </p>
              <p className="text-xs text-gray-500">
                We'll send a one-time code to <strong>{email}</strong>. No documents
                needed — this takes less than a minute.
              </p>
            </div>

            <Button onClick={handleSendOTP} className="w-full bg-primary gap-2" size="lg">
              <Mail className="h-5 w-5" /> Send Verification Code
            </Button>
          </motion.div>
        )}

        {/* Step: Email OTP */}
        {step === "email_otp" && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-8 shadow-xl border border-white/20"
          >
            <div className="text-center mb-6">
              <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold text-dark">Check Your Email</h2>
              <p className="text-gray-500 mt-1">
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest h-14"
              />

              <Button
                onClick={handleVerify}
                className="w-full bg-primary gap-2"
                size="lg"
                disabled={isVerifying || otp.length < 4}
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5" /> Verify & Reveal Contact
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setStep("intro");
                }}
                className="w-full text-sm text-gray-500 hover:text-primary text-center"
              >
                Didn't receive a code? Go back
              </button>
            </div>
          </motion.div>
        )}

        {/* Step: Verified */}
        {step === "verified" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 shadow-xl border border-white/20 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-20 w-20 text-success mx-auto mb-4" />
            </motion.div>

            <h2 className="text-xl font-bold text-dark">Verification Complete!</h2>
            <p className="text-gray-500 mt-2">
              Both you and the donor are now verified. Contact information has been
              exchanged. Check your email for the donor's details.
            </p>

            <div className="bg-success/5 border border-success/20 rounded-xl p-4 mt-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="font-medium text-dark">What happens now?</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• The donor's name, email, and phone are now visible to you</li>
                <li>• Coordinate directly for the donation</li>
                <li>• Mark the request as fulfilled once the donation is complete</li>
              </ul>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
              <Button
                className="flex-1 bg-primary gap-2"
                onClick={() => navigate(`/connect/${matchId}`)}
              >
                View Connection <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}