import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  CalendarRange, 
  Lock, 
  Unlock, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Building2, 
  Landmark, 
  FileSpreadsheet, 
  Sparkles,
  ArrowRight,
  Printer,
  Edit2,
  X,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { 
  FinancialYearPeriod, 
  BalanceSourceItem, 
  SevaType,
  Donation, 
  ExpenseVoucher,
  AuditAdjustmentItem
} from '../../types/accounting';
import { useFeedback } from '../../components/ui/Feedback';

export const AuditorHubPage: React.FC = () => {
  const { notify } = useFeedback();
  const [financialYears, setFinancialYears] = useState<FinancialYearPeriod[]>(storageService.getFinancialYears());
  const [selectedYearId, setSelectedYearId] = useState<string>(() => {
    return storageService.getCurrentFinancialYear().id;
  });
  const [sevas, setSevas] = useState<SevaType[]>(storageService.getSevas());
  const [selectedSevaCategory, setSelectedSevaCategory] = useState<string>('ALL');
  const [donations, setDonations] = useState<Donation[]>(storageService.getDonations());
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>(storageService.getExpenses());

  const [activeTab, setActiveTab] = useState<'fy_audit' | 'events' | '10bd' | 'voids'>('fy_audit');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal States
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<BalanceSourceItem['type']>('BANK');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceAmount, setNewSourceAmount] = useState('');
  const [newSourceBank, setNewSourceBank] = useState('');
  const [newSourceAccNo, setNewSourceAccNo] = useState('');

  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventBudget, setNewEventBudget] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newSevaCategory, setNewSevaCategory] = useState<string>('FESTIVAL_EVENT');
  const [newSevaDeity, setNewSevaDeity] = useState<string>('Main Sanctum');
  const [newSevaDefaultAmt, setNewSevaDefaultAmt] = useState<string>('1001');
  const [newEventPeriod, setNewEventPeriod] = useState<string>('');

  const [isCertifyModalOpen, setIsCertifyModalOpen] = useState(false);
  const [auditorName, setAuditorName] = useState('CA Raghavendra Rao & Associates');
  const [auditorRegNo, setAuditorRegNo] = useState('ICAI-M-209844');
  const [auditNotes, setAuditNotes] = useState('Statutory audit completed and certified without qualifications. Bank reconciliation matched with passbooks.');

  const selectedYear = financialYears.find(y => y.id === selectedYearId) || financialYears[0];

  useEffect(() => {
    const handleStorageUpdate = () => {
      setFinancialYears(storageService.getFinancialYears());
      setSevas(storageService.getSevas());
      setDonations(storageService.getDonations());
      setExpenses(storageService.getExpenses());
    };
    window.addEventListener('temple_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleStorageUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // --- Calculations for In-Year Movement by Source ---
  // Inflow (Cash vs Bank)
  const cashInflows = donations.filter(d => d.paymentMode === 'CASH').reduce((sum, d) => sum + d.amount, 0);
  const bankInflows = donations.filter(d => ['UPI', 'CHEQUE', 'BANK_TRANSFER', 'CARD'].includes(d.paymentMode)).reduce((sum, d) => sum + d.amount, 0);

  // Outflow (Cash vs Bank)
  const cashOutflows = expenses.filter(e => e.paymentMode === 'CASH').reduce((sum, e) => sum + e.amount, 0);
  const bankOutflows = expenses.filter(e => ['UPI', 'CHEQUE', 'BANK_TRANSFER', 'CARD'].includes(e.paymentMode)).reduce((sum, e) => sum + e.amount, 0);

  // Opening Balance Totals
  const totalOpeningCash = (selectedYear.openingBalances || [])
    .filter(s => s.type === 'CASH')
    .reduce((sum, s) => sum + s.openingAmount, 0);

  const totalOpeningBank = (selectedYear.openingBalances || [])
    .filter(s => s.type === 'BANK')
    .reduce((sum, s) => sum + s.openingAmount, 0);

  const totalOpeningFD = (selectedYear.openingBalances || [])
    .filter(s => s.type === 'FIXED_DEPOSIT')
    .reduce((sum, s) => sum + s.openingAmount, 0);

  const totalOpeningOther = (selectedYear.openingBalances || [])
    .filter(s => s.type === 'OTHER')
    .reduce((sum, s) => sum + s.openingAmount, 0);

  const grandTotalOpening = totalOpeningCash + totalOpeningBank + totalOpeningFD + totalOpeningOther;

  // Calculated Live Closing Balances
  const calculatedClosingCash = totalOpeningCash + cashInflows - cashOutflows;
  const calculatedClosingBank = totalOpeningBank + bankInflows - bankOutflows;
  const calculatedGrandClosing = calculatedClosingCash + calculatedClosingBank + totalOpeningFD + totalOpeningOther;

  // Handle Add Opening Balance Source
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newSourceAmount) || 0;
    if (!newSourceName.trim() || amt < 0) {
      notify('Please enter a valid source name and opening amount', 'error');
      return;
    }

    storageService.addOpeningBalanceSource(selectedYear.id, {
      type: newSourceType,
      sourceName: newSourceName.trim(),
      bankName: newSourceBank.trim() || undefined,
      accountNumber: newSourceAccNo.trim() || undefined,
      openingAmount: amt,
      notes: 'Configured during initial setup'
    });

    setFinancialYears(storageService.getFinancialYears());
    setIsAddSourceModalOpen(false);
    setNewSourceName('');
    setNewSourceAmount('');
    setNewSourceBank('');
    setNewSourceAccNo('');
    showToast('Opening balance source successfully added');
  };

  // Handle Create Event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    const newSeva = storageService.saveSeva({
      name: newEventName.trim(),
      category: (newSevaCategory as any) || 'FESTIVAL_EVENT',
      code: `EVT-${Date.now().toString().slice(-4)}`,
      defaultAmount: parseFloat(newSevaDefaultAmt) || 1001,
      deity: newSevaDeity.trim() || 'Main Sanctum',
      budgetEstimated: parseFloat(newEventBudget) || 1000000,
      description: newEventDesc.trim(),
      periodLabel: newEventPeriod.trim() || 'Annual Festival Event',
      isActive: true,
      isSpecialEvent: true,
    });

    setSevas(storageService.getSevas());
    setIsAddEventModalOpen(false);
    setNewEventName('');
    setNewEventBudget('');
    setNewEventDesc('');
    setNewEventPeriod('');
    setNewSevaDeity('Main Sanctum');
    setNewSevaDefaultAmt('1001');
    showToast(`Seva / Festival Offering "${newSeva.name}" created successfully!`);
  };

  // Handle Certify & Lock Annual Audit (Rollover)
  const handleCertifyAudit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare closing balances based on calculated balances for each source
    const closingSources: BalanceSourceItem[] = (selectedYear.openingBalances || []).map(s => {
      let finalAmt = s.openingAmount;
      if (s.type === 'CASH') {
        const cashRatio = totalOpeningCash > 0 ? s.openingAmount / totalOpeningCash : 1;
        finalAmt = Math.round(calculatedClosingCash * cashRatio);
      } else if (s.type === 'BANK') {
        const bankRatio = totalOpeningBank > 0 ? s.openingAmount / totalOpeningBank : 1;
        finalAmt = Math.round(calculatedClosingBank * bankRatio);
      }
      return {
        ...s,
        closingAmount: finalAmt,
        auditedAmount: finalAmt
      };
    });

    const result = storageService.certifyAndLockFinancialYear(selectedYear.id, {
      auditorName: auditorName.trim(),
      registrationNo: auditorRegNo.trim(),
      notes: auditNotes.trim(),
      closingBalances: closingSources
    });

    setFinancialYears(storageService.getFinancialYears());
    setIsCertifyModalOpen(false);
    showToast(`Financial Year ${result.certifiedYear.label} certified & locked! Rolled over into FY ${result.nextYear.label}.`);
    setSelectedYearId(result.nextYear.id);
  };

  // Export Form 10BD CSV
  const eligible80G = donations.filter(d => d.donorPhone && d.amount >= 500);
  const donors = storageService.getDonors();

  const handleExportForm10BD = () => {
    const csvRows = [
      ['Section 80G Form 10BD Statement of Donations'],
      ['Financial Year:', selectedYear.label],
      ['Sr No', 'Devotee Name', 'PAN/ID', 'Address/Village', 'Event / Festival', 'Payment Mode', 'Amount (INR)', 'Receipt No', 'Date'],
      ...eligible80G.map((d, index) => [
        index + 1,
        `"${d.donorName || d.donorFirstName}"`,
        `"${donors.find(dn => dn.phone === d.donorPhone)?.pan || 'PAN_NOT_PROVIDED'}"`,
        `"${d.donorVillage || ''}"`,
        `"${d.eventName || 'Daily Sanctum'}"`,
        d.paymentMode,
        d.amount,
        d.receiptNo,
        d.date
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Form10BD_Donations_${selectedYear.label}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto animate-fade-in font-sans text-stone-900">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header & Financial Year Selector */}
      <div className="bg-white rounded-2xl p-6 border border-orange-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Statutory Audit, Multi-Source Balances & Event Performance</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 leading-tight">
            Financial Year Audit & Events Hub
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure Opening Balances (Cash, Bank, FDs), track Event Collections, and perform Annual Audit Lock with Auto-Rollover.
          </p>
        </div>

        {/* Financial Year Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-orange-50/70 p-1.5 rounded-xl border border-orange-200">
            <span className="text-xs font-bold text-orange-900 pl-2">FY:</span>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="bg-white border border-orange-200 font-bold text-xs py-1.5 px-3 rounded-lg text-stone-900 focus:outline-none cursor-pointer"
            >
              {financialYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  FY {fy.label} {fy.isAuditLocked ? '🔒 (Audited & Locked)' : fy.isCurrent ? '⚡ (Active Operating)' : '(Upcoming)'}
                </option>
              ))}
            </select>
          </div>

          {selectedYear.isAuditLocked ? (
            <span className="px-3 py-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Certified by {selectedYear.auditorName?.split(' ')[0] || 'CA'}</span>
            </span>
          ) : (
            <button
              onClick={() => setIsCertifyModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Certify Audit & Roll Over Year</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-orange-200 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveTab('fy_audit')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'fy_audit'
              ? 'border-orange-600 text-orange-950 bg-orange-50/50 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Landmark className="w-4 h-4 text-orange-600" />
          <span>Annual Balances & FY Rollover</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'events'
              ? 'border-orange-600 text-orange-950 bg-orange-50/50 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <CalendarRange className="w-4 h-4 text-orange-600" />
          <span>Seva & Festival Offerings Matrix ({sevas.length} Offerings)</span>
        </button>

        <button
          onClick={() => setActiveTab('10bd')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === '10bd'
              ? 'border-orange-600 text-orange-950 bg-orange-50/50 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-orange-600" />
          <span>Section 80G Form 10BD Exporter</span>
        </button>
      </div>

      {/* TAB 1: ANNUAL BALANCES & FY ROLLOVER */}
      {activeTab === 'fy_audit' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-stagger">
            <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-xs card-lift">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>Opening Liquid Balance</span>
                <Landmark className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-xl font-black text-stone-900">
                ₹{grandTotalOpening.toLocaleString('en-IN')}.00
              </div>
              <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                <span>Rolled over on 1st April</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs card-lift">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
                <span>In-Year Collections (Inflow)</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700">
                +₹{(cashInflows + bankInflows).toLocaleString('en-IN')}.00
              </div>
              <div className="text-[10px] text-stone-500 mt-1">
                Cash: ₹{cashInflows.toLocaleString('en-IN')} · Bank/UPI: ₹{bankInflows.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs card-lift">
              <div className="flex items-center justify-between text-xs text-rose-800 font-semibold mb-1">
                <span>In-Year Expenses (Outflow)</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-black text-rose-700">
                -₹{(cashOutflows + bankOutflows).toLocaleString('en-IN')}.00
              </div>
              <div className="text-[10px] text-stone-500 mt-1">
                Cash: ₹{cashOutflows.toLocaleString('en-IN')} · Bank: ₹{bankOutflows.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-2xl border border-orange-300 shadow-xs card-lift">
              <div className="flex items-center justify-between text-xs text-orange-950 font-bold mb-1">
                <span>{selectedYear.isAuditLocked ? 'Audited Closing Fund' : 'Calculated Live Fund'}</span>
                <Coins className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-xl font-black text-orange-950">
                ₹{calculatedGrandClosing.toLocaleString('en-IN')}.00
              </div>
              <div className="text-[10px] text-orange-800 mt-1 font-semibold">
                Cash: ₹{calculatedClosingCash.toLocaleString('en-IN')} · Bank: ₹{calculatedClosingBank.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Opening Balance Sources Table */}
          <div className="bg-white rounded-2xl border border-orange-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-orange-50/80 to-white border-b border-orange-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-orange-600" />
                  <span>Opening Balances by Source (FY {selectedYear.label})</span>
                </h2>
                <p className="text-[11px] text-stone-500">
                  Initial balances entered at beginning of year (In-Hand Cash, Banks, FDs, and Other Reserves).
                </p>
              </div>

              {!selectedYear.isAuditLocked && (
                <button
                  onClick={() => setIsAddSourceModalOpen(true)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs btn-press cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Opening Source</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Source Type</th>
                    <th className="p-3.5">Source Name & Particulars</th>
                    <th className="p-3.5">Account / Bank Details</th>
                    <th className="p-3.5 text-right">Opening Balance (₹)</th>
                    <th className="p-3.5 text-right">Estimated Closing (₹)</th>
                    <th className="p-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {(selectedYear.openingBalances || []).map((source) => {
                    let estClosing = source.openingAmount;
                    if (source.type === 'CASH') {
                      const ratio = totalOpeningCash > 0 ? source.openingAmount / totalOpeningCash : 1;
                      estClosing = Math.round(calculatedClosingCash * ratio);
                    } else if (source.type === 'BANK') {
                      const ratio = totalOpeningBank > 0 ? source.openingAmount / totalOpeningBank : 1;
                      estClosing = Math.round(calculatedClosingBank * ratio);
                    }

                    return (
                      <tr key={source.id} className="hover:bg-orange-50/40 transition">
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            source.type === 'CASH' 
                              ? 'bg-amber-100 text-amber-800'
                              : source.type === 'BANK'
                              ? 'bg-blue-100 text-blue-800'
                              : source.type === 'FIXED_DEPOSIT'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}>
                            {source.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-stone-900">{source.sourceName}</td>
                        <td className="p-3.5 text-stone-500 font-mono text-[11px]">
                          {source.bankName ? `${source.bankName} ` : ''}
                          {source.accountNumber ? `(${source.accountNumber})` : '—'}
                        </td>
                        <td className="p-3.5 text-right font-bold text-stone-900 font-mono">
                          ₹{source.openingAmount.toLocaleString('en-IN')}.00
                        </td>
                        <td className="p-3.5 text-right font-bold text-orange-950 font-mono">
                          ₹{estClosing.toLocaleString('en-IN')}.00
                        </td>
                        <td className="p-3.5 text-stone-400 text-[11px] italic">{source.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-orange-50/60 font-bold border-t border-orange-200 text-xs">
                    <td colSpan={3} className="p-3.5 text-stone-800">Total Liquid Reserves Across All Sources</td>
                    <td className="p-3.5 text-right text-stone-900 font-mono">
                      ₹{grandTotalOpening.toLocaleString('en-IN')}.00
                    </td>
                    <td className="p-3.5 text-right text-orange-950 font-mono">
                      ₹{calculatedGrandClosing.toLocaleString('en-IN')}.00
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Audit Certification Details if Locked */}
          {selectedYear.isAuditLocked && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-300 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Statutory Annual Audit Certified & Filed</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-stone-700 pt-1">
                <div>
                  <span className="text-stone-500 block">Chartered Accountant / Auditor:</span>
                  <strong className="text-stone-900">{selectedYear.auditorName}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">ICAI Registration No:</span>
                  <strong className="text-stone-900 font-mono">{selectedYear.auditorRegistrationNo}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Audit Sign-off Date:</span>
                  <strong className="text-stone-900">{selectedYear.auditedDate}</strong>
                </div>
              </div>
              <p className="text-xs text-emerald-800 italic pt-1 border-t border-emerald-200">
                "{selectedYear.notes}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEVAS & FESTIVAL OFFERINGS PERFORMANCE MATRIX */}
      {activeTab === 'events' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-orange-600" />
                <span>Seva & Festival Offerings Financial Performance Matrix</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Every Seva / Offering is treated directly as an event / cause. Track devotee collections, incurred expenses, and net surplus per offering.
              </p>
            </div>

            <button
              onClick={() => setIsAddEventModalOpen(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs btn-press self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Seva / Event Offering</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: '✨ All Offerings' },
              { id: 'FESTIVAL_EVENT', label: '🚩 Festivals & Utsavas' },
              { id: 'DAILY_SEVA', label: '🪔 Daily Sanctum' },
              { id: 'ANNADANAM', label: '🍲 Annadanam & Feeding' },
              { id: 'SPECIAL_POOJA', label: '✨ Special Poojas' },
              { id: 'BUILDING_FUND', label: '🏛️ Renovation Projects' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedSevaCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedSevaCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white hover:bg-orange-50 text-stone-700 border border-orange-200/80 shadow-2xs'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sevas Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
            {sevas
              .filter((s) => selectedSevaCategory === 'ALL' || s.category === selectedSevaCategory)
              .map((s) => {
                const sevaDonations = donations.filter(
                  (d) => d.sevaTypeId === s.id || d.sevaName.toLowerCase() === s.name.toLowerCase()
                );
                const sevaExpenses = expenses.filter(
                  (e) =>
                    e.sevaTypeId === s.id ||
                    (e.sevaName && e.sevaName.toLowerCase() === s.name.toLowerCase()) ||
                    (e.purpose && e.purpose.toLowerCase().includes(s.name.toLowerCase()))
                );

                const totalCol = sevaDonations.reduce((acc, d) => acc + d.amount, 0);
                const totalExp = sevaExpenses.reduce((acc, e) => acc + e.amount, 0);
                const netSurplus = totalCol - totalExp;
                const target = s.budgetEstimated || (s.category === 'FESTIVAL_EVENT' ? 2500000 : 500000);
                const progressPct = target > 0 ? Math.min(100, Math.round((totalCol / target) * 100)) : 100;

                const categoryBadge =
                  s.category === 'FESTIVAL_EVENT'
                    ? { bg: 'bg-amber-100 text-amber-900 border-amber-300', label: '🚩 Festival Event' }
                    : s.category === 'ANNADANAM'
                    ? { bg: 'bg-orange-100 text-orange-900 border-orange-300', label: '🍲 Annadanam' }
                    : s.category === 'BUILDING_FUND'
                    ? { bg: 'bg-purple-100 text-purple-900 border-purple-300', label: '🏛️ Capital Project' }
                    : s.category === 'DAILY_SEVA'
                    ? { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: '🪔 Daily Sanctum' }
                    : { bg: 'bg-blue-100 text-blue-900 border-blue-300', label: '✨ Special Pooja' };

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-orange-200 shadow-xs card-lift p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryBadge.bg}`}>
                          {categoryBadge.label}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 font-semibold">{s.code}</span>
                      </div>

                      <div>
                        <h3 className="font-bold text-stone-900 text-base leading-snug">{s.name}</h3>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{s.description || 'Devotee ritual offering'}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium pt-1">
                        <span>Deity: <strong className="text-stone-700">{s.deity || 'Main Sanctum'}</strong></span>
                        <span>Rate: <strong className="text-orange-900 font-bold">₹{s.defaultAmount || 0}</strong></span>
                      </div>

                      {s.periodLabel && (
                        <div className="text-[10px] text-amber-800 bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200/50 font-medium">
                          Period: {s.periodLabel}
                        </div>
                      )}
                    </div>

                    {/* Progress vs Target */}
                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <div className="flex justify-between text-[11px] text-stone-500">
                        <span>Target: ₹{target.toLocaleString('en-IN')}</span>
                        <span className="font-bold text-orange-950">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Financial Inflow vs Outflow */}
                    <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-stone-600">
                        <span>Total Collections ({sevaDonations.length} receipts):</span>
                        <strong className="text-emerald-700 font-mono font-bold">+₹{totalCol.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span>Direct Expenses ({sevaExpenses.length} vouchers):</span>
                        <strong className="text-rose-700 font-mono font-bold">-₹{totalExp.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="pt-1.5 border-t border-orange-200 flex justify-between items-center font-bold">
                        <span>Net Surplus / (Deficit):</span>
                        <span className={`font-mono font-bold text-sm ${netSurplus >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                          ₹{netSurplus.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: SECTION 80G FORM 10BD EXPORTER */}
      {activeTab === '10bd' && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-xs p-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-orange-100">
            <div>
              <h2 className="text-base font-bold text-stone-900">Income Tax Form 10BD Statement</h2>
              <p className="text-xs text-stone-500">
                Ready-to-upload compilation for Section 80G statutory filing ({eligible80G.length} eligible records in FY {selectedYear.label}).
              </p>
            </div>
            <button
              onClick={handleExportForm10BD}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm btn-press cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Form 10BD (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Donor Name</th>
                  <th className="p-3">PAN</th>
                  <th className="p-3">Village / City</th>
                  <th className="p-3">Festival / Event</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {eligible80G.slice(0, 15).map((d) => (
                  <tr key={d.id} className="hover:bg-orange-50/30">
                    <td className="p-3 font-mono font-bold text-orange-950">{d.receiptNo}</td>
                    <td className="p-3 font-bold text-stone-900">{d.donorName || d.donorFirstName}</td>
                    <td className="p-3 font-mono text-stone-600">{donors.find(dn => dn.phone === d.donorPhone)?.pan || 'PAN_NOT_PROVIDED'}</td>
                    <td className="p-3 text-stone-500">{d.donorVillage || '—'}</td>
                    <td className="p-3 text-orange-900 font-medium">{d.eventName || 'Daily Sanctum'}</td>
                    <td className="p-3 font-bold text-[11px]">{d.paymentMode}</td>
                    <td className="p-3 text-right font-mono font-bold text-stone-900">₹{d.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Opening Balance Source */}
      {isAddSourceModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex min-h-full items-center justify-center overflow-y-auto p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-orange-200">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <h3 className="font-bold text-stone-900 text-sm">Add Opening Balance Source</h3>
              <button onClick={() => setIsAddSourceModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSource} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Source Category *</label>
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold"
                >
                  <option value="CASH">In-Hand Cash (Vault / Float)</option>
                  <option value="BANK">Bank Account (Savings / Current)</option>
                  <option value="FIXED_DEPOSIT">Fixed Deposit (Investments / Corpus)</option>
                  <option value="OTHER">Other Reserves (Post Office / Floats)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India Current A/c"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold"
                />
              </div>

              {newSourceType === 'BANK' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Canara Bank"
                      value={newSourceBank}
                      onChange={(e) => setNewSourceBank(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Account No</label>
                    <input
                      type="text"
                      placeholder="e.g. 1092840192"
                      value={newSourceAccNo}
                      onChange={(e) => setNewSourceAccNo(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Opening Amount as on 1st April (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 45000"
                  value={newSourceAmount}
                  onChange={(e) => setNewSourceAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-bold font-mono text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-orange-100">
                <button
                  type="button"
                  onClick={() => setIsAddSourceModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs cursor-pointer btn-press"
                >
                  Save Opening Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Seva / Event Offering */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex min-h-full items-center justify-center overflow-y-auto p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-orange-200">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Create New Seva / Event Offering</h3>
                <p className="text-[10px] text-stone-500">Each Seva serves as an accounting cause & event</p>
              </div>
              <button onClick={() => setIsAddEventModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Seva / Offering / Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthika Somavara Deepotsava 2026"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category *</label>
                  <select
                    value={newSevaCategory}
                    onChange={(e) => setNewSevaCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-medium"
                  >
                    <option value="FESTIVAL_EVENT">🚩 Major Festival / Annual Event</option>
                    <option value="ANNADANAM">🍲 Annadanam & Goshala</option>
                    <option value="BUILDING_FUND">🏛️ Renovation & Building Fund</option>
                    <option value="DAILY_SEVA">🪔 Daily Sanctum Seva</option>
                    <option value="SPECIAL_POOJA">✨ Special Ritual / Homa</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Deity / Sannidhi</label>
                  <input
                    type="text"
                    placeholder="e.g. Lord Shiva / Main Sanctum"
                    value={newSevaDeity}
                    onChange={(e) => setNewSevaDeity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-medium"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Default Offering (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1001"
                    value={newSevaDefaultAmt}
                    onChange={(e) => setNewSevaDefaultAmt(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Target Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1000000"
                    value={newEventBudget}
                    onChange={(e) => setNewEventBudget(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Period / Season Timing</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Karthika Masa / 3-Day Utsava"
                  value={newEventPeriod}
                  onChange={(e) => setNewEventPeriod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Sacred significance and arrangements..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition btn-press cursor-pointer"
              >
                Save Seva / Event Offering
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Certify Audit & Lock Financial Year */}
      {isCertifyModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex min-h-full items-center justify-center overflow-y-auto p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-orange-200">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Annual Statutory Audit Sign-off</h3>
                <p className="text-[11px] text-stone-500">Certify FY {selectedYear.label} and roll over closing balances into next year</p>
              </div>
              <button onClick={() => setIsCertifyModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCertifyAudit} className="mt-4 space-y-4 text-xs">
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 space-y-1 text-amber-950">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Important Audit Locking Notice:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Upon certification, FY {selectedYear.label} will be <strong>permanently locked</strong> to prevent backdated changes. The final closing balance (<strong>₹{calculatedGrandClosing.toLocaleString('en-IN')}</strong>) will automatically become the opening balance for next year.
                </p>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Auditor / CA Firm Name *</label>
                <input
                  type="text"
                  required
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">ICAI Membership / Reg No *</label>
                <input
                  type="text"
                  required
                  value={auditorRegNo}
                  onChange={(e) => setAuditorRegNo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Audit Certificate Remarks / Opinion</label>
                <textarea
                  rows={2}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-orange-100">
                <button
                  type="button"
                  onClick={() => setIsCertifyModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Audit & Rollover Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
