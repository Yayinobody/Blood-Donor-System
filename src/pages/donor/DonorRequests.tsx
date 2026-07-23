import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  AlertTriangle,
  ArrowRight,
  Droplets,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function DonorRequests() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setRequests(data);
        }
      } catch (err: any) {
        console.error("Error fetching requests:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleAcceptRequest = async (request: any) => {
    if (!user) {
      toast.error("Please log in to accept requests.");
      return;
    }
    try {
      // Upsert match into request_matches
      const { data, error } = await supabase
        .from("request_matches")
        .insert({
          request_id: request.id,
          donor_id: user.id,
          status: "accepted",
          notified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Request accepted! Redirecting to contact exchange...");
      navigate(`/connect/${data.id}`);
    } catch (err: any) {
      console.error("Error accepting request:", err.message);
      toast.error("Failed to accept request. Please try again.");
    }
  };

  const donorBloodType = profile?.blood_type || "All types";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Blood Requests</h1>
        <p className="text-gray-500 mt-1">
          Active urgent blood requests in your area. Your blood type: <span className="font-semibold text-primary">{donorBloodType}</span>
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Droplets className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-dark">No active requests right now.</p>
            <p className="text-sm mt-1">Check back later or keep your availability status set to Available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <motion.div key={req.id} variants={item}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{req.hospital_name || "General Hospital"}</h3>
                        <Badge variant={req.urgency_level === "within_hours" ? "destructive" : "warning"}>
                          {req.urgency_level === "within_hours" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {req.urgency_level?.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {req.units_needed} unit(s) of {req.blood_type_needed} blood required.
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {req.hospital_address || "Nearby Hospital"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {new Date(req.created_at || Date.now()).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-primary">
                          Blood type needed: {req.blood_type_needed}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button onClick={() => handleAcceptRequest(req)} className="gap-2 bg-primary">
                        Accept Request <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}