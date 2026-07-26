import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

// Lazy-loaded pages
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmailPage"));
const VerifyEmailPending = lazy(() => import("@/pages/auth/VerifyEmailPending"));
const DonorDashboard = lazy(() => import("@/pages/donor/Dashboard"));
const DonorProfile = lazy(() => import("@/pages/donor/Profile"));
const DonorRequests = lazy(() => import("@/pages/donor/Requests"));
const DonorHistory = lazy(() => import("@/pages/donor/History"));
const DonorVerification = lazy(() => import("@/pages/donor/Verification"));
const ConnectScreen = lazy(() => import("@/pages/shared/ConnectScreen"));
// const AIAssistantPage = lazy(() => import("@/pages/ai-assistant/AIAssistant"));
const SeekerRequestForm = lazy(() => import("@/pages/seeker/RequestForm"));
const SeekerConfirmation = lazy(() => import("@/pages/seeker/Confirmation"));
const SeekerVerify = lazy(() => import("@/pages/seeker/Verify"));
const SeekerConfirmPage = lazy(() => import("@/pages/shared/SeekerConfirmPage"));
const AdminVerifications = lazy(() => import("@/pages/admin/AdminVerifications"));

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
        {/* Public routes - MainLayout (Navbar + Footer) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
          <Route path="/seeker/request/:donorId" element={<SeekerRequestForm />} />
          <Route path="/seeker/confirmation" element={<SeekerConfirmation />} />
          <Route path="/seeker/verify" element={<SeekerVerify />} />
          {/* Public seeker confirm page — no login required */}
          <Route path="/seeker-confirm" element={<SeekerConfirmPage />} />
        </Route>

        {/* Protected routes - DashboardLayout (Sidebar + Topbar) */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DonorDashboard />} />
          <Route path="/donor/profile" element={<DonorProfile />} />
          <Route path="/donor/requests" element={<DonorRequests />} />
          <Route path="/donor/history" element={<DonorHistory />} />
          <Route path="/donor/verification" element={<DonorVerification />} />
          <Route path="/connect/:matchId" element={<ConnectScreen />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
