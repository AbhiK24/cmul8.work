import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Setup from './pages/Setup';
import Preview from './pages/Preview';
import CandidateLink from './pages/CandidateLink';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CandidateLanding from './pages/CandidateLanding';
import Simulation from './pages/Simulation';
import Debrief from './pages/Debrief';
import Report from './pages/Report';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Employer routes (protected) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <Setup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preview/:sessionId"
            element={
              <ProtectedRoute>
                <Preview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/link/:sessionId"
            element={
              <ProtectedRoute>
                <CandidateLink />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:sessionId"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />

          {/* Candidate routes (public, token-validated on backend) */}
          <Route path="/s/:sessionId/:token" element={<CandidateLanding />} />
          <Route path="/sim/:sessionId/:token" element={<Simulation />} />
          <Route path="/debrief/:sessionId/:token" element={<Debrief />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
