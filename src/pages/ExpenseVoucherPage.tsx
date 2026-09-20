import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  FileDown,
  FileText,
  Ban,
  Printer,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Account, ExpenseVoucher, PaymentMode, SevaType } from '../types/accounting';
import { generateExpenseSanctionOrderPDF } from '../services/pdfService';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';
import { PaymentOrderModal } from '../components/receipts/PaymentOrderModal';

export const ExpenseVoucherPage: React.FC = () => {
  const { notify } = useFeedback();
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>(storageService.getExpenses());
  const [accounts, setAccounts] = useState<Account[]>(storageService.getAccounts());
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser());

  // Form State
  const [debitAccountId, setDebitAccountId] = useState<string>('acc-401'); // Priest Dakshina
  const [creditAccountId, setCreditAccountId] = useState<string>('acc-101'); // In-Hand Cash
  const [payeeName, setPayeeName] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');

  // Handle Payment Mode sync
  const handlePaymentModeChange = (mode: PaymentMode) => {
    setPaymentMode(mode);
    if (mode === 'CASH') {
      const cashAcc = paymentAccounts.find(a => a.id === 'acc-101' || a.name.toLowerCase().includes('cash')) || paymentAccounts[0];
      if (cashAcc) setCreditAccountId(cashAcc.id);
    } else {
      const bankAcc = paymentAccounts.find(a => a.id === 'acc-103' || a.name.toLowerCase().includes('bank')) || paymentAccounts[1] || paymentAccounts[0];
      if (bankAcc) setCreditAccountId(bankAcc.id);
    }
  };

  // Handle Credit Account sync
  const handleCreditAccountChange = (accId: string) => {
    setCreditAccountId(accId);
    const chosen = paymentAccounts.find(a => a.id === accId);
    if (chosen) {
      if (chosen.id === 'acc-101' || chosen.name.toLowerCase().includes('cash')) {
        setPaymentMode('CASH');
      } else {
        setPaymentMode('BANK_TRANSFER');
      }
    }
  };
  const [refNo, setRefNo] = useState<string>('');
  const [sanctionedBy, setSanctionedBy] = useState<string>('Dr. K. V. Sharma (Trustee)');
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [createdOrder, setCreatedOrder] = useState<ExpenseVoucher | null>(null);
  const [sevas, setSevas] = useState<SevaType[]>(storageService.getSevas());
  const [selectedSevaId, setSelectedSevaId] = useState<string>('seva-shiva-1');

  useEffect(() => {
    const handleUpdate = () => {
      setExpenses(storageService.getExpenses());
      setAccounts(storageService.getAccounts());
      setCurrentUser(storageService.getCurrentUser());
      setSevas(storageService.getSevas());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  const expenseAccounts = accounts.filter((a) => a.category === 'EXPENSE' && a.isActive !== false);
  const paymentAccounts = accounts.filter(
    (a) =>
      a.id === 'acc-101' ||
      a.id === 'acc-103' ||
      a.category === 'ASSET' ||
      a.id.startsWith('acc-10') ||
      a.name.toLowerCase().includes('cash') ||
      a.name.toLowerCase().includes('bank')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) {
      notify('Please enter a valid expense amount', 'error');
      return;
    }
    if (!payeeName.trim() || !purpose.trim()) {
      notify('Please fill payee name and purpose of expense', 'error');
      return;
    }

    const debitAcc = accounts.find((a) => a.id === debitAccountId);
    const creditAcc = accounts.find((a) => a.id === creditAccountId);

    const matchedSeva = sevas.find(s => s.id === selectedSevaId);
    const voucher = storageService.createExpense({
      debitAccountId,
      debitAccountName: debitAcc?.name || 'Expense Account',
      creditAccountId,
      creditAccountName: creditAcc?.name || 'Cash in Hand',
      payeeName: payeeName.trim(),
      purpose: purpose.trim(),
      sevaTypeId: matchedSeva?.id || 'GENERAL',
      sevaName: matchedSeva?.name || 'General Temple Operations',
      eventId: matchedSeva?.id,
      eventName: matchedSeva?.name,
      category: debitAcc?.subCategory || 'General Expense',
      amount: amtNum,
      paymentMode,
      refNo: refNo.trim(),
      sanctionedBy: sanctionedBy.trim() || currentUser.name,
      status: 'SANCTIONED',
      notes: notes.trim(),
    });

    setCreatedOrder(voucher);

    // Reset Form
    setPayeeName('');
    setPurpose('');
    setAmount('');
    setRefNo('');
    setNotes('');
  };

  const handleDownloadOrderCopy = (voucher: ExpenseVoucher) => {
    const doc = generateExpenseSanctionOrderPDF(voucher);
    doc.save(`Sanction_Order_${voucher.sanctionOrderNo}.pdf`);
  };

  const handleVoidExpense = (voucher: ExpenseVoucher) => {
    if (voucher.status === 'VOIDED') return;
    const reason = window.prompt(`Reason for voiding ${voucher.sanctionOrderNo}:`);
    if (!reason?.trim()) return;
    try {
      storageService.voidExpense(voucher.id, reason);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to void expense.', 'error');
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.sanctionOrderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.payeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader
        icon={FileText}
        title="Expense Sanctions"
        subtitle="Approval orders & payments"
        actions={
          <div className="text-xs text-stone-500 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span>Next Order No:</span>
            <span className="font-bold text-stone-800 font-mono">{storageService.peekNextSanctionOrderNo()}</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Columns: Voucher Creation Form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-rose-200/80 shadow-sm overflow-hidden">
            {/* Sacred gradient form header */}
            <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-orange-600 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xs">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="text-white">
                <h2 className="text-sm font-bold tracking-tight leading-tight">New Sanction &amp; Payment Order</h2>
                <p className="text-[11px] text-white/80">Approve an expense &amp; issue the payment order</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Expense Category */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Expense Category / Purpose <span className="text-rose-500">*</span>
              </label>
              <select
                value={debitAccountId}
                onChange={(e) => setDebitAccountId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none cursor-pointer"
              >
                {expenseAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {acc.nameHindi ? `(${acc.nameHindi})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Deduct Money From (In-Hand Cash or Bank) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Deduct Money From (Payment Source) <span className="text-rose-500">*</span>
                </label>
                {paymentAccounts.find(a => a.id === creditAccountId) && (
                  <span className="text-[11px] font-bold text-emerald-700 font-mono">
                    Available: ₹{(paymentAccounts.find(a => a.id === creditAccountId)?.balance || 0).toLocaleString('en-IN')}.00
                  </span>
                )}
              </div>
              <select
                value={creditAccountId}
                onChange={(e) => handleCreditAccountChange(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-2xs"
              >
                {paymentAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name.toLowerCase().includes('cash') ? '💵' : '🏦'} {acc.name} — Balance: ₹{acc.balance.toLocaleString('en-IN')}.00
                  </option>
                ))}
              </select>
            </div>

            {/* Payee Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Payee / Priest / Vendor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. Pt. Raghavendra Dixit / Shri Balaji Grocers"
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none"
              />
            </div>

            {/* Seva / Offering / Cause Allocation */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Seva / Festival / Cause Allocation
              </label>
              <select
                value={selectedSevaId}
                onChange={(e) => setSelectedSevaId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none cursor-pointer"
              >
                <optgroup label="🚩 Grand Festivals & Annual Utsavas">
                  {sevas.filter(s => s.category === 'FESTIVAL_EVENT' || s.isSpecialEvent).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </optgroup>
                <optgroup label="🍲 Annadanam & Feeding">
                  {sevas.filter(s => s.category === 'ANNADANAM').map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </optgroup>
                <optgroup label="🏛️ Renovation Projects">
                  {sevas.filter(s => s.category === 'BUILDING_FUND').map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </optgroup>
                <optgroup label="🪔 Daily Sanctum & Poojas">
                  {sevas.filter(s => s.category === 'DAILY_SEVA' || s.category === 'SPECIAL_POOJA').map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </optgroup>
                <optgroup label="🏛️ General Administration">
                  <option value="GENERAL">General Temple Operations & Maintenance</option>
                </optgroup>
              </select>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Purpose / Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Monthly Archaka Sambhavana / 100kg Rice for Annadanam"
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none"
              />
            </div>

            {/* Amount & Mode */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Amount (INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-stone-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => handlePaymentModeChange(e.target.value as PaymentMode)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium focus:outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank / NEFT</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            {/* Reference & Sanctioned By */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Bill / Cheque Ref No</label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  placeholder="e.g. Inv #884 or Chq #0021"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Sanctioned By (Trustee) *</label>
                <input
                  type="text"
                  required
                  value={sanctionedBy}
                  onChange={(e) => setSanctionedBy(e.target.value)}
                  placeholder="Trustee Name"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Live sanction amount preview */}
            <div className="bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-rose-100/30 p-3 rounded-xl border border-rose-300 flex items-center justify-between mt-1">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Amount to Sanction</div>
                <div className="text-[10px] text-stone-500">{paymentMode} • {accounts.find(a => a.id === creditAccountId)?.name || 'Payment Source'}</div>
              </div>
              <div className="text-xl font-black text-rose-700 font-mono">
                ₹{(parseFloat(amount) || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 mt-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Pass Sanction Order & Issue Payment</span>
            </button>
            </div>
          </form>
        </div>

        {/* Right 7 Columns: Past Sanction Orders List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-200 flex items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sanction orders by number, payee, purpose..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
              />
            </div>
            <span className="text-stone-500 font-medium">Total: {filteredExpenses.length} Orders</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-bold sticky top-0 border-b border-stone-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Order No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payee / Purpose</th>
                    <th className="py-2.5 px-3">Expense Head</th>
                    <th className="py-2.5 px-3 text-right">Sanctioned (INR)</th>
                    <th className="py-2.5 px-3 text-center">Order Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400">
                        No expense sanction orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className={`hover:bg-rose-50/20 transition ${exp.status === 'VOIDED' ? 'opacity-60' : ''}`}>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-800">{exp.sanctionOrderNo} {exp.status === 'VOIDED' && <span className="text-[10px]">(VOIDED)</span>}</td>
                        <td className="py-2.5 px-3 text-stone-500">{exp.date}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-stone-900">{exp.payeeName}</div>
                          <div className="text-[10px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                            {exp.sevaName && (
                              <span className="bg-orange-100 text-orange-800 font-semibold px-1.5 py-0.5 rounded text-[9px] border border-orange-200">
                                {exp.sevaName}
                              </span>
                            )}
                            <span>{exp.purpose}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-stone-100 text-stone-700">
                            {exp.debitAccountName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                          ₹{exp.amount.toLocaleString('en-IN')}.00
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setCreatedOrder(exp)} title="View & Reprint Payment Order (Print / PDF / Share)" className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-800 transition"><Printer className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDownloadOrderCopy(exp)} title="Download Official Sanction Order Copy PDF" className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-800 transition"><FileDown className="w-3.5 h-3.5" /></button>
                            {exp.status !== 'VOIDED' && <button onClick={() => handleVoidExpense(exp)} title="Void expense with audit reason" className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"><Ban className="w-3.5 h-3.5" /></button>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Full Payment Order preview — print (thermal/A5), PDF & WhatsApp share */}
      {createdOrder && (
        <PaymentOrderModal voucher={createdOrder} onClose={() => setCreatedOrder(null)} />
      )}
    </div>
  );
};
