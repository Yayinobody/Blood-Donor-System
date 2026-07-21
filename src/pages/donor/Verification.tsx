import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  BadgeCheck,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

type VerificationTab = "light" | "strong";

export default function DonorVerification() {
  const [activeTab, setActiveTab] = useState<VerificationTab>("light");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-dark">Verification</h1>
        <p className="text-gray-500 mt-1">
          Verify your identity to build trust with seekers and access contact exchange.
        </p>
      </div>

      {/* Current status */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <BadgeCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-semibold text-dark">Light Verification</p>
              <p className="text-sm text-success">Completed</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-dark">Strong Verification</p>
              <p className="text-sm text-gray-500">Optional — upgrade to get a Verified badge</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("light")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "light" ? "bg-white shadow text-dark" : "text-gray-500"
          }`}
        >
          <Mail className="h-4 w-4 inline mr-1" /> Light Verification
        </button>
        <button
          onClick={() => setActiveTab("strong")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "strong" ? "bg-white shadow text-dark" : "text-gray-500"
          }`}
        >
          <Shield className="h-4 w-4 inline mr-1" /> Strong Verification
        </button>
      </div>

      {activeTab === "light" ? <LightVerification /> : <StrongVerification />}
    </motion.div>
  );
}

// --------------------- Light Verification ---------------------
function LightVerification() {
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Light verification is required before contact info can be exchanged with a seeker.
            It only takes a minute.
          </p>

          {/* Email verification */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <span className="font-medium text-dark">Email Verification</span>
              <Badge variant="success" className="ml-auto">Done</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              We'll send a one-time code to <strong>j***@example.com</strong>
            </p>
            {!emailSent ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmailSent(true);
                  toast.success("Code sent to your email");
                }}
              >
                Send Code
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="123456"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => toast.success("Email verified!")}
                  disabled={emailOtp.length < 4}
                >
                  Verify
                </Button>
              </div>
            )}
          </div>

          {/* Phone verification */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-primary" />
              <span className="font-medium text-dark">Phone Verification</span>
              <Badge variant="outline" className="ml-auto">Optional</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Add your phone number for an extra layer of verification.
            </p>
            {!phoneSent ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPhoneSent(true);
                  toast.success("Code sent to your phone");
                }}
              >
                Send SMS Code
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="123456"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => toast.success("Phone verified!")}
                  disabled={phoneOtp.length < 4}
                >
                  Verify
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --------------------- Strong Verification ---------------------
function StrongVerification() {
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "reviewing" | "approved">("idle");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Please upload a valid ID");
      return;
    }
    setSubmitted(true);
    setStatus("reviewing");
    toast.success("ID submitted for review. This usually takes 24-48 hours.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-dark">Strong Verification</p>
              <p className="text-sm text-gray-500 mt-1">
                Upload a government-issued ID (passport, driver's license, UMID, etc.) to get a
                <Badge variant="success" className="mx-1 gap-1 text-xs">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </Badge>
                badge on your donor profile. This builds trust with seekers and speeds up the contact exchange process.
              </p>
            </div>
          </div>

          {status === "idle" && (
            <>
              {/* Upload area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-dark">
                  {file ? file.name : "Drag & drop your ID, or click to browse"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Accepted: JPG, PNG, PDF (max 5MB)
                </p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 relative z-10"
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                >
                  Browse Files
                </Button>
              </div>

              {/* Privacy notice */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-2 text-xs">
                <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-gray-600">
                  Your ID is encrypted and only reviewed by our admin team for verification purposes.
                  It is never shared with seekers or other users.
                </p>
              </div>

              <Button
                className="w-full bg-primary gap-2"
                disabled={!file}
                onClick={handleSubmit}
              >
                <Shield className="h-4 w-4" /> Submit for Review
              </Button>
            </>
          )}

          {status === "reviewing" && (
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-6 text-center">
              <Clock className="h-10 w-10 text-warning mx-auto mb-2" />
              <p className="font-medium text-dark">Under Review</p>
              <p className="text-sm text-gray-500 mt-1">
                Your ID is being reviewed by our team. This usually takes 24-48 hours.
                You'll be notified by email once approved.
              </p>
            </div>
          )}

          {status === "approved" && (
            <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center">
              <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
              <p className="font-medium text-dark">Strong Verification Approved!</p>
              <p className="text-sm text-gray-500 mt-1">
                Your donor profile now shows a Verified badge. Seekers will see this when browsing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}