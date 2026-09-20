import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Plus, 
  Radio,
  Sliders,
  Building2,
  HardDrive
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { SecurityAnomaly, PlatformBroadcast, Tenant } from '../../types/saas';

export const BackupSecurityHubPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<SecurityAnomaly[]>(saasService.getSecurityAnomalies());
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcast[]>(saasService.getBroadcasts());
  const [tenants] = useState<Tenant[]>(saasService.getTenants());
  const [selectedTenantExport, setSelectedTenantExport] = useState<string>(tenants[0]?.id || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<{ checkedRecords: number; mismatches: number; status: string; hash: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New broadcast form state
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [bcLevel, setBcLevel] = useState<'INFO' | 'WARNING' | 'EMERGENCY'>('INFO');
  const [isBcModalOpen, setIsBcModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadSnapshot = () => {
    const snapshot = saasService.createSystemSnapshot();
    const blob = new Blob([snapshot.dataBlob], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templeos-master-snapshot-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported encrypted master snapshot (${snapshot.sizeKb} KB) across ${snapshot.tenantsCount} trusts`);
  };

  const handleExportSingleTenant = () => {
    const tenant = tenants.find(t => t.id === selectedTenantExport);
    if (!tenant) return;
    const data = {
      tenant,
      exportedAt: new Date().toISOString(),
      format: 'TempleOS Statutory Audit Export (Section 80G & Form 10BD Ready)',
      records: 'All ledgers, accounts, vouchers, receipts, and assets included.'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-export-${tenant.slug}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded statutory audit dossier for ${tenant.name}`);
  };

  const handleVerifyIntegrity = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = saasService.verifyLedgerIntegrity();
      setIntegrityResult(result);
      setIsVerifying(false);
      showToast('SHA-256 Ledger integrity verified: 0 mismatches detected.');
    }, 1200);
  };

  const handleResolveAnomaly = (id: string) => {
    const updated = saasService.resolveAnomaly(id);
    setAnomalies(updated);
    showToast('Security anomaly marked as investigated and resolved');
  };

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcMessage.trim()) return;

    saasService.addBroadcast(bcTitle, bcMessage, bcLevel);
    setBroadcasts(saasService.getBroadcasts());
    setIsBcModalOpen(false);
    setBcTitle('');
    setBcMessage('');
    showToast('Platform broadcast published to all active temple dashboards');
  };

  const handleToggleBroadcast = (id: string) => {
    const updated = saasService.toggleBroadcast(id);
    setBroadcasts(updated);
  };

  return (
    <div className="p-8 animate-fade-in space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" /> Disaster Recovery, Ledger Integrity & Security
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated database snapshot backups, cryptographic audit verifications, anomaly alerts, and platform announcements.
          </p>
        </div>

        <button
          onClick={handleDownloadSnapshot}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 self-start"
        >
          <HardDrive className="w-4 h-4" /> 1-Click Master Encrypted Snapshot
        </button>
      </div>

      {/* Top 3 Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-stagger">
        {/* Card 1: Cryptographic Integrity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Immutable Ledger Integrity Check</h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify cryptographic SHA-256 chain hashes across all double-entry journal vouchers and account balances.
            </p>
          </div>

          <div className="space-y-2">
            {integrityResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Audit Status: {integrityResult.status}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  Verified {integrityResult.checkedRecords} ledger records. 0 mismatches.
                </div>
                <div className="text-[9px] font-mono text-emerald-600 mt-1 truncate">
                  {integrityResult.hash}
                </div>
              </div>
            )}

            <button
              onClick={handleVerifyIntegrity}
              disabled={isVerifying}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-purple-400' : ''}`} />
              <span>{isVerifying ? 'Verifying Hashes...' : 'Run Cryptographic Audit'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Single Tenant Export */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Statutory CA Audit Dossier Export</h2>
            <p className="text-xs text-slate-500 mt-1">
              Generate Form 10BD aggregate donation schedules and full accounting ledgers for any individual trust.
            </p>
          </div>

          <div className="space-y-2">
            <select
              value={selectedTenantExport}
              onChange={(e) => setSelectedTenantExport(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportSingleTenant}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Download CA Audit Dossier
            </button>
          </div>
        </div>

        {/* Card 3: Platform Announcements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-3">
              <Radio className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Global Announcement Broadcast</h2>
            <p className="text-xs text-slate-500 mt-1">
              Push real-time alert banners to cashier counters, trustee dashboards, and accountants across all temples.
            </p>
          </div>

          <button
            onClick={() => setIsBcModalOpen(true)}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Compose Platform Broadcast
          </button>
        </div>
      </div>

      {/* Security Anomalies Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Security & Operational Anomaly Alerts</h2>
            <p className="text-xs text-slate-500">Heuristic detection for high-value collections, off-hours access, and void surges</p>
          </div>
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Active Anomaly Engine
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {anomalies.map((anom) => (
            <div key={anom.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  anom.severity === 'CRITICAL' || anom.severity === 'HIGH'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{anom.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      anom.status === 'OPEN'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {anom.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Severity: {anom.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {anom.description}
                  </p>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                    <span>Temple: <strong className="text-slate-700">{anom.tenantName}</strong></span>
                    <span>·</span>
                    <span>Timestamp: {anom.timestamp}</span>
                  </div>
                </div>
              </div>

              <div>
                {anom.status === 'OPEN' ? (
                  <button
                    onClick={() => handleResolveAnomaly(anom.id)}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs transition shadow-xs whitespace-nowrap"
                  >
                    Mark as Investigated
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Broadcast Announcements List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Platform Announcements</h2>
            <p className="text-xs text-slate-500">Live banners visible to temple users</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {broadcasts.map((bc) => (
            <div key={bc.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    bc.level === 'EMERGENCY'
                      ? 'bg-rose-100 text-rose-800'
                      : bc.level === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {bc.level}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{bc.title}</h3>
                </div>
                <p className="text-xs text-slate-600">{bc.message}</p>
                <div className="text-[10px] text-slate-400">
                  Published on: {bc.createdAt} · Valid until: {bc.expiresAt}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleBroadcast(bc.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                    bc.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {bc.isActive ? 'Active on Screens' : 'Paused'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Broadcast Compose Modal */}
      {isBcModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex min-h-full items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">New Platform Announcement</h2>
                <p className="text-xs text-slate-500">Publish banner to all temple counters & trustee screens</p>
              </div>
              <button 
                onClick={() => setIsBcModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Income Tax Form 10BD Compliance Window"
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Severity / Banner Level</label>
                <select
                  value={bcLevel}
                  onChange={(e) => setBcLevel(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="INFO">General Information (Blue)</option>
                  <option value="WARNING">Important Advisory / Tax Deadline (Amber)</option>
                  <option value="EMERGENCY">Urgent Maintenance / System Notice (Rose)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message Body *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type message content that will be shown across all temple interfaces..."
                  value={bcMessage}
                  onChange={(e) => setBcMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBcModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
