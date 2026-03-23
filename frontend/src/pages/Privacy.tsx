import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="px-6 py-4 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <svg className="w-7 h-4" viewBox="0 0 28 16" fill="none">
              <path d="M7 8c0-2.5 2-4.5 4.5-4.5S16 5.5 16 8s-2 4.5-4.5 4.5S7 10.5 7 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M12 8c0-2.5 2-4.5 4.5-4.5S21 5.5 21 8s-2 4.5-4.5 4.5S12 10.5 12 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <line x1="1" y1="8" x2="27" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
              <polygon points="25,6 27,8 25,10" fill="currentColor"/>
            </svg>
            <span className="font-semibold text-dark tracking-tight">WorkSim</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-dark mb-8">Privacy Policy</h1>
        <p className="text-muted mb-6">Last updated: March 23, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-dark mb-3">1. Introduction</h2>
            <p className="text-muted leading-relaxed">
              WorkSim ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered workplace simulation platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark mb-3">2. Information We Collect</h2>
            <p className="text-muted leading-relaxed mb-3">We collect information you provide directly to us:</p>
            <ul className="list-disc pl-6 text-muted space-y-2">
              <li>Account information (name, email address)</li>
              <li>Profile information from social login providers (Google, LinkedIn)</li>
              <li>Simulation responses and interactions</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark mb-3">3. How We Use Your Information</h2>
            <p className="text-muted leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-muted space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Generate personalized feedback and reports</li>
              <li>Communicate with you about our services</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark mb-3">4. Information Sharing</h2>
            <p className="text-muted leading-relaxed">
              We do not sell your personal information. We may share your information with third-party service providers who assist us in operating our platform (e.g., authentication services, cloud hosting). These providers are bound by contractual obligations to keep personal information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark mb-3">5. Data Security</h2>
            <p className="text-muted leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark mb-3">6. Your Rights</h2>
            <p className="text-muted leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark mb-3">7. Third-Party Services</h2>
            <p className="text-muted leading-relaxed">
              Our platform integrates with third-party authentication providers (Google, LinkedIn). When you sign in using these services, you are subject to their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark mb-3">8. Contact Us</h2>
            <p className="text-muted leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@cmul8.work.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
