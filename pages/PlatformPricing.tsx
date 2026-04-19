import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ChevronRight, Star, MessageSquare, Zap, Shield } from 'lucide-react';
import PlatformNavbar from '../components/PlatformNavbar';

const PlatformPricing: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Starter',
      subtitle: 'Essentials for Small Teams (up to 25)',
      monthlyNGN: '₦168,000', monthlyGBP: '£105',
      annualNGN: '₦1,680,000', annualGBP: '£1,050',
      badge: null,
      features: [
        'Full Core HR Suite (Employees, Leaves, Attendance)',
        'Up to 25 Active Employee Profiles',
        'Basic Recruitment (1 Active Job Posting)',
        'Self-Service Employee Dashboard',
        'Standard Email & WhatsApp Support',
        'Secure Cloud Hosting & SSL Included',
      ],
      cta: 'Get Started',
      highlight: false,
    },
    {
      name: 'Business',
      subtitle: 'Advanced Controls for Growing Orgs (up to 100)',
      monthlyNGN: '₦350,000', monthlyGBP: '£220',
      annualNGN: '₦3,500,000', annualGBP: '£2,200',
      badge: 'MOST POPULAR',
      features: [
        'All Starter features included',
        'Up to 100 Active Employee Profiles',
        'Advanced Payroll Management (Auto-Payslips)',
        'Unlimited Recruitment & AI Candidate Parsing',
        'Workforce Insights & Performance Tracking',
        'Automated Data Backups & Priority Support',
      ],
      cta: 'Choose Business',
      highlight: true,
    },
    {
      name: 'Enterprise',
      subtitle: 'Ultimate Platform for Global Scale',
      monthlyNGN: '₦560,000 – ₦980,000', monthlyGBP: '£350 – £615',
      annualNGN: 'Negotiable', annualGBP: 'Contact us',
      badge: null,
      features: [
        'All Business features included',
        'Unlimited Employee Profiles & Multi-Entity Scale',
        'Full White-Label Rebranding (Logo, Colors, Domain)',
        'Custom Workflow Automation & API Integration',
        'Survey, Sentiment & Engagement Dashboard',
        'Dedicated Account Manager & 24/7 Support',
      ],
      cta: 'Contact Us',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans pt-24">
      <PlatformNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">Transparent Pricing</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Flexible Plans for Every Organisation</h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            All plans include full system access, cloud hosting, security maintenance, and technical support. Prices in NGN and GBP.
          </p>

          <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            {(['monthly', 'annual'] as const).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === cycle ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {cycle === 'monthly' ? 'Monthly' : 'Annual'} {cycle === 'annual' && <span className="text-xs font-normal ml-1">(Save 15%)</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 flex flex-col relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${plan.highlight
                ? 'bg-slate-900 text-white shadow-2xl ring-2 ring-orange-500 scale-105'
                : 'bg-white border border-gray-200 text-gray-900'
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-extrabold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm ${plan.highlight ? 'text-slate-400' : 'text-gray-500'}`}>{plan.subtitle}</p>
              </div>

              <div className="mb-8">
                <div className={`text-3xl font-extrabold ${plan.highlight ? 'text-orange-400' : 'text-gray-900'}`}>
                  {billingCycle === 'monthly' ? plan.monthlyNGN : plan.annualNGN}
                </div>
                <div className={`text-sm ${plan.highlight ? 'text-slate-400' : 'text-gray-500'}`}>
                  {billingCycle === 'monthly' ? plan.monthlyGBP : plan.annualGBP} · {billingCycle === 'monthly' ? '/month' : '/year'}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f, fi) => (
                  <li key={fi} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-slate-300' : 'text-gray-600'}`}>
                    <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-orange-400' : 'text-green-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.cta === 'Contact Us' ? navigate('/') : navigate('/register')}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.highlight
                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* White Label + Setup Costs */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white border border-orange-500/30">
            <div className="inline-block bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-orange-500/20 mb-5">
              White-Label Ownership Plan
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">Launch HireWix as Your Own Brand</h3>
            <p className="text-slate-400 text-sm mb-5">For governments, parastatals, HR consultancies, and entrepreneurs who want a market-ready HR platform under their own identity.</p>
            <div className="mb-5">
              <div className="text-2xl font-extrabold text-orange-400">Custom Pricing</div>
              <div className="text-slate-400 text-sm">Reach out to us for a tailored quote</div>
            </div>
            <ul className="space-y-2 mb-6">
              {[
                'Full rebranding rights — your name, logo, colours',
                'Custom domain (hr.yourcompany.com)',
                'White-labelled UI (no HireWix/TCS mentions)',
                'Custom email templates in your brand',
                'Dedicated onboarding by our engineering team',
                '6 months post-deployment technical support',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/')} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/30">
              Enquire About White-Label
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 transition-all hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-orange-900 mb-1">Pilot Offer Available</h4>
                  <p className="text-orange-700 text-sm leading-relaxed">
                    Evaluate HireWix in a controlled environment. We offer a <strong>pilot phase pricing arrangement</strong> for initial adoption.
                  </p>
                  <button onClick={() => navigate('/')} className="mt-3 text-orange-600 font-bold text-sm hover:underline flex items-center gap-1">
                    Discuss a Pilot <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 transition-all hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-3">Technical Support Plans</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" /> Basic Support
                      </span>
                      <span className="font-bold text-gray-900">Included</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" /> Premium Support
                      </span>
                      <span className="font-bold text-gray-900">₦70k / Mo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white border border-white/10 transition-all hover:shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Uptime SLA</div>
                  <div className="text-2xl font-extrabold text-orange-400">99.9%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Backups</div>
                  <div className="text-2xl font-extrabold text-blue-400">Daily</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-green-400" /> Enterprise-grade data encryption at rest
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">6-Stage Implementation Process</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { n: '01', title: 'Requirements', desc: 'Detailed discussion to document workflows and roles' },
              { n: '02', title: 'Configuration', desc: 'Customise to your org structure and branding' },
              { n: '03', title: 'Deployment', desc: 'Cloud server, SSL, domain, and production setup' },
              { n: '04', title: 'Testing', desc: 'Full module testing with your team before go-live' },
              { n: '05', title: 'Training', desc: 'Training sessions for admins, HR, and employees' },
              { n: '06', title: 'Go-Live', desc: 'Launch with 30-day close monitoring period' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl font-extrabold text-sm flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30">
                  {step.n}
                </div>
                <div className="font-bold text-gray-900 text-sm mb-1">{step.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6 font-medium">
            ⏱ Estimated timeline: <strong className="text-gray-900">2–4 weeks</strong> from contract signing to go-live
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlatformPricing;
