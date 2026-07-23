import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Droplets, Calendar, MapPin, Phone, Mail, Shield,
  Edit, Save, ToggleLeft, ToggleRight, Clock, CheckCircle,
  BadgeCheck, Activity, AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import type { AvailabilityStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";

export default function DonorProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingDonation, setLoggingDonation] = useState(false);
  const donationDateRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const nextEligible = profile?.next_eligible_date ? new Date(profile.next_eligible_date) : null;
  const isMedicallyEligible = nextEligible ? today >= nextEligible : true;
  const daysUntilEligible = nextEligible
    ? Math.ceil((nextEligible.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Local editable fields
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: (profile as any)?.phone || "",
    city: (profile as any)?.city || "",
    barangay: (profile as any)?.barangay || "",
  });

  // Sync form when profile loads
  useState(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: (profile as any)?.phone || "",
        city: (profile as any)?.city || "",
        barangay: (profile as any)?.barangay || "",
      });
    }
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: form.full_name,
          phone: form.phone || null,
          city: form.city || null,
          barangay: form.barangay || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!user || !profile) return;
    const currentStatus = profile.availability_status;
    if (currentStatus === "resting" && !isMedicallyEligible) {
      toast.error("You cannot set yourself as available until your rest period ends.");
      return;
    }
    const newStatus: AvailabilityStatus = currentStatus === "available" ? "unavailable" : "available";
    try {
      const { error } = await supabase
        .from("users")
        .update({ availability_status: newStatus })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(newStatus === "available" ? "You are now visible to seekers" : "You are now hidden from search results");
    } catch (err: any) {
      toast.error("Failed to update availability.");
    }
  };

  const handleLogDonation = async () => {
    if (!user) return;
    const donationDate = donationDateRef.current?.value || today.toISOString().split("T")[0];
    setLoggingDonation(true);
    try {
      const nextEligibleDate = new Date(donationDate);
      nextEligibleDate.setDate(nextEligibleDate.getDate() + 84); // 12 weeks

      // Insert into donations table
      const { error: donationError } = await supabase.from("donations").insert({
        donor_id: user.id,
        donation_date: donationDate,
        volume_ml: 450,
        status: "completed",
      });
      if (donationError) throw donationError;

      // Update user's last donation date, next eligible date, and status
      const { error: userError } = await supabase.from("users").update({
        last_donation_date: donationDate,
        next_eligible_date: nextEligibleDate.toISOString(),
        availability_status: "resting",
      }).eq("id", user.id);
      if (userError) throw userError;

      await refreshProfile();
      toast.success("Donation logged! You are now in resting period (12 weeks).");
    } catch (err: any) {
      toast.error(err.message || "Failed to log donation.");
    } finally {
      setLoggingDonation(false);
    }
  };

  const availability = profile?.availability_status || "available";
  const displayId = profile?.display_id || "—";
  const bloodType = profile?.blood_type || "—";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dark">My Profile</h1>
        <Button
          variant={editing ? "default" : "outline"}
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : editing ? (
            <><Save className="h-4 w-4 mr-2" /> Save</>
          ) : (
            <><Edit className="h-4 w-4 mr-2" /> Edit</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{displayId}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                <Droplets className="h-3 w-3 mr-1" /> {bloodType}
              </span>
              {profile?.is_verified && (
                <Badge variant="success" className="gap-1 text-xs">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>

            {/* Availability Toggle */}
            <div className="mt-6 w-full bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-dark mb-3">Availability</p>
              <button onClick={handleToggleAvailability} className="flex items-center justify-center w-full gap-2">
                {availability === "available"
                  ? <ToggleRight className="h-8 w-8 text-success" />
                  : <ToggleLeft className="h-8 w-8 text-gray-300" />}
              </button>
              <p className={`text-sm font-medium mt-1 ${availability === "available" ? "text-success" : "text-gray-500"}`}>
                {availability === "available" ? "Available to donate" : "Not available"}
              </p>
              {availability === "resting" && (
                <p className="text-xs text-warning mt-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Medical rest period
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
              {profile?.next_eligible_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Next eligible: {new Date(profile.next_eligible_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ProfileField icon={Mail} label="Email" value={user?.email || "—"} editing={false} />
              <ProfileField
                icon={User} label="Full Name" value={form.full_name} editing={editing}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              <ProfileField
                icon={Phone} label="Phone" value={form.phone} editing={editing}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <ProfileField
                icon={MapPin} label="City" value={form.city} editing={editing}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <ProfileField icon={Shield} label="Verification" value={profile?.is_verified ? "Verified" : "Not Verified"} editing={false} />
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader><CardTitle>Donation Statistics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatBlock label="Last Donation" value={profile?.last_donation_date ? new Date(profile.last_donation_date).toLocaleDateString() : "None"} icon={Calendar} />
              <StatBlock label="Next Eligible" value={profile?.next_eligible_date ? new Date(profile.next_eligible_date).toLocaleDateString() : "Now"} icon={Clock} />
              <StatBlock label="Status" value={availability} icon={CheckCircle} />
            </CardContent>
          </Card>

          {/* Log Donation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Log a Donation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                After donating, log it here. This updates your eligibility window automatically (12 weeks rest).
              </p>
              <div className="flex gap-3">
                <Input type="date" ref={donationDateRef} defaultValue={today.toISOString().split("T")[0]} />
                <Button onClick={handleLogDonation} className="bg-primary" disabled={loggingDonation}>
                  {loggingDonation ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging...</> : "Log Donation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileField({ icon: Icon, label, value, editing, onChange }: {
  icon: React.ElementType; label: string; value: string;
  editing: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        {editing && onChange
          ? <Input value={value} onChange={onChange} className="mt-1 h-9" />
          : <p className="font-medium">{value || "—"}</p>}
      </div>
    </div>
  );
}

function StatBlock({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
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