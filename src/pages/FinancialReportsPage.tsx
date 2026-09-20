import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Account, Donation, ExpenseVoucher, SevaType, TempleEvent, FinancialYearPeriod, TempleProfile } from '../types/accounting';
import { BarChart, DonutChart } from '../components/ui';
import { formatCurrency } from '../lib/cn';
import { PageHeader } from '../components/layout/PageHeader';
import { exportToCsv, exportToExcel } from '../services/exportService';

export const FinancialReportsPage: React.FC = () => {
  const [profile, setProfile] = useState<TempleProfile>(storageService.getTempleProfile());
  const [accounts, setAccounts] = useState<Account[]>(storageService.getAccounts());
  const [donations, setDonations] = useState<Donation[]>(storageService.getDonations());
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>(storageService.getExpenses());
  const [sevas, setSevas] = useState<SevaType[]>(storageService.getSevas());
  const [events, setEvents] = useState<TempleEvent[]>(storageService.getEvents());
  const [financialYears] = useState<FinancialYearPeriod[]>(storageService.getFinancialYears());
  const [activeTab, setActiveTab] = useState<'PL' | 'BALANCE_SHEET' | 'TRIAL_BALANCE'>('PL');

  // Filters
  const [fyId, setFyId] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<string>('ALL');
  const [sevaFilter, setSevaFilter] = useState<string>('ALL');

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(storageService.getTempleProfile());
      setAccounts(storageService.getAccounts());
      setDonations(storageService.getDonations());
      setExpenses(storageService.getExpenses());
      setSevas(storageService.getSevas());
      setEvents(storageService.getEvents());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  const handleFyChange = (id: string) => {
    setFyId(id);
    const fy = financialYears.find((f) => f.id === id);
    if (fy) {
      setFromDate(fy.startDate);
      setToDate(fy.endDate);
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  const withinRange = (dateStr: string): boolean => {
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  };

  const matchesScope = (eventId?: string, sevaTypeId?: string): boolean => {
    if (eventFilter !== 'ALL' && eventId !== eventFilter) return false;
    if (sevaFilter !== 'ALL' && sevaTypeId !== sevaFilter) return false;
    return true;
  };

  const hasFilter = fromDate !== '' || toDate !== '' || eventFilter !== 'ALL' || sevaFilter !== 'ALL';

  // --- Account-based snapshot figures (Balance Sheet & Trial Balance) ---
  const incomeAccounts = accounts.filter((a) => a.category === 'INCOME');
  const expenseAccounts = accounts.filter((a) => a.category === 'EXPENSE');
  const assetAccounts = accounts.filter((a) => a.category === 'ASSET');
  const liabilityAccounts = accounts.filter((a) => a.category === 'LIABILITY' || a.category === 'EQUITY');

  const acctNetSurplus =
    incomeAccounts.reduce((s, a) => s + a.balance, 0) - expenseAccounts.reduce((s, a) => s + a.balance, 0);
  const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0) + acctNetSurplus;

  // --- Period activity figures (Income & Expenditure) from donations + expenses ---
  const filteredDonations = donations.filter(
    (d) => d.status !== 'VOIDED' && withinRange(d.date) && matchesScope(d.eventId, d.sevaTypeId)
  );
  const filteredExpenses = expenses.filter(
    (e) => e.status !== 'VOIDED' && withinRange(e.date) && matchesScope(e.eventId, e.sevaTypeId)
  );

  const groupSum = <T,>(items: T[], keyFn: (i: T) => string, amtFn: (i: T) => number) => {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = keyFn(item) || 'Unclassified';
      map.set(key, (map.get(key) || 0) + amtFn(item));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const incomeRows = groupSum(filteredDonations, (d) => d.sevaName, (d) => d.amount);
  const expenseRows = groupSum(filteredExpenses, (e) => e.category || e.sevaName || 'General', (e) => e.amount);
  const totalIncome = incomeRows.reduce((s, r) => s + r.value, 0);
  const totalExpense = expenseRows.reduce((s, r) => s + r.value, 0);
  const netSurplus = totalIncome - totalExpense;

  const periodLabel = (() => {
    if (fromDate && toDate) return `${fromDate} to ${toDate}`;
    if (fromDate) return `From ${fromDate}`;
    if (toDate) return `Up to ${toDate}`;
    return 'All periods';
  })();

  const handleExport = (mode: 'csv' | 'excel') => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let title = '';

    if (activeTab === 'PL') {
      title = 'Income & Expenditure';
      headers = ['Type', 'Head', 'Amount (INR)'];
      rows = [
        ...incomeRows.map((r) => ['Income', r.name, r.value] as (string | number)[]),
        ['Income', 'TOTAL INCOME', totalIncome],
        ...expenseRows.map((r) => ['Expenditure', r.name, r.value] as (string | number)[]),
        ['Expenditure', 'TOTAL EXPENDITURE', totalExpense],
        ['Result', 'NET SURPLUS / (DEFICIT)', netSurplus],
      ];
    } else if (activeTab === 'BALANCE_SHEET') {
      title = 'Balance Sheet';
      headers = ['Side', 'Account Head', 'Sub Category', 'Amount (INR)'];
      rows = [
        ...liabilityAccounts.map((a) => ['Liabilities', a.name, a.subCategory, a.balance] as (string | number)[]),
        ['Liabilities', 'Current Year Net Surplus', '', acctNetSurplus],
        ['Liabilities', 'TOTAL LIABILITIES', '', totalLiabilities],
        ...assetAccounts.map((a) => ['Assets', a.name, a.subCategory, a.balance] as (string | number)[]),
        ['Assets', 'TOTAL ASSETS', '', totalAssets],
      ];
    } else {
      title = 'Trial Balance';
      headers = ['Code', 'Account Head', 'Category', 'Debit (INR)', 'Credit (INR)'];
      rows = accounts.map((a) => {
        const isDebit = a.category === 'ASSET' || a.category === 'EXPENSE';
        return [a.code, a.name, a.category, isDebit ? a.balance : 0, isDebit ? 0 : a.balance];
      });
    }

    const stamp = new Date().toISOString().split('T')[0];
    const filename = `${profile.name.replace(/[^a-z0-9]+/gi, '_')}_${title.replace(/[^a-z0-9]+/gi, '_')}_${stamp}`;
    if (mode === 'csv') exportToCsv(filename, headers, rows);
    else exportToExcel(filename, title, headers, rows);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader
        icon={BarChart3}
        title="Financial Statements"
        subtitle="Income & Expenditure, Balance Sheet, Trial Balance"
        actions={
          <>
            <div className="flex bg-stone-100 p-1 rounded-lg gap-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('PL')}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === 'PL' ? 'bg-white text-orange-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Income & Expenditure
              </button>
              <button
                onClick={() => setActiveTab('BALANCE_SHEET')}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === 'BALANCE_SHEET' ? 'bg-white text-orange-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Balance Sheet
              </button>
              <button
                onClick={() => setActiveTab('TRIAL_BALANCE')}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === 'TRIAL_BALANCE' ? 'bg-white text-orange-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Trial Balance
              </button>
            </div>

            <button
              onClick={() => handleExport('csv')}
              className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold"
              title="Export CSV"
            >
              <FileDown className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold"
              title="Print Official Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
          </>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-3 flex flex-wrap items-end gap-3 text-xs print:hidden">
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-stone-600">Financial Year</label>
          <select
            value={fyId}
            onChange={(e) => handleFyChange(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Years</option>
            {financialYears.map((fy) => (
              <option key={fy.id} value={fy.id}>{fy.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-stone-600">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setFyId('ALL'); }}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-stone-600">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setFyId('ALL'); }}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-stone-600">Event</label>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-stone-600">Seva</label>
          <select
            value={sevaFilter}
            onChange={(e) => setSevaFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Sevas</option>
            {sevas.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {hasFilter && (
          <button
            onClick={() => { setFyId('ALL'); setFromDate(''); setToDate(''); setEventFilter('ALL'); setSevaFilter('ALL'); }}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 font-semibold"
          >
            Clear
          </button>
        )}
        <div className="ml-auto text-stone-500 self-center">
          Period: <span className="font-semibold text-stone-700">{periodLabel}</span>
        </div>
      </div>

      {/* 1. INCOME & EXPENDITURE STATEMENT */}
      {activeTab === 'PL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
              <div className="text-xs text-emerald-800 font-semibold">Total Temple Income (Revenue)</div>
              <div className="text-2xl font-bold text-emerald-900 mt-1 font-mono">
                ₹{totalIncome.toLocaleString('en-IN')}.00
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
              <div className="text-xs text-rose-800 font-semibold">Total Temple Expenditure (Expenses)</div>
              <div className="text-2xl font-bold text-rose-900 mt-1 font-mono">
                ₹{totalExpense.toLocaleString('en-IN')}.00
              </div>
            </div>
            <div className="bg-saffron-50 border border-saffron-200 p-3.5 rounded-2xl">
              <div className="text-xs text-saffron-800 font-semibold">Net Surplus / (Deficit)</div>
              <div className={`text-2xl font-bold mt-1 font-mono ${netSurplus >= 0 ? 'text-saffron-900' : 'text-rose-700'}`}>
                ₹{netSurplus.toLocaleString('en-IN')}.00
              </div>
            </div>
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4">
              <h3 className="text-h3 mb-3">Income vs Expenditure</h3>
              <BarChart
                data={[
                  { label: 'Income', value: totalIncome, color: '#15803d' },
                  { label: 'Expenditure', value: totalExpense, color: '#be123c' },
                  { label: 'Surplus', value: Math.max(netSurplus, 0), color: '#e65100' },
                ]}
              />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4">
              <h3 className="text-h3 mb-3">Income by Head</h3>
              <DonutChart
                data={incomeRows
                  .filter((r) => r.value > 0)
                  .map((r) => ({ label: r.name, value: r.value }))}
                centerLabel={
                  <div>
                    <div className="text-[10px] text-stone-400">Total</div>
                    <div className="text-sm font-bold text-stone-800">{formatCurrency(totalIncome)}</div>
                  </div>
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Income Side */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 space-y-3">
              <div className="font-bold text-xs text-emerald-900 uppercase tracking-wider pb-2 border-b flex justify-between">
                <span>Income Breakdown (Revenue Heads)</span>
                <span>Amount (INR)</span>
              </div>
              <div className="space-y-2 text-xs">
                {incomeRows.length === 0 && (
                  <div className="text-stone-400 py-2">No income in the selected period.</div>
                )}
                {incomeRows.map((row) => (
                  <div key={row.name} className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-800">{row.name}</span>
                    <span className="font-mono font-bold text-stone-900">
                      ₹{row.value.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t-2 border-stone-300 flex justify-between text-xs font-bold">
                <span>TOTAL INCOME (A):</span>
                <span className="text-emerald-800 font-mono">₹{totalIncome.toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            {/* Expenditure Side */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 space-y-3">
              <div className="font-bold text-xs text-rose-900 uppercase tracking-wider pb-2 border-b flex justify-between">
                <span>Expenditure Breakdown (Expense Heads)</span>
                <span>Amount (INR)</span>
              </div>
              <div className="space-y-2 text-xs">
                {expenseRows.length === 0 && (
                  <div className="text-stone-400 py-2">No expenditure in the selected period.</div>
                )}
                {expenseRows.map((row) => (
                  <div key={row.name} className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-800">{row.name}</span>
                    <span className="font-mono font-bold text-stone-900">
                      ₹{row.value.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t-2 border-stone-300 flex justify-between text-xs font-bold">
                <span>TOTAL EXPENDITURE (B):</span>
                <span className="text-rose-800 font-mono">₹{totalExpense.toLocaleString('en-IN')}.00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BALANCE SHEET */}
      {activeTab === 'BALANCE_SHEET' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 space-y-4">
          <div className="text-center space-y-1 pb-3 border-b border-stone-200">
            <h3 className="font-serif font-bold text-base text-stone-900">{profile.name}</h3>
            <p className="text-xs text-stone-500">Statement of Assets & Liabilities (Balance Sheet)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Liabilities & Capital Fund */}
            <div className="space-y-3">
              <div className="bg-stone-50 p-2.5 rounded-xl font-bold text-xs text-stone-800 flex justify-between uppercase">
                <span>Funds & Liabilities (Capital & Trust Funds)</span>
                <span>Amount</span>
              </div>
              <div className="space-y-2 text-xs">
                {liabilityAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between py-1 border-b border-stone-100">
                    <div>
                      <div className="font-semibold text-stone-800">{acc.name}</div>
                      <div className="text-[10px] text-stone-400">{acc.subCategory}</div>
                    </div>
                    <span className="font-mono font-bold text-stone-900">
                      ₹{acc.balance.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                ))}
                <div className="flex justify-between py-1 border-b border-saffron-200 bg-saffron-50/40 px-2 rounded">
                  <span className="font-semibold text-saffron-900">Current Year Net Surplus (I&E)</span>
                  <span className="font-mono font-bold text-saffron-900">
                    ₹{acctNetSurplus.toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t-2 border-stone-900 flex justify-between text-xs font-bold">
                <span>TOTAL LIABILITIES:</span>
                <span className="font-mono text-sm">₹{totalLiabilities.toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            {/* Assets */}
            <div className="space-y-3">
              <div className="bg-stone-50 p-2.5 rounded-xl font-bold text-xs text-stone-800 flex justify-between uppercase">
                <span>Assets & Property (Fixed & Current Assets)</span>
                <span>Amount</span>
              </div>
              <div className="space-y-2 text-xs">
                {assetAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between py-1 border-b border-stone-100">
                    <div>
                      <div className="font-semibold text-stone-800">{acc.name}</div>
                      <div className="text-[10px] text-stone-400">{acc.subCategory}</div>
                    </div>
                    <span className="font-mono font-bold text-stone-900">
                      ₹{acc.balance.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t-2 border-stone-900 flex justify-between text-xs font-bold">
                <span>TOTAL ASSETS:</span>
                <span className="font-mono text-sm">₹{totalAssets.toLocaleString('en-IN')}.00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRIAL BALANCE */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b">
              <tr>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Account Head Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Debit Balance (₹)</th>
                <th className="py-2.5 px-3 text-right">Credit Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {accounts.map((acc) => {
                const isDebit = acc.category === 'ASSET' || acc.category === 'EXPENSE';
                return (
                  <tr key={acc.id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 font-mono text-saffron-800 font-bold">{acc.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900">{acc.name}</td>
                    <td className="py-2.5 px-3 text-[10px] text-stone-500 uppercase">{acc.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {isDebit ? `₹${acc.balance.toLocaleString('en-IN')}.00` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {!isDebit ? `₹${acc.balance.toLocaleString('en-IN')}.00` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {(() => {
              const totalDebit = accounts
                .filter((a) => a.category === 'ASSET' || a.category === 'EXPENSE')
                .reduce((sum, a) => sum + a.balance, 0);
              const totalCredit = accounts
                .filter((a) => !(a.category === 'ASSET' || a.category === 'EXPENSE'))
                .reduce((sum, a) => sum + a.balance, 0);
              const isBalanced = Math.round(totalDebit) === Math.round(totalCredit);
              return (
                <tfoot>
                  <tr className="bg-stone-100 border-t-2 border-stone-300 font-bold text-stone-900">
                    <td className="py-3 px-3" colSpan={3}>TOTAL</td>
                    <td className="py-3 px-3 text-right font-mono">₹{totalDebit.toLocaleString('en-IN')}.00</td>
                    <td className="py-3 px-3 text-right font-mono">₹{totalCredit.toLocaleString('en-IN')}.00</td>
                  </tr>
                  <tr className={isBalanced ? 'bg-emerald-50' : 'bg-rose-50'}>
                    <td className="py-2.5 px-3" colSpan={5}>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isBalanced
                          ? '✓ Trial Balance is balanced — Total Debits equal Total Credits.'
                          : `⚠ Trial Balance does NOT tie out — difference of ₹${Math.abs(totalDebit - totalCredit).toLocaleString('en-IN')}.00. Review opening balances.`}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      )}
    </div>
  );
};
