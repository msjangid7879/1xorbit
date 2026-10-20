import React, { useState } from 'react';
import api from '../services/api';

// 1. Assets folder se images import karein
import dashboardImg from '../assets/dashboard.jpg';
import masterTasksImg from '../assets/master-tasks.jpg';
import chatsImg from '../assets/chats.jpg';
import userMgmtImg from '../assets/user-management.png'; // File extension/name check kar lein (.png ya .jpg)

export default function LandingPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('choose'); // 'choose', 'features', 'pricing', 'login', 'signup'
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  const [zoomedImage, setZoomedImage] = useState(null); // Lightbox zoom state

  // Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Company Signup State
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', {
        username: loginUsername.trim(),
        password: loginPassword.trim()
      });
      onLoginSuccess(res.data.user);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/register', {
        companyName,
        subdomain,
        adminName,
        adminUsername,
        adminPassword,
        email,
        phone
      });
      alert('Company & Admin Registered Successfully!');
      onLoginSuccess(res.data.user);
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  // App Screenshots & Showcase Data
  const appFeatures = [
    {
      id: "dashboard",
      badge: "LIVE ANALYTICS & PENALTY TRACKING",
      title: "Real-Time Dashboard Overview",
      description: "Automated master task monitoring, pending penalty logs, interactive status breakdowns, department performance metrics, and high-priority action tables.",
      image: dashboardImg, // Replace with local path e.g., /assets/dashboard.jpg
      highlights: ["Interactive Donut Charts", "Task Unread Badges", "Priority & Status Filtering"]
    },
    {
      id: "master_tasks",
      badge: "RECURRING AUTOMATION ENGINE",
      title: "Master Recurring Tasks & Auto-Penalties",
      description: "Configure daily, weekly, or monthly recurring operational schedules. Automatically assign tasks to team members with KPI remarks and reference images.",
      image: masterTasksImg,
      highlights: ["Admin-Only Access Control", "Custom Schedule Frequencies", "Reference Image Uploads"]
    },
    {
      id: "chats",
      badge: "INTEGRATED TEAM CHAT & TASK COMMANDS",
      title: "Chats & Channels with Smart Commands",
      description: "Direct messaging with team members, media attachments, voice notes, and instant task conversion directly from chat using the /task command.",
      image: chatsImg,
      highlights: ["Instant /task Conversion", "Read Receipts & Unread Counts", "Clean No-Scrollbar UI"]
    },
    {
      id: "user_mgmt",
      badge: "ENTERPRISE ROLE SECURITY",
      title: "User & Access Management",
      description: "Manage team member access rights across modules. Restrict or allow access to Dashboard, Master Tasks, Tasks Board, and Chat modules individually.",
      image: userMgmtImg,
      highlights: ["Granular Module Permissions", "Department Assignment", "Secure Credentials Management"]
    }
  ];

  const pricingPlans = [
    {
      name: "Starter Plan",
      price: "Free",
      period: "forever",
      desc: "Great for small teams starting out with basic workspace management.",
      features: ["Up to 2 Users", "Basic Task Tracking", "Standard Chat & Support", "Community Access"]
    },
    {
      name: "Growth Plan",
      price: "₹49",
      period: "per month",
      desc: "Ideal for growing teams requiring robust task and workflow tracking.",
      features: ["Up to 10 Users", "Multi-Tenant Workspace", "Automated Master Tasks", "Real-time Chat & Unread Badges"]
    },
    {
      name: "Business Plan",
      price: "₹99",
      period: "per month",
      desc: "Designed for scaling organizations with multiple departments.",
      features: ["Up to 100 Users", "Department Scorecards", "Advanced Master Penalties", "Priority Support"]
    },
    {
      name: "Enterprise Plan",
      price: "₹149",
      period: "per month",
      desc: "Unlimited scalability for large-scale enterprise operations.",
      features: ["100+ Users", "Custom Dedicated Subdomain", "Dedicated Account Manager", "22/7 Priority Operations Support"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white no-scrollbar">
      {/* Header */}
      <header className="border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 bg-[#0b0f19]/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAuthMode('choose')}>
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-500/20">
            1X
          </div>
          <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            1XORBIT WORKSPACE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setAuthMode('choose')} className={`text-xs font-medium transition ${authMode === 'choose' ? 'text-indigo-400 font-bold' : 'text-slate-300 hover:text-white'}`}>Home</button>
          <button onClick={() => setAuthMode('features')} className={`text-xs font-medium transition ${authMode === 'features' ? 'text-indigo-400 font-bold' : 'text-slate-300 hover:text-white'}`}>Features</button>
          <button onClick={() => setAuthMode('pricing')} className={`text-xs font-medium transition ${authMode === 'pricing' ? 'text-indigo-400 font-bold' : 'text-slate-300 hover:text-white'}`}>Pricing</button>
          <button onClick={() => setAuthMode('login')} className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">Sign In</button>
          <button onClick={() => setAuthMode('signup')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition transform active:scale-95">
            Register Company
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col justify-center items-center">

        {/* ================= HOME SECTION ================= */}
        {authMode === 'choose' && (
          <div className="w-full space-y-16 py-4">
            {/* Hero Banner */}
            <div className="text-center space-y-6 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                Next-Gen Operational Intelligence Suite
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Streamline Workspace & <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Automate Team Workflows
                </span>
              </h1>

              <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Empower your business with multi-tenant company isolation, automated recurring schedules, real-time chats with task triggers, and employee penalty tracking.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <button onClick={() => setAuthMode('login')} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-2xl shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5">
                  Sign In to Workspace
                </button>
                <button onClick={() => setAuthMode('features')} className="px-8 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-sm font-semibold rounded-2xl border border-slate-700 transition">
                  Explore App Features
                </button>
              </div>
            </div>

            {/* Main App Interactive Mockup Showcase */}
            <div className="relative rounded-3xl p-3 bg-gradient-to-b from-indigo-500/20 via-slate-800/60 to-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-w-6xl mx-auto">
              <div className="bg-[#0b0f19] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl">
                {/* Window Control Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#111827] border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    <span className="ml-2 text-xs text-slate-400 font-mono">1xorbit.workspace/dashboard</span>
                  </div>
                  <span className="text-[11px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-medium">
                    Live Live Preview
                  </span>
                </div>

                {/* Styled App Mockup Image Container */}
                <div className="relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent z-10 opacity-70"></div>

                  {/* Your Real Dashboard Image Styled Attractively */}
                  <img
                    src={dashboardImg}
                    alt="1XORBIT Dashboard Screenshot"
                    className="w-full h-auto object-cover opacity-95 group-hover:scale-[1.01] transition-all duration-700"
                  />

                  {/* Floating Highlight Cards on Mockup */}
                  <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-wrap justify-between items-center bg-[#111827]/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/80 shadow-2xl">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">AUTOMATED MANAGEMENT SUITE</p>
                      <p className="text-sm font-bold text-white">Live Operations Dashboard & Department Performance Table</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAuthMode('features')} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md">
                        View All Modules
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick App Modules Grid */}
            <div className="space-y-8 pt-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold">Built For Enterprise Efficiency</h2>
                <p className="text-xs text-slate-400">Integrated suite designed to manage tasks, recurring schedules, and direct chats seamlessly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {appFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setActiveFeatureTab(idx); setAuthMode('features'); }}
                    className="bg-[#111827] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl space-y-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg group"
                  >
                    <div className="p-2 bg-indigo-950/60 border border-indigo-800/60 w-fit rounded-xl text-indigo-400 font-bold text-xs">
                      0{idx + 1}
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition">{feat.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{feat.description}</p>
                    <span className="text-[11px] text-indigo-400 font-semibold inline-flex items-center gap-1">
                      Explore Module →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= FEATURES PAGE SECTION ================= */}
        {authMode === 'features' && (
          <div className="w-full space-y-10 py-4">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold rounded-full uppercase tracking-wider">
                Module Deep Dive
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Explore 1XORBIT App Features</h2>
              <p className="text-slate-400 text-xs md:text-sm">Click through the modules below to see real app interfaces and capabilities.</p>
            </div>

            {/* Feature Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-2 bg-[#111827] p-1.5 rounded-2xl border border-slate-800 max-w-3xl mx-auto">
              {appFeatures.map((feat, idx) => (
                <button
                  key={feat.id}
                  onClick={() => setActiveFeatureTab(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeFeatureTab === idx
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  {feat.title.split(' ')[0]} {feat.title.split(' ')[1] || ''}
                </button>
              ))}
            </div>

            {/* Feature Display Showcase */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
              {/* Feature Info Text */}
              <div className="lg:col-span-5 space-y-5">
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800">
                  {appFeatures[activeFeatureTab].badge}
                </span>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                  {appFeatures[activeFeatureTab].title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {appFeatures[activeFeatureTab].description}
                </p>

                {/* Key Points */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Key Highlights:</p>
                  {appFeatures[activeFeatureTab].highlights.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-indigo-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-3">
                  <button onClick={() => setAuthMode('login')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition">
                    Access {appFeatures[activeFeatureTab].title.split(' ')[0]}
                  </button>
                </div>
              </div>

              {/* Feature App Image Showcase */}
              <div onClick={() => setZoomedImage(appFeatures[activeFeatureTab].image)}
                className="lg:col-span-7 bg-[#0b0f19] p-2 rounded-2xl border border-slate-800 shadow-2xl relative group overflow-hidden cursor-pointer"
                title="Click to Zoom Image">
                <img
                  src={appFeatures[activeFeatureTab].image}
                  alt={appFeatures[activeFeatureTab].title}
                  className="w-full h-auto rounded-xl object-cover shadow-2xl group-hover:scale-[1.02] transition duration-500"
                />

                <div className="absolute inset-0 bg-indigo-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="bg-indigo-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
                    🔍 Click to Zoom Preview
                  </span>
                </div>

              </div>
            </div>

            {/* Bottom Callout */}
            <div className="text-center pt-4">
              <button onClick={() => setAuthMode('choose')} className="text-xs text-slate-400 hover:text-white transition">
                ← Back to Home
              </button>
            </div>
          </div>
        )}

        {/* ================= PRICING SECTION ================= */}
        {authMode === 'pricing' && (
          <div className="w-full space-y-10 py-6">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold">Transparent Workspace Pricing</h2>
              <p className="text-slate-400 text-xs md:text-sm">Choose the ideal plan for your team and operational scale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan, idx) => (
                <div key={idx} className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400">{plan.desc}</p>
                    <div className="text-3xl font-extrabold text-indigo-400 pt-2">
                      {plan.price} <span className="text-xs text-slate-400 font-normal">/ {plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">✓ {f}</li>
                    ))}
                  </ul>
                  <button onClick={() => setAuthMode('signup')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition">
                    Get Started
                  </button>
                </div>
              ))}
            </div>
            <div className="text-center pt-4">
              <button onClick={() => setAuthMode('choose')} className="text-xs text-slate-400 hover:text-white transition">← Back to Home</button>
            </div>
          </div>
        )}

        {/* ================= LOGIN MODAL ================= */}
        {authMode === 'login' && (
          <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl w-full max-w-md text-left space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Workspace Sign In</h2>
              <p className="text-xs text-slate-400">Enter your credentials to access your tenant account.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setAuthMode('choose')} className="text-xs text-slate-400 hover:text-white transition">← Back to Home</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl text-sm shadow-md transition transform active:scale-95">Sign In</button>
              </div>
            </form>
          </div>
        )}

        {/* ================= SIGNUP MODAL ================= */}
        {authMode === 'signup' && (
          <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl w-full max-w-lg text-left space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Register Company & Admin Account</h2>
              <p className="text-xs text-slate-400">Set up a new workspace for your company and admin team.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Company Name</label>
                  <input type="text" placeholder="Bhavya Gems & Jewels" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Subdomain</label>
                  <input type="text" placeholder="bhavya_gems" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" required />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Admin Full Name</label>
                <input type="text" placeholder="Manish Jangid" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Admin Username</label>
                  <input type="text" placeholder="manish_admin" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Admin Password</label>
                  <input type="password" placeholder="******" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Email (Info)</label>
                  <input type="email" placeholder="manish@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Phone (Info)</label>
                  <input type="text" placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setAuthMode('choose')} className="text-xs text-slate-400 hover:text-white transition">← Back to Home</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2 rounded-xl text-sm shadow-md transition transform active:scale-95">Register & Launch</button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Image Zoom Lightbox Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full font-bold text-sm transition"
            >
              ✕ Close
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        © 2026 1XORBIT Multi-Tenant Workspace. All rights reserved.
      </footer>
    </div>
  );
}