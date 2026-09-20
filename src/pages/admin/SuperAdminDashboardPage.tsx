import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  CreditCard, 
  ShieldCheck, 
  ArrowUpRight, 
  ExternalLink,
  Activity,
  CheckCircle2,
  Bell,
  Download,
  Database,
  Radio,
  Wifi,
  Sparkles
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { Tenant } from '../../types/saas';
import { useRouter } from '../../router/Router';

export const SuperAdminDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const [metrics, setMetrics] = useState(saasService.getGlobalMetrics());
  const [tenants, setTenants] = useState<Tenant[]>(saasService.getTenants());
  const [logs] = useState(saasService.getSystemLogs());
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [activeBroadcast, setActiveBroadcast] = useState('All platform services are operational.');
  const [broadcastSaved, setBroadcastSaved] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setMetrics(saasService.getGlobalMetrics());
      setTenants(saasService.getTenants());
    };
    window.addEventListener('saas_tenants_updated', handleUpdate);
    return () => window.removeEventListener('saas_tenants_updated', handleUpdate);
  }, []);

  const handleLoginAsTemple = (tenant: Tenant) => {
    saasService.setActiveTenant(tenant.id);
    sessionStorage.setItem('ghost_impersonating_name', tenant.name);
    window.location.href = saasService.getSubdomainUrl(tenant.subdomain || tenant.slug);
  };

  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setActiveBroadcast(broadcastMessage.trim());
    setBroadcastMessage('');
    setBroadcastSaved(true);
    setTimeout(() => setBroadcastSaved(false), 3000);
  };

  const handleDownloadPlatformBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      platform: 'TempleOS Cloud SaaS',
      version: '2.5.0',
      tenants: saasService.getTenants(),
      invoices: saasService.getInvoices(),
      systemLogs: saasService.getSystemLogs()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TempleOS_Platform_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-400" /> Platform SuperAdmin Operations Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">TempleOS Multi-Tenant Control Center</h1>
          <p className="text-sm text-purple-200/80 mt-1">
            Centrally managing tenant database partitions, live POS registers, subscription billing, and gateway quotas across India.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPlatformBackup}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-purple-300" /> Full Platform Backup
          </button>
          <button
            onClick={() => navigate('admin/tenants')}
            className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/25 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" /> Onboard New Temple
          </button>
        </div>
      </div>

      {/* Global Broadcast Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Live Broadcast Announcement to All Counters</div>
            <div className="text-xs font-semibold text-stone-800 mt-0.5">{activeBroadcast}</div>
          </div>
        </div>
        <form onSubmit={handlePublishBroadcast} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Type flash announcement for all temple staff..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-amber-300 text-xs w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-all shadow-xs"
          >
            Broadcast
          </button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Platform GMV</span>
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              INR {(metrics.totalGmv / 100000).toFixed(2)} Lakhs
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24% YoY growth
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Total devotee donations recorded
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Recurring (MRR)</span>
            <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              INR {(metrics.mrr).toLocaleString('en-IN')}/mo
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +16% vs last month
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            SaaS subscription recurring revenue
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Temples</span>
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalTenantsCount}</span>
            <span className="text-xs text-slate-500 ml-2 font-medium">({metrics.activeTemples} Active)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Across Karnataka, AP, MH & Gujarat
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live POS Registers</span>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalCounters}</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Platform operational
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Connected thermal receipt printers
          </div>
        </div>
      </div>

      {/* Main Grid: Temples Table + Live Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Onboarded Temples & Trusts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Quick access to temple accounts and operational state</p>
            </div>
            <button
              onClick={() => navigate('admin/tenants')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View Full Directory <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Temple & Trust</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Donation GMV</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      <div className="text-slate-500 text-[11px]">{t.deity} • {t.trustName}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {t.city}, {t.state}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.planId === 'enterprise' 
                          ? 'bg-purple-100 text-purple-700'
                          : t.planId === 'pro'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {t.planId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      INR {(t.totalDonationGmv || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleLoginAsTemple(t)}
                        title="Impersonate and open this temple's portal"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-200 rounded-lg font-medium transition-all inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Login as Temple
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Platform Realtime Feed</h3>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>

            <div className="space-y-3.5 mt-4">
              {logs.map((log) => (
                <div key={log.id} className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp.split(' ')[1]}</span>
                  </div>
                  <div className="text-slate-600 truncate">{log.tenantName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{log.resource}</div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium pt-1">
                    <CheckCircle2 className="w-3 h-3" /> User: {log.userEmail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button 
              onClick={() => navigate('admin/system-health')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline"
            >
              View Full System Health & Logs &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
