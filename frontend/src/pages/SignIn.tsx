import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function SignInPage() {
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
            to="/signup"
            className="text-sm text-muted hover:text-dark transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-dark mb-2">
              Welcome back
            </h1>
            <p className="text-muted">
              Sign in to continue practicing
            </p>
          </div>

          <SignIn
            routing="path"
            path="/signin"
            signUpUrl="/signup"
            afterSignInUrl="/practice"
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
            Don't have an account?{' '}
            <Link to="/signup" className="text-dark font-medium hover:underline">
              Sign up free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
