import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Shield,
  Mail,
  ArrowRight,
  Home,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

interface ConfirmationState {
  donorId: string;
  bloodType: string;
  hospital: string;
  email: string;
}

export default function SeekerConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ConfirmationState | null;
  const [countdown, setCountdown] = useState(120); // 2 hours in minutes

  // If no state, redirect back
  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  // Countdown timer (simulated)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 60000); // tick every minute
    return () => clearInterval(timer);
  }, [countdown]);

  if (!state) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-success/5 to-primary/5 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-lg w-full"
      >
        {/* Success icon */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
          >
            <CheckCircle className="h-12 w-12 text-success" />
          </motion.div>
          <h1 className="text-2xl font-bold text-dark mt-4">Request Sent!</h1>
          <p className="text-gray-500 mt-2">
            Your request has been sent to Donor #{state.donorId}
          </p>
        </div>

        {/* Info cards */}
        <div className="space-y-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Blood type needed:</span>
                  <span className="font-semibold text-primary">{state.bloodType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hospital:</span>
                  <span className="font-semibold">{state.hospital}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Contact email:</span>
                  <span className="font-semibold">{state.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy notice */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-dark">What happens next?</p>
              <ol className="text-gray-600 mt-1 space-y-1 list-decimal list-inside">
                <li>The donor will be notified anonymously</li>
                <li>If they accept, both of you will verify your identities</li>
                <li>Only after mutual verification will contact info be exchanged</li>
              </ol>
            </div>
          </div>

          {/* Timeout warning */}
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex gap-3">
            <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-dark">Response window</p>
              <p className="text-gray-600 mt-1">
                For urgent requests, the donor has ~2 hours to respond. If they don't respond
                or decline, we'll automatically try the next compatible donor.
              </p>
              <p className="text-warning font-medium mt-2">
                {countdown > 0
                  ? `~${countdown} minutes remaining`
                  : "Response window closing soon"}
              </p>
            </div>
          </div>

          {/* Email notification */}
          <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
            <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-dark">Check your email</p>
              <p className="text-gray-600 mt-1">
                We'll notify you at <strong>{state.email}</strong> when the donor responds.
                No further action is needed from you right now.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button className="w-full bg-primary gap-2">
              <Search className="h-4 w-4" /> Search More Donors
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          If you don't hear back within the expected timeframe, the system will
          automatically try the next available donor.
        </p>
      </motion.div>
    </div>
  );
}