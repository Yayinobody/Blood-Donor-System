import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

const requests = [
  { id: 1, bloodType: "O-", quantity: "3 units", urgency: "urgent", status: "open", date: "2026-07-19", matched: 2 },
  { id: 2, bloodType: "A+", quantity: "5 units", urgency: "high", status: "in-progress", date: "2026-07-18", matched: 3 },
  { id: 3, bloodType: "B-", quantity: "2 units", urgency: "normal", status: "fulfilled", date: "2026-07-15", matched: 2 },
  { id: 4, bloodType: "AB+", quantity: "1 unit", urgency: "urgent", status: "open", date: "2026-07-19", matched: 0 },
];

export default function HospitalRequests() {
  const [search, setSearch] = useState("");
  const [openNewRequest, setOpenNewRequest] = useState(false);

  const filtered = requests.filter(r =>
    r.bloodType.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateRequest = () => {
    toast.success("New blood request created successfully!");
    setOpenNewRequest(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Blood Requests</h1>
          <p className="text-gray-500 mt-1">Manage and create blood donation requests.</p>
        </div>
        <Dialog open={openNewRequest} onOpenChange={setOpenNewRequest}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Blood Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Blood Type</label>
                <select className="w-full mt-1 rounded-lg border border-gray-200 p-2 text-sm">
                  <option>O-</option><option>O+</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity (units)</label>
                <Input type="number" min={1} defaultValue={1} />
              </div>
              <div>
                <label className="text-sm font-medium">Urgency</label>
                <select className="w-full mt-1 rounded-lg border border-gray-200 p-2 text-sm">
                  <option>normal</option><option>high</option><option>urgent</option>
                </select>
              </div>
              <Button className="w-full" onClick={handleCreateRequest}>Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Requests</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 px-4 font-medium">ID</th>
                  <th className="py-3 px-4 font-medium">Blood Type</th>
                  <th className="py-3 px-4 font-medium">Quantity</th>
                  <th className="py-3 px-4 font-medium">Urgency</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Matched</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">#{req.id}</td>
                    <td className="py-3 px-4 font-semibold text-primary">{req.bloodType}</td>
                    <td className="py-3 px-4">{req.quantity}</td>
                    <td className="py-3 px-4">
                      <Badge variant={req.urgency === "urgent" ? "destructive" : req.urgency === "high" ? "warning" : "outline"}>
                        {req.urgency === "urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {req.urgency}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-gray-500">{req.date}</td>
                    <td className="py-3 px-4">{req.matched} donors</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open":
      return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Open</Badge>;
    case "in-progress":
      return <Badge variant="secondary">In Progress</Badge>;
    case "fulfilled":
      return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Fulfilled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}