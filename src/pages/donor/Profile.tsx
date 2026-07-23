import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Droplets,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Shield,
  Edit,
  Save,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle,
  BadgeCheck,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import type { AvailabilityStatus, BloodType } from "@/types";

export default function DonorProfile() {
  const [editing, setEditing] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityStatus>("available");
  const [profile, setProfile] = useState({
    display_id: "Donor #482",
    blood_type: "O-" as BloodType,
    email: "j***@example.com",
    phone: "+63 912 ••• ••••",
    city: "Manila",
    barangay: "Ermita",
    verification_level: "strong" as const,
    last_donation_date: "2026-04-20",
    next_eligible_date: "2026-07-20",
    total_donations: 4,
    total_requests_fulfilled: 3,
  });

  // Check if medical eligibility window is active
  const today = new Date();
  const nextEligible = new Date(profile.next_eligible_date);
  const isMedicallyEligible = today >= nextEligible;
  const daysUntilEligible = Math.ceil(
    (nextEligible.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleSave = () => {
    setEditing(false);
    toast.success("Profile updated successfully");
  };

  const handleToggleAvailability = () => {
    if (availability === "resting" && !isMedicallyEligible) {
      toast.error("You cannot set yourself as available until your medical eligibility window ends.");
      return;
    }
    const newStatus: AvailabilityStatus =
      availability === "available" ? "unavailable" : "available";
    setAvailability(newStatus);
    toast.success(
      newStatus === "available"
        ? "You are now visible to seekers"
        : "You are now hidden from search results"
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dark">My Profile</h1>
        <Button
          variant={editing ? "default" : "outline"}
          onClick={() => (editing ? handleSave() : setEditing(true))}
        >
          {editing ? (
            <>
              <Save className="h-4 w-4 mr-2" /> Save
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Identity & Availability */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{profile.display_id}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                <Droplets className="h-3 w-3 mr-1" />
                {profile.blood_type}
              </span>
              {profile.verification_level === "strong" && (
                <Badge variant="success" className="gap-1 text-xs">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>

            {/* Availability Toggle */}
            <div className="mt-6 w-full bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-dark mb-3">Availability</p>
              <button
                onClick={handleToggleAvailability}
                className="flex items-center justify-center w-full gap-2"
              >
                {availability === "available" ? (
                  <ToggleRight className="h-8 w-8 text-success" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-300" />
                )}
              </button>
              <p
                className={`text-sm font-medium mt-1 ${
                  availability === "available"
                    ? "text-success"
                    : "text-gray-500"
                }`}
              >
                {availability === "available"
                  ? "Available to donate"
                  : "Not available"}
              </p>
              {availability === "resting" && (
                <p className="text-xs text-warning mt-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Medical rest period
                </p>
              )}
            </div>

            {/* Medical eligibility */}
            <div className="mt-4 w-full bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-dark mb-2">Eligibility</p>
              {isMedicallyEligible ? (
                <p className="text-sm text-success flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Eligible to donate
                </p>
              ) : (
                <div className="text-sm text-warning text-center">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {daysUntilEligible} days until eligible
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Next eligible: {profile.next_eligible_date}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right column - Details & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileField
                icon={Mail}
                label="Email"
                value={profile.email}
                editing={false}
              />
              <ProfileField
                icon={Phone}
                label="Phone"
                value={profile.phone}
                editing={editing}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
              <ProfileField
                icon={MapPin}
                label="City"
                value={profile.city}
                editing={editing}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              />
              <ProfileField
                icon={MapPin}
                label="Barangay (fuzzed in search)"
                value={profile.barangay}
                editing={false}
              />
              <ProfileField
                icon={Shield}
                label="Verification Level"
                value={profile.verification_level === "strong" ? "Strong (ID Verified)" : "Light (Email Verified)"}
                editing={false}
              />
            </CardContent>
          </Card>

          {/* Donation Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Donation Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBlock label="Total Donations" value={profile.total_donations} icon={Droplets} />
              <StatBlock label="Requests Fulfilled" value={profile.total_requests_fulfilled} icon={CheckCircle} />
              <StatBlock label="Last Donation" value={profile.last_donation_date} icon={Calendar} />
              <StatBlock label="Next Eligible" value={profile.next_eligible_date} icon={Clock} />
            </CardContent>
          </Card>

          {/* Log a Donation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Log a Donation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                After donating, log it here. This updates your eligibility window automatically.
              </p>
              <div className="flex gap-3">
                <Input type="date" defaultValue={today.toISOString().split("T")[0]} />
                <Button
                  onClick={() => {
                    const newDate = new Date();
                    newDate.setDate(newDate.getDate() + 84); // 12 weeks
                    setProfile({
                      ...profile,
                      last_donation_date: today.toISOString().split("T")[0],
                      next_eligible_date: newDate.toISOString().split("T")[0],
                      total_donations: profile.total_donations + 1,
                    });
                    setAvailability("resting");
                    toast.success("Donation logged! You're now in resting period.");
                  }}
                  className="bg-primary"
                >
                  Log Donation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// --------------------- Profile Field ---------------------
function ProfileField({
  icon: Icon,
  label,
  value,
  editing,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  editing: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        {editing && onChange ? (
          <Input value={value} onChange={onChange} className="mt-1 h-9" />
        ) : (
          <p className="font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

// --------------------- Stat Block ---------------------
function StatBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="text-lg font-bold text-dark mt-1">{value}</p>
    </div>
  );
}