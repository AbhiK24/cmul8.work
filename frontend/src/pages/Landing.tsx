import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <svg className="w-6 h-3.5 sm:w-7 sm:h-4" viewBox="0 0 28 16" fill="none">
              <path d="M7 8c0-2.5 2-4.5 4.5-4.5S16 5.5 16 8s-2 4.5-4.5 4.5S7 10.5 7 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M12 8c0-2.5 2-4.5 4.5-4.5S21 5.5 21 8s-2 4.5-4.5 4.5S12 10.5 12 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <line x1="1" y1="8" x2="27" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
              <polygon points="25,6 27,8 25,10" fill="currentColor"/>
            </svg>
            <span className="font-semibold text-dark tracking-tight text-sm sm:text-base">WorkSim</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/signin" className="text-sm text-muted hover:text-dark transition-colors px-3 py-2">Sign In</Link>
            <Link to="/signup" className="text-sm text-dark bg-white border border-border rounded-full px-4 py-2 hover:bg-gray-50 transition-colors">Start Free</Link>
            <span className="text-border">|</span>
            <Link to="/login" className="flex items-center gap-2 text-sm text-muted hover:text-dark transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              Enterprise
            </Link>
          </div>

          {/* Mobile nav button */}
          <button
            className="md:hidden p-2 text-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white px-4 py-3 flex flex-col gap-2">
            <Link to="/signin" className="text-sm text-muted hover:text-dark py-2" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/signup" className="text-sm text-dark bg-accent text-white rounded-full px-4 py-2.5 text-center" onClick={() => setMobileMenuOpen(false)}>Start Free</Link>
            <Link to="/login" className="text-sm text-muted hover:text-dark py-2 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              Enterprise
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section - Side by Side */}
      <section className="pt-20 sm:pt-24 pb-8 sm:pb-16 px-4 sm:px-6 min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-80px)] flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left - Hero Text */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-medium text-dark tracking-tight leading-[1.1] mb-4 sm:mb-6">
                Soft skills decide careers.
                <br />
                <span className="text-muted">Practice yours.</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted max-w-lg mb-6 sm:mb-8 leading-relaxed mx-auto lg:mx-0">
                High-stakes scenarios. Real feedback. Skills that stick.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link
                  to="/signup"
                  className="bg-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-medium hover:opacity-85 transition-all hover:-translate-y-0.5 shadow-lg shadow-dark/20 text-center"
                >
                  Start Simulation Free →
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-3 sm:mt-4">No credit card required</p>
            </div>

            {/* Right - Motion Demo */}
            <div className="order-1 lg:order-2">
              <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 aspect-square sm:aspect-[4/3] lg:aspect-square relative overflow-hidden border border-border shadow-xl shadow-black/5 max-w-[320px] sm:max-w-none mx-auto">

                {/* Responsive orbit animations - using CSS custom properties */}
                <style>{`
                  :root {
                    --orbit-radius: 55px;
                  }
                  @media (min-width: 640px) {
                    :root { --orbit-radius: 75px; }
                  }
                  @media (min-width: 768px) {
                    :root { --orbit-radius: 85px; }
                  }
                  @media (min-width: 1024px) {
                    :root { --orbit-radius: 95px; }
                  }
                  @keyframes orbit1 { from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); } to { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); } }
                  @keyframes orbit2 { from { transform: rotate(60deg) translateX(calc(var(--orbit-radius) * 1.1)) rotate(-60deg); } to { transform: rotate(420deg) translateX(calc(var(--orbit-radius) * 1.1)) rotate(-420deg); } }
                  @keyframes orbit3 { from { transform: rotate(120deg) translateX(calc(var(--orbit-radius) * 0.9)) rotate(-120deg); } to { transform: rotate(480deg) translateX(calc(var(--orbit-radius) * 0.9)) rotate(-480deg); } }
                  @keyframes orbit4 { from { transform: rotate(180deg) translateX(calc(var(--orbit-radius) * 1.15)) rotate(-180deg); } to { transform: rotate(540deg) translateX(calc(var(--orbit-radius) * 1.15)) rotate(-540deg); } }
                  @keyframes orbit5 { from { transform: rotate(240deg) translateX(var(--orbit-radius)) rotate(-240deg); } to { transform: rotate(600deg) translateX(var(--orbit-radius)) rotate(-600deg); } }
                  @keyframes orbit6 { from { transform: rotate(300deg) translateX(calc(var(--orbit-radius) * 1.2)) rotate(-300deg); } to { transform: rotate(660deg) translateX(calc(var(--orbit-radius) * 1.2)) rotate(-660deg); } }
                  @keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.02); } }
                  @keyframes pulse-border { 0%, 100% { border-color: rgba(239, 68, 68, 0.3); } 50% { border-color: rgba(239, 68, 68, 0.6); } }
                  @keyframes float-around { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(3px, -2px); } 50% { transform: translate(-2px, 3px); } 75% { transform: translate(-3px, -2px); } }
                  @keyframes float-around-reverse { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-2px, 3px); } 50% { transform: translate(3px, -2px); } 75% { transform: translate(2px, 2px); } }
                `}</style>

                {/* Stress indicators */}
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 sm:gap-1.5 bg-red-50 border border-red-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse">
                  <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-red-500 rounded-full" />
                  <span className="text-[8px] sm:text-[10px] text-red-600 font-medium">5 urgent</span>
                </div>

                {/* Timer */}
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-1.5 bg-white border border-border px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-sm">
                  <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[8px] sm:text-[10px] text-red-600 font-mono font-medium">02:47</span>
                </div>

                {/* Central user */}
                <div className="absolute left-1/2 top-[42%] sm:top-[45%] -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    {/* Stress ring */}
                    <div className="absolute inset-0 -m-2 sm:-m-3 border-2 border-red-300/40 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />

                    {/* User */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full border-2 border-dark/20 flex items-center justify-center shadow-lg relative z-10">
                      <span className="text-xs sm:text-sm font-medium text-dark">You</span>
                    </div>

                    {/* Orbiting artifacts - responsive sizing */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit1 6s linear infinite' }}>
                      <div className="bg-[#4A154B] text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md flex items-center gap-0.5 sm:gap-1">
                        <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/></svg>
                        <span className="text-[7px] sm:text-[9px] font-medium">@you</span>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit2 7s linear infinite' }}>
                      <div className="bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md flex items-center gap-0.5 sm:gap-1">
                        <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
                        <span className="text-[7px] sm:text-[9px] font-medium">NOW</span>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit3 5s linear infinite' }}>
                      <div className="bg-white border border-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md flex items-center gap-0.5 sm:gap-1">
                        <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M14.2 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7.8L14.2 2z"/></svg>
                        <span className="text-[7px] sm:text-[9px] font-medium text-dark">Doc</span>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit4 8s linear infinite' }}>
                      <div className="bg-amber-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md flex items-center gap-0.5 sm:gap-1">
                        <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022" /></svg>
                        <span className="text-[7px] sm:text-[9px] font-medium">Late</span>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block" style={{ animation: 'orbit5 6.5s linear infinite' }}>
                      <div className="bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md flex items-center gap-0.5 sm:gap-1">
                        <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75" /></svg>
                        <span className="text-[7px] sm:text-[9px] font-medium">URGENT</span>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block" style={{ animation: 'orbit6 9s linear infinite' }}>
                      <div className="bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md flex items-center gap-0.5 sm:gap-1">
                        <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[7px] sm:text-[9px] font-medium">Due</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating messages - responsive positioning */}
                <div className="absolute top-[12%] sm:top-[15%] left-[5%] sm:left-[8%] bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md border border-border max-w-[120px] sm:max-w-36" style={{ animation: 'float-around 4s ease-in-out infinite' }}>
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=sarah" className="w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-gray-100" alt="" />
                    <span className="text-[8px] sm:text-[10px] font-medium text-dark">Sarah</span>
                    <span className="text-[6px] sm:text-[8px] bg-red-100 text-red-600 px-0.5 sm:px-1 rounded font-medium">VP</span>
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-dark/70">"EOD. No exceptions."</p>
                </div>

                <div className="absolute top-[10%] sm:top-[12%] right-[5%] sm:right-[8%] bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md border border-border max-w-[100px] sm:max-w-32" style={{ animation: 'float-around-reverse 5s ease-in-out infinite', animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=mike" className="w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-gray-100" alt="" />
                    <span className="text-[8px] sm:text-[10px] font-medium text-dark">Mike</span>
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-dark/70">"Blocking launch"</p>
                </div>

                <div className="hidden sm:block absolute bottom-[22%] left-[10%] bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md border-2" style={{ animation: 'float-around 3.5s ease-in-out infinite, pulse-border 2s ease-in-out infinite', animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=priya" className="w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-gray-100" alt="" />
                    <span className="text-[8px] sm:text-[10px] font-medium text-dark">Priya</span>
                    <span className="text-[6px] sm:text-[8px] bg-orange-100 text-orange-600 px-0.5 sm:px-1 rounded">!</span>
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-dark/70">"Still waiting..."</p>
                </div>

                <div className="hidden sm:block absolute bottom-[18%] right-[8%] bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md border border-border max-w-[100px] sm:max-w-32" style={{ animation: 'float-around-reverse 4.5s ease-in-out infinite', animationDelay: '0.8s' }}>
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=client" className="w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-gray-100" alt="" />
                    <span className="text-[8px] sm:text-[10px] font-medium text-dark">Client</span>
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-dark/70">"We need to talk"</p>
                </div>

                {/* Response area */}
                <div className="absolute bottom-2 left-2 sm:left-3 right-2 sm:right-3 bg-white border-2 border-dark/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-dark/40">How do you respond?</span>
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 h-1 bg-dark/30 rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-dark/30 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <div className="w-1 h-1 bg-dark/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] sm:text-xs text-muted mt-2 sm:mt-3">Real scenarios. Real pressure. Safe environment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-6 sm:py-8 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-x-12 sm:gap-y-4 text-xs sm:text-sm text-muted">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-dark">2,400+</span>
              <span>simulations completed</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-dark">94%</span>
              <span>felt more confident after</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline">Practiced by people at</span>
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Google - Full color */}
                <svg className="h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {/* Meta - Blue */}
                <svg className="h-5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                {/* Amazon - Orange */}
                <svg className="h-5" viewBox="0 0 24 24" fill="#FF9900"><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.045-.122zm6.22-5.763c0-1.027.26-1.885.782-2.574.522-.69 1.19-1.18 2.006-1.47a7.375 7.375 0 012.17-.478l1.227-.074V6.617c0-.56-.08-.97-.243-1.226-.202-.32-.528-.482-.976-.482h-.105c-.328.023-.616.135-.862.334-.247.2-.392.478-.437.833l-2.608-.238c.1-.895.53-1.62 1.287-2.168.756-.55 1.755-.826 2.996-.826 1.39 0 2.47.387 3.237 1.16.767.773 1.15 1.78 1.15 3.022v5.446c0 .39.017.782.05 1.174.036.392.092.71.17.956l.142.392H13.86l-.244-.61a4.04 4.04 0 01-.122-.447 4.526 4.526 0 01-1.416 1.003 4.114 4.114 0 01-1.736.392c-1.04 0-1.878-.313-2.518-.94-.64-.627-.96-1.448-.96-2.462zm3.61.58c.38 0 .747-.1 1.1-.305a2.197 2.197 0 00.814-.784v-1.63l-.96.055c-.753.042-1.32.204-1.702.488-.382.283-.573.68-.573 1.187 0 .37.117.666.35.887.236.22.548.33.94.33l.03-.228z"/></svg>
                {/* Stripe - Purple */}
                <svg className="h-5" viewBox="0 0 24 24" fill="#635BFF"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Practice - Compact Pills */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-dark mb-3 sm:mb-4 tracking-tight">
            Train on what actually matters
          </h2>
          <p className="text-sm sm:text-base text-muted mb-6 sm:mb-10 max-w-xl mx-auto">Pick a skill. Get dropped into a realistic scenario. Practice until it clicks.</p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
            <div className="group flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-200 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-dark">Interview</span>
              <span className="hidden sm:inline text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">6</span>
            </div>

            <div className="group flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-200 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-dark">Conversations</span>
              <span className="hidden sm:inline text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">5</span>
            </div>

            <div className="group flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-200 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-dark">Pressure</span>
              <span className="hidden sm:inline text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">4</span>
            </div>

            <div className="group flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-200 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584" /></svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-dark">Stakeholders</span>
              <span className="hidden sm:inline text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">4</span>
            </div>

            <div className="group flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-200 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-dark">Leadership</span>
              <span className="hidden sm:inline text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">5</span>
            </div>

            <div className="group flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-200 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 hover:border-cyan-300 hover:bg-cyan-50 transition-all cursor-pointer">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-dark">Negotiation</span>
              <span className="hidden sm:inline text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">3</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Horizontal Timeline */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-dark text-white overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-center mb-10 sm:mb-16 tracking-tight">
            Three steps. Real skills.
          </h2>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-white/20" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-4">
              <div className="text-center relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white text-dark rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold shadow-lg relative z-10">1</div>
                <h3 className="text-lg sm:text-xl font-medium mb-1.5 sm:mb-2">Pick a scenario</h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-[250px] mx-auto">Interview prep, tough feedback, negotiation — choose your challenge</p>
              </div>

              <div className="text-center relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white text-dark rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold shadow-lg relative z-10">2</div>
                <h3 className="text-lg sm:text-xl font-medium mb-1.5 sm:mb-2">Face the heat</h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-[250px] mx-auto">AI coworkers with real personalities push back on your ideas</p>
              </div>

              <div className="text-center relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white text-dark rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold shadow-lg relative z-10">3</div>
                <h3 className="text-lg sm:text-xl font-medium mb-1.5 sm:mb-2">Get real feedback</h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-[250px] mx-auto">Detailed report shows what worked and where to improve</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Pyramid Layout */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-xs sm:text-sm font-medium text-muted uppercase tracking-wider mb-2 sm:mb-3">Results that matter</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-dark tracking-tight">Skills that changed careers</h2>
          </div>

          {/* Pyramid: 1 on top, 2 below */}
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            {/* Top card - centered */}
            <div className="w-full max-w-md">
              <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=arun&backgroundColor=c0aede" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                  <div>
                    <p className="font-medium text-dark">Arun K.</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted">Product Manager</span>
                      <span className="text-muted">·</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                  </div>
                </div>
                <p className="text-dark leading-relaxed">"I bombed my first PM interview. After 3 WorkSim sessions, I walked into Google confident. <span className="font-semibold">Got the offer.</span>"</p>
              </div>
            </div>

            {/* Bottom row - 2 cards */}
            <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=sarah-eng&backgroundColor=b6e3f4" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                  <div>
                    <p className="font-medium text-dark">Sarah M.</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted">Engineering Manager</span>
                      <span className="text-muted">·</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF9900"><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.045-.122zm6.22-5.763c0-1.027.26-1.885.782-2.574.522-.69 1.19-1.18 2.006-1.47a7.375 7.375 0 012.17-.478l1.227-.074V6.617c0-.56-.08-.97-.243-1.226-.202-.32-.528-.482-.976-.482h-.105c-.328.023-.616.135-.862.334-.247.2-.392.478-.437.833l-2.608-.238c.1-.895.53-1.62 1.287-2.168.756-.55 1.755-.826 2.996-.826 1.39 0 2.47.387 3.237 1.16.767.773 1.15 1.78 1.15 3.022v5.446c0 .39.017.782.05 1.174.036.392.092.71.17.956l.142.392H13.86l-.244-.61a4.04 4.04 0 01-.122-.447 4.526 4.526 0 01-1.416 1.003 4.114 4.114 0 01-1.736.392c-1.04 0-1.878-.313-2.518-.94-.64-.627-.96-1.448-.96-2.462zm3.61.58c.38 0 .747-.1 1.1-.305a2.197 2.197 0 00.814-.784v-1.63l-.96.055c-.753.042-1.32.204-1.702.488-.382.283-.573.68-.573 1.187 0 .37.117.666.35.887.236.22.548.33.94.33l.03-.228z"/></svg>
                    </div>
                  </div>
                </div>
                <p className="text-dark leading-relaxed">"The difficult conversations track changed how I give feedback. <span className="font-semibold">My team actually thanks me for reviews now.</span>"</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=james-design&backgroundColor=d1d4f9" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                  <div>
                    <p className="font-medium text-dark">James L.</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted">Senior Designer</span>
                      <span className="text-muted">·</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </div>
                  </div>
                </div>
                <p className="text-dark leading-relaxed">"Practiced negotiating my raise here first. Asked for 20% more than I planned. <span className="font-semibold">Got it.</span>"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-white mb-2 sm:mb-3 tracking-tight">
            Your next big moment is coming.
          </h2>
          <p className="text-base sm:text-lg text-white/60 mb-6 sm:mb-8">Be ready.</p>
          <Link
            to="/signup"
            className="inline-block bg-white text-dark px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Start Practicing Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border bg-white">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 sm:w-6 h-3 sm:h-3.5" viewBox="0 0 28 16" fill="none">
              <path d="M7 8c0-2.5 2-4.5 4.5-4.5S16 5.5 16 8s-2 4.5-4.5 4.5S7 10.5 7 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M12 8c0-2.5 2-4.5 4.5-4.5S21 5.5 21 8s-2 4.5-4.5 4.5S12 10.5 12 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <line x1="1" y1="8" x2="27" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
              <polygon points="25,6 27,8 25,10" fill="currentColor"/>
            </svg>
            <span className="text-muted text-xs sm:text-sm">WorkSim by cmul8</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <a
              href="https://www.cmul8.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted border border-border rounded-full px-3 sm:px-4 py-1.5 sm:py-2 hover:text-dark hover:bg-gray-50 transition-all"
            >
              <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <span className="hidden sm:inline">cmul8.com</span>
            </a>
            <Link
              to="/login"
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted border border-border rounded-full px-3 sm:px-4 py-1.5 sm:py-2 hover:text-dark hover:bg-gray-50 transition-all"
            >
              <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              Enterprise
            </Link>
            <a
              href="mailto:hello@cmul8.com"
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted border border-border rounded-full px-3 sm:px-4 py-1.5 sm:py-2 hover:text-dark hover:bg-gray-50 transition-all"
            >
              <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
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
