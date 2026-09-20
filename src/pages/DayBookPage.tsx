import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Coins,
  Landmark,
  Inbox,
  Receipt,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Account, Donation, ExpenseVoucher, HundiCount, AccountTransfer } from '../types/accounting';
import { Button, StatCard, EmptyState } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/cn';
import { PageHeader } from '../components/layout/PageHeader';

export const DayBookPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [donations, setDonations] = useState<Donation[]>(storageService.getDonations());
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>(storageService.getExpenses());
  const [hundis, setHundis] = useState<HundiCount[]>(storageService.getHundiCounts());
  const [accounts, setAccounts] = useState<Account[]>(storageService.getAccounts());
  const [transfers, setTransfers] = useState<AccountTransfer[]>(storageService.getTransfers());

  useEffect(() => {
    const handleUpdate = () => {
      setDonations(storageService.getDonations());
      setExpenses(storageService.getExpenses());
      setHundis(storageService.getHundiCounts());
      setAccounts(storageService.getAccounts());
      setTransfers(storageService.getTransfers());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  // Filter for selected date
  const dayDonations = donations.filter((d) => d.date === selectedDate);
  const dayExpenses = expenses.filter((e) => e.date === selectedDate);
  const dayHundis = hundis.filter((h) => h.unsealDate === selectedDate);
  const dayTransfers = transfers.filter((t) => t.date === selectedDate);

  const totalInflow =
    dayDonations.reduce((sum, d) => sum + d.amount, 0) +
    dayHundis.reduce((sum, h) => sum + h.totalAmount, 0);

  const totalOutflow = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netMovement = totalInflow - totalOutflow;

  // Breakdown by payment mode
  const cashInflow =
    dayDonations.filter((d) => d.paymentMode === 'CASH').reduce((sum, d) => sum + d.amount, 0) +
    dayHundis.reduce((sum, h) => sum + h.totalAmount, 0);
  const upiInflow = dayDonations.filter((d) => d.paymentMode === 'UPI').reduce((sum, d) => sum + d.amount, 0);
  const bankInflow = dayDonations
    .filter((d) => d.paymentMode === 'BANK_TRANSFER' || d.paymentMode === 'CHEQUE')
    .reduce((sum, d) => sum + d.amount, 0);

  const cashOutflow = dayExpenses.filter((e) => e.paymentMode === 'CASH').reduce((sum, e) => sum + e.amount, 0);
  const bankOutflow = dayExpenses.filter((e) => e.paymentMode !== 'CASH').reduce((sum, e) => sum + e.amount, 0);

  // Accounts
  const cashAccount = accounts.find((a) => a.id === 'acc-101');
  const bankAccount = accounts.find((a) => a.id === 'acc-103');

  const noReceipts = dayDonations.length === 0 && dayHundis.length === 0;

  return (
    <main className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader
        icon={Receipt}
        title="Daybook & Cashbook"
        subtitle="Daily cash & bank register with balances"
        actions={
          <>
            <label htmlFor="daybook-date" className="sr-only">Select date</label>
            <input
              id="daybook-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>
              Print Daybook
            </Button>
          </>
        }
      />

      {/* Summary Cards */}
      <section aria-label="Day summary" className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard
          tone="emerald"
          icon={ArrowUpRight}
          label="Total Day Receipts (Inflow)"
          value={formatCurrency(totalInflow, { paise: true })}
          hint={`Cash: ${formatCurrency(cashInflow)} | UPI/Bank: ${formatCurrency(upiInflow + bankInflow)}`}
        />
        <StatCard
          tone="rose"
          icon={ArrowDownLeft}
          label="Total Day Payments (Outflow)"
          value={formatCurrency(totalOutflow, { paise: true })}
          hint={`Cash: ${formatCurrency(cashOutflow)} | Bank: ${formatCurrency(bankOutflow)}`}
        />
        <StatCard
          tone={netMovement >= 0 ? 'saffron' : 'rose'}
          icon={Coins}
          label="Net Day Surplus / Deficit"
          value={formatCurrency(netMovement, { paise: true })}
          hint={`Net movement for ${formatDate(selectedDate)}`}
        />
        <div className="bg-gradient-to-br from-saffron-50 to-marigold-50 p-3.5 rounded-2xl border border-saffron-300 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-saffron-900 font-medium">
            <span>Cash in Hand Balance</span>
            <Landmark className="w-4 h-4 text-saffron-700" aria-hidden="true" />
          </div>
          <div className="text-xl font-bold text-stone-900 counter-value">
            {formatCurrency(cashAccount?.balance || 0, { paise: true })}
          </div>
          <div className="text-[10px] text-stone-500">
            Bank A/c: {formatCurrency(bankAccount?.balance || 0)}
          </div>
        </div>
      </section>

      {/* Two-Column Daybook: Inflow (Receipts) vs Outflow (Vouchers) */}
      <section aria-label="Transaction registers" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Receipts / Inflow */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden space-y-2">
          <div className="bg-emerald-50/70 px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
              <h2 className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                Cash Receipts (Inflow Register)
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-800">
              {formatCurrency(totalInflow, { paise: true })}
            </span>
          </div>

          <div className="p-3 max-h-[500px] overflow-y-auto space-y-2">
            {noReceipts ? (
              <EmptyState
                compact
                icon={Inbox}
                title="No receipts on this date"
                description="Donations and hundi collections recorded for this day will appear here."
              />
            ) : (
              <>
                {dayHundis.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span>Hundi Collection: {h.hundiName}</span>
                      </div>
                      <div className="text-[10px] text-amber-700">Batch: {h.batchNo}</div>
                    </div>
                    <span className="font-bold text-amber-900 text-sm">
                      +{formatCurrency(h.totalAmount, { paise: true })}
                    </span>
                  </div>
                ))}

                {dayDonations.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50/30 border border-stone-200 flex items-center justify-between text-xs transition"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-stone-900">{d.donorName}</div>
                      <div className="text-[10px] text-stone-500">
                        {d.sevaName} • {d.receiptNo} • <span className="font-semibold">{d.paymentMode}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700 text-sm">+{formatCurrency(d.amount, { paise: true })}</div>
                      <div className="text-[10px] text-stone-400">{d.time}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Payments / Outflow */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden space-y-2">
          <div className="bg-rose-50/70 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true"></span>
              <h2 className="font-bold text-xs text-rose-950 uppercase tracking-wider">
                Cash Payments (Outflow Register)
              </h2>
            </div>
            <span className="text-xs font-bold text-rose-800">
              {formatCurrency(totalOutflow, { paise: true })}
            </span>
          </div>

          <div className="p-3 max-h-[500px] overflow-y-auto space-y-2">
            {dayExpenses.length === 0 ? (
              <EmptyState
                compact
                icon={Receipt}
                title="No payment vouchers on this date"
                description="Expense vouchers recorded for this day will appear here."
              />
            ) : (
              dayExpenses.map((e) => (
                <div
                  key={e.id}
                  className="p-2.5 rounded-xl bg-stone-50 hover:bg-rose-50/30 border border-stone-200 flex items-center justify-between text-xs transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-stone-900">{e.payeeName}</div>
                    <div className="text-[10px] text-stone-500">
                      {e.purpose} • {e.voucherNo} • <span className="font-semibold">{e.paymentMode}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-700 text-sm">-{formatCurrency(e.amount, { paise: true })}</div>
                    <div className="text-[10px] text-stone-400">{e.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Internal Transfers (Cash ⇄ Bank) Section if any on this date */}
      {dayTransfers.length > 0 && (
        <section
          aria-label="Internal fund transfers"
          className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <span>🔄 Internal Fund Transfers on {formatDate(selectedDate)} ({dayTransfers.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dayTransfers.map((t) => (
              <div key={t.id} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{t.fromAccountName} ➔ {t.toAccountName}</span>
                    <span className="font-mono text-[10px] text-amber-800 px-1.5 py-0.2 bg-white rounded border border-amber-300">
                      {t.transferNo}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {t.purpose} • Handled by: <strong>{t.handledBy}</strong> {t.referenceNo ? `• Ref: ${t.referenceNo}` : ''}
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-amber-900 text-sm">
                  {formatCurrency(t.amount, { paise: true })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
