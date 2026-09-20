import React, { useState, useEffect } from 'react';
import { RouterProvider, useRouter } from './router/Router';
import { MarketingLandingPage } from './pages/MarketingLandingPage';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';

// Admin Pages
import { SuperAdminDashboardPage } from './pages/admin/SuperAdminDashboardPage';
import { TenantsDirectoryPage } from './pages/admin/TenantsDirectoryPage';
import { SubscriptionsBillingPage } from './pages/admin/SubscriptionsBillingPage';
import { PlatformOperationsPage } from './pages/admin/PlatformOperationsPage';
import { BackupSecurityHubPage } from './pages/admin/BackupSecurityHubPage';
import { SystemHealthLogsPage } from './pages/admin/SystemHealthLogsPage';
import { AdminIntegrationsHubPage } from './pages/admin/AdminIntegrationsHubPage';

// Temple Pages & Layout
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { PosDonationPage } from './pages/PosDonationPage';
import { ReceiptsHistoryPage } from './pages/ReceiptsHistoryPage';
import { DayBookPage } from './pages/DayBookPage';
import { ExpenseVoucherPage } from './pages/ExpenseVoucherPage';
import { AssetManagementPage } from './pages/AssetManagementPage';
import { HundiCountingPage } from './pages/HundiCountingPage';
import { AccountsLedgerPage } from './pages/AccountsLedgerPage';
import { FinancialReportsPage } from './pages/FinancialReportsPage';
import { DonorsDirectoryPage } from './pages/DonorsDirectoryPage';
import { CatalogManagementPage } from './pages/CatalogManagementPage';
import { TempleSettingsPage } from './pages/TempleSettingsPage';
import { CashierShiftPage } from './pages/temple/CashierShiftPage';
import { AuditorHubPage } from './pages/temple/AuditorHubPage';
import { TempleLoginPage } from './pages/temple/TempleLoginPage';

import { storageService } from './services/storageService';
import { saasService } from './services/saasService';
import { canAccessTab, firstAllowedTab } from './services/permissions';
import { FeedbackProvider } from './components/ui/Feedback';
import { UserRole } from './types/accounting';
import { Tenant, StaffAccount } from './types/saas';
import { Crown, ArrowLeft, ShieldCheck, Lock, Building2 } from 'lucide-react';

const AccessDenied: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
      <Lock className="w-8 h-8 text-rose-600" />
    </div>
    <h2 className="text-xl font-bold text-stone-800">Access Restricted</h2>
    <p className="text-sm text-stone-500 mt-2 max-w-md">
      Your role does not have permission to view this section. Please contact the Board of Trustees if you believe this is an error.
    </p>
    <button
      onClick={onGoBack}
      className="mt-6 px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-lg font-semibold text-sm transition cursor-pointer"
    >
      Go to My Dashboard
    </button>
  </div>
);

const SubdomainRequiredPage: React.FC = () => {
  const { navigate } = useRouter();
  const tenants = saasService.getTenants();

  const handleSelectTenant = (subdomain?: string, id?: string) => {
    if (subdomain) {
      const url = saasService.getSubdomainUrl(subdomain);
      if (url.startsWith('http') && !url.includes(window.location.host)) {
        window.location.href = url;
      } else {
        navigate(`tenant/${subdomain}`);
      }
    } else if (id) {
      saasService.setActiveTenant(id);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#fff8ef] to-[#FFFDF9] flex items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 border border-orange-200/80 shadow-2xl shadow-orange-950/10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="mt-5 text-2xl sm:text-3xl font-black text-stone-900">Select Temple Portal</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 max-w-lg mx-auto">
          Please select your registered temple or trust account to enter the daily operations portal, POS counter, and financial management system.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTenant(t.subdomain || t.slug, t.id)}
              className="p-5 rounded-2xl border border-orange-200 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-100/50 transition-all text-stone-900 group cursor-pointer shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-200/60 px-2 py-0.5 rounded-md">
                    {t.deity || 'TEMPLE'}
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-400 group-hover:text-orange-600">
                    {t.subdomain}.tatva.app &rarr;
                  </span>
                </div>
                <h2 className="font-serif font-bold text-base mt-2 text-stone-900 group-hover:text-orange-700 leading-snug">
                  {t.name}
                </h2>
                <p className="text-xs text-stone-500 mt-1">{t.trustName}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{t.city}, {t.state}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-orange-200/60 flex items-center justify-between text-[11px] text-stone-600 font-medium">
                <span>{t.activeCounters || 1} Counters Active</span>
                <span className="font-bold text-orange-600">Enter Portal &rarr;</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('home')}
            className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
          >
            &larr; Back to TATVa Home
          </button>
          <button
            onClick={() => navigate('admin')}
            className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Platform SuperAdmin</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminLoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (username.trim() !== 'superadmin' || password !== 'TempleOS@2026') {
      setError('Invalid platform administrator credentials.');
      return;
    }
    sessionStorage.setItem('temple_platform_admin_auth', 'true');
    onLogin();
  };
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl p-7 shadow-2xl space-y-4">
        <div className="text-center">
          <ShieldCheck className="w-10 h-10 mx-auto text-purple-600" />
          <h1 className="text-xl font-bold text-slate-900 mt-2">Platform Administration</h1>
          <p className="text-xs text-slate-500 mt-1">Authenticate to continue to SuperAdmin.</p>
        </div>
        <input aria-label="Platform username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full px-3 py-2.5 border rounded-xl text-sm" autoComplete="username" />
        <input aria-label="Platform password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-3 py-2.5 border rounded-xl text-sm" autoComplete="current-password" />
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
        <button type="submit" className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm">Sign In</button>
      </form>
    </div>
  );
};

interface TempleWorkspaceProps {
  tenant?: Tenant;
  onLogout?: () => void;
}

const TempleWorkspace: React.FC<TempleWorkspaceProps> = ({ tenant, onLogout }) => {
  const { currentPath, navigate, subRoute } = useRouter();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return subRoute || 'pos';
  });
  const [userRole, setUserRole] = useState<UserRole>(() => storageService.getCurrentUser().role);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [impersonatingName, setImpersonatingName] = useState<string | null>(() => {
    return sessionStorage.getItem('ghost_impersonating_name');
  });

  useEffect(() => {
    const handleUpdate = () => {
      const user = storageService.getCurrentUser();
      setUserRole(user.role);
    };

    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (subRoute && subRoute !== currentTab) {
      setCurrentTab(subRoute);
    }
  }, [subRoute]);

  const handleExitGhostMode = () => {
    sessionStorage.removeItem('ghost_impersonating_name');
    setImpersonatingName(null);
    navigate('admin/tenants');
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    navigate(`temple/${tab}`);
  };

  const renderContent = () => {
    // Enforce role permissions at render time so deep-links / manual hash edits
    // cannot bypass the Sidebar visibility filtering.
    if (!canAccessTab(userRole, currentTab)) {
      return <AccessDenied onGoBack={() => handleTabChange(firstAllowedTab(userRole))} />;
    }
    switch (currentTab) {
      case 'pos':
        return <PosDonationPage />;
      case 'receipts':
        return <ReceiptsHistoryPage />;
      case 'daybook':
        return <DayBookPage />;
      case 'expenses':
        return <ExpenseVoucherPage />;
      case 'assets':
        return <AssetManagementPage />;
      case 'hundi':
        return <HundiCountingPage />;
      case 'accounts':
        return <AccountsLedgerPage />;
      case 'reports':
        return <FinancialReportsPage />;
      case 'donors':
        return <DonorsDirectoryPage />;
      case 'catalogs':
        return <CatalogManagementPage />;
      case 'settings':
        return <TempleSettingsPage />;
      case 'shift':
        return <CashierShiftPage />;
      case 'auditor':
        return <AuditorHubPage />;
      default:
        return <PosDonationPage />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#FFFDF9] flex flex-col antialiased text-stone-900 font-sans">
      {/* Ghost Impersonation Banner if active */}
      {impersonatingName && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 text-white px-5 py-2 flex items-center justify-between text-xs z-50 border-b border-purple-800 shadow-md">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/30 text-purple-300 border border-purple-400/40 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Ghost Mode
            </span>
            <span>
              SuperAdmin live impersonation active for <strong>{impersonatingName}</strong>. You have unrestricted tenant administrative access.
            </span>
          </div>
          <button
            onClick={handleExitGhostMode}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to SuperAdmin</span>
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={handleTabChange} onLogout={onLogout} onToggleMenu={() => setMobileNavOpen((v) => !v)} />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar currentTab={currentTab} setCurrentTab={handleTabChange} userRole={userRole} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#FFFDF9]">{renderContent()}</main>
      </div>
    </div>
  );
};

const SuperAdminWorkspace: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { currentPath } = useRouter();

  const renderAdminContent = () => {
    switch (currentPath) {
      case 'admin/tenants':
        return <TenantsDirectoryPage />;
      case 'admin/subscriptions':
        return <SubscriptionsBillingPage />;
      case 'admin/gateway-revenue':
      case 'admin/communication':
      case 'admin/feature-flags':
      case 'admin/analytics':
      case 'admin/operations':
        return <PlatformOperationsPage />;
      case 'admin/integrations':
        return <AdminIntegrationsHubPage />;
      case 'admin/backup-security':
        return <BackupSecurityHubPage />;
      case 'admin/system-health':
        return <SystemHealthLogsPage />;
      case 'admin':
      case 'admin/dashboard':
      default:
        return <SuperAdminDashboardPage />;
    }
  };

  return <SuperAdminLayout onLogout={onLogout}>{renderAdminContent()}</SuperAdminLayout>;
};

const AppRoutes: React.FC = () => {
  const { isHomeRoute, isAdminRoute, isTempleRoute, isSubdomainRoute, isDemoRoute, subdomainTenant } = useRouter();
  const activeTenant = subdomainTenant || saasService.getActiveTenant();

  // Set the tenant storage namespace before any tenant page reads accounting data.
  // Silent here keeps render pure; the effect below broadcasts the change post-commit.
  storageService.setTenantContext(activeTenant.id, { silent: true });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('temple_storage_updated'));
  }, [activeTenant.id]);

  const [authenticatedStaff, setAuthenticatedStaff] = useState<StaffAccount | null>(() => {
    const raw = sessionStorage.getItem(`temple_auth_user_${activeTenant.id}`);
    if (raw) {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  });
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => sessionStorage.getItem('temple_platform_admin_auth') === 'true');

  useEffect(() => {
    const raw = sessionStorage.getItem(`temple_auth_user_${activeTenant.id}`);
    if (raw) {
      try { setAuthenticatedStaff(JSON.parse(raw)); } catch { setAuthenticatedStaff(null); }
    } else {
      setAuthenticatedStaff(null);
    }
  }, [activeTenant.id]);

  const handleLoginSuccess = (staff: StaffAccount) => {
    setAuthenticatedStaff(staff);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`temple_auth_user_${activeTenant.id}`);
    sessionStorage.removeItem('temple_auth_user');
    setAuthenticatedStaff(null);
  };
  const handleAdminLogout = () => {
    sessionStorage.removeItem('temple_platform_admin_auth');
    setAdminAuthenticated(false);
  };

  // 1. SUBDOMAIN ROUTE (e.g. http://Sidhodlur.localhost:5173/)
  if (isSubdomainRoute && subdomainTenant) {
    if (isDemoRoute) {
      return <TempleWorkspace tenant={subdomainTenant} />;
    }
    if (!authenticatedStaff) {
      return <TempleLoginPage tenant={subdomainTenant} onLoginSuccess={handleLoginSuccess} />;
    }
    return <TempleWorkspace tenant={subdomainTenant} onLogout={handleLogout} />;
  }

  // 2. ADMIN ROUTE (e.g. http://localhost:5173/#/admin/*)
  if (isAdminRoute) {
    return adminAuthenticated
      ? <SuperAdminWorkspace onLogout={handleAdminLogout} />
      : <AdminLoginPage onLogin={() => setAdminAuthenticated(true)} />;
  }

  // 3. TEMPLE ROUTE (e.g. http://localhost:5173/#/temple/*)
  if (isTempleRoute) {
    if (!isSubdomainRoute) {
      return <SubdomainRequiredPage />;
    }
    if (!authenticatedStaff) {
      return <TempleLoginPage tenant={activeTenant} onLoginSuccess={handleLoginSuccess} />;
    }
    return <TempleWorkspace tenant={activeTenant} onLogout={handleLogout} />;
  }

  // 4. HOME MARKETING ROUTE (e.g. http://localhost:5173/#/ or empty)
  return <MarketingLandingPage />;
};

export function App() {
  return (
    <RouterProvider>
      <FeedbackProvider>
        <AppRoutes />
      </FeedbackProvider>
    </RouterProvider>
  );
}

export default App;
