import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero content */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark text-white p-12 flex-col justify-between">
        <div>
          <Logo linkTo="" size="lg" className="brightness-0 invert" />
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl font-bold leading-tight mb-6">
            See how candidates actually work.
            <br />
            <span className="text-white/70">Not how they interview.</span>
          </h1>

          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            WorkSim drops candidates into realistic work scenarios with AI colleagues,
            competing priorities, and real pressure. In 45 minutes, you see what months
            of onboarding would reveal.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI teammates with real personalities</h3>
                <p className="text-sm text-white/60">Navigate a difficult stakeholder, manage up, collaborate with peers</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Task-driven assessment</h3>
                <p className="text-sm text-white/60">Real deliverables, not hypotheticals. Gather info, make tradeoffs, ship work.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Behavioral insights that matter</h3>
                <p className="text-sm text-white/60">9 dimensions scored with evidence. Agent debriefs. Suggested interview questions.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>45-min simulations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>Role-specific scenarios</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>Instant reports</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex justify-center mb-3">
              <Logo linkTo="" size="lg" />
            </div>
            <p className="text-sm text-muted">
              Work simulation for hiring
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-dark">
              {isLogin ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-sm text-muted mt-1">
              {isLogin ? 'Sign in to your account' : 'Create your account to start assessing'}
            </p>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark/10 focus:border-dark/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-widest text-muted font-medium">
                    Password
                  </label>
                  {isLogin && (
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted hover:text-dark transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark/10 focus:border-dark/40"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-dark text-white py-3 px-4 rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : isLogin ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-muted hover:text-dark transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>

          <p className="text-xs text-muted text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
