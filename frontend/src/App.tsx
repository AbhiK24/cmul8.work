import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
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
import CandidateReport from './pages/CandidateReport';
import TrainingDetail from './pages/TrainingDetail';
import TrainingReport from './pages/TrainingReport';
import AssessmentDetail from './pages/AssessmentDetail';
// B2C Pages
import Signup from './pages/Signup';
import SignInPage from './pages/SignIn';
import Practice from './pages/Practice';

// B2B Protected Route (Employers)
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

// B2C Protected Route (Individual Users) - Uses Clerk
function B2CProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* B2C Auth routes (Clerk) */}
          <Route path="/signup/*" element={<Signup />} />
          <Route path="/signin/*" element={<SignInPage />} />

          {/* B2C routes (individual users) */}
          <Route
            path="/practice"
            element={
              <B2CProtectedRoute>
                <Practice />
              </B2CProtectedRoute>
            }
          />

          {/* Employer routes (protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/training/:slug"
            element={
              <ProtectedRoute>
                <TrainingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training-report/:sessionId"
            element={
              <ProtectedRoute>
                <TrainingReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:role"
            element={
              <ProtectedRoute>
                <AssessmentDetail />
              </ProtectedRoute>
            }
          />

          {/* Candidate routes (public, token-validated on backend) */}
          <Route path="/s/:sessionId/:token" element={<CandidateLanding />} />
          <Route path="/sim/:sessionId/:token" element={<Simulation />} />
          <Route path="/debrief/:sessionId/:token" element={<Debrief />} />
          <Route path="/report/:sessionId/candidate" element={<CandidateReport />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
