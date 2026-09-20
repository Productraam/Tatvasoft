import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { LineChart, DonutChart } from '../../components/ui';

export const GlobalAnalyticsPage: React.FC = () => {
  const metrics = saasService.getGlobalMetrics();

  const monthlyTrend = [
    { label: 'Apr', value: Math.round(metrics.totalGmv * 0.12) },
    { label: 'May', value: Math.round(metrics.totalGmv * 0.14) },
    { label: 'Jun', value: Math.round(metrics.totalGmv * 0.15) },
    { label: 'Jul', value: Math.round(metrics.totalGmv * 0.18) },
    { label: 'Aug', value: Math.round(metrics.totalGmv * 0.19) },
    { label: 'Sep', value: Math.round(metrics.totalGmv * 0.22) },
  ];

  const paymentShare = [
    { label: 'UPI QR', value: 54, color: '#7c3aed' },
    { label: 'Cash', value: 32, color: '#f59e0b' },
    { label: 'Bank Transfer', value: 10, color: '#0369a1' },
    { label: 'POS Card', value: 4, color: '#15803d' },
  ];

  return (
    <div className="p-8 animate-fade-in space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-600" /> Platform Global Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Aggregated macro-insights on donation trends, payment methods, and temple traffic.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Devotee Donations</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">INR {(metrics.totalGmv).toLocaleString('en-IN')}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +24% YoY growth
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-400">Average Transaction Ticket</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">INR 540.00</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Across Archana, Annadanam & Hundi
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-400">Digital / UPI Adoption</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">68.2%</div>
          <div className="text-xs text-purple-700/80 font-medium mt-1">
            Cash transactions down from 54% to 31.8%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" /> Donation Trend (Last 6 Months)
          </h2>
          <LineChart data={monthlyTrend} color="#7c3aed" />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" /> Payment Method Mix
          </h2>
          <DonutChart data={paymentShare} size={150} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" /> Payment Methods Share across Temples
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Dynamic UPI QR (PhonePe / GPay / Paytm)</span>
                <span>54%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '54%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Physical Cash (Counter Box)</span>
                <span>32%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Direct Bank Transfer (NEFT/RTGS Corpus)</span>
                <span>10%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Credit / Debit POS Card</span>
                <span>4%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '4%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" /> Peak Traffic Patterns
          </h2>

          <div className="text-xs text-slate-600 space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800">Peak Festival Spike</div>
              <p className="text-slate-500 mt-0.5">
                Average counter transaction throughput jumps from 4 receipts/min to 18 receipts/min during festivals.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800">High-Velocity Hours</div>
              <p className="text-slate-500 mt-0.5">
                Morning: 07:30 AM - 11:30 AM (Archana & Abhishekam tickets)<br/>
                Evening: 05:30 PM - 08:45 PM (Deeparadhana & Prasad collections)
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800">Hundi Unsealing Frequency</div>
              <p className="text-slate-500 mt-0.5">
                Large temples count twice a month with average yield of INR 12L per session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
