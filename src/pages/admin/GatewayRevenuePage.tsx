import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Percent, 
  ShieldCheck, 
  Building2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { GatewayRoutingRule, PlatformSettlementBatch } from '../../types/saas';

export const GatewayRevenuePage: React.FC = () => {
  const [rules, setRules] = useState<GatewayRoutingRule[]>(saasService.getGatewayRules());
  const [batches, setBatches] = useState<PlatformSettlementBatch[]>(saasService.getSettlementBatches());
  const [selectedGateway, setSelectedGateway] = useState<GatewayRoutingRule | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const metrics = saasService.getGlobalMetrics();

  const handleToggleActive = (id: string, current: boolean) => {
    const updated = saasService.updateGatewayRule(id, { isActive: !current });
    setRules(updated);
    showToast('Gateway status updated successfully');
  };

  const handleReleasePayout = (batchId: string) => {
    const updated = saasService.releaseSettlementPayout(batchId);
    setBatches(updated);
    showToast('Settlement payout released to temple beneficiary account');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const totalGrossSettled = batches.reduce((acc, b) => acc + b.grossAmount, 0);
  const totalFeesCollected = batches.reduce((acc, b) => acc + b.platformFee, 0);

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
            <CreditCard className="w-6 h-6 text-purple-600" /> Payment Gateway Routing & Platform Revenue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Orchestrate multi-gateway payment routing, set platform transaction take-rates, and monitor temple payouts.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-stagger">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Platform GMV Processed</div>
          <div className="text-2xl font-extrabold text-slate-900">₹{(metrics.totalGmv / 100000).toFixed(2)} L</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Across 4 Active Trusts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Platform Take-Rate Revenue</div>
          <div className="text-2xl font-extrabold text-purple-700">₹{metrics.platformFeesEarned.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Avg 0.50% convenience split</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Gateway Success Rate</div>
          <div className="text-2xl font-extrabold text-emerald-600">99.4%</div>
          <div className="text-[11px] text-slate-500 mt-1">Auto failover enabled</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Settled to Temples</div>
          <div className="text-2xl font-extrabold text-slate-900">₹{(totalGrossSettled / 100000).toFixed(2)} L</div>
          <div className="text-[11px] text-slate-500 mt-1">Direct Bank UTR transfers</div>
        </div>
      </div>

      {/* Gateway Routing Rules */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Configured Payment Gateway Adapters</h2>
            <p className="text-xs text-slate-500">Live split fees and traffic routing distribution</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {rules.map((rule) => (
            <div key={rule.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                  {rule.provider.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{rule.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rule.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {rule.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>Provider: <strong className="text-slate-700">{rule.provider}</strong></span>
                    <span>·</span>
                    <span>Settlement: <strong className="text-slate-700">{rule.settlementCycle}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Platform Markup</div>
                  <div className="font-bold text-slate-900 text-sm">{rule.platformFeePercent}% + ₹{rule.flatFeePerTxn}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Traffic Allocation</div>
                  <div className="font-bold text-purple-700 text-sm">{rule.volumeShare}%</div>
                </div>

                <button
                  onClick={() => handleToggleActive(rule.id, rule.isActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    rule.isActive
                      ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {rule.isActive ? 'Disable Adapter' : 'Enable Adapter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temple Settlement Batches */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Temple Settlement & Payout Reconciliation</h2>
            <p className="text-xs text-slate-500">Gross donation collections minus platform convenience fees</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Batch ID & Date</th>
                <th className="p-4">Temple / Religious Trust</th>
                <th className="p-4 text-right">Gross Collections</th>
                <th className="p-4 text-right">Platform Fee (0.5%)</th>
                <th className="p-4 text-right">Net Payout to Trust</th>
                <th className="p-4">Bank UTR / Ref</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4">
                    <span className="font-bold text-slate-900">{b.batchNo}</span>
                    <div className="text-[11px] text-slate-400">{b.date}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800">{b.tenantName}</span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">
                    ₹{b.grossAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-bold text-purple-700">
                    ₹{b.platformFee.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-700">
                    ₹{b.netPayout.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 font-mono text-[11px] text-slate-600">
                    {b.utrNumber}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      b.status === 'SETTLED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.status === 'PROCESSING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {b.status === 'PROCESSING' ? (
                      <button
                        onClick={() => handleReleasePayout(b.id)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] shadow-xs"
                      >
                        Release Payout
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Complete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
