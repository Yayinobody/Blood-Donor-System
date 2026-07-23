import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  MapPin,
  Clock,
  Send,
  Loader2,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import type { BloodType, UrgencyLevel } from "@/types";
import { BLOOD_TYPES } from "@/types";

interface SeekerRequestFormValues {
  seeker_email: string;
  seeker_phone: string;
  blood_type_needed: BloodType | "";
  urgency: UrgencyLevel;
  hospital_name: string;
  hospital_area: string;
  units_needed: number;
  note: string;
}

// Mock donor data (in real app, fetched from API)
const MOCK_DONOR = {
  display_id: "Donor #482",
  blood_type: "O-",
  distance_km: 1.2,
  verification_badge: true,
  availability_status: "available" as const,
};

export default function SeekerRequestForm() {
  const { donorId } = useParams<{ donorId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SeekerRequestFormValues>({
    defaultValues: {
      urgency: "within_hours",
      units_needed: 1,
    },
  });

  const selectedUrgency = watch("urgency");

  const onSubmit = async (data: SeekerRequestFormValues) => {
    if (!data.blood_type_needed) {
      toast.error("Please select a blood type needed");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Request sent! The donor will be notified.");
      navigate("/seeker/confirmation", {
        state: {
          donorId: donorId,
          bloodType: data.blood_type_needed,
          hospital: data.hospital_name,
          email: data.seeker_email,
        },
      });
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 to-accent/10 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-500 hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to search
        </button>

        {/* Donor info card */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {MOCK_DONOR.blood_type}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-dark">{MOCK_DONOR.display_id}</span>
                  {MOCK_DONOR.verification_badge && (
                    <Badge variant="success" className="gap-1 text-xs">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {MOCK_DONOR.distance_km.toFixed(1)} km away • Available now
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex gap-3"
        >
          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-dark">Your privacy matters</p>
            <p className="text-gray-600 mt-1">
              Your contact information will NOT be shown to the donor until both of you
              complete identity verification. The donor will only see the blood type needed,
              urgency, and hospital area.
            </p>
          </div>
        </motion.div>

        {/* Request form */}
        <div className="glass rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 className="text-xl font-bold text-dark mb-1">Request Blood Donation</h2>
          <p className="text-sm text-gray-500 mb-6">
            Fill in the details below. The donor will be notified anonymously.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Blood type needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood type needed *
              </label>
              <select
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                {...register("blood_type_needed", { required: "Blood type is required" })}
              >
                <option value="">Select blood type</option>
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
              {errors.blood_type_needed && (
                <p className="text-sm text-error mt-1">{errors.blood_type_needed.message}</p>
              )}
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency level *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "within_hours" as UrgencyLevel, label: "Within Hours", icon: AlertTriangle },
                  { value: "within_day" as UrgencyLevel, label: "Within a Day", icon: Clock },
                  { value: "planning_ahead" as UrgencyLevel, label: "Planning Ahead", icon: Clock },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                      selectedUrgency === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                      {...register("urgency")}
                    />
                    <opt.icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Seeker email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your email *
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register("seeker_email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                })}
              />
              <p className="text-xs text-gray-400 mt-1">
                This is how the donor will reach you after verification. Hidden from donor until then.
              </p>
              {errors.seeker_email && (
                <p className="text-sm text-error mt-1">{errors.seeker_email.message}</p>
              )}
            </div>

            {/* Seeker phone (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your phone (optional)
              </label>
              <Input
                type="tel"
                placeholder="+63 912 345 6789"
                {...register("seeker_phone")}
              />
            </div>

            {/* Hospital / Facility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital / Facility *
                </label>
                <Input
                  placeholder="Hospital name"
                  {...register("hospital_name", { required: "Hospital name is required" })}
                />
                {errors.hospital_name && (
                  <p className="text-sm text-error mt-1">{errors.hospital_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area / City *
                </label>
                <Input
                  placeholder="e.g. Manila, Quezon City"
                  {...register("hospital_area", { required: "Area is required" })}
                />
                {errors.hospital_area && (
                  <p className="text-sm text-error mt-1">{errors.hospital_area.message}</p>
                )}
              </div>
            </div>

            {/* Units needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Units needed
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                {...register("units_needed", { valueAsNumber: true, min: 1 })}
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional note (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any additional details..."
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                {...register("note")}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-600 shadow-lg shadow-primary/25"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending request...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" /> Send Anonymous Request
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}