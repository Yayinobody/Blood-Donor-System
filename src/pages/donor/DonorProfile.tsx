import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Droplets,
  MapPin,
  Phone,
  Mail,
  Shield,
  Edit,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function DonorProfile() {
  const [editing, setEditing] = useState(false);
  const [available, setAvailable] = useState(true);
  const [profile, setProfile] = useState({
    pseudonym: "Anon#4523",
    bloodType: "O-",
    email: "anon4523@anonblood.com",
    phone: "•••• ••• 4523",
    location: "New York, NY (Approx.)",
    lastDonation: "2026-06-15",
    totalDonations: 8,
    nextEligible: "2026-08-15",
    medicalConditions: "None",
  });

  const handleSave = () => {
    setEditing(false);
    toast.success("Profile updated successfully");
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
        {/* Left column - Identity */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{profile.pseudonym}</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mt-2">
              <Droplets className="h-3 w-3 mr-1" />
              {profile.bloodType} (Universal Donor)
            </span>

            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Availability</span>
                <button
                  onClick={() => setAvailable(!available)}
                  className="text-primary"
                >
                  {available ? (
                    <ToggleRight className="h-6 w-6 text-success" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-300" />
                  )}
                </button>
              </div>
              <div className="text-sm text-left">
                <p className="text-gray-500">Status</p>
                <span
                  className={`font-medium ${
                    available ? "text-success" : "text-gray-500"
                  }`}
                >
                  {available ? "Available to donate" : "Not available"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileField
                icon={Mail}
                label="Email"
                value={profile.email}
                editing={editing}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              <ProfileField
                icon={Phone}
                label="Phone"
                value={profile.phone}
                editing={false}
              />
              <ProfileField
                icon={MapPin}
                label="Location"
                value={profile.location}
                editing={false}
              />
              <ProfileField
                icon={Shield}
                label="Medical Conditions"
                value={profile.medicalConditions}
                editing={editing}
                onChange={(e) => setProfile({ ...profile, medicalConditions: e.target.value })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Donation Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <StatBlock label="Total Donations" value={profile.totalDonations} />
              <StatBlock label="Blood Type" value={profile.bloodType} />
              <StatBlock label="Last Donation" value={profile.lastDonation} />
              <StatBlock label="Next Eligible" value={profile.nextEligible} />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

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
          <Input
            value={value}
            onChange={onChange}
            className="mt-1 h-9"
          />
        ) : (
          <p className="font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-bold text-dark">{value}</p>
    </div>
  );
}