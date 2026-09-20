import React, { useState } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  FileCheck2,
  Printer
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export const CashierShiftPage: React.FC = () => {
  const [openingFloat] = useState<number>(2000);
  const [shiftClosed, setShiftClosed] = useState(false);

  const [denoms, setDenoms] = useState({
    d500: 0,
    d200: 0,
    d100: 0,
    d50: 0,
    d20: 0,
    d10: 0,
    coins: 0
  });

  const donations = storageService.getDonations();
  const cashDonations = donations
    .filter((d) => d.paymentMode === 'CASH')
    .reduce((sum, d) => sum + d.amount, 0);

  const upiDonations = donations
    .filter((d) => d.paymentMode === 'UPI')
    .reduce((sum, d) => sum + d.amount, 0);

  const calculatedTotalCash = (
    denoms.d500 * 500 +
    denoms.d200 * 200 +
    denoms.d100 * 100 +
    denoms.d50 * 50 +
    denoms.d20 * 20 +
    denoms.d10 * 10 +
    denoms.coins * 1
  );

  const expectedDrawerCash = openingFloat + cashDonations;
  const variance = calculatedTotalCash - expectedDrawerCash;

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    setShiftClosed(true);
  };

  return (
    <div className="p-8 animate-fade-in space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-amber-600" /> Cashier Shift Drawer & Handover
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Perform shift opening float verification, end-of-shift physical cash count, and handover tally.
        </p>
      </div>

      {shiftClosed ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Shift Closed & Handover Recorded</h2>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            Cash drawer handover sheet generated with expected balance of INR {expectedDrawerCash.toLocaleString('en-IN')}. Physical cash counted: INR {calculatedTotalCash.toLocaleString('en-IN')}.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Handover Slip
            </button>
            <button
              onClick={() => setShiftClosed(false)}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
            >
              Start Next Shift
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Current Shift Status</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600 font-medium">Counter</span>
                <span className="font-bold text-stone-900 text-sm">Counter #1 (Main Sanctum)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600 font-medium">Cashier</span>
                <span className="font-bold text-stone-900 text-sm">Operator #104</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600 font-medium">Shift Start</span>
                <span className="font-bold text-stone-900 text-sm">Today, 08:00 AM</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Expected Drawer Balance</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Opening Cash Float</span>
                <span className="font-bold text-stone-900">INR {openingFloat.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Cash Collections</span>
                <span className="font-bold text-emerald-600">+INR {cashDonations.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 font-bold">
                <span className="text-stone-800">Total Expected Cash</span>
                <span className="text-base text-stone-900">INR {expectedDrawerCash.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-stone-500 pt-1">
                * UPI donations (INR {upiDonations.toLocaleString('en-IN')}) settle directly to the temple bank account.
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-stone-900">Physical Cash Drawer Tally</h2>
              <p className="text-xs text-stone-500 mt-0.5">Input the exact denomination count from your cash drawer</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">INR 500 Notes (Qty)</label>
                <input
                  type="number"
                  min="0"
                  value={denoms.d500 || ''}
                  onChange={(e) => setDenoms({ ...denoms, d500: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">INR 200 Notes (Qty)</label>
                <input
                  type="number"
                  min="0"
                  value={denoms.d200 || ''}
                  onChange={(e) => setDenoms({ ...denoms, d200: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">INR 100 Notes (Qty)</label>
                <input
                  type="number"
                  min="0"
                  value={denoms.d100 || ''}
                  onChange={(e) => setDenoms({ ...denoms, d100: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">INR 50 Notes (Qty)</label>
                <input
                  type="number"
                  min="0"
                  value={denoms.d50 || ''}
                  onChange={(e) => setDenoms({ ...denoms, d50: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">INR 20 / 10 Notes (Qty)</label>
                <input
                  type="number"
                  min="0"
                  value={denoms.d20 || ''}
                  onChange={(e) => setDenoms({ ...denoms, d20: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Coins Total (INR)</label>
                <input
                  type="number"
                  min="0"
                  value={denoms.coins || ''}
                  onChange={(e) => setDenoms({ ...denoms, coins: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-500">Physical Counted Cash:</div>
                <div className="text-xl font-bold text-stone-900">INR {calculatedTotalCash.toLocaleString('en-IN')}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-stone-500">Cash Variance:</div>
                <div className={`text-sm font-bold ${
                  variance === 0 
                    ? 'text-emerald-600' 
                    : variance > 0 
                    ? 'text-blue-600' 
                    : 'text-rose-600'
                }`}>
                  {variance === 0 ? 'Exact Match (INR 0)' : `INR ${variance > 0 ? '+' : ''}${variance}`}
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseShift}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" /> Finalize Shift & Lock Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
