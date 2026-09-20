import React, { useState } from 'react';
import { 
  Building2, Receipt, BookOpen, 
  Coins, Gem, Scale, BarChart3, Users, ArrowRight, 
  CheckCircle2, Phone, Mail, MapPin, MessageSquare, 
  FileCheck2, Send, HeartHandshake, Sparkles, Landmark, 
  ShieldCheck, IndianRupee, Flame 
} from 'lucide-react';
import { useRouter } from '../router/Router';
import { saasService } from '../services/saasService';

// --- Decorative Indic SVG motifs ---

const KonarkChakra: React.FC<{ className?: string; spokes?: number }> = ({ className, spokes = 16 }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none" stroke="currentColor">
    <circle cx="100" cy="100" r="95" strokeWidth="2.5" />
    <circle cx="100" cy="100" r="84" strokeWidth="1" />
    <circle cx="100" cy="100" r="30" strokeWidth="2.5" />
    <circle cx="100" cy="100" r="9" fill="currentColor" stroke="none" />
    {Array.from({ length: spokes }).map((_, i) => (
      <g key={i} transform={`rotate(${(i * 360) / spokes} 100 100)`}>
        <line x1="100" y1="30" x2="100" y2="70" strokeWidth="2" />
        <circle cx="100" cy="22" r="3.5" fill="currentColor" stroke="none" />
      </g>
    ))}
  </svg>
);

type TempleVariant = 'gopuram' | 'shikhara' | 'deul' | 'vimana' | 'konark' | 'trikuta';

const TempleGlyph: React.FC<{ variant: TempleVariant; className?: string }> = ({ variant, className }) => {
  const props = { className, viewBox: '0 0 100 120', 'aria-hidden': true as const, fill: 'currentColor' as const };
  const tier = 'rgba(255,255,255,0.28)';
  switch (variant) {
    case 'gopuram':
      return (
        <svg {...props}>
          <polygon points="8,120 14,90 86,90 92,120" />
          <polygon points="14,90 20,66 80,66 86,90" />
          <polygon points="20,66 26,44 74,44 80,66" />
          <polygon points="27,44 50,22 73,44" />
          <rect x="45" y="10" width="10" height="14" rx="3" />
          <circle cx="50" cy="8" r="5" />
          <g stroke={tier} strokeWidth="2">
            <line x1="16" y1="90" x2="84" y2="90" />
            <line x1="21" y1="66" x2="79" y2="66" />
          </g>
        </svg>
      );
    case 'shikhara':
      return (
        <svg {...props}>
          <path d="M30 120 L30 60 Q30 22 50 10 Q70 22 70 60 L70 120 Z" />
          <ellipse cx="50" cy="16" rx="10" ry="4" />
          <rect x="47" y="4" width="6" height="10" rx="2" />
          <path d="M40 60 Q40 30 50 18 Q60 30 60 60 Z" fill={tier} />
        </svg>
      );
    case 'deul':
      return (
        <svg {...props}>
          <path d="M26 120 L30 46 Q30 18 50 8 Q70 18 70 46 L74 120 Z" />
          <circle cx="50" cy="12" r="6" />
          <g stroke={tier} strokeWidth="1.5">
            <line x1="42" y1="30" x2="42" y2="118" />
            <line x1="50" y1="24" x2="50" y2="118" />
            <line x1="58" y1="30" x2="58" y2="118" />
          </g>
        </svg>
      );
    case 'vimana':
      return (
        <svg {...props}>
          <polygon points="16,120 22,96 78,96 84,120" />
          <polygon points="22,96 27,74 73,74 78,96" />
          <polygon points="27,74 32,52 68,52 73,74" />
          <polygon points="32,52 37,32 63,32 68,52" />
          <polygon points="38,32 50,16 62,32" />
          <circle cx="50" cy="12" r="5" />
          <g stroke={tier} strokeWidth="2">
            <line x1="23" y1="96" x2="77" y2="96" />
            <line x1="28" y1="74" x2="72" y2="74" />
            <line x1="33" y1="52" x2="67" y2="52" />
          </g>
        </svg>
      );
    case 'konark':
      return (
        <svg {...props} fill="none" stroke="currentColor">
          <rect x="10" y="104" width="80" height="14" rx="2" fill="currentColor" stroke="none" />
          <circle cx="50" cy="62" r="38" strokeWidth="5" />
          <circle cx="50" cy="62" r="10" strokeWidth="4" />
          <circle cx="50" cy="62" r="3" fill="currentColor" stroke="none" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="50" y1="62" x2="50" y2="27" strokeWidth="2.5" transform={`rotate(${i * 30} 50 62)`} />
          ))}
        </svg>
      );
    case 'trikuta':
      return (
        <svg {...props}>
          <path d="M14 120 L16 74 Q16 58 26 52 Q36 58 36 74 L36 120 Z" />
          <path d="M64 120 L64 74 Q64 58 74 52 Q84 58 84 74 L86 120 Z" />
          <path d="M36 120 L38 52 Q38 26 50 14 Q62 26 62 52 L64 120 Z" />
          <circle cx="26" cy="50" r="4" />
          <circle cx="74" cy="50" r="4" />
          <circle cx="50" cy="12" r="5" />
        </svg>
      );
    default:
      return null;
  }
};

const TempleSkyline: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <div className="flex items-end justify-center gap-1 sm:gap-3">
      <TempleGlyph variant="gopuram" className="w-16 sm:w-20 h-auto text-[#7c2d12]/85" />
      <TempleGlyph variant="shikhara" className="w-12 sm:w-16 h-auto text-[#9a3412]/85" />
      <TempleGlyph variant="vimana" className="w-20 sm:w-28 h-auto text-[#7c2d12]" />
      <TempleGlyph variant="konark" className="w-16 sm:w-20 h-auto text-[#9a3412]/85" />
      <TempleGlyph variant="deul" className="w-12 sm:w-16 h-auto text-[#7c2d12]/85" />
      <TempleGlyph variant="trikuta" className="w-16 sm:w-24 h-auto text-[#9a3412]/80" />
    </div>
  </div>
);

const ToranaDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center justify-center gap-3 ${className ?? ''}`} aria-hidden="true">
    <span className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-orange-300" />
    <Flame className="w-4 h-4 text-orange-500" />
    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
    <KonarkChakra className="w-6 h-6 text-orange-500" spokes={12} />
    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
    <Flame className="w-4 h-4 text-orange-500" />
    <span className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-orange-300" />
  </div>
);

export const MarketingLandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [formData, setFormData] = useState({
    name: '', templeName: '', city: '', phone: '', email: '', counters: '1-3', message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = 'Please enter your full name.';
    if (!formData.templeName.trim()) next.templeName = 'Please enter your temple or trust name.';
    if (!formData.city.trim()) next.city = 'Please enter your city and state.';
    const phone = formData.phone.replace(/[\s-]/g, '');
    if (!phone) next.phone = 'Please enter a contact number.';
    else if (!/^\+?\d{10,13}$/.test(phone)) next.phone = 'Enter a valid mobile number.';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      next.email = 'Enter a valid email address.';
    return next;
  };

  const setField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      <div className="shimmer-bar h-1.5 w-full" />
      <header className="bg-white/90 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('home')} className="flex items-center gap-3 cursor-pointer">
            {logoError ? (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-sm">
                <img src="/diya.svg" alt="" className="w-8 h-8" />
              </div>
            ) : (
              <img
                src="/tatva-logo.png"
                alt="TATVa"
                onError={() => setLogoError(true)}
                className="w-12 h-12 rounded-full object-contain shadow-sm"
              />
            )}
            <div className="leading-tight text-left">
              <div className="font-extrabold text-2xl tracking-tight text-orange-600">TATVa</div>
              <p className="text-[10px] text-stone-500 font-semibold">Temple Administration, Trust &amp; Value Accounting</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <button onClick={() => navigate('home')} className="text-orange-600 border-b-2 border-orange-500 pb-0.5 cursor-pointer">Home</button>
            <a href="#features" className="hover:text-orange-600 transition-colors">Features</a>
            <a href="#about" className="hover:text-orange-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-orange-600 transition-colors">Contact</a>
            <button onClick={() => navigate('admin')} className="text-purple-700 hover:text-purple-900 transition-colors font-bold cursor-pointer">SuperAdmin</button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('temple/pos')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-md shadow-orange-600/25 cursor-pointer"
            >
              Temple Login
            </button>
            <a
              href="#contact"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-orange-600 bg-white border border-orange-300 hover:bg-orange-50 transition-all"
            >
              Sign Up
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fff7ec] via-[#fffaf3] to-[#FFFDF9]">
        {/* Decorative chakras + dotted texture */}
        <KonarkChakra className="pointer-events-none absolute -top-24 -right-24 w-[26rem] h-[26rem] text-orange-200/40" spokes={24} />
        <KonarkChakra className="pointer-events-none absolute top-40 -left-28 w-72 h-72 text-amber-200/30" spokes={16} />
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(234,88,12,0.10) 1px, transparent 0)', backgroundSize: '22px 22px' }} />

        <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-orange-200 shadow-xs text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
                <Sparkles className="w-3.5 h-3.5" />
                Sanatana Temple Operating System
              </div>

              <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-stone-900 leading-[1.04]">
                Where Devotion<br />Meets
                <span className="block text-gradient-saffron">Diligent Accounting</span>
              </h1>

              <p className="mt-6 text-base md:text-lg text-stone-600 max-w-xl leading-relaxed">
                TATVa unites the timeless discipline of temple seva with modern, transparent
                bookkeeping — donations, hundi, expenses, devotees and trust governance, all in one sacred ledger.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a
                  href="#contact"
                  className="btn-press px-7 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2.5"
                >
                  <span>Begin Your Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    const demoUrl = saasService.getSubdomainUrl('sidhodlur');
                    if (demoUrl.startsWith('http') && !demoUrl.includes(window.location.host)) {
                      window.location.href = demoUrl;
                    } else {
                      navigate('tenant/sidhodlur');
                    }
                  }}
                  className="btn-press px-7 py-3.5 bg-white hover:bg-amber-50 text-stone-800 border border-orange-200 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Flame className="w-5 h-5 text-orange-600" />
                  <span>Explore Live Demo</span>
                </button>
              </div>

              <div className="mt-8 text-xs font-bold tracking-[0.22em] text-orange-500 uppercase">
                Seva <span className="text-orange-300">•</span> Shradha <span className="text-orange-300">•</span> Satya
              </div>

              <div className="mt-8 grid grid-cols-3 max-w-md gap-4">
                {[
                  { icon: Landmark, k: '500+', v: 'Temples & Trusts' },
                  { icon: IndianRupee, k: '3 sec', v: 'Per Seva Receipt' },
                  { icon: ShieldCheck, k: '80G', v: 'Form 10BD Ready' },
                ].map(({ icon: Icon, k, v }) => (
                  <div key={v} className="rounded-2xl bg-white/80 border border-orange-100 p-3 text-center shadow-xs">
                    <Icon className="w-4 h-4 mx-auto text-orange-600" />
                    <div className="mt-1.5 text-lg font-black text-stone-900 leading-none">{k}</div>
                    <div className="text-[10px] font-semibold text-stone-500 mt-1 leading-tight">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sacred skyline panel */}
            <div className="relative">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-orange-900/20 border border-orange-200/60">
                <div className="relative h-[420px] md:h-[480px] bg-gradient-to-b from-[#fde3a7] via-[#f8b25c] to-[#e2712b]">
                  {/* Sun + rays */}
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-[#fff3cf] shadow-[0_0_80px_28px_rgba(255,240,180,0.7)]" />
                  <KonarkChakra className="absolute top-6 left-1/2 -translate-x-1/2 w-40 h-40 text-orange-900/15" spokes={24} />
                  <div className="pointer-events-none absolute top-[100px] left-1/2 -translate-x-1/2 w-72 h-72">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute left-1/2 top-0 h-32 w-0.5 bg-white/25 origin-bottom"
                        style={{ transform: `rotate(${i * 30}deg)` }}
                      />
                    ))}
                  </div>
                  {/* Temple skyline */}
                  <div className="absolute bottom-0 left-0 right-0">
                    <TempleSkyline className="px-4" />
                    <div className="h-6 bg-[#5c2410]" />
                  </div>
                </div>
                {/* Quote */}
                <div className="absolute top-6 left-6 max-w-[200px]">
                  <p className="font-serif text-xl md:text-2xl text-[#5c2410] leading-snug drop-shadow-sm">
                    &ldquo;Faith Well Managed Creates a Better Tomorrow&rdquo;
                  </p>
                  <div className="mt-3 w-12 h-0.5 bg-[#5c2410]/70" />
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl border border-orange-100 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-black text-stone-900">Transparent Seva</div>
                  <div className="text-[10px] text-stone-500 font-semibold">Every rupee accounted</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="relative max-w-6xl mx-auto px-6 -mt-20 z-10">
          <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-orange-100 grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-stone-100">
            {[
              { icon: HeartHandshake, label: 'Donation Management' },
              { icon: Receipt, label: 'Expense Tracking' },
              { icon: Users, label: 'Devotee Management' },
              { icon: Building2, label: 'Trust Administration' },
              { icon: BarChart3, label: 'Reports & Transparency' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="group flex flex-col items-center text-center gap-2.5 px-4 py-6">
                <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-stone-700 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Temples intro */}
      <section id="about" className="py-20 bg-[#FFFDF9]">
        <div className="max-w-7xl mx-auto px-6">
          <ToranaDivider className="mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-stone-900 leading-tight">
                Built for Temples.<br />
                <span className="text-gradient-saffron">Designed for Trust.</span>
              </h2>
              <div className="mt-4 w-16 h-1 bg-orange-500 rounded-full" />
            </div>
            <p className="text-sm md:text-base text-stone-600 leading-relaxed lg:pt-2">
              TATVa is a modern, easy-to-use platform for temples and religious trusts to manage their daily operations, finances and community engagement — with complete transparency and accountability, honouring the sacred trust placed in you by every devotee.
            </p>
          </div>
        </div>

        {/* Temple heritage showcase */}
        <div className="mt-16 max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-b from-[#fff8ee] to-white p-8 md:p-12 shadow-xs">
            <KonarkChakra className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 text-orange-100" spokes={24} />
            <div className="relative text-center max-w-2xl mx-auto">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Inspired by India&rsquo;s Temple Heritage</h3>
              <p className="mt-2 font-serif text-2xl md:text-3xl font-black text-stone-900">One Platform for Every Sacred Style</p>
              <p className="mt-3 text-sm text-stone-500">From soaring Dravidian gopurams to curvilinear Nagara shikharas — TATVa serves every tradition of worship across Bharat.</p>
            </div>
            <div className="relative mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { variant: 'gopuram', name: 'Meenakshi', style: 'Dravidian Gopuram' },
                { variant: 'vimana', name: 'Brihadeeswara', style: 'Chola Vimana' },
                { variant: 'konark', name: 'Konark', style: 'Sun Temple Wheel' },
                { variant: 'deul', name: 'Jagannath Puri', style: 'Kalinga Deul' },
                { variant: 'shikhara', name: 'Kashi Vishwanath', style: 'Nagara Shikhara' },
                { variant: 'trikuta', name: 'Chennakeshava', style: 'Hoysala Trikuta' },
              ].map((t) => (
                <div key={t.name} className="group flex flex-col items-center text-center">
                  <div className="h-28 flex items-end justify-center">
                    <TempleGlyph variant={t.variant as TempleVariant} className="w-16 h-auto text-orange-700 transition-all duration-300 group-hover:text-orange-500 group-hover:-translate-y-1" />
                  </div>
                  <div className="mt-3 text-sm font-black text-stone-900">{t.name}</div>
                  <div className="text-[11px] font-semibold text-orange-600">{t.style}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="flex justify-center mb-4"><KonarkChakra className="w-8 h-8 text-orange-400" spokes={16} /></div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Platform Capabilities</h2>
            <p className="font-serif text-3xl font-black text-stone-900">Purpose-Built for Religious Accounting &amp; Temple Operations</p>
            <p className="text-sm text-stone-500 mt-3">
              Standard commercial accounting tools lack hundi counting, seva registers, and patron gotra directories. TATVa is designed specifically for religious trusts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-stone-200 hover:border-orange-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">High-Speed POS & Seva Counter</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Issue Archana, Abhishekam, and Annadanam receipts in under 3 seconds. Supports cash, dynamic UPI QR display on screen, and instant 58mm/80mm thermal printing.
              </p>
            </div>

            <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-stone-200 hover:border-orange-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Daybook & Cash Flow Register</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Daily opening cash, counter collection tallies, disbursements, and end-of-shift cash drawer handover with automated variance detection.
              </p>
            </div>

            <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-stone-200 hover:border-orange-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Hundi Unsealing & Counting Sessions</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Record official box unsealing with dual-trustee witness names. Input complete currency denominations (500, 200, 100, coins, gold) and directly post to bank deposit ledgers.
              </p>
            </div>

            <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-stone-200 hover:border-orange-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Double-Entry General Ledger</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Strict double-entry accounting with standardized Chart of Accounts tailored for Hindu religious trusts: Corpus Fund, Building Fund, Annadanam, and Festival Reserves.
              </p>
            </div>

            <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-stone-200 hover:border-orange-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Gem className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Sacred Assets & Jewelry Registry</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Track temple gold crowns, silver vahanas, immovable land parcels, and survey numbers. Log custodian checkout, festival adornments, and vault returns.
              </p>
            </div>

            <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-stone-200 hover:border-orange-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Statutory Audit & 80G Form 10BD</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                1-Click generation and CSV export of Form 10BD statement of donations for seamless electronic filing with the Indian Income Tax Department.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Governance */}
      <section id="roles" className="py-20 bg-[#FFFDF9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="flex justify-center mb-4"><KonarkChakra className="w-8 h-8 text-orange-400" spokes={16} /></div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Security &amp; Access Control</h2>
            <p className="font-serif text-3xl font-black text-stone-900">Strict Role-Based Operational Permissions</p>
            <p className="text-sm text-stone-500 mt-3">
              Every staff member, accountant, board trustee, and external statutory auditor gets an interface customized to their duties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm mb-4">01</div>
              <h3 className="text-base font-bold text-stone-900">Counter Cashier</h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Restricted high-speed interface. Access only to donation booking, receipt reprint, and shift drawer handover. Cannot view overall temple profit and loss.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm mb-4">02</div>
              <h3 className="text-base font-bold text-stone-900">Chief Accountant</h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Full operational accounting control: daybook, journal vouchers, vendor disbursements, bank reconciliation, balance sheet, and devotee directories.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm mb-4">03</div>
              <h3 className="text-base font-bold text-stone-900">Trustee / President</h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Executive oversight: Real-time collection numbers, voucher sanction approvals, hundi unsealing verification, and sacred jewelry registry.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm mb-4">04</div>
              <h3 className="text-base font-bold text-stone-900">Statutory Auditor</h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Read-only compliance portal for Chartered Accountants. Verify sequential receipt continuity, check voided logs, and export Form 10BD statements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-b from-[#FFFDF9] to-[#fff6ea]">
        <div className="max-w-7xl mx-auto px-6">
          <ToranaDivider className="mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Get in Touch</h2>
                <h3 className="text-3xl font-extrabold text-stone-900">Schedule a Live Demonstration or Onboard Your Trust</h3>
                <p className="text-sm text-stone-600 mt-3 leading-relaxed">
                  Our religious trust implementation specialists will guide your executive board through account setup, chart of accounts migration from physical books or Tally, and counter operator training.
                </p>
              </div>

              <div className="space-y-4 pt-4 text-sm text-stone-700">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <div className="p-3 animate-fade-in bg-orange-50 text-orange-600 rounded-xl">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400 font-bold uppercase">Direct Phone Support</div>
                    <div className="font-bold text-stone-900 mt-0.5">+91 (80) 4567-8900</div>
                    <div className="text-xs text-stone-500">Monday - Saturday: 9:00 AM - 7:00 PM IST</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400 font-bold uppercase">WhatsApp Onboarding Desk</div>
                    <div className="font-bold text-stone-900 mt-0.5">+91 98765 43210</div>
                    <div className="text-xs text-stone-500">Instant chat assistance for temple administrators</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400 font-bold uppercase">Official Email</div>
                    <div className="font-bold text-stone-900 mt-0.5">onboarding@tatva.org</div>
                    <div className="text-xs text-stone-500">trustsupport@tatva.org</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400 font-bold uppercase">Registered Office</div>
                    <div className="font-bold text-stone-900 mt-0.5">TATVa Technologies Private Limited</div>
                    <div className="text-xs text-stone-500">Sanatana Technology Park, Bengaluru, Karnataka - 560085, India</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50">
              {formSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-bold text-stone-900">Thank You for Reaching Out!</h4>
                  <p className="text-sm text-stone-600 max-w-md mx-auto">
                    Our temple trust onboarding team will contact you within 2 business hours on <span className="font-bold">{formData.phone || 'your phone number'}</span> to schedule a personalized walkthrough.
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all mt-4"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
                  <div>
                    <h4 className="text-xl font-bold text-stone-900">Request a Personalized Demo</h4>
                    <p className="text-stone-500 mt-1">Fill out the form below and we will tailor a sandbox instance for your temple trust.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label htmlFor="lead-name" className="font-semibold text-stone-700 block mb-1">Your Full Name *</label>
                      <input
                        id="lead-name"
                        type="text"
                        required
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'lead-name-err' : undefined}
                        placeholder="e.g. Ramesh Sharma"
                        value={formData.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 ${errors.name ? 'border-rose-400 focus:ring-rose-500/20' : 'border-stone-200 focus:ring-orange-500/20'}`}
                      />
                      {errors.name && <p id="lead-name-err" role="alert" className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="lead-temple" className="font-semibold text-stone-700 block mb-1">Temple / Trust Name *</label>
                      <input
                        id="lead-temple"
                        type="text"
                        required
                        aria-invalid={!!errors.templeName}
                        aria-describedby={errors.templeName ? 'lead-temple-err' : undefined}
                        placeholder="e.g. Shri Siddeswar Temple Trust"
                        value={formData.templeName}
                        onChange={(e) => setField('templeName', e.target.value)}
                        className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 ${errors.templeName ? 'border-rose-400 focus:ring-rose-500/20' : 'border-stone-200 focus:ring-orange-500/20'}`}
                      />
                      {errors.templeName && <p id="lead-temple-err" role="alert" className="text-[11px] text-rose-600 mt-1">{errors.templeName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="lead-city" className="font-semibold text-stone-700 block mb-1">City & State *</label>
                      <input
                        id="lead-city"
                        type="text"
                        required
                        aria-invalid={!!errors.city}
                        aria-describedby={errors.city ? 'lead-city-err' : undefined}
                        placeholder="e.g. Kalaburgi, Karnataka"
                        value={formData.city}
                        onChange={(e) => setField('city', e.target.value)}
                        className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 ${errors.city ? 'border-rose-400 focus:ring-rose-500/20' : 'border-stone-200 focus:ring-orange-500/20'}`}
                      />
                      {errors.city && <p id="lead-city-err" role="alert" className="text-[11px] text-rose-600 mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label htmlFor="lead-phone" className="font-semibold text-stone-700 block mb-1">Mobile / WhatsApp Number *</label>
                      <input
                        id="lead-phone"
                        type="tel"
                        required
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'lead-phone-err' : undefined}
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 ${errors.phone ? 'border-rose-400 focus:ring-rose-500/20' : 'border-stone-200 focus:ring-orange-500/20'}`}
                      />
                      {errors.phone && <p id="lead-phone-err" role="alert" className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="lead-email" className="font-semibold text-stone-700 block mb-1">Email Address</label>
                      <input
                        id="lead-email"
                        type="email"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'lead-email-err' : undefined}
                        placeholder="trustoffice@temple.org"
                        value={formData.email}
                        onChange={(e) => setField('email', e.target.value)}
                        className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 ${errors.email ? 'border-rose-400 focus:ring-rose-500/20' : 'border-stone-200 focus:ring-orange-500/20'}`}
                      />
                      {errors.email && <p id="lead-email-err" role="alert" className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="lead-counters" className="font-semibold text-stone-700 block mb-1">Expected Active Counters</label>
                      <select
                        id="lead-counters"
                        value={formData.counters}
                        onChange={(e) => setField('counters', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
                      >
                        <option value="1">1 Counter (Neighborhood Temple)</option>
                        <option value="2-4">2 - 4 Counters (Medium Trust)</option>
                        <option value="5+">5+ Counters (Historic / Multi-Branch)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lead-message" className="font-semibold text-stone-700 block mb-1">Specific Requirements / Notes</label>
                    <textarea
                      id="lead-message"
                      rows={3}
                      placeholder="Tell us about your temple, current accounting system, or special requirements..."
                      value={formData.message}
                      onChange={(e) => setField('message', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/25 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit Demo Request
                  </button>

                  <div className="text-[10px] text-stone-400 text-center pt-2">
                    Zero spam. Your trust details are kept confidential under strict religious trust privacy guidelines.
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-12 border-t border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-base text-orange-400">
              {logoError ? (
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                  <img src="/diya.svg" alt="" className="w-5 h-5" />
                </div>
              ) : (
                <img
                  src="/tatva-logo.png"
                  alt="TATVa"
                  onError={() => setLogoError(true)}
                  className="w-7 h-7 rounded-full object-contain"
                />
              )}
              <span>TATVa</span>
            </div>
            <p className="text-stone-400 text-xs mt-2 leading-relaxed">
              Standardized Financial & Donation Management System designed specifically for religious trusts and places of worship.
            </p>
          </div>

          <div>
            <div className="font-bold text-stone-200 mb-3 uppercase tracking-wider text-[11px]">Direct Portals</div>
            <ul className="space-y-2 text-stone-400">
              <li><button onClick={() => navigate('temple/pos')} className="hover:text-white">Temple Operations Portal</button></li>
              <li><button onClick={() => navigate('admin')} className="hover:text-white">Platform SuperAdmin</button></li>
              <li><a href="#features" className="hover:text-white">Core Modules</a></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-stone-200 mb-3 uppercase tracking-wider text-[11px]">Compliance Standards</div>
            <ul className="space-y-2 text-stone-400">
              <li>Income Tax Section 12A / 12AB</li>
              <li>Section 80G Form 10BD Format</li>
              <li>ICAI Non-Profit Guidelines</li>
              <li>Statutory Audit Trail Compliance</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-stone-200 mb-3 uppercase tracking-wider text-[11px]">Support & Inquiries</div>
            <p className="text-stone-400 leading-relaxed">
              Phone: +91 (80) 4567-8900<br />
              Email: support@tatva.org<br />
              Bengaluru, Karnataka, India
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-stone-800 text-center text-stone-500 text-[11px]">
          (C) 2026 TATVa Technologies Pvt. Ltd. All rights reserved. English language edition.
        </div>
      </footer>
    </div>
  );
};
