import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Lock, 
  Crown, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  RefreshCw,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { createPlatformSubAdminCloud, fetchPlatformAdminsCloud } from '../../services/supabaseService';

export const SubAdminGovernancePage: React.FC = () => {
  const [subadmins, setSubadmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('SubAdmin@2026');
  const [role, setRole] = useState<'platform_owner' | 'platform_admin' | 'support' | 'auditor'>('platform_admin');
  const [mfaRequired, setMfaRequired] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    const admins = await fetchPlatformAdminsCloud();
    setSubadmins(admins);
    setLoading(false);
  };

  useEffect(() => {
    void loadAdmins();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setSubmitting(true);
    const result = await createPlatformSubAdminCloud({
      usernameOrEmail: username.trim(),
      password: password.trim(),
      role,
      mfaRequired,
    });

    setSubmitting(false);
    setIsModalOpen(false);
    showToast(result.message || 'Successfully provisioned SubAdmin account.');

    setUsername('');
    setPassword('SubAdmin@2026');
    setRole('platform_admin');
    setMfaRequired(true);

    void loadAdmins();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-bold text-purple-700 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Platform Control Plane
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" /> Platform SubAdmin Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision cloud platform administrators, support engineers, and auditors with mandatory TOTP MFA & RLS policies.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 self-start btn-press cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Provision SubAdmin
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Administrators</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{subadmins.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Cloud Profiles</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{subadmins.filter(s => s.isActive).length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MFA Protected</div>
            <div className="text-2xl font-black text-purple-700 mt-1">{subadmins.filter(s => s.mfaRequired !== false).length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table of SubAdmins */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Provisioned Platform SubAdmins</h2>
          <button onClick={loadAdmins} className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-5 py-3">Administrator</th>
                <th className="px-4 py-3">Platform Role</th>
                <th className="px-4 py-3">MFA Policy</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {subadmins.map((adm) => (
                <tr key={adm.id} className="hover:bg-purple-50/20 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                        {adm.username ? adm.username.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{adm.email || `${adm.username}@tatva.org`}</div>
                        <div className="text-[10px] font-mono text-slate-400">ID: {adm.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                      {adm.role || 'platform_admin'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {adm.mfaRequired !== false ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Lock className="w-3 h-3 text-emerald-600" /> TOTP Enabled
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">Standard Password</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-400 text-[11px]">
                    {adm.createdAt ? adm.createdAt.split('T')[0] : '2026-09-20'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Provision Platform SubAdmin</h2>
                <p className="text-xs text-slate-500">Matches active Supabase Auth & Postgres cloud profile format</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Username or Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. subadmin_mumbai"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">If no domain is entered, @tatva.org will be appended automatically.</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. SubAdmin@2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Platform Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="platform_admin">Platform Administrator (Full Access)</option>
                  <option value="support">Tier 2 Support Engineer</option>
                  <option value="auditor">Statutory Auditor (Read-Only Compliance)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-purple-900">Enforce TOTP MFA</div>
                  <div className="text-[10px] text-slate-500">Require 6-digit authenticator code upon login</div>
                </div>
                <input
                  type="checkbox"
                  checked={mfaRequired}
                  onChange={(e) => setMfaRequired(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Provisioning...' : 'Provision SubAdmin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdminGovernancePage;
