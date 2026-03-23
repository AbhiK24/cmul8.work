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
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-muted hover:text-dark transition-colors border border-border rounded-full px-4 py-2 hover:bg-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              Enterprise
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-dark tracking-tight leading-tight mb-6">
            The workplace is a simulation.<br/>
            <span className="text-muted">Now you can practice it.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
            Step into realistic work scenarios with AI colleagues who push back, get frustrated, and test your limits. Fail safely. Learn fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-accent text-white px-8 py-4 rounded-full text-base font-medium hover:opacity-85 transition-all hover:-translate-y-0.5 shadow-lg shadow-dark/20"
            >
              Start Practicing Free →
            </Link>
          </div>
          <p className="text-sm text-muted mt-4">No credit card required</p>
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

      {/* Testimonials */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-border">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-dark text-sm mb-4 leading-relaxed">"I bombed my first PM interview. After 3 WorkSim sessions, I walked into Google confident. Got the offer."</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">AK</div>
                <div>
                  <p className="text-sm font-medium text-dark">Arun K.</p>
                  <p className="text-xs text-muted">PM at Google</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-dark text-sm mb-4 leading-relaxed">"The 'difficult conversations' track changed how I give feedback. My team actually thanks me for reviews now."</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">SM</div>
                <div>
                  <p className="text-sm font-medium text-dark">Sarah M.</p>
                  <p className="text-xs text-muted">Engineering Manager</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-dark text-sm mb-4 leading-relaxed">"Practiced negotiating my raise here first. Asked for 20% more than I planned. Got it."</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-medium">JL</div>
                <div>
                  <p className="text-sm font-medium text-dark">James L.</p>
                  <p className="text-xs text-muted">Senior Designer</p>
                </div>
              </div>
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
          <div className="flex items-center gap-3">
            <a
              href="https://www.cmul8.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted border border-border rounded-full px-4 py-2 hover:text-dark hover:bg-gray-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              cmul8.com
            </a>
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-muted border border-border rounded-full px-4 py-2 hover:text-dark hover:bg-gray-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              Enterprise
            </Link>
            <a
              href="mailto:hello@cmul8.com"
              className="flex items-center gap-2 text-sm text-muted border border-border rounded-full px-4 py-2 hover:text-dark hover:bg-gray-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
