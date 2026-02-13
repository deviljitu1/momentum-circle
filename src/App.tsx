import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import CirclesPage from "./pages/CirclesPage";
import AuthPage from "./pages/AuthPage";
import InsightsPage from "./pages/InsightsPage";
import AdminPage from "./pages/AdminPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import WellnessPage from "./pages/WellnessPage";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/circles"
          element={
            <ProtectedRoute>
              <CirclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <InsightsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wellness"
          element={
            <ProtectedRoute>
              <WellnessPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <BottomNav />}
    </div>
  );
};

import { TourProvider } from "@/contexts/TourContext";
import { AppTour } from "@/components/AppTour";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AuthProvider>
          <TourProvider>
            <AppTour />
            <AppRoutes />
          </TourProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
