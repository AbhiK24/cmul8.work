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
            <a href="#pricing" className="text-muted hover:text-dark transition-colors text-sm hidden sm:block">
              Pricing
            </a>
            <Link to="/login" className="text-muted hover:text-dark transition-colors text-sm">
              Enterprise Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Career skills, pressure-tested</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-dark tracking-tight leading-tight mb-6">
            Nail the satisfactory interview.
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
            Practice difficult conversations, high-pressure negotiations, and critical feedback—with AI that pushes back. Like the real thing, minus the consequences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-accent text-white px-8 py-4 rounded-full text-base font-medium hover:opacity-85 transition-all hover:-translate-y-0.5"
            >
              Start Practicing Free
            </Link>
          </div>
          <p className="text-sm text-muted mt-4">No credit card required. 2 free simulations.</p>
        </div>
      </section>

      {/* Chaotic Simulation Demo */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-2xl p-6 md:p-10 aspect-[16/10] relative overflow-hidden border border-border">

            {/* Stress indicators - red pulses */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs text-red-600 font-medium">3 urgent</span>
            </div>

            {/* Timer pressure */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-white border border-border px-3 py-1.5 rounded-full">
              <svg className="w-4 h-4 text-dark/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-dark/80 font-mono">14:32</span>
            </div>

            {/* Central user - stressed */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* Overwhelm rings */}
                <div className="absolute inset-0 -m-6 border-2 border-red-300/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 -m-12 border border-orange-200/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />

                {/* User */}
                <div className="w-14 h-14 bg-white rounded-full border-2 border-dark/20 flex items-center justify-center shadow-lg relative z-10">
                  <span className="text-lg">You</span>
                </div>
              </div>
            </div>

            {/* Incoming messages - chaotic positioning */}
            <div className="absolute top-16 left-8 bg-white rounded-xl px-4 py-3 shadow-md border border-border max-w-48 animate-bounce" style={{ animationDuration: '2s' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-medium text-red-600">VP</div>
                <span className="text-xs font-medium text-dark">Sarah Chen</span>
              </div>
              <p className="text-xs text-dark/70">"I need this by EOD. No exceptions."</p>
            </div>

            <div className="absolute top-24 right-12 bg-white rounded-xl px-4 py-3 shadow-md border border-border max-w-44 animate-bounce" style={{ animationDuration: '2.3s', animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">PM</div>
                <span className="text-xs font-medium text-dark">Mike Ross</span>
              </div>
              <p className="text-xs text-dark/70">"Can we sync? This is blocking launch."</p>
            </div>

            <div className="absolute bottom-28 left-16 bg-white rounded-xl px-4 py-3 shadow-md border border-orange-200 max-w-52 animate-bounce" style={{ animationDuration: '1.8s', animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-medium text-orange-600">DR</div>
                <span className="text-xs font-medium text-dark">Priya Sharma</span>
                <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">frustrated</span>
              </div>
              <p className="text-xs text-dark/70">"You said you'd review this yesterday..."</p>
            </div>

            <div className="absolute bottom-20 right-8 bg-white rounded-xl px-4 py-3 shadow-md border border-border max-w-48 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.8s' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">CL</div>
                <span className="text-xs font-medium text-dark">Acme Corp</span>
              </div>
              <p className="text-xs text-dark/70">"We're reconsidering the contract..."</p>
            </div>

            {/* Task pile indicator */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="flex -space-x-1">
                <div className="w-5 h-6 bg-yellow-100 border border-yellow-200 rounded shadow-sm" />
                <div className="w-5 h-6 bg-yellow-50 border border-yellow-200 rounded shadow-sm" />
                <div className="w-5 h-6 bg-white border border-border rounded shadow-sm" />
              </div>
              <span className="text-xs text-muted">+5 tasks pending</span>
            </div>

            {/* Your response area */}
            <div className="absolute bottom-4 right-4 left-32 bg-white border border-dark/20 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark/40">How do you respond?</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-dark/30 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-dark/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 bg-dark/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted mt-4">Real scenarios. Real pressure. Safe environment.</p>
        </div>
      </section>

      {/* Social Proof - quick stats */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div>
              <p className="text-3xl font-medium text-dark">10k+</p>
              <p className="text-sm text-muted">Simulations run</p>
            </div>
            <div>
              <p className="text-3xl font-medium text-dark">89%</p>
              <p className="text-sm text-muted">Feel more prepared</p>
            </div>
            <div>
              <p className="text-3xl font-medium text-dark">4.8/5</p>
              <p className="text-sm text-muted">User rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Practice */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-4 tracking-tight">
            Practice what actually matters
          </h2>
          <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
            The skills that make or break careers. Not theory—actual practice.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="font-medium text-dark mb-2">Interview Prep</h3>
              <p className="text-sm text-muted mb-4">PM, consulting, leadership interviews. Get grilled by AI interviewers who've seen it all.</p>
              <span className="text-xs text-muted">6 scenarios</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">💬</div>
              <h3 className="font-medium text-dark mb-2">Difficult Conversations</h3>
              <p className="text-sm text-muted mb-4">Giving feedback, saying no, managing up. The conversations everyone avoids.</p>
              <span className="text-xs text-muted">5 scenarios</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-medium text-dark mb-2">Pressure Management</h3>
              <p className="text-sm text-muted mb-4">Competing deadlines, angry stakeholders, impossible asks. Stay cool when it counts.</p>
              <span className="text-xs text-muted">4 scenarios</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">🤝</div>
              <h3 className="font-medium text-dark mb-2">Stakeholder Management</h3>
              <p className="text-sm text-muted mb-4">Navigate competing interests, build alignment, manage expectations.</p>
              <span className="text-xs text-muted">4 scenarios</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">📈</div>
              <h3 className="font-medium text-dark mb-2">Leadership Moments</h3>
              <p className="text-sm text-muted mb-4">First-time manager challenges. Team conflict. Performance issues.</p>
              <span className="text-xs text-muted">5 scenarios</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">💰</div>
              <h3 className="font-medium text-dark mb-2">Negotiation</h3>
              <p className="text-sm text-muted mb-4">Salary talks, vendor deals, resource allocation. Get what you need.</p>
              <span className="text-xs text-muted">3 scenarios</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-12 tracking-tight">
            Three steps. Real skills.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-dark text-white flex items-center justify-center font-medium">1</div>
              <h3 className="font-medium text-dark mb-2">Pick a scenario</h3>
              <p className="text-sm text-muted">Choose what you want to practice. Interview prep? Tough feedback? We've got it.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-dark text-white flex items-center justify-center font-medium">2</div>
              <h3 className="font-medium text-dark mb-2">Face the pressure</h3>
              <p className="text-sm text-muted">AI colleagues with real personalities. They'll push back, get frustrated, and test your limits.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-dark text-white flex items-center justify-center font-medium">3</div>
              <h3 className="font-medium text-dark mb-2">Get actionable feedback</h3>
              <p className="text-sm text-muted">Detailed report on what worked, what didn't, and exactly how to improve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-4 tracking-tight">
            Simple pricing
          </h2>
          <p className="text-muted text-center mb-12">Start free. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-border">
              <h3 className="text-lg font-medium text-dark mb-2">Free</h3>
              <p className="text-3xl font-medium text-dark mb-4">$0<span className="text-base text-muted font-normal">/forever</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-muted">
                  <svg className="w-4 h-4 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  2 practice simulations
                </li>
                <li className="flex items-center gap-2 text-sm text-muted">
                  <svg className="w-4 h-4 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Basic feedback report
                </li>
                <li className="flex items-center gap-2 text-sm text-muted">
                  <svg className="w-4 h-4 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  All scenario types
                </li>
              </ul>
              <Link to="/signup" className="block w-full text-center border border-border text-dark px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors">
                Get Started
              </Link>
            </div>
            <div className="bg-dark p-8 rounded-2xl text-white relative">
              <div className="absolute -top-3 right-6 bg-white text-dark text-xs font-medium px-3 py-1 rounded-full">Popular</div>
              <h3 className="text-lg font-medium mb-2">Pro</h3>
              <p className="text-3xl font-medium mb-4">$19<span className="text-base text-white/60 font-normal">/month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited simulations
                </li>
                <li className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Deep-dive feedback reports
                </li>
                <li className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Progress tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Shareable certificates
                </li>
              </ul>
              <Link to="/signup?plan=pro" className="block w-full text-center bg-white text-dark px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
                Start Free Trial
              </Link>
            </div>
          </div>
          <p className="text-center text-sm text-muted mt-8">
            Enterprise team? <Link to="/login" className="text-dark underline">Contact us</Link> for volume pricing.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-surface to-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-dark mb-4 tracking-tight">
            Your next big moment is coming.
          </h2>
          <p className="text-lg text-muted mb-8">Be ready.</p>
          <Link
            to="/signup"
            className="inline-block bg-accent text-white px-8 py-4 rounded-full text-base font-medium hover:opacity-85 transition-all hover:-translate-y-0.5"
          >
            Start Practicing Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-white">
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
            <Link to="/login" className="hover:text-dark transition-colors">Enterprise</Link>
            <a href="mailto:hello@cmul8.com" className="hover:text-dark transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
