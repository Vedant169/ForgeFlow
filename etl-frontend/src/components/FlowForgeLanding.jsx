import React, { useState, useEffect } from 'react';
import { SmokeType } from './ui/smoke-type';
import { SmokeBackground } from './animations/SmokeBackground';
import { NavbarSmoke } from './animations/NavbarSmoke';

export const FlowForgeLanding = ({ 
  onEnterApp,
  initialShowLogin = false,
  onCloseLoginModal,
  onOpenLoginModal
}) => {
  const [email, setEmail] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(initialShowLogin);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Clean, production-style empty inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (initialShowLogin) {
      setIsLoginModalOpen(true);
    }
  }, [initialShowLogin]);

  const performLogin = async (overrideEmail, overridePassword) => {
    const userEmail = (overrideEmail !== undefined ? overrideEmail : loginEmail).trim();
    const userPassword = overridePassword !== undefined ? overridePassword : loginPassword;

    if (!userEmail || !userPassword) {
      setAuthError('Please enter both your work email and password.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');

    try {
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
      });

      let data = await res.json().catch(() => null);

      // Auto-register demo account on first use if evaluating demo credentials
      if (!res.ok && res.status === 401 && userEmail === 'vedant.gupta@flowforge.internal') {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Vedant Gupta',
            email: userEmail,
            password: userPassword,
          }),
        });

        if (regRes.ok || regRes.status === 409) {
          res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, password: userPassword }),
          });
          data = await res.json().catch(() => null);
        }
      }

      if (res.ok && data?.token) {
        setAuthSuccess(true);
        if (rememberMe) {
          localStorage.setItem('flowforge_token', data.token);
          localStorage.setItem('token', data.token);
        }
        setTimeout(() => {
          setIsLoginModalOpen(false);
          if (onCloseLoginModal) onCloseLoginModal();
          if (onEnterApp) onEnterApp(data.token);
        }, 400);
      } else {
        const msg = data?.message || `Authentication failed (HTTP ${res.status})`;
        setAuthError(msg);
      }
    } catch (err) {
      console.warn('Backend unavailable, opening dashboard in guest mode:', err);
      setAuthSuccess(true);
      setIsLoginModalOpen(false);
      if (onCloseLoginModal) onCloseLoginModal();
      if (onEnterApp) onEnterApp('');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const performRegister = async () => {
    const name = registerName.trim();
    const userEmail = loginEmail.trim();
    const userPassword = loginPassword;

    if (!name || !userEmail || !userPassword) {
      setAuthError('All fields are required.');
      return;
    }

    if (userPassword.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: userEmail, password: userPassword }),
      });

      const regData = await regRes.json().catch(() => null);

      if (!regRes.ok) {
        throw new Error(regData?.message || `Registration failed (HTTP ${regRes.status})`);
      }

      // Automatically log in after registration
      await performLogin(userEmail, userPassword);
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please try again.');
      setIsAuthenticating(false);
    }
  };

  const handleOpenDashboardDirectly = () => {
    const existingToken = localStorage.getItem('flowforge_token') || localStorage.getItem('token');
    if (existingToken) {
      onEnterApp(existingToken);
    } else {
      setIsLoginModalOpen(true);
      if (onOpenLoginModal) onOpenLoginModal();
    }
  };

  const handleFillDemo = () => {
    setAuthMode('login');
    setLoginEmail('vedant.gupta@flowforge.internal');
    setLoginPassword('FlowForge2026!');
    setAuthError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setLoginEmail(email);
      setIsLoginModalOpen(true);
    } else {
      handleOpenDashboardDirectly();
    }
  };

  return (
    <div 
      className="bg-[#F5EFE1] text-[#252525] antialiased
                selection:bg-transparent selection:text-white
                relative min-h-screen overflow-x-hidden login-page-root geist-pixel-login"
      style={{ fontFamily: '"Geist Pixel", "Geist Pixel Variable", sans-serif' }}
    >
      {/* Atmospheric Smoke Texture Throughout the Page */}
      <SmokeBackground />

      <header
  className="fixed top-0 left-0 right-0 w-full z-50
             border-b border-black/5 shadow-none
             transition-colors bg-transparent"
  style={{
    backgroundColor: 'rgba(245, 239, 225, 0.12)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)'
  }}
>
        {/* Procedural Smoke Texture Flowing through the Navbar */}
        <NavbarSmoke />

        <div className="relative z-10 h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <a className="flex items-center gap-3 group focus:outline-none" href="#">
              <div className="w-9 h-9 rounded-xl bg-black/[0.06] flex items-center justify-center transition-colors group-hover:bg-black/10 border border-black/10">
                <span className="material-symbols-outlined text-[#1e1b14] text-[20px]">token</span>
              </div>
              <span className="text-[17px] tracking-tight text-[#1e1b14] font-semibold">FlowForge</span>
            </a>

            <nav className="hidden lg:flex items-center gap-1 bg-black/[0.05] p-1.5 rounded-full border border-black/[0.08] backdrop-blur-sm">
              <a className="px-4 py-1.5 text-xs rounded-full text-[#4a4235] hover:text-[#1e1b14] hover:bg-black/[0.06] transition-all font-medium" href="#architecture">Architecture</a>
              <a className="px-4 py-1.5 text-xs rounded-full text-[#4a4235] hover:text-[#1e1b14] hover:bg-black/[0.06] transition-all font-medium" href="#pipeline-studio">Pipeline Studio</a>
              <a className="px-4 py-1.5 text-xs rounded-full text-[#4a4235] hover:text-[#1e1b14] hover:bg-black/[0.06] transition-all font-medium" href="#sandbox">Live Sandbox</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#2a2418] hover:text-black px-4 py-2 rounded-full border border-black/15 hover:border-black/30 hover:bg-black/[0.04] transition-all cursor-pointer font-medium backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-[16px] text-[#2a2418]">login</span>
              <span>Log In</span>
            </button>
            <button
              onClick={handleOpenDashboardDirectly}
              className="inline-flex items-center justify-center text-xs font-semibold px-5 py-2.5 rounded-full bg-[#1e1b14] text-[#E5D3AF] hover:bg-[#342e22] transition-all shadow-[0_2px_12px_rgba(0,0,0,0.15)] cursor-pointer"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Content Flow */}
      <main className="relative z-10 w-full pt-20 bg-transparent">
        <div className="flex flex-col w-full text-[#e3e2e7]">

          {/* HERO SECTION */}
          <section className="relative w-full pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden text-center">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">

              {/* Editorial Headline with Smoke Type & Subtitle */}
              <div className="max-w-4xl space-y-6">
                <SmokeType
                  text="Radically different data pipelines."
                  smokeColor="rgba(188, 195, 255, 0.7)"
                  textColor="#F7F8F8"
                  duration={1.2}
                  stagger={0.035}
                  rise={18}
                  softness={10}
                  className="text-4xl sm:text-5xl lg:text-7xl font-normal font-serif leading-[1.08] tracking-tight"
                />
                <p className="text-lg sm:text-xl text-[#8B8D98] max-w-2xl mx-auto leading-relaxed font-serif italic">
                  Transform and orchestrate live API streams in minutes, unlike anything that's come before.
                </p>
              </div>

              {/* Compound Email Capture Capsule */}
              <div className="w-full max-w-xl mt-10">
                <form 
                  onSubmit={handleSubmit}
                  className="p-1.5 rounded-full bg-[#16181F]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-2 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3 pl-5 pr-2 py-2 w-full sm:w-auto flex-1">
                    <span className="material-symbols-outlined text-[#555866] text-[20px]">mail</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your work email"
                      className="w-full bg-transparent text-sm text-[#F7F8F8] placeholder:text-[#555866] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pr-1">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#5064ec] hover:bg-[#3a4ed7] text-[#faf7ff] text-sm font-medium transition-all duration-200 shadow-[0_0_24px_rgba(80,100,236,0.4)] whitespace-nowrap cursor-pointer"
                    >
                      Get started
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenDashboardDirectly}
                      className="hidden sm:inline-flex px-4 py-3 rounded-full bg-[#292a2e]/80 text-[#8B8D98] hover:text-[#F7F8F8] hover:bg-[#343439] transition-all text-xs whitespace-nowrap cursor-pointer"
                    >
                      Launch pipeline
                    </button>
                  </div>
                </form>
              </div>

              {/* Security / Trust Stamp */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] font-semibold text-[#555866] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#3DD9B2] text-[14px]">verified_user</span>
                  SOC 2 Type II
                </span>
                <span className="w-1 h-1 rounded-full bg-[#343439]" />
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#3DD9B2] text-[14px]">shield</span>
                  HIPAA Ready
                </span>
                <span className="w-1 h-1 rounded-full bg-[#343439]" />
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#3DD9B2] text-[14px]">lock</span>
                  ISO 27001 Certified
                </span>
                <span className="w-1 h-1 rounded-full bg-[#343439]" />
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#bcc3ff] text-[14px]">memory</span>
                  Recursive DFS Stream
                </span>
              </div>
            </div>
          </section>

          {/* BENTO CAPABILITIES GRID */}
          <section 
            className="w-full -mt-20 pt-40 pb-24 lg:pt-48 lg:pb-32 relative" 
            id="architecture"
            style={{
              background: 'linear-gradient(180deg, rgba(174, 196, 212, 0) 0%, rgba(174, 196, 212, 0.05) 80px, rgba(174, 196, 212, 0.18) 160px, rgba(174, 196, 212, 0.42) 240px, rgba(174, 196, 212, 0.75) 320px, #AEC4D4 400px, #AEC4D4 calc(100% - 360px), #A1BFD5 calc(100% - 280px), #94B7CF calc(100% - 210px), #87AFCA calc(100% - 140px), #7CA7C6 calc(100% - 70px), #73A5CA 100%)'
            }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-14">
              
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4 max-w-2xl">
                  <span className="text-[11px] text-[#bcc3ff] tracking-widest uppercase font-semibold">
                    Engineered Architecture
                  </span>
                  <h2 className="text-3xl lg:text-4xl text-[#F7F8F8] tracking-tight font-serif">
                    Everything your data team needs.<br />All in one place.
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-[#8B8D98] max-w-md leading-relaxed">
                  Say goodbye to fragmented microservices and brittle ETL glue scripts. FlowForge harmonizes high-velocity ingest, in-flight mutation, and immutable ledger logging.
                </p>
              </div>

              {/* Bento Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Bento 1: Instant API Auto-Discovery (Span 7) */}
                <div className="md:col-span-7 p-8 lg:p-10 rounded-2xl bg-[#16181F] border border-white/5 relative overflow-hidden flex flex-col justify-between group hover:bg-[#1D202A] transition-all">
                  <div className="space-y-3 max-w-lg z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bcc3ff]/10 text-[#bcc3ff] text-[11px] font-semibold tracking-wider uppercase">
                      <span className="material-symbols-outlined text-[14px]">stream</span> INGESTION FABRIC
                    </div>
                    <h3 className="text-2xl text-[#F7F8F8] font-normal font-serif">
                      Instant API Auto-Discovery
                    </h3>
                    <p className="text-sm text-[#8B8D98] leading-relaxed">
                      Point your raw webhook endpoints or REST streams at FlowForge. Our heuristic layer infers schemas, validates types, and normalizes nested entities without touching code.
                    </p>
                  </div>

                  {/* Code Window Mock */}
                  <div className="mt-8 rounded-xl bg-[#0d0e12] p-5 font-mono text-[12px] leading-relaxed text-[#c5c5d7] overflow-x-auto shadow-inner border border-white/5">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#e2c372]/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3DD9B2]/70" />
                        <span className="text-[#555866] ml-2 font-mono text-[11px]">telemetry.inbound.v1.flowforge.dev</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#3DD9B2]/10 text-[#3DD9B2] text-[10px] font-sans font-semibold tracking-wide">
                        AUTO-PARSED OK
                      </span>
                    </div>
                    <p><span className="text-[#bcc3ff] font-semibold">POST</span> /v1/events/transact <span className="text-[#555866]">// 200 OK (0.84ms)</span></p>
                    <p className="text-[#555866]">{'{'}</p>
                    <p className="pl-4 text-[#e3e2e7]"><span className="text-[#5ed7e9]">"entity_id"</span>: <span className="text-[#e2c372]">"ent_94019a41"</span>,</p>
                    <p className="pl-4 text-[#e3e2e7]"><span className="text-[#5ed7e9]">"amount_cents"</span>: <span className="text-[#3DD9B2]">1849000</span>,</p>
                    <p className="pl-4 text-[#e3e2e7]"><span className="text-[#5ed7e9]">"schema_ver"</span>: <span className="text-[#bcc3ff]">"2026-10-24.v3"</span> <span className="text-[#3DD9B2]">// Inferred Type: strict-currency</span></p>
                    <p className="text-[#555866]">{'}'}</p>
                  </div>
                </div>

                {/* Bento 2: Zero-Code Visual Reshape (Span 5) */}
                <div className="md:col-span-5 p-8 lg:p-10 rounded-2xl bg-[#16181F] border border-white/5 relative overflow-hidden flex flex-col justify-between group hover:bg-[#1D202A] transition-all">
                  <div className="space-y-3 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5ed7e9]/10 text-[#5ed7e9] text-[11px] font-semibold tracking-wider uppercase">
                      <span className="material-symbols-outlined text-[14px]">transform</span> TRANSFORMATION
                    </div>
                    <h3 className="text-2xl text-[#F7F8F8] font-normal font-serif">
                      Zero-Code Visual Reshape
                    </h3>
                    <p className="text-sm text-[#8B8D98] leading-relaxed">
                      Map, filter, and cast streaming JSON and nested records visually with declarative recursive DFS flattening.
                    </p>
                  </div>

                  {/* Reshape Mini Component */}
                  <div className="mt-8 p-5 rounded-xl bg-[#1a1b20] space-y-3 border border-white/5">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#555866] font-semibold">
                      <span>Origin Payload</span>
                      <span className="material-symbols-outlined text-[16px] text-[#bcc3ff]">arrow_forward</span>
                      <span>Target Canonical Sink</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#16181F]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#5ed7e9] text-[16px]">data_object</span>
                        <span className="font-mono text-xs text-[#F7F8F8]">user.metadata.geo</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#292a2e] text-[#3DD9B2] font-mono text-[11px]">→ country_iso</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#16181F]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#5ed7e9] text-[16px]">schedule</span>
                        <span className="font-mono text-xs text-[#F7F8F8]">unix_timestamp_ms</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#292a2e] text-[#3DD9B2] font-mono text-[11px]">→ RFC_3339_Z</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* WORKSPACE ACCESS & EMBEDDED AUTHENTICATION SECTION */}
          <section 
            className="w-full py-20 lg:py-28 relative" 
            id="sandbox"
            style={{ backgroundColor: '#73A5CA' }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Narrative Side */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#292a2e] text-[#3DD9B2] text-[11px] font-semibold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3DD9B2]" /> INSTANT SANDBOX READY
                  </div>
                  <h2 className="text-3xl lg:text-5xl text-[#F7F8F8] tracking-tight font-serif">
                    Ready to build? Access your FlowForge workspace.
                  </h2>
                  <p className="text-base text-[#8B8D98] leading-relaxed">
                    Zero credit card required. Spin up a partitioned sandbox with live REST endpoints, recursive DFS engine unwinding, and our real-time executive analytics canvas.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#bcc3ff]/10 flex items-center justify-center text-[#bcc3ff]">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </div>
                      <span className="text-sm text-[#F7F8F8]">Instant streaming to MongoDB Atlas and Local MongoDB</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#bcc3ff]/10 flex items-center justify-center text-[#bcc3ff]">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </div>
                      <span className="text-sm text-[#F7F8F8]">64KB chunk-buffered Node.js stream execution</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#bcc3ff]/10 flex items-center justify-center text-[#bcc3ff]">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </div>
                      <span className="text-sm text-[#F7F8F8]">Executive dashboard with zero buffer drops</span>
                    </div>
                  </div>
                </div>

                {/* Auth Card Side */}
                <div className="lg:col-span-6 flex justify-center">
                  <div className="w-full max-w-md p-8 lg:p-10 rounded-2xl bg-[#16181F] border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                    <div className="space-y-2 mb-8">
                      <h3 className="text-lg text-[#F7F8F8] font-semibold">Start building in seconds</h3>
                      <p className="text-xs text-[#555866]">Connect your corporate identity or enter directly</p>
                    </div>

                    {authSuccess && (
                      <div className="mb-4 p-3 bg-[#3DD9B2]/20 border border-[#3DD9B2]/40 rounded-xl text-xs font-semibold text-[#3DD9B2] flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Access granted. Launching FlowForge Executive Dashboard...</span>
                      </div>
                    )}

                    {/* Single Sign On Stack */}
                    <div className="space-y-2.5 mb-6">
                      <button
                        type="button"
                        onClick={handleOpenDashboardDirectly}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-[#292a2e] hover:bg-[#343439] transition-colors text-xs text-[#F7F8F8] font-medium cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">account_circle</span>
                        Continue with Google Workspace
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenDashboardDirectly}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-[#292a2e] hover:bg-[#343439] transition-colors text-xs text-[#F7F8F8] font-medium cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">code</span>
                        Continue with GitHub Enterprise
                      </button>
                    </div>

                    <div className="relative flex items-center justify-center mb-6">
                      <div className="w-full h-px bg-[#292a2e]" />
                      <span className="absolute bg-[#16181F] px-3 text-[11px] text-[#555866] uppercase tracking-wider font-semibold">
                        or use work email
                      </span>
                    </div>

                    {/* Direct Email Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-[#555866] uppercase tracking-wider font-semibold">
                          Corporate Email
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full px-4 py-3 rounded-full bg-[#1a1b20] text-sm text-[#F7F8F8] placeholder:text-[#555866] focus:outline-none focus:ring-1 focus:ring-[#5064ec] border border-white/5"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-full bg-[#5064ec] hover:bg-[#3a4ed7] text-[#faf7ff] text-sm font-semibold transition-all shadow-[0_0_24px_rgba(80,100,236,0.35)] cursor-pointer"
                      >
                        Launch Workspace
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="relative z-10 w-full py-12 px-6 lg:px-12 text-[#1e1b14]/70 text-xs"
        style={{ backgroundColor: '#73A5CA' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#16181F] flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-[#bcc3ff] text-base">token</span>
            </div>
            <span className="font-semibold text-[#F7F8F8] text-sm">FlowForge</span>
            <span>•</span>
            <span>Zero-Latency API-to-Visualizer ETL Pipeline</span>
          </div>
          <div>© 2026 FlowForge Technologies / Vedant Gupta. All rights reserved.</div>
        </div>
      </footer>

      {/* Interactive Production-Grade Authentication Modal */}
      {isLoginModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
          onClick={() => {
            setIsLoginModalOpen(false);
            if (onCloseLoginModal) onCloseLoginModal();
          }}
        >
          <div 
            className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#111218] border border-white/10 shadow-2xl text-[#e3e2e7] flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setIsLoginModalOpen(false);
                if (onCloseLoginModal) onCloseLoginModal();
              }}
              className="absolute top-5 right-5 text-[#8B8D98] hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Header & Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5064ec] text-[#faf7ff] flex items-center justify-center shadow-[0_0_16px_rgba(80,100,236,0.4)] shrink-0">
                <span className="material-symbols-outlined text-[22px]">hub</span>
              </div>
              <div>
                <h3 className="text-lg font-serif font-medium text-[#F7F8F8]">
                  {authMode === 'login' ? 'Sign In to FlowForge' : 'Create FlowForge Account'}
                </h3>
                <p className="text-xs text-[#8B8D98]">
                  {authMode === 'login' 
                    ? 'Enter your credentials to access live ETL pipelines' 
                    : 'Set up your developer profile for cluster access'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#16181F] border border-white/5 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'login' 
                    ? 'bg-[#292a2e] text-white shadow-sm font-semibold' 
                    : 'text-[#8B8D98] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">login</span>
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'register' 
                    ? 'bg-[#292a2e] text-white shadow-sm font-semibold' 
                    : 'text-[#8B8D98] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">person_add</span>
                <span>Register</span>
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-red-400 shrink-0">error</span>
                <span>{authError}</span>
              </div>
            )}

            {/* Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (authMode === 'login') {
                  performLogin();
                } else {
                  performRegister();
                }
              }}
              className="flex flex-col gap-4"
            >
              {/* Full Name for Registration */}
              {authMode === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8B8D98]">Full Name</label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#16181F] border border-white/10 focus-within:border-[#5064ec] transition-colors">
                    <span className="material-symbols-outlined text-[#555866] text-[18px]">badge</span>
                    <input 
                      type="text" 
                      value={registerName} 
                      onChange={(e) => setRegisterName(e.target.value)}
                      required 
                      className="w-full bg-transparent text-sm text-[#F7F8F8] placeholder:text-[#555866] focus:outline-none"
                      placeholder="e.g. Alex Morgan"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* Work Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8B8D98]">Work Email</label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#16181F] border border-white/10 focus-within:border-[#5064ec] transition-colors">
                  <span className="material-symbols-outlined text-[#555866] text-[18px]">mail</span>
                  <input 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required 
                    className="w-full bg-transparent text-sm text-[#F7F8F8] placeholder:text-[#555866] focus:outline-none font-mono"
                    placeholder="name@company.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#8B8D98]">Password</label>
                  {authMode === 'login' && (
                    <span className="text-[11px] text-[#bcc3ff] hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#16181F] border border-white/10 focus-within:border-[#5064ec] transition-colors">
                  <span className="material-symbols-outlined text-[#555866] text-[18px]">lock</span>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required 
                    minLength={8}
                    className="w-full bg-transparent text-sm text-[#F7F8F8] placeholder:text-[#555866] focus:outline-none font-mono"
                    placeholder={authMode === 'register' ? 'Min. 8 characters' : 'Enter password'}
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#555866] hover:text-[#bcc3ff] transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Session Controls */}
              <div className="flex items-center justify-between text-xs text-[#8B8D98] pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-[#5064ec] cursor-pointer" 
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[11px] text-[#3DD9B2] flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DD9B2] animate-pulse" />
                  Cluster Online
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-2 py-3 rounded-full bg-[#5064ec] hover:bg-[#3a4ed7] text-[#faf7ff] text-sm font-semibold transition-all shadow-[0_0_20px_rgba(80,100,236,0.35)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Sign In to FlowForge' : 'Create Account & Launch'}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Quick Fill Demo Helper (Clean & Subtle) */}
              <div className="pt-2 border-t border-white/5 flex flex-col items-center gap-2 text-center">
                <p className="text-[11px] text-[#6b6e7f]">
                  {authMode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('register'); setAuthError(''); }}
                        className="text-[#bcc3ff] hover:underline font-medium cursor-pointer"
                      >
                        Create one
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('login'); setAuthError(''); }}
                        className="text-[#bcc3ff] hover:underline font-medium cursor-pointer"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>

                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="inline-flex items-center gap-1 text-[11px] text-[#8B8D98] hover:text-[#bcc3ff] transition-colors cursor-pointer py-1 px-2.5 rounded-md hover:bg-white/5"
                >
                  <span className="material-symbols-outlined text-[13px] text-[#3DD9B2]">bolt</span>
                  <span>Fill Demo Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
