import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  Heart,
  Bell,
  History,
  MapPin,
  Building2,
  ClipboardList,
  BarChart3,
  Package,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

const donorLinks = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "My Profile", path: "/donor/profile", icon: User },
  { name: "Donation History", path: "/donor/history", icon: History },
  { name: "Nearby Requests", path: "/donor/requests", icon: MapPin },
  { name: "Notifications", path: "/notifications", icon: Bell },
];

const generalLinks = [
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function DashboardSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
        <Link
          to="/dashboard"
          className={cn("flex items-center space-x-2", collapsed && "lg:hidden")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Droplets className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-dark">
              Anon<span className="text-primary">Blood</span>
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        <p className={cn("px-3 text-xs font-semibold uppercase text-gray-400", collapsed && "lg:text-center")}>
          Donor
        </p>
        {donorLinks.map((link) => (
          <NavItem
            key={link.path}
            link={link}
            active={location.pathname === link.path}
            collapsed={collapsed}
          />
        ))}

        <div className="my-3 border-t border-gray-100" />

        <div className="my-3 border-t border-gray-100" />

        {generalLinks.map((link) => (
          <NavItem
            key={link.path}
            link={link}
            active={location.pathname === link.path}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-100 p-3">
        <div className={cn("flex items-center space-x-3 rounded-lg p-2", collapsed && "lg:justify-center")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1 text-sm">
              <p className="font-medium text-dark">John Doe</p>
              <p className="text-gray-500">Universal Donor (O-)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

function NavItem({
  link,
  active,
  collapsed,
}: {
  link: { name: string; path: string; icon: React.ElementType };
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = link.icon;
  return (
    <Link
      to={link.path}
      className={cn(
        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-100 hover:text-dark",
        collapsed && "lg:justify-center lg:px-2"
      )}
      title={collapsed ? link.name : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span className="ml-3">{link.name}</span>}
    </Link>
  );
}
