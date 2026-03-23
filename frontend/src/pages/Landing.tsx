import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <svg className="w-7 h-4" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 8c0-2.5 2-4.5 4.5-4.5S16 5.5 16 8s-2 4.5-4.5 4.5S7 10.5 7 8z"/>
              <path d="M12 8c0-2.5 2-4.5 4.5-4.5S21 5.5 21 8s-2 4.5-4.5 4.5S12 10.5 12 8z"/>
            </svg>
            <span className="font-semibold text-dark tracking-tight">WorkSim</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="https://www.cmul8.com" className="text-muted hover:text-dark transition-colors text-sm hidden sm:block">
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
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-dark tracking-tight leading-tight mb-6">
            Simulate work. Build skills.
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-xl mx-auto mb-10">
            AI-powered workplace scenarios for training, assessment, and growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-accent text-white px-8 py-4 rounded-full text-base font-medium hover:opacity-85 transition-all hover:-translate-y-0.5"
            >
              Get Started
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

      {/* Animated Demo Section */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 md:p-12 aspect-video relative overflow-hidden border border-border">
            {/* Animated simulation visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Center user node */}
              <div className="relative">
                {/* Pulsing rings */}
                <div className="absolute inset-0 -m-8 border-2 border-dark/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 -m-16 border border-dark/5 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />

                {/* Center avatar */}
                <div className="w-16 h-16 bg-white rounded-full border-2 border-dark/20 flex items-center justify-center shadow-lg z-10 relative">
                  <svg className="w-8 h-8 text-dark/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                </div>

                {/* AI Colleague nodes orbiting */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDuration: '2s' }}>
                  <div className="bg-white rounded-xl px-4 py-2 shadow-md border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-dark/10 rounded-full flex items-center justify-center text-xs">M</div>
                      <span className="text-sm text-dark/80">Manager</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-dark/10 mx-auto" />
                </div>

                <div className="absolute -left-32 top-1/2 -translate-y-1/2 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}>
                  <div className="bg-white rounded-xl px-4 py-2 shadow-md border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-dark/10 rounded-full flex items-center justify-center text-xs">P</div>
                      <span className="text-sm text-dark/80">Peer</span>
                    </div>
                  </div>
                  <div className="w-8 h-px bg-dark/10 absolute -right-8 top-1/2" />
                </div>

                <div className="absolute -right-32 top-1/2 -translate-y-1/2 animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0.6s' }}>
                  <div className="bg-white rounded-xl px-4 py-2 shadow-md border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-dark/10 rounded-full flex items-center justify-center text-xs">C</div>
                      <span className="text-sm text-dark/80">Client</span>
                    </div>
                  </div>
                  <div className="w-8 h-px bg-dark/10 absolute -left-8 top-1/2" />
                </div>

                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '0.9s' }}>
                  <div className="w-px h-8 bg-dark/10 mx-auto" />
                  <div className="bg-white rounded-xl px-4 py-2 shadow-md border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-dark/10 rounded-full flex items-center justify-center text-xs">R</div>
                      <span className="text-sm text-dark/80">Report</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chat bubbles */}
            <div className="absolute top-8 left-8 bg-white rounded-lg px-4 py-2 shadow-sm border border-border animate-pulse" style={{ animationDuration: '3s' }}>
              <p className="text-xs text-dark/60">"Can we discuss the deadline?"</p>
            </div>
            <div className="absolute bottom-8 right-8 bg-dark text-white rounded-lg px-4 py-2 shadow-sm animate-pulse" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>
              <p className="text-xs">"I'd like to propose..."</p>
            </div>

            {/* Label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <span className="text-xs text-muted">Interactive workplace simulation</span>
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
              <h3 className="text-lg font-medium text-dark mb-3">Design the scenario</h3>
              <p className="text-muted leading-relaxed">
                Choose a workplace situation—feedback conversations, team conflicts, client negotiations. We create AI colleagues with realistic personalities.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-accent/5 flex items-center justify-center">
                <span className="text-lg font-medium text-dark">2</span>
              </div>
              <h3 className="text-lg font-medium text-dark mb-3">Run the simulation</h3>
              <p className="text-muted leading-relaxed">
                Participants get a unique link. They navigate the scenario at their own pace—no scheduling, no pressure.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-accent/5 flex items-center justify-center">
                <span className="text-lg font-medium text-dark">3</span>
              </div>
              <h3 className="text-lg font-medium text-dark mb-3">Learn from insights</h3>
              <p className="text-muted leading-relaxed">
                Detailed reports on communication patterns, decision-making, and how they handled critical moments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-16 tracking-tight">
            Why simulate?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl border border-border">
              <div className="w-10 h-10 mb-4 rounded-lg bg-accent/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Safe to fail</h3>
              <p className="text-muted leading-relaxed">
                Practice difficult conversations, make mistakes, and learn—without real-world consequences.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-border">
              <div className="w-10 h-10 mb-4 rounded-lg bg-accent/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Actionable insights</h3>
              <p className="text-muted leading-relaxed">
                Detailed reports on communication patterns, blind spots, and growth areas. Not just scores—real feedback.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-border">
              <div className="w-10 h-10 mb-4 rounded-lg bg-accent/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">On-demand</h3>
              <p className="text-muted leading-relaxed">
                No scheduling, no coordination. Run simulations anytime, anywhere. Scale training without scaling overhead.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-border">
              <div className="w-10 h-10 mb-4 rounded-lg bg-accent/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">Realistic complexity</h3>
              <p className="text-muted leading-relaxed">
                AI colleagues with distinct personalities, agendas, and communication styles. Just like the real workplace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-4 tracking-tight">
            Use cases
          </h2>
          <p className="text-muted text-center mb-16 max-w-2xl mx-auto">
            From hiring to training to everyday skill-building.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Candidate Assessment', 'Manager Training', 'Difficult Conversations', 'Onboarding', 'Leadership Development', 'Sales Roleplay', 'Performance Reviews', 'Conflict Resolution'].map((useCase) => (
              <span key={useCase} className="px-5 py-2.5 bg-white border border-border rounded-full text-dark text-sm">
                {useCase}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-card-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-6 tracking-tight">
            Practice makes ready.
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Build skills for moments that matter. Train, assess, and grow—all in simulation.
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
            <svg className="w-6 h-3.5" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 8c0-2.5 2-4.5 4.5-4.5S16 5.5 16 8s-2 4.5-4.5 4.5S7 10.5 7 8z"/>
              <path d="M12 8c0-2.5 2-4.5 4.5-4.5S21 5.5 21 8s-2 4.5-4.5 4.5S12 10.5 12 8z"/>
            </svg>
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
