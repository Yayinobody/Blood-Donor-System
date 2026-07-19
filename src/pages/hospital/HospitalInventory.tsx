import { motion } from "framer-motion";
import {
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const inventory = [
  { type: "O+", stock: 25, minRequired: 10, status: "good" },
  { type: "O-", stock: 3, minRequired: 8, status: "critical" },
  { type: "A+", stock: 18, minRequired: 10, status: "good" },
  { type: "A-", stock: 5, minRequired: 6, status: "low" },
  { type: "B+", stock: 12, minRequired: 8, status: "good" },
  { type: "B-", stock: 2, minRequired: 5, status: "critical" },
  { type: "AB+", stock: 7, minRequired: 4, status: "good" },
  { type: "AB-", stock: 1, minRequired: 2, status: "low" },
];

const chartData = inventory.map((item) => ({
  name: item.type,
  stock: item.stock,
  required: item.minRequired,
}));

export default function HospitalInventory() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-dark">Blood Inventory</h1>
        <p className="text-gray-500 mt-1">
          Real-time blood stock levels and requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-gray-500">Well Stocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-sm text-gray-500">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Stock vs Required</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#E63946" radius={[4, 4, 0, 0]} />
                <Bar dataKey="required" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>All Blood Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 px-4">Blood Type</th>
                  <th className="py-3 px-4">Stock (Units)</th>
                  <th className="py-3 px-4">Min Required</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const percentage = Math.min((item.stock / item.minRequired) * 100, 100);
                  return (
                    <tr key={item.type} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold">{item.type}</td>
                      <td className="py-3 px-4">{item.stock}</td>
                      <td className="py-3 px-4 text-gray-500">{item.minRequired}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            item.status === "good"
                              ? "success"
                              : item.status === "low"
                              ? "warning"
                              : "destructive"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 w-40">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage >= 100
                                ? "bg-success"
                                : percentage >= 50
                                ? "bg-warning"
                                : "bg-error"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}