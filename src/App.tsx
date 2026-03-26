import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import MissionsPage from "./pages/Missions";
import MissionDetailPage from "./pages/MissionDetail";
import HistoriquePage from "./pages/Historique";
import MessagesPage from "./pages/Messages";
import CartePage from "./pages/Carte";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="missions" element={<MissionsPage />} />
        <Route path="missions/:id" element={<MissionDetailPage />} />
        <Route path="historique" element={<HistoriquePage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="carte" element={<CartePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
