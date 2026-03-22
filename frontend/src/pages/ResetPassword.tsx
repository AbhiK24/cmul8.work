import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { auth, ApiError } from '../api/client';
import Logo from '../components/Logo';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await auth.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <Logo linkTo="" size="lg" />
          </div>
          <p className="text-sm text-muted">Set a new password</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-8">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-dark/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Password reset</h3>
              <p className="text-sm text-muted mb-6">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <Link
                to="/login"
                className="text-sm text-muted hover:text-dark transition-colors"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-surface border border-border rounded-lg text-sm text-dark">
                  {error}
                </div>
              )}

              {!token ? (
                <div className="text-center">
                  <p className="text-sm text-muted mb-6">
                    This reset link is invalid or has expired.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-block bg-dark text-white py-3 px-6 rounded-full font-medium text-sm hover:opacity-85 transition-all duration-200"
                  >
                    Request new link
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 bg-dark text-white py-3 px-4 rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {isLoading ? 'Resetting...' : 'Reset password'}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center text-sm">
                <Link
                  to="/login"
                  className="text-muted hover:text-dark transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
