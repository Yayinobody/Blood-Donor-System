import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

const nearbyRequests = [
  {
    id: 1,
    hospital: "City General Hospital",
    location: "2.3 km away",
    bloodType: "O-",
    urgency: "urgent",
    posted: "10 min ago",
    description: "Emergency surgery - need O- blood immediately",
  },
  {
    id: 2,
    hospital: "St. Mary's Medical Center",
    location: "5.1 km away",
    bloodType: "O-",
    urgency: "normal",
    posted: "1 hour ago",
    description: "Routine supply replenishment for O- blood type",
  },
  {
    id: 3,
    hospital: "Metro Health Center",
    location: "3.8 km away",
    bloodType: "O-",
    urgency: "high",
    posted: "30 min ago",
    description: "Child patient with thalassemia needs O- blood",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function DonorRequests() {
  const handleAccept = (requestId: number) => {
    toast.success(`Request #${requestId} accepted. Hospital will be notified.`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Nearby Blood Requests</h1>
        <p className="text-gray-500 mt-1">
          Requests matching your blood type (O-) in your area.
        </p>
      </div>

      <div className="space-y-4">
        {nearbyRequests.map((req) => (
          <motion.div key={req.id} variants={item}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{req.hospital}</h3>
                      <Badge variant={req.urgency === "urgent" ? "destructive" : req.urgency === "high" ? "warning" : "outline"}>
                        {req.urgency === "urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {req.urgency}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{req.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {req.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {req.posted}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-primary">
                        Blood type: {req.bloodType}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button onClick={() => handleAccept(req.id)} className="gap-2">
                      Accept Request <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}