import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <nav className="px-6 py-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <svg className="w-7 h-4" viewBox="0 0 28 16" fill="none">
              <path d="M7 8c0-2.5 2-4.5 4.5-4.5S16 5.5 16 8s-2 4.5-4.5 4.5S7 10.5 7 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M12 8c0-2.5 2-4.5 4.5-4.5S21 5.5 21 8s-2 4.5-4.5 4.5S12 10.5 12 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <line x1="1" y1="8" x2="27" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
              <polygon points="25,6 27,8 25,10" fill="currentColor"/>
            </svg>
            <span className="font-semibold text-dark tracking-tight">WorkSim</span>
          </Link>
          <Link
            to="/signin"
            className="text-sm text-muted hover:text-dark transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-dark mb-2">
              Start practicing
            </h1>
            <p className="text-muted">
              Free access to all scenarios. No credit card needed.
            </p>
          </div>

          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/signin"
            afterSignUpUrl="/practice"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "shadow-none border border-border rounded-2xl bg-white",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-border hover:bg-gray-50 rounded-xl",
                socialButtonsBlockButtonText: "font-medium",
                formButtonPrimary: "bg-dark hover:opacity-90 rounded-xl",
                footerActionLink: "text-dark hover:text-dark/80",
                formFieldInput: "rounded-xl border-border",
                dividerLine: "bg-border",
                dividerText: "text-muted",
              }
            }}
          />

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-dark font-medium hover:underline">
              Sign in →
            </Link>
          </p>

          {/* Benefits */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <p className="text-xs text-muted">Unlimited practice</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
              </div>
              <p className="text-xs text-muted">Track progress</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <p className="text-xs text-muted">Real feedback</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
