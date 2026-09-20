import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  AlertCircle, 
  ShieldCheck, 
  MapPin, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Crown,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { Tenant, StaffAccount } from '../../types/saas';
import { storageService } from '../../services/storageService';
import { useRouter } from '../../router/Router';

interface TempleLoginPageProps {
  tenant: Tenant;
  onLoginSuccess: (staffUser: StaffAccount) => void;
}

export const TempleLoginPage: React.FC<TempleLoginPageProps> = ({ tenant, onLoginSuccess }) => {
  const { navigate } = useRouter();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAutoFillTrustee = () => {
    const trustee = (tenant.staffAccounts || []).find((staff) => staff.role === 'trustee' && staff.isActive !== false);
    setUsername(trustee?.username || 'trustee');
    setPassword(trustee?.password || trustee?.pin || '');
    setErrorMsg(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMsg('Please enter both Username and Password.');
      return;
    }

    // 1. Gather all possible staff accounts from active tenant and local storage
    const storageUsers = storageService.getUsers();
    const combinedStaff: StaffAccount[] = [
      ...(tenant.staffAccounts || []),
      ...storageUsers.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        password: u.password || '',
        role: u.role as any,
        counterName: u.counterName,
        pin: u.pin || '',
        isActive: u.isActive !== false,
      }))
    ];

    // Find matched staff by exact username or email (case-insensitive)
    const matchedStaff = combinedStaff.find((s) => {
      const u = (s.username || s.name).toLowerCase().trim();
      const email = (s.email || '').toLowerCase().trim();
      return u === cleanUsername || email === cleanUsername;
    });

    if (!matchedStaff) {
      setErrorMsg('Invalid username or password.');
      return;
    }

    // Validate ONLY against this account's own credentials (password or numeric PIN).
    const accountPassword = matchedStaff.password ? String(matchedStaff.password).trim() : '';
    const accountPin = matchedStaff.pin ? String(matchedStaff.pin).trim() : '';
    const isPasswordValid =
      (accountPassword !== '' && cleanPassword === accountPassword) ||
      (accountPin !== '' && cleanPassword === accountPin);

    if (!isPasswordValid) {
      setErrorMsg('Invalid username or password.');
      return;
    }

    if (matchedStaff.isActive === false) {
      setErrorMsg('This account has been deactivated by the Trustee. Please contact the Board of Trustees.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Sync temple profile into storageService
      const currentProf = storageService.getTempleProfile();
      storageService.updateTempleProfile({
        ...currentProf,
        name: tenant.name,
        deity: tenant.deity,
        trustName: tenant.trustName,
        city: tenant.city,
        state: tenant.state,
        email: tenant.contactEmail,
        phone: tenant.contactPhone,
        registrationNo: tenant.registrationNo || currentProf.registrationNo || 'TR-2018-8849'
      });

      // Set current user in storageService
      storageService.setCurrentUser({
        id: matchedStaff!.id,
        name: matchedStaff!.name,
        username: matchedStaff!.username || cleanUsername,
        password: matchedStaff!.password || cleanPassword,
        role: matchedStaff!.role as any,
        counterName: matchedStaff!.counterName,
        pin: matchedStaff!.pin || cleanPassword,
        isActive: true
      });

      // Save the authenticated session only for this tenant.
      sessionStorage.setItem(`temple_auth_user_${tenant.id}`, JSON.stringify(matchedStaff));
      sessionStorage.setItem('temple_authenticated_tenant_id', tenant.id);

      storageService.recordAudit(
        'LOGIN',
        'SESSION',
        matchedStaff.id,
        `${matchedStaff.name} (${matchedStaff.role}) signed in`,
        undefined,
        { name: matchedStaff.name, role: matchedStaff.role as string }
      );

      onLoginSuccess(matchedStaff!);
      navigate('temple/pos');
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#f4eee4] flex flex-col font-sans text-stone-900 selection:bg-orange-200">
      <div className="h-1.5 bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#1e3a5f]"></div>

      <main className="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
        {/* Ambient background: warm wash + dotted texture */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,#fdf6e8_0%,#f4eee4_45%,#efe6d6_100%)]"></div>
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#c6a66b_0.6px,transparent_0.6px)] [background-size:22px_22px]"></div>

        {/* Konark Chakra — centered symmetric watermark behind the card */}
        <svg
          viewBox="0 0 600 600"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(150vw,860px)] w-[min(150vw,860px)] -translate-x-1/2 -translate-y-1/2 text-[#c08a3e] opacity-[0.09]"
          aria-hidden="true"
        >
          <circle cx="300" cy="300" r="250" fill="none" stroke="currentColor" strokeWidth="6" />
          <circle cx="300" cy="300" r="220" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="300" cy="300" r="120" fill="none" stroke="currentColor" strokeWidth="2.5" />
          {Array.from({ length: 24 }, (_, index) => (
            <g key={index} transform={`rotate(${index * 15} 300 300)`}>
              <line x1="300" y1="80" x2="300" y2="520" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="300" cy="66" r="7" fill="currentColor" />
            </g>
          ))}
          <circle cx="300" cy="300" r="58" fill="none" stroke="currentColor" strokeWidth="6" />
          <circle cx="300" cy="300" r="16" fill="currentColor" />
        </svg>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#e2d3b6] bg-[#fffdf8]/95 shadow-[0_30px_80px_-24px_rgba(78,55,25,0.35)] backdrop-blur-sm">
          {/* Temple Branding Header */}
          <div className="relative border-b border-[#eadfce] bg-gradient-to-b from-[#fff8ea] to-[#fffdf8] px-8 pt-8 pb-7 text-center">
            <div className="mx-auto mb-5 inline-flex items-baseline gap-0.5 border-b-2 border-[#c4933e] pb-1.5">
              <span className="font-serif text-3xl font-black tracking-tight text-[#d2691e]">TAT</span>
              <span className="font-serif text-3xl font-black tracking-tight text-[#263e5d]">Va</span>
            </div>

            <h1 className="font-indic-title text-2xl font-semibold leading-snug text-[#263e5d]">
              {tenant.name}
            </h1>

            {tenant.deity && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#e7c98e] bg-[#fbf0d6] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#98651d]">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                <span>{tenant.deity}</span>
              </div>
            )}

            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs text-stone-500">
              <span>{tenant.trustName}</span>
              <span className="text-stone-300">·</span>
              <span className="flex items-center gap-0.5 font-medium text-[#98651d]">
                <MapPin className="h-3 w-3 text-[#b7791f]" /> {tenant.city}
              </span>
            </p>
          </div>

          {/* Clean Login Form: Only Username and Password */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 p-8">
            {tenant.id === 't-102' && (
              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs text-amber-950 shadow-2xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Trustee: <strong className="font-mono text-purple-700 font-bold">{(tenant.staffAccounts || []).find((s) => s.role === 'trustee')?.username || 'trustee'}</strong> / <strong className="font-mono text-purple-700 font-bold">trustee123</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillTrustee}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Auto-fill</span>
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#7c6a4d]">
                Username <span className="text-[#d2691e]">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-[#c08a3e]" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Enter Username (e.g. trustee)"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-[#e6dbc6] bg-[#fdfaf3] py-3 pl-10 pr-4 text-sm font-semibold text-stone-900 transition focus:border-[#c4933e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c4933e]/25"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#7c6a4d]">
                Password <span className="text-[#d2691e]">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-[#c08a3e]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter Password (e.g. trustee123)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-[#e6dbc6] bg-[#fdfaf3] py-3 pl-10 pr-10 text-sm font-semibold text-stone-900 transition focus:border-[#c4933e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c4933e]/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 transition hover:text-[#c08a3e] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d2691e] to-[#e58a2a] py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-8px_rgba(210,105,30,0.6)] transition hover:from-[#c05e18] hover:to-[#d67d20] disabled:opacity-70 cursor-pointer btn-press"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Temple Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Security Assurance Notice */}
            <div className="flex items-center justify-center gap-1.5 border-t border-[#eadfce] pt-4 text-center text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Authorized Temple Personnel Only • Multi-Role Access</span>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-stone-500 border-t border-orange-200/60 bg-white/50 backdrop-blur-sm">
        <span>{tenant.name} · Temple Portal Powered by <strong>TempleOS</strong></span>
      </footer>
    </div>
  );
};
