import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Diagnosis from "./pages/Diagnosis";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Feedback from "./pages/Feedback";
import Community from "./pages/Community";
import Complaints from "./pages/Complaints";
import AdminComplaints from "./pages/AdminComplaints";
import AdminDiagnosis from "./pages/AdminDiagnosis";
import NaturalPesticides from "./pages/NaturalPesticides";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import MainLayout from "./components/MainLayout";

const queryClient = new QueryClient();

const SplashScreen = () => (
  <div className="splash-screen">
    <img src="/logo.jpg" alt="Logo" className="splash-logo" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (user && !userData?.isOnboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (user && userData?.isOnboarded && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {showSplash && <SplashScreen />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><MainLayout><Marketplace /></MainLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><MainLayout><History /></MainLayout></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><MainLayout><Feedback /></MainLayout></ProtectedRoute>} />
              <Route path="/pesticides" element={<ProtectedRoute><MainLayout><NaturalPesticides /></MainLayout></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute><MainLayout><Community /></MainLayout></ProtectedRoute>} />
              <Route path="/complaints" element={<ProtectedRoute><MainLayout><Complaints /></MainLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><MainLayout><SubAdminDashboard /></MainLayout></ProtectedRoute>} />
              <Route path="/admin/complaints" element={<ProtectedRoute><MainLayout><AdminComplaints /></MainLayout></ProtectedRoute>} />
              <Route path="/admin/diagnosis" element={<ProtectedRoute><MainLayout><AdminDiagnosis /></MainLayout></ProtectedRoute>} />
              <Route path="/diagnosis" element={<ProtectedRoute><MainLayout><Diagnosis /></MainLayout></ProtectedRoute>} />

              {/* Public Home */}
              <Route path="/" element={<Home />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
