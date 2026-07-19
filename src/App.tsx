import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// Lazy-loaded pages
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const DonorProfile = lazy(() => import("@/pages/donor/DonorProfile"));
const DonorHistory = lazy(() => import("@/pages/donor/DonorHistory"));
const DonorRequests = lazy(() => import("@/pages/donor/DonorRequests"));
const HospitalProfile = lazy(() => import("@/pages/hospital/HospitalProfile"));
const HospitalRequests = lazy(() => import("@/pages/hospital/HospitalRequests"));
const HospitalInventory = lazy(() => import("@/pages/hospital/HospitalInventory"));
const AIAssistant = lazy(() => import("@/pages/ai-assistant/AIAssistant"));

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <Routes>
        {/* Public routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected dashboard routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/donor/profile" element={<DonorProfile />} />
          <Route path="/donor/history" element={<DonorHistory />} />
          <Route path="/donor/requests" element={<DonorRequests />} />
          <Route path="/hospital/profile" element={<HospitalProfile />} />
          <Route path="/hospital/requests" element={<HospitalRequests />} />
          <Route path="/hospital/inventory" element={<HospitalInventory />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;