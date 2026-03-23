import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);

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

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-dark">
              {isLogin ? 'Enterprise Login' : 'Get started'}
            </h2>
            <p className="text-sm text-muted mt-1">
              {isLogin ? 'Sign in with your work email' : 'Create your enterprise account'}
            </p>
          </div>

          {/* Work email notice */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Work email required. Personal emails (Gmail, Yahoo, etc.) are not accepted for enterprise accounts.</span>
            </div>
          </div>

          {isLogin ? (
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/login"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-border rounded-xl bg-white p-6",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "hidden", // Hide social login for enterprise
                  socialButtonsBlockButtonArrow: "hidden",
                  dividerRow: "hidden", // Hide "or" divider
                  formButtonPrimary: "bg-dark hover:opacity-90 rounded-full",
                  footerActionLink: "text-dark hover:text-dark/80",
                  formFieldInput: "rounded-lg border-border",
                  formFieldLabel: "text-xs uppercase tracking-widest text-muted font-medium",
                  identityPreviewEditButton: "text-dark",
                  formResendCodeLink: "text-dark",
                  footer: "hidden",
                }
              }}
            />
          ) : (
            <SignUp
              routing="path"
              path="/login"
              signInUrl="/login"
              afterSignUpUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-border rounded-xl bg-white p-6",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "hidden", // Hide social login for enterprise
                  socialButtonsBlockButtonArrow: "hidden",
                  dividerRow: "hidden", // Hide "or" divider
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
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted hover:text-dark transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted mb-2">Looking to practice soft skills?</p>
            <Link
              to="/signup"
              className="text-sm text-dark font-medium hover:underline"
            >
              Sign up for free individual practice →
            </Link>
          </div>

          <p className="text-xs text-muted text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
