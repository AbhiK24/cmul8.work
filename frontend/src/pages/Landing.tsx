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
            Soft skills separate leaders from everyone else.<br/>
            <span className="text-muted">You can't learn them from a book.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
            Step into high-stakes work scenarios that test how you handle pressure, conflict, and ambiguity. Get real feedback. Build real skills.
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

            {/* Orbiting work artifacts */}
            <style>{`
              @keyframes orbit1 { from { transform: rotate(0deg) translateX(140px) rotate(0deg); } to { transform: rotate(360deg) translateX(140px) rotate(-360deg); } }
              @keyframes orbit2 { from { transform: rotate(120deg) translateX(160px) rotate(-120deg); } to { transform: rotate(480deg) translateX(160px) rotate(-480deg); } }
              @keyframes orbit3 { from { transform: rotate(240deg) translateX(130px) rotate(-240deg); } to { transform: rotate(600deg) translateX(130px) rotate(-600deg); } }
              @keyframes orbit4 { from { transform: rotate(60deg) translateX(180px) rotate(-60deg); } to { transform: rotate(420deg) translateX(180px) rotate(-420deg); } }
              @keyframes orbit5 { from { transform: rotate(180deg) translateX(150px) rotate(-180deg); } to { transform: rotate(540deg) translateX(150px) rotate(-540deg); } }
              @keyframes orbit6 { from { transform: rotate(300deg) translateX(170px) rotate(-300deg); } to { transform: rotate(660deg) translateX(170px) rotate(-660deg); } }
              @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            `}</style>

            {/* Stress indicators - red pulses */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs text-red-600 font-medium">3 urgent</span>
            </div>

            {/* Timer pressure */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-white border border-border px-3 py-1.5 rounded-full shadow-sm">
              <svg className="w-4 h-4 text-dark/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-dark/80 font-mono">14:32</span>
            </div>

            {/* Central user */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* User */}
                <div className="w-16 h-16 bg-white rounded-full border-2 border-dark/20 flex items-center justify-center shadow-xl relative z-10">
                  <span className="text-base font-medium text-dark">You</span>
                </div>

                {/* Orbiting Slack ping */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit1 12s linear infinite' }}>
                  <div className="bg-[#4A154B] text-white px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
                    <span className="text-[10px] font-medium">@you</span>
                  </div>
                </div>

                {/* Orbiting calendar invite */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit2 15s linear infinite' }}>
                  <div className="bg-blue-500 text-white px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    <span className="text-[10px] font-medium">in 5 min</span>
                  </div>
                </div>

                {/* Orbiting doc */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit3 18s linear infinite' }}>
                  <div className="bg-white border border-border px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M14.2 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7.8L14.2 2zM6 20V4h7v4h5v12H6z"/></svg>
                    <span className="text-[10px] font-medium text-dark">Review</span>
                  </div>
                </div>

                {/* Orbiting reminder */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit4 14s linear infinite' }}>
                  <div className="bg-amber-500 text-white px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    <span className="text-[10px] font-medium">Overdue</span>
                  </div>
                </div>

                {/* Orbiting email */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit5 16s linear infinite' }}>
                  <div className="bg-red-500 text-white px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    <span className="text-[10px] font-medium">Re: URGENT</span>
                  </div>
                </div>

                {/* Orbiting task */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit6 20s linear infinite' }}>
                  <div className="bg-green-500 text-white px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-medium">Due today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating message cards */}
            <div className="absolute top-16 left-6 bg-white rounded-xl px-4 py-3 shadow-lg border border-border max-w-48" style={{ animation: 'float 3s ease-in-out infinite' }}>
              <div className="flex items-center gap-2 mb-1">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=sarah" className="w-6 h-6 rounded-full bg-gray-100" alt="" />
                <span className="text-xs font-medium text-dark">Sarah Chen</span>
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">VP</span>
              </div>
              <p className="text-xs text-dark/70">"I need this by EOD. No exceptions."</p>
            </div>

            <div className="absolute top-20 right-8 bg-white rounded-xl px-4 py-3 shadow-lg border border-border max-w-44" style={{ animation: 'float 3.5s ease-in-out infinite', animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 mb-1">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=mike" className="w-6 h-6 rounded-full bg-gray-100" alt="" />
                <span className="text-xs font-medium text-dark">Mike Ross</span>
              </div>
              <p className="text-xs text-dark/70">"This is blocking launch."</p>
            </div>

            <div className="absolute bottom-24 left-12 bg-white rounded-xl px-4 py-3 shadow-lg border border-orange-200 max-w-52" style={{ animation: 'float 2.8s ease-in-out infinite', animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-1">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=priya" className="w-6 h-6 rounded-full bg-gray-100" alt="" />
                <span className="text-xs font-medium text-dark">Priya Sharma</span>
                <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">waiting</span>
              </div>
              <p className="text-xs text-dark/70">"Still waiting on your review..."</p>
            </div>

            <div className="absolute bottom-16 right-6 bg-white rounded-xl px-4 py-3 shadow-lg border border-border max-w-48" style={{ animation: 'float 3.2s ease-in-out infinite', animationDelay: '0.8s' }}>
              <div className="flex items-center gap-2 mb-1">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=client" className="w-6 h-6 rounded-full bg-gray-100" alt="" />
                <span className="text-xs font-medium text-dark">Acme Corp</span>
              </div>
              <p className="text-xs text-dark/70">"We need to discuss the timeline..."</p>
            </div>

            {/* Your response area */}
            <div className="absolute bottom-4 left-4 right-4 bg-white border-2 border-dark/10 rounded-xl px-4 py-3 shadow-sm">
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
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-medium text-muted uppercase tracking-wider mb-4">What people are saying</p>
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-16 tracking-tight">
            Skills that changed careers
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-2 text-6xl text-gray-100 font-serif">"</div>
              <div className="relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-dark text-base mb-6 leading-relaxed relative z-10">
                  I bombed my first PM interview. After 3 WorkSim sessions, I walked into Google confident. <span className="font-medium">Got the offer.</span>
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src="https://api.dicebear.com/7.x/notionists/svg?seed=arun&backgroundColor=c0aede"
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    alt="Arun K."
                  />
                  <div>
                    <p className="font-medium text-dark">Arun K.</p>
                    <p className="text-sm text-muted">Product Manager</p>
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      <span className="text-xs text-muted">Google</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="relative md:mt-8">
              <div className="absolute -top-4 -left-2 text-6xl text-gray-100 font-serif">"</div>
              <div className="relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-dark text-base mb-6 leading-relaxed relative z-10">
                  The difficult conversations track changed how I give feedback. <span className="font-medium">My team actually thanks me for reviews now.</span>
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src="https://api.dicebear.com/7.x/notionists/svg?seed=sarah-eng&backgroundColor=b6e3f4"
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    alt="Sarah M."
                  />
                  <div>
                    <p className="font-medium text-dark">Sarah M.</p>
                    <p className="text-sm text-muted">Engineering Manager</p>
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF9900"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/></svg>
                      <span className="text-xs text-muted">Amazon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-2 text-6xl text-gray-100 font-serif">"</div>
              <div className="relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-dark text-base mb-6 leading-relaxed relative z-10">
                  Practiced negotiating my raise here first. Asked for 20% more than I planned. <span className="font-medium">Got it.</span>
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src="https://api.dicebear.com/7.x/notionists/svg?seed=james-design&backgroundColor=d1d4f9"
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    alt="James L."
                  />
                  <div>
                    <p className="font-medium text-dark">James L.</p>
                    <p className="text-sm text-muted">Senior Designer</p>
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span className="text-xs text-muted">Meta</span>
                    </div>
                  </div>
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
