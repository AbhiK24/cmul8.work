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
      <section className="pt-28 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-dark tracking-tight leading-tight mb-5">
            Soft skills separate leaders from everyone else.<br/>
            <span className="text-muted">You can't learn them from a book.</span>
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto mb-8">
            High-stakes scenarios. Real feedback. Skills that stick.
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
      <section className="py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-2xl p-4 md:p-6 aspect-[16/9] relative overflow-hidden border border-border">

            {/* Orbiting work artifacts - tighter, faster */}
            <style>{`
              @keyframes orbit1 { from { transform: rotate(0deg) translateX(85px) rotate(0deg); } to { transform: rotate(360deg) translateX(85px) rotate(-360deg); } }
              @keyframes orbit2 { from { transform: rotate(60deg) translateX(95px) rotate(-60deg); } to { transform: rotate(420deg) translateX(95px) rotate(-420deg); } }
              @keyframes orbit3 { from { transform: rotate(120deg) translateX(80px) rotate(-120deg); } to { transform: rotate(480deg) translateX(80px) rotate(-480deg); } }
              @keyframes orbit4 { from { transform: rotate(180deg) translateX(100px) rotate(-180deg); } to { transform: rotate(540deg) translateX(100px) rotate(-540deg); } }
              @keyframes orbit5 { from { transform: rotate(240deg) translateX(90px) rotate(-240deg); } to { transform: rotate(600deg) translateX(90px) rotate(-600deg); } }
              @keyframes orbit6 { from { transform: rotate(300deg) translateX(105px) rotate(-300deg); } to { transform: rotate(660deg) translateX(105px) rotate(-660deg); } }
              @keyframes orbit7 { from { transform: rotate(30deg) translateX(75px) rotate(-30deg); } to { transform: rotate(390deg) translateX(75px) rotate(-390deg); } }
              @keyframes orbit8 { from { transform: rotate(150deg) translateX(110px) rotate(-150deg); } to { transform: rotate(510deg) translateX(110px) rotate(-510deg); } }
              @keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.02); } }
              @keyframes pulse-border { 0%, 100% { border-color: rgba(239, 68, 68, 0.3); } 50% { border-color: rgba(239, 68, 68, 0.6); } }
            `}</style>

            {/* Stress indicators */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-[10px] text-red-600 font-medium">5 urgent</span>
            </div>

            {/* Timer */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white border border-border px-2 py-1 rounded-full shadow-sm">
              <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] text-red-600 font-mono font-medium">02:47</span>
            </div>

            {/* Central user */}
            <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* Stress ring */}
                <div className="absolute inset-0 -m-3 border-2 border-red-300/40 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />

                {/* User */}
                <div className="w-12 h-12 bg-white rounded-full border-2 border-dark/20 flex items-center justify-center shadow-lg relative z-10">
                  <span className="text-sm font-medium text-dark">You</span>
                </div>

                {/* Orbiting artifacts - faster, tighter */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit1 6s linear infinite' }}>
                  <div className="bg-[#4A154B] text-white px-2 py-1 rounded shadow-md flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/></svg>
                    <span className="text-[9px] font-medium">@you</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit2 7s linear infinite' }}>
                  <div className="bg-blue-500 text-white px-2 py-1 rounded shadow-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
                    <span className="text-[9px] font-medium">NOW</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit3 5s linear infinite' }}>
                  <div className="bg-white border border-gray-200 px-2 py-1 rounded shadow-md flex items-center gap-1">
                    <svg className="w-3 h-3 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M14.2 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7.8L14.2 2z"/></svg>
                    <span className="text-[9px] font-medium text-dark">Doc</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit4 8s linear infinite' }}>
                  <div className="bg-amber-500 text-white px-2 py-1 rounded shadow-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022" /></svg>
                    <span className="text-[9px] font-medium">Late</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit5 6.5s linear infinite' }}>
                  <div className="bg-red-500 text-white px-2 py-1 rounded shadow-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75" /></svg>
                    <span className="text-[9px] font-medium">URGENT</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit6 9s linear infinite' }}>
                  <div className="bg-green-500 text-white px-2 py-1 rounded shadow-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[9px] font-medium">Due</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit7 5.5s linear infinite' }}>
                  <div className="bg-purple-500 text-white px-2 py-1 rounded shadow-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952" /></svg>
                    <span className="text-[9px] font-medium">1:1</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit8 7.5s linear infinite' }}>
                  <div className="bg-pink-500 text-white px-2 py-1 rounded shadow-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372" /></svg>
                    <span className="text-[9px] font-medium">Call</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact floating messages */}
            <div className="absolute top-10 left-3 bg-white rounded-lg px-3 py-2 shadow-md border border-border max-w-36" style={{ animation: 'float 2s ease-in-out infinite' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=sarah" className="w-5 h-5 rounded-full bg-gray-100" alt="" />
                <span className="text-[10px] font-medium text-dark">Sarah</span>
                <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded font-medium">VP</span>
              </div>
              <p className="text-[10px] text-dark/70">"EOD. No exceptions."</p>
            </div>

            <div className="absolute top-8 right-3 bg-white rounded-lg px-3 py-2 shadow-md border border-border max-w-32" style={{ animation: 'float 2.5s ease-in-out infinite', animationDelay: '0.3s' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=mike" className="w-5 h-5 rounded-full bg-gray-100" alt="" />
                <span className="text-[10px] font-medium text-dark">Mike</span>
              </div>
              <p className="text-[10px] text-dark/70">"Blocking launch"</p>
            </div>

            <div className="absolute bottom-14 left-3 bg-white rounded-lg px-3 py-2 shadow-md border-2" style={{ animation: 'float 1.8s ease-in-out infinite, pulse-border 2s ease-in-out infinite', animationDelay: '0.1s' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=priya" className="w-5 h-5 rounded-full bg-gray-100" alt="" />
                <span className="text-[10px] font-medium text-dark">Priya</span>
                <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded">!</span>
              </div>
              <p className="text-[10px] text-dark/70">"Still waiting..."</p>
            </div>

            <div className="absolute bottom-12 right-3 bg-white rounded-lg px-3 py-2 shadow-md border border-border max-w-32" style={{ animation: 'float 2.2s ease-in-out infinite', animationDelay: '0.6s' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=client" className="w-5 h-5 rounded-full bg-gray-100" alt="" />
                <span className="text-[10px] font-medium text-dark">Client</span>
              </div>
              <p className="text-[10px] text-dark/70">"We need to talk"</p>
            </div>

            {/* Response area */}
            <div className="absolute bottom-2 left-3 right-3 bg-white border-2 border-dark/10 rounded-lg px-3 py-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark/40">How do you respond?</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-1 h-1 bg-dark/30 rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-dark/30 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1 h-1 bg-dark/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted mt-3">Real scenarios. Real pressure. Safe environment.</p>
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
          <p className="text-center text-sm font-medium text-muted uppercase tracking-wider mb-3">Skill tracks</p>
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-12 tracking-tight">
            Practice what actually matters
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">6 scenarios</div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Interview Prep</h3>
              <p className="text-sm text-muted leading-relaxed">PM, consulting, leadership. Get grilled by interviewers who've seen it all.</p>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">5 scenarios</div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Difficult Conversations</h3>
              <p className="text-sm text-muted leading-relaxed">Giving feedback, saying no, managing up. The talks everyone avoids.</p>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">4 scenarios</div>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Pressure Management</h3>
              <p className="text-sm text-muted leading-relaxed">Competing deadlines, angry stakeholders. Stay cool when it counts.</p>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">4 scenarios</div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Stakeholder Management</h3>
              <p className="text-sm text-muted leading-relaxed">Navigate competing interests, build alignment, manage expectations.</p>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">5 scenarios</div>
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Leadership Moments</h3>
              <p className="text-sm text-muted leading-relaxed">First-time manager challenges. Team conflict. Performance issues.</p>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">3 scenarios</div>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Negotiation</h3>
              <p className="text-sm text-muted leading-relaxed">Salary talks, vendor deals, resource allocation. Get what you need.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-muted uppercase tracking-wider mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-medium text-dark text-center mb-12 tracking-tight">
            Three steps. Real skills.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-dark text-white rounded-full flex items-center justify-center font-semibold text-sm shadow-lg">1</div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Pick a scenario</h3>
              <p className="text-sm text-muted leading-relaxed">Choose your challenge. Interview prep, tough feedback, negotiation.</p>
            </div>

            <div className="relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm md:mt-4">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-dark text-white rounded-full flex items-center justify-center font-semibold text-sm shadow-lg">2</div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Face the heat</h3>
              <p className="text-sm text-muted leading-relaxed">Real personalities. Real pushback. The scenario tests your limits.</p>
            </div>

            <div className="relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-dark text-white rounded-full flex items-center justify-center font-semibold text-sm shadow-lg">3</div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
              </div>
              <h3 className="font-medium text-dark mb-2">Get real feedback</h3>
              <p className="text-sm text-muted leading-relaxed">Detailed report. What worked, what didn't, how to improve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-3 tracking-tight">
            Your next big moment is coming.
          </h2>
          <p className="text-lg text-white/60 mb-8">Be ready.</p>
          <Link
            to="/signup"
            className="inline-block bg-white text-dark px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Start Practicing Free →
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
