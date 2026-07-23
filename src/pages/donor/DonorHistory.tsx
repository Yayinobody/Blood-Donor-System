import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Droplets, Heart, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

export default function DonorHistory() {
  const { user, profile } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("donations")
          .select(`
            id,
            donation_date,
            volume_ml,
            status,
            notes,
            blood_banks (
              name,
              address,
              city
            )
          `)
          .eq("donor_id", user.id)
          .order("donation_date", { ascending: false });

        if (error) throw error;
        setDonations(data || []);
      } catch (err: any) {
        console.error("Error fetching donations:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, [user]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Donation History</h1>
        <p className="text-gray-500 mt-1">Your past blood donations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> All Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Droplets className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-dark">No donations recorded yet.</p>
              <p className="text-sm mt-1">Log your first donation on the Profile page.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <motion.div
                  key={donation.id}
                  variants={item}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 last:border-0 gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      donation.status === "completed" ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    }`}>
                      {donation.status === "completed"
                        ? <CheckCircle className="h-5 w-5" />
                        : <XCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-dark">
                        {donation.blood_banks?.name || "Blood Bank"}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(donation.donation_date).toLocaleDateString()}
                        </span>
                        {donation.blood_banks?.city && (
                          <span>{donation.blood_banks.city}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{profile?.blood_type || "—"}</p>
                      <p className="text-xs text-gray-500">{donation.volume_ml ? `${donation.volume_ml}ml` : "450ml"}</p>
                    </div>
                    <Badge variant={donation.status === "completed" ? "success" : "destructive"}>
                      {donation.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}