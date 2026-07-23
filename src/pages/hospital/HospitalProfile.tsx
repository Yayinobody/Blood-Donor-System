import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Edit,
  Save,
  Droplets,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

export default function HospitalProfile() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "City General Hospital",
    type: "General Hospital",
    license: "HOS-2023-45678",
    email: "bloodbank@citygeneral.com",
    phone: "+1 (555) 987-6543",
    address: "123 Health Avenue, New York, NY 10001",
    hours: "24/7",
    verificationStatus: "verified",
    totalRequests: 156,
    fulfilled: 142,
    pending: 14,
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
        <h1 className="text-2xl font-bold text-dark">Hospital Profile</h1>
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
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" /> {profile.verificationStatus}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-2">{profile.type}</p>
            <p className="text-xs text-gray-400 mt-1">License: {profile.license}</p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileField icon={Mail} label="Email" value={profile.email} editing={editing} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              <ProfileField icon={Phone} label="Phone" value={profile.phone} editing={editing} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              <ProfileField icon={MapPin} label="Address" value={profile.address} editing={editing} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
              <ProfileField icon={Clock} label="Operating Hours" value={profile.hours} editing={editing} onChange={(e) => setProfile({ ...profile, hours: e.target.value })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatBlock label="Total Requests" value={profile.totalRequests} icon={Droplets} />
              <StatBlock label="Fulfilled" value={profile.fulfilled} icon={CheckCircle} />
              <StatBlock label="Pending" value={profile.pending} icon={Clock} />
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
        {editing && onChange ? <Input value={value} onChange={onChange} className="mt-1 h-9" /> : <p className="font-medium">{value}</p>}
      </div>
    </div>
  );
}

function StatBlock({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-dark mt-1">{value}</p>
    </div>
  );
}