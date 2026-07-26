import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, LogOut, RefreshCw, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import { useState } from "react";

export default function VerifyEmailPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const { signOut } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("Verification email resent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 to-accent/10 relative overflow-hidden">
      <motion.div
        className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-2xl p-8 shadow-xl border border-white/20 backdrop-blur-xl text-center">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-dark">
              Anon<span className="text-primary">Blood</span>
            </span>
          </div>

          {/* Animated email icon */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="flex justify-center mb-6"
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-10 w-10 text-primary" />
            </div>
          </motion.div>

          <h2 className="text-2xl font-bold text-dark">Check Your Email</h2>
          <p className="text-gray-500 mt-2 text-sm">
            We sent a confirmation link to:
          </p>
          <p className="font-semibold text-dark mt-1 text-sm break-all">
            {email || "your registered email address"}
          </p>

          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-4 text-left text-sm text-gray-600">
            <p className="font-medium text-dark mb-1">📬 What to do:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your email inbox</li>
              <li>Find the email from AnonBlood</li>
              <li>Click <strong>"Confirm your email"</strong></li>
              <li>You'll be automatically taken to your dashboard</li>
            </ol>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Didn't receive it? Check your spam folder.
          </p>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleResend}
              disabled={isResending}
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Sending..." : "Resend Email"}
            </Button>
            <Button
              variant="ghost"
              className="flex-1 gap-2 text-gray-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
