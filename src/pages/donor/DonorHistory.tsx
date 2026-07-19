import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const donations = [
  {
    id: 1,
    date: "2026-06-15",
    hospital: "City General Hospital",
    location: "Manhattan, NY",
    bloodType: "O-",
    status: "completed",
    volume: "450ml",
  },
  {
    id: 2,
    date: "2026-03-20",
    hospital: "St. Mary's Medical Center",
    location: "Brooklyn, NY",
    bloodType: "O-",
    status: "completed",
    volume: "450ml",
  },
  {
    id: 3,
    date: "2025-12-01",
    hospital: "Metro Health",
    location: "Queens, NY",
    bloodType: "O-",
    status: "completed",
    volume: "450ml",
  },
  {
    id: 4,
    date: "2025-09-10",
    hospital: "Red Cross Center",
    location: "Bronx, NY",
    bloodType: "O-",
    status: "cancelled",
    volume: "N/A",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function DonorHistory() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-dark">Donation History</h1>
        <p className="text-gray-500 mt-1">
          Your past donations and upcoming appointments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            All Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {donations.map((donation) => (
              <motion.div
                key={donation.id}
                variants={item}
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 last:border-0 gap-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      donation.status === "completed"
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error"
                    }`}
                  >
                    {donation.status === "completed" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-dark">{donation.hospital}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {donation.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {donation.location}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{donation.bloodType}</p>
                    <p className="text-xs text-gray-500">{donation.volume}</p>
                  </div>
                  <Badge
                    variant={donation.status === "completed" ? "success" : "destructive"}
                  >
                    {donation.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}