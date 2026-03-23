import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SignIn, SignUp, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { auth, InviteInfo } from '../api/client';
import Logo from '../components/Logo';

export default function AcceptInvite() {
  const { token: inviteToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { getToken } = useClerkAuth();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);

  // Load invite info
  useEffect(() => {
    async function loadInvite() {
      if (!inviteToken) return;

      try {
        const info = await auth.getInviteInfo(inviteToken);
        setInviteInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid or expired invitation');
      } finally {
        setIsLoading(false);
      }
    }

    loadInvite();
  }, [inviteToken]);

  // When user signs in, accept the invite
  useEffect(() => {
    if (user && isClerkLoaded && inviteInfo && inviteToken) {
      acceptInvite();
    }
  }, [user, isClerkLoaded, inviteInfo]);

  const acceptInvite = async () => {
    if (!inviteToken) return;
    setIsAccepting(true);
    setError('');

    try {
      const clerkToken = await getToken();
      if (!clerkToken) {
        setError('Authentication failed');
        return;
      }

      await auth.acceptInvite(clerkToken, inviteToken, user?.fullName || undefined);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-dark mb-2">Invalid Invitation</h1>
          <p className="text-muted mb-6">{error}</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-dark text-white rounded-xl font-medium hover:bg-dark/90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // If user is already signed in, show accepting state
  if (user && isClerkLoaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {isAccepting ? (
            <>
              <div className="animate-spin h-12 w-12 border-2 border-dark border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted">Joining {inviteInfo?.org_name}...</p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-dark mb-2">Couldn't Join</h1>
              <p className="text-muted mb-6">{error}</p>
              <Link
                to="/dashboard"
                className="inline-block px-6 py-3 bg-dark text-white rounded-xl font-medium hover:bg-dark/90"
              >
                Go to Dashboard
              </Link>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-md mx-auto">
          <Logo linkTo="" size="md" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {!showAuth ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                {inviteInfo?.org_name[0]}
              </div>

              <h1 className="text-2xl font-semibold text-dark mb-2">
                You're invited to join
              </h1>
              <h2 className="text-3xl font-bold text-dark mb-4">
                {inviteInfo?.org_name}
              </h2>

              <p className="text-muted mb-2">
                {inviteInfo?.inviter_email} invited you as a{inviteInfo?.role === 'admin' ? 'n' : ''}{' '}
                <span className="font-medium text-dark">{inviteInfo?.role}</span>
              </p>

              <div className="bg-white border border-border rounded-xl p-6 mt-8 space-y-4">
                <button
                  onClick={() => {
                    setShowAuth(true);
                    setIsSignUp(true);
                  }}
                  className="w-full py-3 bg-dark text-white rounded-xl font-medium hover:bg-dark/90 transition-colors"
                >
                  Create Account & Join
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-muted">or</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowAuth(true);
                    setIsSignUp(false);
                  }}
                  className="w-full py-3 border border-border rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Sign In to Existing Account
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowAuth(false)}
                className="flex items-center gap-2 text-muted hover:text-dark mb-6"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-dark">
                  {isSignUp ? 'Create your account' : 'Sign in'}
                </h2>
                <p className="text-muted mt-1">
                  to join {inviteInfo?.org_name}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              {isSignUp ? (
                <SignUp
                  routing="hash"
                  afterSignUpUrl={`/invite/${inviteToken}`}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border border-border rounded-xl bg-white p-6",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      formButtonPrimary: "bg-dark hover:opacity-90 rounded-full",
                      footerActionLink: "text-dark hover:text-dark/80",
                      formFieldInput: "rounded-lg border-border",
                      formFieldLabel: "text-xs uppercase tracking-widest text-muted font-medium",
                      footer: "hidden",
                    }
                  }}
                />
              ) : (
                <SignIn
                  routing="hash"
                  afterSignInUrl={`/invite/${inviteToken}`}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border border-border rounded-xl bg-white p-6",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      formButtonPrimary: "bg-dark hover:opacity-90 rounded-full",
                      footerActionLink: "text-dark hover:text-dark/80",
                      formFieldInput: "rounded-lg border-border",
                      formFieldLabel: "text-xs uppercase tracking-widest text-muted font-medium",
                      footer: "hidden",
                    }
                  }}
                />
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted hover:text-dark"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
