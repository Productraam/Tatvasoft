import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Building2, 
  Clock, 
  Plus, 
  X,
  FileCheck2,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { Tenant, CommunicationTemplate } from '../../types/saas';

export const CommunicationHubPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>(saasService.getTenants());
  const [templates] = useState<CommunicationTemplate[]>(saasService.getCommunicationTemplates());
  const [rechargeModalTenant, setRechargeModalTenant] = useState<Tenant | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState<number>(5000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalCreditsAllocated = tenants.reduce((acc, t) => acc + (t.messageCredits || 0), 0);

  const handleRechargeCredits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeModalTenant) return;

    saasService.rechargeTenantCredits(rechargeModalTenant.id, creditsToAdd);
    setTenants(saasService.getTenants());
    setRechargeModalTenant(null);
    showToast(`Added ${creditsToAdd.toLocaleString('en-IN')} message credits to ${rechargeModalTenant.name}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
            <MessageSquare className="w-6 h-6 text-purple-600" /> WhatsApp Business & SMS Communications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage WABA e-receipt templates, monitor temple credit wallets, and oversee automated devotee communications.
          </p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-stagger">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Devotee Messages Sent</div>
          <div className="text-2xl font-extrabold text-slate-900">42,850</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 98.6% Delivery Rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Active Credit Pool</div>
          <div className="text-2xl font-extrabold text-purple-700">{totalCreditsAllocated.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 4 onboarded trusts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Meta WABA SLA Status</div>
          <div className="text-2xl font-extrabold text-emerald-600">High Quality</div>
          <div className="text-[11px] text-slate-500 mt-1">Green tier verified business</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Average Dispatch Speed</div>
          <div className="text-2xl font-extrabold text-slate-900">1.2 sec</div>
          <div className="text-[11px] text-slate-500 mt-1">Sub-second e-receipt push</div>
        </div>
      </div>

      {/* Temple Wallets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Temple Message Credit Wallets</h2>
            <p className="text-xs text-slate-500">Live balance and automatic threshold alerts</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Temple / Religious Trust</th>
                <th className="p-4">Current Plan</th>
                <th className="p-4">Message Credits Remaining</th>
                <th className="p-4">WhatsApp Module</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Top-up Wallet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-400">{t.city}, {t.state}</div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize font-semibold text-slate-700">{t.planId}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {(t.messageCredits || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">credits</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.modules.whatsappReceipts
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {t.modules.whatsappReceipts ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="p-4">
                    {(t.messageCredits || 0) < 1000 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
                        <AlertCircle className="w-3 h-3" /> Low Balance
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" /> Healthy
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setRechargeModalTenant(t)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ml-auto"
                    >
                      <Plus className="w-3.5 h-3.5" /> Top-up Credits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approved WhatsApp Message Templates */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Approved Meta WABA Message Templates</h2>
            <p className="text-xs text-slate-500">Official templated messages for receipts, reminders, and tax certificates</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 3 Templates Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700">
                    {tmpl.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {tmpl.metaApprovalStatus}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-xs">{tmpl.name}</h3>
                <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed font-mono">
                  {tmpl.contentSnippet}
                </div>
              </div>

              <div className="text-[10px] text-slate-400">
                Variables: {tmpl.sampleVariables.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top-up Credits Modal */}
      {rechargeModalTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex min-h-full items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recharge Message Wallet</h2>
                <p className="text-xs text-slate-500">{rechargeModalTenant.name}</p>
              </div>
              <button 
                onClick={() => setRechargeModalTenant(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRechargeCredits} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Current Balance</label>
                <div className="font-extrabold text-lg text-slate-900">
                  {(rechargeModalTenant.messageCredits || 0).toLocaleString('en-IN')} Credits
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Credit Bundle</label>
                <div className="grid grid-cols-3 gap-2">
                  {[2500, 5000, 10000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setCreditsToAdd(amt)}
                      className={`p-3 rounded-xl border text-center font-bold transition ${
                        creditsToAdd === amt
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      +{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRechargeModalTenant(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
                >
                  Confirm Top-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
