import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-4" />
            <span className="font-medium text-dark">WorkSim</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://www.cmul8.com" className="text-muted hover:text-dark transition-colors text-sm">
              cmul8
            </a>
            <Link
              to="/login"
              className="bg-accent text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-85 transition-opacity"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-dark tracking-tight leading-tight mb-6">
            See how candidates actually perform.
            <span className="block text-muted">Before you hire.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Candidates navigate realistic workplace scenarios with AI colleagues.
            Watch them handle pressure, conflict, and collaboration in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-accent text-white px-8 py-4 rounded-full text-base font-medium hover:opacity-85 transition-all hover:-translate-y-0.5"
            >
              Start Free Trial
            </Link>
            <a
              href="mailto:hello@cmul8.com?subject=WorkSim Demo"
              className="border border-border text-dark px-8 py-4 rounded-full text-base font-medium hover:bg-white transition-all"
            >
              Request Demo
            </a>
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card-dark rounded-2xl p-8 md:p-12 aspect-video flex items-center justify-center relative overflow-hidden">
            {/* Simulated chat interface preview */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-8 left-8 w-48 h-3 bg-white/30 rounded" />
              <div className="absolute top-14 left-8 w-32 h-3 bg-white/20 rounded" />
              <div className="absolute top-24 right-8 w-56 h-3 bg-white/30 rounded" />
              <div className="absolute top-30 right-8 w-40 h-3 bg-white/20 rounded" />
              <div className="absolute bottom-24 left-8 w-64 h-3 bg-white/30 rounded" />
              <div className="absolute bottom-16 left-8 w-48 h-3 bg-white/20 rounded" />
            </div>
            <div className="text-center z-10">
              <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/80 text-sm">Live Simulation</span>
              </div>
              <p className="text-white/60 text-sm max-w-md">
                Candidates interact with AI coworkers in scenarios tailored to your role
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-16 tracking-tight">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-accent/5 flex items-center justify-center">
                <span className="text-lg font-medium text-dark">1</span>
              </div>
              <h3 className="text-lg font-medium text-dark mb-3">Define the scenario</h3>
              <p className="text-muted leading-relaxed">
                Choose a role and workplace situation. We'll create AI colleagues with realistic personalities and agendas.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-accent/5 flex items-center justify-center">
                <span className="text-lg font-medium text-dark">2</span>
              </div>
              <h3 className="text-lg font-medium text-dark mb-3">Send to candidates</h3>
              <p className="text-muted leading-relaxed">
                Each candidate gets a unique link. They navigate the scenario at their own pace, no scheduling needed.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-accent/5 flex items-center justify-center">
                <span className="text-lg font-medium text-dark">3</span>
              </div>
              <h3 className="text-lg font-medium text-dark mb-3">Review insights</h3>
              <p className="text-muted leading-relaxed">
                Get detailed reports on communication style, decision-making, and how they handled key moments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-16 tracking-tight">
            Beyond the resume
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl border border-border">
              <div className="w-10 h-10 mb-4 rounded-lg bg-accent/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Realistic scenarios</h3>
              <p className="text-muted leading-relaxed">
                AI colleagues with distinct personalities, priorities, and communication styles. Just like the real workplace.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-border">
              <div className="w-10 h-10 mb-4 rounded-lg bg-accent/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Structured insights</h3>
              <p className="text-muted leading-relaxed">
                Objective reports on key competencies. Compare candidates on the dimensions that matter for the role.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-border">
              <div className="w-10 h-10 mb-4 rounded-lg bg-accent/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Async & scalable</h3>
              <p className="text-muted leading-relaxed">
                No interviews to schedule. Candidates complete simulations on their time. Screen hundreds without burning out your team.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-border">
              <div className="w-10 h-10 mb-4 rounded-lg bg-accent/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Bias-reduced</h3>
              <p className="text-muted leading-relaxed">
                Everyone gets the same scenario. Evaluation based on behavior, not background or interview chemistry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-4 tracking-tight">
            Built for high-stakes roles
          </h2>
          <p className="text-muted text-center mb-16 max-w-2xl mx-auto">
            Where the cost of a bad hire is measured in months, not days.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Product Managers', 'Engineering Leads', 'Customer Success', 'Sales', 'Operations', 'People Managers'].map((role) => (
              <span key={role} className="px-5 py-2.5 bg-white border border-border rounded-full text-dark text-sm">
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-card-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-6 tracking-tight">
            Stop guessing. Start seeing.
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Join teams using WorkSim to make better hiring decisions, faster.
          </p>
          <Link
            to="/login"
            className="inline-block bg-white text-dark px-8 py-4 rounded-full text-base font-medium hover:opacity-90 transition-all hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-3.5" />
            <span className="text-muted text-sm">WorkSim by cmul8</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="https://www.cmul8.com" className="hover:text-dark transition-colors">cmul8.com</a>
            <a href="mailto:hello@cmul8.com" className="hover:text-dark transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
