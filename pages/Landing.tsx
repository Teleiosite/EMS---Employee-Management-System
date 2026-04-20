import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PlatformNavbar from '../components/PlatformNavbar';
import {
  Building2, ArrowRight, CheckCircle, Briefcase, MapPin, Clock, Users, Shield, Zap,
  Menu, X, Mail, Phone, Globe, Award, BarChart3, FileText, Bell, GitBranch,
  Lock, Eye, ChevronDown, Star, TrendingUp, UserCheck, Calendar, DollarSign,
  HeartHandshake, Send, ExternalLink, ChevronRight, Search, MessageSquare, Loader2
} from 'lucide-react';
import api from '../services/api';

// ─── Color pallette variables ───────────────────────────────────────────────

// Primary: Orange (#EA580C)  Accent: Deep navy (#0F172A)  Muted: Slate

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const scrollTarget = searchParams.get('scrollTo');
    if (scrollTarget) {
      setTimeout(() => {
        document.getElementById(`${scrollTarget}-section`)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);




  const scrollToInternal = (id: string) => {
    document.getElementById(`${id}-section`)?.scrollIntoView({ behavior: 'smooth' });
  };

  const modules = [
    { icon: Users, color: 'orange', title: 'Employee Management', desc: 'Full employee profiles, department assignment, role management, and bulk CSV import for seamless onboarding.' },
    { icon: Clock, color: 'blue', title: 'Attendance Tracking', desc: 'Clock-in/clock-out records, monthly summaries, and department-level filtering with real-time dashboards.' },
    { icon: Calendar, color: 'purple', title: 'Leave Management', desc: 'Configurable leave types, balance tracking, approval workflows, and automatic email notifications.' },
    { icon: DollarSign, color: 'green', title: 'Payroll & Payslips', desc: 'Dynamic salary structures, payroll run generation, and PDF payslip download, in minutes, not hours.' },
    { icon: Search, color: 'pink', title: 'AI Recruitment Pipeline', desc: 'Job postings, public careers portal, AI-powered CV scoring via Google Gemini, and a Kanban hiring pipeline.' },
    { icon: Bell, color: 'yellow', title: 'Announcements', desc: 'Company-wide announcements with automatic email broadcast to all employees the moment you publish.' },
    { icon: Eye, color: 'teal', title: 'Audit Trail', desc: 'Every CREATE, UPDATE, and DELETE action is logged with user, IP address, and full JSON payload of changes.' },
    { icon: GitBranch, color: 'indigo', title: 'Organisation Chart', desc: 'Interactive visual org chart showing reporting lines and department structures across your entire organisation.' },
  ];

  const colorMap: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    pink: 'bg-pink-50 text-pink-600 border-pink-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const securityPillars = [
    {
      icon: Shield, title: 'Multi-Tenant Isolation',
      points: [
        'ORM enforcement: every query scoped to your tenant',
        'Middleware guard prevents cross-tenant access',
        'Company A can never see Company B\'s data',
      ],
    },
    {
      icon: Eye, title: 'System-Wide Audit Trail',
      points: [
        'Every CREATE, UPDATE, DELETE is captured',
        'Logs include User, Tenant, IP, User-Agent, JSON payload',
        'Searchable security dashboard for admins',
      ],
    },
    {
      icon: Lock, title: 'Access Control & RBAC',
      points: [
        'Role-Based Access Control (ADMIN, HR_MANAGER, EMPLOYEE)',
        'JWT Authentication with httpOnly cookies',
        'Optional TOTP-based MFA for admin accounts',
      ],
    },
    {
      icon: FileText, title: 'Data Integrity',
      points: [
        'Sensitive fields (passwords, tokens) stripped from logs',
        'Encrypted data at rest and in transit',
        'Regular automated backups included on all plans',
      ],
    },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Direct POST to the core/contact/ endpoint
      await api.post('/core/contact/', contactForm);
      setContactSent(true);
      // Reset form
      setContactForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (err: any) {
      console.error('Contact submission error:', err);
      const detail = err.response?.data?.detail || 'Failed to send message. Please try again later.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ═══════════════════════════════════════════════ NAVBAR */}
      <PlatformNavbar />

      {/* ═══════════════════════════════════════════════ HERO */}
      <div id="home-section" className="pt-24 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
              <Star className="w-4 h-4 fill-orange-400" /> Cloud-Based · Multi-Tenant · AI-Powered
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6">
              The Complete HR Platform <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                for Modern Organisations
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              HireWix digitises and automates the full spectrum of HR operations, from payroll and attendance to AI-powered recruitment, in one secure, cloud-based platform accessible from anywhere.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/register')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-2 hover:scale-105"
              >
                Register Your Company <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="http://yourems.duckdns.org"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-105"
              >
                <ExternalLink className="w-5 h-5" /> View Live Demo
              </a>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { value: '100+', label: 'Companies Served' },
                { value: '10,000+', label: 'Employees Managed' },
                { value: '99.9%', label: 'System Uptime' },
                { value: '2–4 Wks', label: 'To Go Live' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-2xl font-extrabold text-orange-400">{stat.value}</div>
                  <div className="text-xs text-slate-400 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ FEATURES */}
      <div id="features-section" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">Core Modules</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Everything HR, In One Place</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Eight deeply integrated modules covering the entire lifecycle of HR management, from hire to retire.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              const classes = colorMap[mod.color] || colorMap.orange;
              return (
                <div key={i} className="group border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${classes}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">{mod.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ ABOUT US */}
      <div id="about-section" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Company story */}
            <div>
              <div className="inline-block bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6 border border-orange-500/20">About Us</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
                Built by TeleiocraftSolutions.<br />
                <span className="text-orange-400">Powered by Expertise.</span>
              </h2>
              <p className="text-slate-300 text-base leading-relaxed mb-6">
                TeleiocraftSolutions is a software solutions provider with offices in <strong className="text-white">Ilishan-Remo, Ogun State, Nigeria</strong> and <strong className="text-white">Greater London, United Kingdom</strong>. We specialise in the design, development, and deployment of practical, scalable, and secure web-based platforms for organisations across various sectors.
              </p>
              <p className="text-slate-300 text-base leading-relaxed mb-8">
                Our approach combines modern engineering practices with AI-assisted development workflows, enabling us to deliver reliable, high-quality systems within shorter timelines and at competitive costs. We take full ownership of every solution we build, from initial architecture through to production deployment and ongoing support.
              </p>

              {/* Offices */}
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: MapPin, label: 'Nigeria Office', detail: 'Ilishan-Remo, Ogun State' },
                  { icon: Globe, label: 'UK Office', detail: 'Greater London, United Kingdom' },
                  { icon: Mail, label: 'Email', detail: 'TeleiocraftSolutions@gmail.com' },
                  { icon: Phone, label: 'Phone', detail: '08137592915 | 07534 468836' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">{item.label}</div>
                        <div className="text-sm text-white font-semibold">{item.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Services + Team */}
            <div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-400" /> Our Services
                </h3>
                <ul className="space-y-3">
                  {[
                    'Custom SaaS Product Development',
                    'Software & App Development',
                    'UX/UI Design',
                    'Cloud deployment and infrastructure management',
                    'System integration and third-party API connectivity',
                    'AI-powered feature development',
                    'Technical support and system maintenance',
                    'Staff training and onboarding',
                    'White-label platform licensing',
                  ].map((svc, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      {svc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Founder card */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <div className="flex flex-col gap-2"> <b>Visit Our website to learn more</b>
                  <a
                    href="https://teleiocraft.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 text-sm font-bold hover:underline flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" /> teleiocraft.com
                  </a>
                </div>
                <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                  "We stand behind every system we deploy with ongoing support, proactive maintenance, and the flexibility to evolve the platform as your organisation grows."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ BENEFITS STRIP */}
      <div className="py-16 bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: 'Eliminate Manual HR', desc: 'Reduce admin workload and human error significantly.' },
              { icon: BarChart3, title: 'Real-Time Insights', desc: 'Dashboard KPIs give management instant HR visibility.' },
              { icon: UserCheck, title: 'Employee Self-Service', desc: 'Staff handle routine requests independently, reducing HR queries.' },
              { icon: HeartHandshake, title: 'Long-Term Partnership', desc: "We don't just deliver software: we grow with you." },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex items-start gap-4 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1">{b.title}</div>
                    <div className="text-orange-100 text-xs leading-relaxed">{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ SECURITY */}
      <div id="security-section" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4 border border-orange-500/20">Enterprise Security</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Enterprise-First Security Mindset</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Your sensitive HR data remains isolated, auditable, and private. Built with the same security standards trusted by enterprise organisations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityPillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5 border border-orange-500/20">
                    <Icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-4">{pillar.title}</h3>
                  <ul className="space-y-2.5">
                    {pillar.points.map((point, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ CONTACT */}
      <div id="contact-section" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">Contact Us</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Let's Talk About Your Organisation</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Ready to digitise your HR operations? Interested in a pilot? Have questions? Reach out, we typically respond within 24 hours.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Contact details */}
            <div>
              <div className="space-y-5 mb-10">
                {[
                  { icon: Mail, label: 'Email', value: 'TeleiocraftSolutions@gmail.com', href: 'mailto:TeleiocraftSolutions@gmail.com' },
                  { icon: Phone, label: 'Nigeria', value: '08137592915', href: 'tel:+2348137592915' },
                  { icon: Phone, label: 'United Kingdom', value: '07534 468836', href: 'tel:+447534468836' },
                  { icon: Globe, label: 'Website', value: 'https://teleiocraft.com', href: 'https://teleiocraft.com' },
                  { icon: ExternalLink, label: 'Live Demo', value: 'yourems.duckdns.org', href: 'http://yourems.duckdns.org' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <a key={i} href={item.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all group">
                      <div className="w-10 h-10 bg-orange-50 group-hover:bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                        <Icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 font-medium">{item.label}</div>
                        <div className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{item.value}</div>
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Office addresses */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { country: '🇳🇬 Nigeria', address: 'Ilishan-Remo, Ogun State, Nigeria' },
                  { country: '🇬🇧 United Kingdom', address: 'Greater London, United Kingdom' },
                ].map((office, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <div className="font-bold text-gray-900 text-sm mb-2">{office.country}</div>
                    <div className="text-gray-500 text-sm">{office.address}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Contact form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
              {contactSent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 text-sm">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                      <input
                        type="text" required
                        value={contactForm.name}
                        onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                      <input
                        type="email" required
                        value={contactForm.email}
                        onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+234 or +44..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organisation Name</label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))}
                        placeholder="Your company"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
                    <textarea
                      rows={5} required
                      value={contactForm.message}
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us about your organisation and what you're looking for…"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all resize-none"
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full ${submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'} text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 ${!submitting && 'hover:scale-105'}`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Message
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400">We respond within 24 hours on business days.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ FOOTER */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/30">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-white">HireWix</div>
                  <div className="text-[10px] text-orange-400 font-semibold tracking-widest uppercase">by TeleiocraftSolutions</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                A cloud-based, multi-tenant Employee Management System designed to digitise and automate the full spectrum of HR operations.
              </p>
              <a
                href="https://teleiocraft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:underline flex items-center gap-1 mt-2"
              >
                <Globe className="w-3 h-3" /> Website: https://teleiocraft.com
              </a>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4 uppercase tracking-widest">Platform</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', onClick: () => scrollToInternal('features') },
                  { label: 'Pricing', onClick: () => scrollToInternal('pricing') },
                  { label: 'Security', onClick: () => scrollToInternal('security') },
                  { label: 'Live Demo', onClick: () => window.open('http://yourems.duckdns.org', '_blank') },
                  { label: 'Register Company', onClick: () => navigate('/register') },
                ].map((link, i) => (
                  <li key={i}>
                    <button onClick={link.onClick} className="text-slate-400 hover:text-orange-400 text-sm transition-colors">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4 uppercase tracking-widest">Company</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'About Us', onClick: () => scrollToInternal('about') },
                  { label: 'Careers', onClick: () => scrollToInternal('careers') },
                  { label: 'Contact', onClick: () => scrollToInternal('contact') },
                  { label: 'teleiocraft.com', onClick: () => window.open('https://teleiocraft.com', '_blank') },
                ].map((link, i) => (
                  <li key={i}>
                    <button onClick={link.onClick} className="text-slate-400 hover:text-orange-400 text-sm transition-colors">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4 uppercase tracking-widest">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-400 text-sm">
                  <Mail className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <a href="mailto:TeleiocraftSolutions@gmail.com" className="hover:text-orange-400 transition-colors break-all">
                    TeleiocraftSolutions@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2 text-slate-400 text-sm">
                  <Phone className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <a href="tel:+2348137592915" className="hover:text-orange-400 transition-colors">08137592915</a>
                </li>
                <li className="flex items-center gap-2 text-slate-400 text-sm">
                  <Phone className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <a href="tel:+447534468836" className="hover:text-orange-400 transition-colors">07534 468836</a>
                </li>
                <li className="flex items-start gap-2 text-slate-400 text-sm">
                  <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Ilishan-Remo, Nigeria &amp; Greater London, UK</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 TeleiocraftSolutions. All rights reserved. · HireWix EMS
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/login')} className="text-slate-500 hover:text-orange-400 text-sm transition-colors">Login</button>
              <button onClick={() => navigate('/register')} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-orange-500/30">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
