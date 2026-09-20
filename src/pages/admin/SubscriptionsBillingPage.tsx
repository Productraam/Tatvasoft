import React, { useState } from 'react';
import { 
  CreditCard, 
  Check, 
  FileText, 
  Download
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { SubscriptionPlan, PlatformInvoice } from '../../types/saas';

export const SubscriptionsBillingPage: React.FC = () => {
  const [plans] = useState<SubscriptionPlan[]>(saasService.getSubscriptionPlans());
  const [invoices] = useState<PlatformInvoice[]>(saasService.getInvoices());
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.status === 'PAID' ? inv.amount : 0), 0);
  const pendingRevenue = invoices.reduce((sum, inv) => sum + (inv.status === 'PENDING' ? inv.amount : 0), 0);

  return (
    <div className="p-8 animate-fade-in space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-600" /> SaaS Subscriptions & Invoicing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pricing plans, automated recurring invoicing, and payment gateway collections.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              billingCycle === 'yearly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Yearly <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded-full">Save 17%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-2xl border p-6 flex flex-col justify-between relative transition-all shadow-sm ${
              p.recommended 
                ? 'border-purple-500 shadow-purple-500/10 ring-2 ring-purple-500/20' 
                : 'border-slate-200/80'
            }`}
          >
            {p.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Most Popular
              </span>
            )}

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{p.id} tier</div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{p.name}</h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  INR {billingCycle === 'monthly' ? p.pricePerMonth.toLocaleString('en-IN') : p.pricePerYear.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-medium">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Up to {p.maxCounters} live thermal POS counters</p>

              <div className="mt-6 space-y-2.5 pt-6 border-t border-slate-100">
                {p.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  p.recommended
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Configure Plan Specs
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" /> Platform Invoices & Settlements
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Automated GST invoices sent to temple trusts</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
              <span>Collected:</span> INR {totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl">
              <span>Pending:</span> INR {pendingRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Invoice No</th>
                <th className="px-6 py-3">Temple Trust</th>
                <th className="px-6 py-3">Plan / Item</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-purple-700">{inv.invoiceNo}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{inv.tenantName}</td>
                  <td className="px-6 py-4 text-slate-600">{inv.planName}</td>
                  <td className="px-6 py-4">{inv.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">INR {inv.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
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
