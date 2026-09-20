import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  CreditCard, 
  Sliders, 
  Activity, 
  ExternalLink,
  Crown,
  HardDrive,
  PlugZap
} from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { saasService } from '../services/saasService';

export const SuperAdminLayout: React.FC<{ children: React.ReactNode; onLogout?: () => void }> = ({ children, onLogout }) => {
  const { currentPath, navigate } = useRouter();
  const activeTenant = saasService.getActiveTenant();

  const navItems = [
    { label: 'Overview', path: 'admin/dashboard', icon: LayoutDashboard },
    { label: 'Tenants', path: 'admin/tenants', icon: Building2 },
    { label: 'Billing', path: 'admin/subscriptions', icon: CreditCard },
    { label: 'Platform Ops', path: 'admin/operations', icon: Sliders },
    { label: 'Integrations', path: 'admin/integrations', icon: PlugZap },
    { label: 'Backup & Security', path: 'admin/backup-security', icon: HardDrive },
    { label: 'System Health', path: 'admin/system-health', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex flex-col font-sans text-[#24211D]">
      <header className="h-16 bg-[#24211D] text-white border-b border-[#3B342D] flex items-center justify-between px-6 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C96A24] flex items-center justify-center text-white shadow-md shadow-orange-900/30">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight">TATVa</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#C96A24]/20 text-[#E9B07C] border border-[#C96A24]/40">
                SuperAdmin
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#BEB3A7] bg-[#332D27] px-3 py-1.5 rounded-xl border border-[#4A4037]">
            <Building2 className="w-3.5 h-3.5 text-[#E19A5C]" />
            <span>Active Tenant:</span>
            <span className="text-[#FFF7EC] font-semibold">{activeTenant.name}</span>
          </div>

          <Link
            to="temple/pos"
            className="px-3.5 py-1.5 bg-[#C96A24] hover:bg-[#984719] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Go to Temple View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          {onLogout && (
            <button onClick={onLogout} className="px-3 py-1.5 border border-[#5B5045] text-[#E7DED3] hover:bg-[#332D27] text-xs font-bold rounded-lg">
              Sign Out
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-[#FFFCF7] border-r border-[#E5DED2] flex flex-col justify-between shrink-0 shadow-xs">
          <div className="p-4 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#8F857A] uppercase tracking-[0.16em] px-3 mb-2">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (currentPath === 'admin' && item.path === 'admin/dashboard');

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#F0E9DF] text-[#24211D] font-bold border-l-2 border-[#C96A24]'
                      : 'text-[#756F66] hover:bg-[#F8F5EF] hover:text-[#24211D] border-l-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C96A24]' : 'text-[#A69A8D]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#F8F5EF]">
          {children}
        </main>
      </div>
    </div>
  );
};
