import { motion } from "framer-motion";
import {
  Users,
  Droplets,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data
const donationTrend = [
  { month: "Jan", donations: 45 },
  { month: "Feb", donations: 52 },
  { month: "Mar", donations: 61 },
  { month: "Apr", donations: 48 },
  { month: "May", donations: 72 },
  { month: "Jun", donations: 85 },
];

const bloodTypeDistribution = [
  { name: "O+", value: 35, color: "#E63946" },
  { name: "A+", value: 25, color: "#FCA5A5" },
  { name: "B+", value: 20, color: "#EF4444" },
  { name: "AB+", value: 10, color: "#DC2626" },
  { name: "O-", value: 5, color: "#B91C1C" },
  { name: "A-", value: 3, color: "#F87171" },
  { name: "B-", value: 1.5, color: "#FCA5A5" },
  { name: "AB-", value: 0.5, color: "#991B1B" },
];

const requestStatus = [
  { status: "Fulfilled", count: 120 },
  { status: "Pending", count: 35 },
  { status: "Urgent", count: 8 },
];

const recentActivities = [
  { id: 1, donor: "Anon#4523", action: "Donated O+", hospital: "City General", time: "2 min ago", status: "completed" },
  { id: 2, donor: "Anon#7812", action: "Matched B+", hospital: "St. Mary's", time: "15 min ago", status: "pending" },
  { id: 3, donor: "Anon#2341", action: "Request AB-", hospital: "Metro Hospital", time: "1 hour ago", status: "urgent" },
  { id: 4, donor: "Anon#9087", action: "Donated A+", hospital: "City General", time: "2 hours ago", status: "completed" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardHome() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, John. Here's what's happening.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        </div>
      </div>

      {/* Statistic cards */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={container}>
        <StatCard
          icon={Users}
          title="Total Donors"
          value="2,845"
          change="+12%"
          trend="up"
          color="primary"
        />
        <StatCard
          icon={Droplets}
          title="Donations This Month"
          value="156"
          change="+8%"
          trend="up"
          color="red"
        />
        <StatCard
          icon={Building2}
          title="Active Hospitals"
          value="48"
          change="+3"
          trend="up"
          color="blue"
        />
        <StatCard
          icon={Activity}
          title="Match Rate"
          value="94.2%"
          change="+2.1%"
          trend="up"
          color="green"
        />
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donation Trends Line Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Donation Trends</span>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={donationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="donations"
                    stroke="#E63946"
                    strokeWidth={3}
                    dot={{ fill: "#E63946", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Blood Type Distribution */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Blood Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bloodTypeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {bloodTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Request Status and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Status Bar */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Request Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={requestStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="status" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#E63946" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activities */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          activity.status === "completed"
                            ? "bg-success/10 text-success"
                            : activity.status === "urgent"
                            ? "bg-warning/10 text-warning"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {activity.status === "completed" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : activity.status === "urgent" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark">
                          {activity.donor} - {activity.action}
                        </p>
                        <p className="text-xs text-gray-500">{activity.hospital}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Reusable Stat Card
function StatCard({
  icon: Icon,
  title,
  value,
  change,
  trend,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  color: "primary" | "red" | "blue" | "green";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <motion.div variants={item}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span
              className={`text-xs font-medium ${
                trend === "up" ? "text-success" : "text-error"
              }`}
            >
              {change}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-dark">{value}</h3>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}