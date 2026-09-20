import React, { useState, useEffect } from 'react';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Calendar,
  Layers,
  Landmark,
  PlusCircle,
  FileCheck,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Account, HundiCount, HundiDenominations } from '../types/accounting';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';

export const HundiCountingPage: React.FC = () => {
  const { notify } = useFeedback();
  const [hundiCounts, setHundiCounts] = useState<HundiCount[]>(storageService.getHundiCounts());
  const [accounts, setAccounts] = useState<Account[]>(storageService.getAccounts());
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser());

  // Form State
  const [hundiName, setHundiName] = useState<string>('Main Sanctum Maha Hundi');
  const [unsealDate, setUnsealDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [depositToAccountId, setDepositToAccountId] = useState<string>('acc-101'); // Cash in Hand
  const [witness1, setWitness1] = useState<string>('Dr. K. V. Sharma (Trustee President)');
  const [witness2, setWitness2] = useState<string>('Srinivasan Iyer (Chief Accountant)');
  const [witness3, setWitness3] = useState<string>('Pt. Raghavendra Dixit (Chief Archaka)');
  const [notes, setNotes] = useState<string>('Bi-weekly Hundi opening ceremony in presence of trust committee.');

  const [denominations, setDenominations] = useState<HundiDenominations>({
    note500: 0,
    note200: 0,
    note100: 0,
    note50: 0,
    note20: 0,
    note10: 0,
    coins: 0,
  });

  const [createdHundi, setCreatedHundi] = useState<HundiCount | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setHundiCounts(storageService.getHundiCounts());
      setAccounts(storageService.getAccounts());
      setCurrentUser(storageService.getCurrentUser());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  const handleDenomChange = (key: keyof HundiDenominations, value: string) => {
    const count = parseInt(value) || 0;
    setDenominations((prev: HundiDenominations) => ({ ...prev, [key]: count }));
  };

  const total500 = denominations.note500 * 500;
  const total200 = denominations.note200 * 200;
  const total100 = denominations.note100 * 100;
  const total50 = denominations.note50 * 50;
  const total20 = denominations.note20 * 20;
  const total10 = denominations.note10 * 10;
  const totalCoins = denominations.coins;

  const grandTotal = total500 + total200 + total100 + total50 + total20 + total10 + totalCoins;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (grandTotal <= 0) {
      notify('Total Hundi amount must be greater than zero.', 'error');
      return;
    }

    const witnesses = [witness1.trim(), witness2.trim(), witness3.trim()].filter(Boolean);
    if (witnesses.length < 2) {
      notify('At least 2 witness trustees/officials are required for statutory Hundi unsealing.', 'error');
      return;
    }

    const hundi = storageService.saveHundiCount({
      hundiName,
      unsealDate,
      denominations,
      totalAmount: grandTotal,
      witnesses,
      depositToAccountId,
      notes,
    });

    setCreatedHundi(hundi);

    // Reset denominations
    setDenominations({
      note500: 0,
      note200: 0,
      note100: 0,
      note50: 0,
      note20: 0,
      note10: 0,
      coins: 0,
    });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader
        icon={Coins}
        title="Hundi Counting"
        subtitle="Denomination counting with trustee witness logs"
        actions={
          <div className="bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <span className="text-stone-500">Batch No:</span>
            <span className="font-mono font-bold text-stone-800">{storageService.getNextHundiBatchNo()}</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Columns: Denominations Matrix */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-800 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-saffron-600" />
                <span>1. Denomination Breakdown Sheet</span>
              </span>
              <span className="text-xs font-semibold text-stone-500">Unseal Date: {unsealDate}</span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
                    <th className="py-2 px-3 text-left">Denomination</th>
                    <th className="py-2 px-3 text-center">Multiplier</th>
                    <th className="py-2 px-3 text-center w-28">Note Count</th>
                    <th className="py-2 px-3 text-right">Subtotal (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {/* ₹500 */}
                  <tr className="hover:bg-saffron-50/30">
                    <td className="py-2 px-3 font-bold text-stone-800">₹500 Notes</td>
                    <td className="py-2 px-3 text-center text-stone-400">× 500 =</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={denominations.note500 || ''}
                        onChange={(e) => handleDenomChange('note500', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-center font-bold bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-1 focus:ring-saffron-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                      ₹{total500.toLocaleString('en-IN')}.00
                    </td>
                  </tr>

                  {/* ₹200 */}
                  <tr className="hover:bg-saffron-50/30">
                    <td className="py-2 px-3 font-bold text-stone-800">₹200 Notes</td>
                    <td className="py-2 px-3 text-center text-stone-400">× 200 =</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={denominations.note200 || ''}
                        onChange={(e) => handleDenomChange('note200', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-center font-bold bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-1 focus:ring-saffron-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                      ₹{total200.toLocaleString('en-IN')}.00
                    </td>
                  </tr>

                  {/* ₹100 */}
                  <tr className="hover:bg-saffron-50/30">
                    <td className="py-2 px-3 font-bold text-stone-800">₹100 Notes</td>
                    <td className="py-2 px-3 text-center text-stone-400">× 100 =</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={denominations.note100 || ''}
                        onChange={(e) => handleDenomChange('note100', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-center font-bold bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-1 focus:ring-saffron-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                      ₹{total100.toLocaleString('en-IN')}.00
                    </td>
                  </tr>

                  {/* ₹50 */}
                  <tr className="hover:bg-saffron-50/30">
                    <td className="py-2 px-3 font-bold text-stone-800">₹50 Notes</td>
                    <td className="py-2 px-3 text-center text-stone-400">× 50 =</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={denominations.note50 || ''}
                        onChange={(e) => handleDenomChange('note50', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-center font-bold bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-1 focus:ring-saffron-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                      ₹{total50.toLocaleString('en-IN')}.00
                    </td>
                  </tr>

                  {/* ₹20 */}
                  <tr className="hover:bg-saffron-50/30">
                    <td className="py-2 px-3 font-bold text-stone-800">₹20 Notes</td>
                    <td className="py-2 px-3 text-center text-stone-400">× 20 =</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={denominations.note20 || ''}
                        onChange={(e) => handleDenomChange('note20', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-center font-bold bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-1 focus:ring-saffron-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                      ₹{total20.toLocaleString('en-IN')}.00
                    </td>
                  </tr>

                  {/* ₹10 */}
                  <tr className="hover:bg-saffron-50/30">
                    <td className="py-2 px-3 font-bold text-stone-800">₹10 Notes</td>
                    <td className="py-2 px-3 text-center text-stone-400">× 10 =</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={denominations.note10 || ''}
                        onChange={(e) => handleDenomChange('note10', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-center font-bold bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-1 focus:ring-saffron-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                      ₹{total10.toLocaleString('en-IN')}.00
                    </td>
                  </tr>

                  {/* Coins & Mixed Change */}
                  <tr className="hover:bg-saffron-50/30">
                    <td className="py-2 px-3 font-bold text-stone-800">Coins & Loose Change</td>
                    <td className="py-2 px-3 text-center text-stone-400">Direct Sum =</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={denominations.coins || ''}
                        onChange={(e) => handleDenomChange('coins', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-center font-bold bg-stone-50 border border-stone-200 rounded focus:bg-white focus:ring-1 focus:ring-saffron-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                      ₹{totalCoins.toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50 font-bold border-t-2 border-amber-300 text-stone-900">
                    <td colSpan={3} className="py-3 px-3 text-right text-xs uppercase tracking-wider text-amber-900">
                      Grand Total Hundi Collection:
                    </td>
                    <td className="py-3 px-3 text-right text-base text-amber-900 font-mono">
                      ₹{grandTotal.toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Witnesses and Submission */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-800 flex items-center gap-1.5 pb-2 border-b border-stone-100">
              <ShieldCheck className="w-3.5 h-3.5 text-saffron-600" />
              <span>2. Committee Witnesses & Account Deposit</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Hundi / Box Name</label>
                <input
                  type="text"
                  value={hundiName}
                  onChange={(e) => setHundiName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Deposit To Account</label>
                <select
                  value={depositToAccountId}
                  onChange={(e) => setDepositToAccountId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium focus:outline-none"
                >
                  <option value="acc-101">1010 - In-Hand Cash</option>
                  <option value="acc-103">1020 - Bank Account (Direct Deposit)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Witness 1 (Trustee) *</label>
                <input
                  type="text"
                  required
                  value={witness1}
                  onChange={(e) => setWitness1(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Witness 2 (Accountant) *</label>
                <input
                  type="text"
                  required
                  value={witness2}
                  onChange={(e) => setWitness2(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Witness 3 (Priest/Member)</label>
                <input
                  type="text"
                  value={witness3}
                  onChange={(e) => setWitness3(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Record & Post Hundi Collection to General Ledger</span>
            </button>
          </div>
        </form>

        {/* Right 5 Columns: Past Unsealing History */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-800 flex items-center gap-1.5 pb-2 border-b border-stone-100">
              <Calendar className="w-3.5 h-3.5 text-saffron-600" />
              <span>Past Hundi Unsealing Batches</span>
            </span>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {hundiCounts.length === 0 ? (
                <div className="text-center py-10 text-xs text-stone-400">
                  No previous Hundi batches found. Fill out the matrix on the left to record the first unsealing.
                </div>
              ) : (
                hundiCounts.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2 hover:border-amber-300 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-amber-900">{h.batchNo}</span>
                        <div className="text-[10px] text-stone-500">{h.unsealDate}</div>
                      </div>
                      <span className="font-bold text-sm text-emerald-800">
                        ₹{h.totalAmount.toLocaleString('en-IN')}.00
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-stone-800">{h.hundiName}</div>

                    <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-1.5">
                      <strong>Witnesses:</strong> {h.witnesses.join(', ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
