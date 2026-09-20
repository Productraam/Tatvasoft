import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Scale,
  Landmark,
  Upload,
  Plus,
  Trash2,
  Check,
  Wand2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Account, LedgerLine, BankStatementLine, ReconciliationState } from '../types/accounting';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';

const inr = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const uid = () => `stl-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export const BankReconciliationPage: React.FC = () => {
  const { notify } = useFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<Account[]>(storageService.getAccounts());

  const moneyAccounts = useMemo(
    () => accounts.filter((a) => a.category === 'ASSET' || a.id.startsWith('acc-10')),
    [accounts]
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    () => moneyAccounts[0]?.id || 'acc-103'
  );

  const selectedAccount = moneyAccounts.find((a) => a.id === selectedAccountId) || moneyAccounts[0];

  const [ledgerLines, setLedgerLines] = useState<LedgerLine[]>([]);
  const [recon, setRecon] = useState<ReconciliationState>(() =>
    storageService.getReconciliation(selectedAccountId)
  );

  // Manual statement entry inputs
  const [mDate, setMDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mDesc, setMDesc] = useState<string>('');
  const [mAmount, setMAmount] = useState<string>('');

  // Refresh data when account changes or storage updates
  useEffect(() => {
    const refresh = () => {
      setAccounts(storageService.getAccounts());
      setLedgerLines(storageService.getBankLedgerLines(selectedAccountId));
      setRecon(storageService.getReconciliation(selectedAccountId));
    };
    refresh();
    window.addEventListener('temple_storage_updated', refresh);
    return () => window.removeEventListener('temple_storage_updated', refresh);
  }, [selectedAccountId]);

  const persist = (next: ReconciliationState) => {
    setRecon(next);
    storageService.saveReconciliation(next);
  };

  const clearedSet = useMemo(() => new Set(recon.clearedLineIds), [recon.clearedLineIds]);

  const toggleCleared = (lineId: string) => {
    const ids = clearedSet.has(lineId)
      ? recon.clearedLineIds.filter((id) => id !== lineId)
      : [...recon.clearedLineIds, lineId];
    persist({ ...recon, clearedLineIds: ids });
  };

  // --- Statement lines ---
  const addManualLine = () => {
    const amt = parseFloat(mAmount);
    if (!mDate || !mDesc.trim() || isNaN(amt) || amt === 0) {
      notify('Enter a date, description and non-zero amount.', 'error');
      return;
    }
    const line: BankStatementLine = { id: uid(), date: mDate, description: mDesc.trim(), amount: amt };
    persist({ ...recon, statementLines: [...recon.statementLines, line] });
    setMDesc('');
    setMAmount('');
  };

  const removeStatementLine = (id: string) => {
    persist({ ...recon, statementLines: recon.statementLines.filter((l) => l.id !== id) });
  };

  const parseCsv = (text: string): BankStatementLine[] => {
    const rows = text
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (rows.length === 0) return [];

    const splitRow = (r: string) =>
      r.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

    // Detect header
    const first = splitRow(rows[0]).map((c) => c.toLowerCase());
    const hasHeader = first.some((c) => ['date', 'description', 'amount', 'debit', 'credit', 'narration'].includes(c));
    const dataRows = hasHeader ? rows.slice(1) : rows;

    const num = (s: string) => parseFloat((s || '').replace(/[₹,\s]/g, '')) || 0;

    const out: BankStatementLine[] = [];
    dataRows.forEach((r) => {
      const cols = splitRow(r);
      if (cols.length < 2) return;
      let date = cols[0];
      let description = '';
      let amount = 0;
      if (cols.length >= 4) {
        // Date, Description, Debit, Credit
        description = cols[1];
        amount = num(cols[3]) - num(cols[2]);
      } else {
        // Date, Description, Amount
        description = cols[1];
        amount = num(cols[2]);
      }
      if (!date || amount === 0) return;
      out.push({ id: uid(), date, description: description || 'Bank line', amount });
    });
    return out;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result || ''));
      if (parsed.length === 0) {
        notify('No valid rows found. Expected: Date, Description, Amount.', 'error');
      } else {
        persist({ ...recon, statementLines: [...recon.statementLines, ...parsed] });
        notify(`${parsed.length} statement line(s) imported.`, 'success');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Auto match: tick book lines whose net equals a statement line amount ---
  const autoMatch = () => {
    const usedStatement = new Set<string>();
    const newCleared = new Set(recon.clearedLineIds);
    let matched = 0;
    ledgerLines.forEach((l) => {
      if (newCleared.has(l.id)) return;
      const net = l.credited - l.deducted;
      const hit = recon.statementLines.find(
        (s) => !usedStatement.has(s.id) && Math.abs(s.amount - net) < 0.01
      );
      if (hit) {
        newCleared.add(l.id);
        usedStatement.add(hit.id);
        matched += 1;
      }
    });
    if (matched === 0) {
      notify('No new matches found between book entries and the statement.', 'info');
      return;
    }
    persist({ ...recon, clearedLineIds: Array.from(newCleared) });
    notify(`${matched} entr${matched === 1 ? 'y' : 'ies'} auto-matched and cleared.`, 'success');
  };

  const resetRecon = () => {
    if (!window.confirm('Reset this reconciliation? Cleared ticks, imported statement lines and closing balance will be removed.')) {
      return;
    }
    persist({
      accountId: selectedAccountId,
      clearedLineIds: [],
      statementLines: [],
      statementClosingBalance: undefined,
      statementDate: undefined,
      lastUpdated: new Date().toISOString(),
    });
  };

  // --- Summary math ---
  const bookBalance = selectedAccount?.balance ?? 0;
  const unclearedNet = useMemo(
    () =>
      ledgerLines
        .filter((l) => !clearedSet.has(l.id))
        .reduce((sum, l) => sum + (l.credited - l.deducted), 0),
    [ledgerLines, clearedSet]
  );
  const statementBalance =
    recon.statementClosingBalance !== undefined && recon.statementClosingBalance !== null
      ? recon.statementClosingBalance
      : 0;
  const hasStatementBalance =
    recon.statementClosingBalance !== undefined && recon.statementClosingBalance !== null;

  // Book = Statement + in-transit(uncleared). Difference should be 0 when reconciled.
  const difference = bookBalance - (statementBalance + unclearedNet);
  const isReconciled = hasStatementBalance && Math.abs(difference) < 0.01;

  const clearedCount = ledgerLines.filter((l) => clearedSet.has(l.id)).length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <PageHeader
        icon={Scale}
        title="Bank Reconciliation"
        subtitle="Match book entries against the bank statement and clear each item"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={autoMatch}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              <Wand2 className="w-4 h-4" /> Auto-match
            </button>
            <button
              onClick={resetRecon}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        }
      />

      {/* Account selector + statement closing balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-stone-500 mb-1">Account</label>
          <div className="relative">
            <Landmark className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {moneyAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Statement Closing Balance</label>
          <input
            type="number"
            step="0.01"
            value={recon.statementClosingBalance ?? ''}
            placeholder="As per bank statement"
            onChange={(e) =>
              persist({
                ...recon,
                statementClosingBalance: e.target.value === '' ? undefined : parseFloat(e.target.value),
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Statement Date</label>
          <input
            type="date"
            value={recon.statementDate ?? ''}
            onChange={(e) => persist({ ...recon, statementDate: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-stone-200 bg-white p-3">
          <p className="text-xs text-stone-500">Book Balance</p>
          <p className="text-lg font-semibold text-stone-900 mt-1">{inr(bookBalance)}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3">
          <p className="text-xs text-stone-500">Statement Balance</p>
          <p className="text-lg font-semibold text-stone-900 mt-1">
            {hasStatementBalance ? inr(statementBalance) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3">
          <p className="text-xs text-stone-500">Outstanding (uncleared)</p>
          <p className={`text-lg font-semibold mt-1 ${unclearedNet < 0 ? 'text-rose-600' : 'text-stone-900'}`}>
            {unclearedNet < 0 ? '-' : ''}
            {inr(unclearedNet)}
          </p>
        </div>
        <div
          className={`rounded-lg border p-3 ${
            !hasStatementBalance
              ? 'border-stone-200 bg-white'
              : isReconciled
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-amber-300 bg-amber-50'
          }`}
        >
          <p className="text-xs text-stone-500">Difference</p>
          <div className="flex items-center gap-1.5 mt-1">
            {hasStatementBalance &&
              (isReconciled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              ))}
            <p
              className={`text-lg font-semibold ${
                !hasStatementBalance ? 'text-stone-900' : isReconciled ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {hasStatementBalance ? inr(difference) : '—'}
            </p>
          </div>
          {hasStatementBalance && (
            <p className={`text-[11px] mt-0.5 ${isReconciled ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isReconciled ? 'Reconciled' : 'Not reconciled'}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Book entries */}
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Book Entries</h2>
              <p className="text-xs text-stone-500">
                {clearedCount} of {ledgerLines.length} cleared
              </p>
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {ledgerLines.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-10">No transactions for this account.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-xs text-stone-500 sticky top-0">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 w-10">✓</th>
                    <th className="text-left font-medium px-3 py-2">Date / Ref</th>
                    <th className="text-left font-medium px-3 py-2">Description</th>
                    <th className="text-right font-medium px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerLines.map((l) => {
                    const cleared = clearedSet.has(l.id);
                    const net = l.credited - l.deducted;
                    return (
                      <tr
                        key={l.id}
                        onClick={() => toggleCleared(l.id)}
                        className={`border-t border-stone-100 cursor-pointer hover:bg-stone-50 ${
                          cleared ? 'bg-emerald-50/60' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded border ${
                              cleared
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {cleared && <Check className="w-3.5 h-3.5" />}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-stone-800">{l.date}</div>
                          <div className="text-[11px] text-stone-400">{l.refNo}</div>
                        </td>
                        <td className="px-3 py-2 text-stone-600">{l.description}</td>
                        <td
                          className={`px-3 py-2 text-right font-medium whitespace-nowrap ${
                            net >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {net >= 0 ? '+' : '-'}
                          {inr(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bank statement */}
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Bank Statement</h2>
              <p className="text-xs text-stone-500">{recon.statementLines.length} line(s)</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                <Upload className="w-4 h-4" /> Import CSV
              </button>
            </div>
          </div>

          {/* Manual add row */}
          <div className="grid grid-cols-12 gap-2 px-3 py-3 border-b border-stone-100 bg-stone-50/50">
            <input
              type="date"
              value={mDate}
              onChange={(e) => setMDate(e.target.value)}
              className="col-span-4 px-2 py-1.5 rounded-md border border-stone-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              type="text"
              value={mDesc}
              placeholder="Description"
              onChange={(e) => setMDesc(e.target.value)}
              className="col-span-4 px-2 py-1.5 rounded-md border border-stone-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              type="number"
              step="0.01"
              value={mAmount}
              placeholder="± Amount"
              onChange={(e) => setMAmount(e.target.value)}
              className="col-span-3 px-2 py-1.5 rounded-md border border-stone-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              onClick={addManualLine}
              className="col-span-1 inline-flex items-center justify-center rounded-md bg-orange-600 text-white hover:bg-orange-700"
              title="Add statement line"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[430px] overflow-y-auto">
            {recon.statementLines.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-10">
                Import a CSV (Date, Description, Amount) or add lines manually.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-xs text-stone-500 sticky top-0">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Date</th>
                    <th className="text-left font-medium px-3 py-2">Description</th>
                    <th className="text-right font-medium px-3 py-2">Amount</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {recon.statementLines.map((s) => (
                    <tr key={s.id} className="border-t border-stone-100">
                      <td className="px-3 py-2 whitespace-nowrap text-stone-800">{s.date}</td>
                      <td className="px-3 py-2 text-stone-600">{s.description}</td>
                      <td
                        className={`px-3 py-2 text-right font-medium whitespace-nowrap ${
                          s.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {s.amount >= 0 ? '+' : '-'}
                        {inr(s.amount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeStatementLine(s.id)}
                          className="text-stone-400 hover:text-rose-600"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReconciliationPage;
