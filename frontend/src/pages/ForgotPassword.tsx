import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, ApiError } from '../api/client';
import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await auth.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to send reset email. Please try again.');
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
          <p className="text-sm text-muted">Reset your password</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-8">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-dark/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Check your email</h3>
              <p className="text-sm text-muted mb-6">
                If an account exists for {email}, you'll receive a password reset link.
              </p>
              <Link
                to="/login"
                className="text-sm text-muted hover:text-dark transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-surface border border-border rounded-lg text-sm text-dark">
                  {error}
                </div>
              )}

              <p className="text-sm text-muted mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 bg-dark text-white py-3 px-4 rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

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
