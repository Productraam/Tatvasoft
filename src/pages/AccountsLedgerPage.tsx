import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote,
  Building2,
  PlusCircle,
  FileText,
  Search,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  X,
  Wallet,
  PiggyBank,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Account, Donation, ExpenseVoucher, AccountTransfer, HundiCount } from '../types/accounting';
import { useFeedback } from '../components/ui/Feedback';
import { PageHeader } from '../components/layout/PageHeader';

interface TransactionLine {
  id: string;
  date: string;
  time: string;
  type: 'DONATION' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  refNo: string;
  partyName: string;
  description: string;
  categoryOrSeva: string;
  paymentMode: string;
  credited: number;
  deducted: number;
  timestamp: number;
}

export const AccountsLedgerPage: React.FC = () => {
  const { notify } = useFeedback();
  const [accounts, setAccounts] = useState<Account[]>(storageService.getAccounts());
  const [donations, setDonations] = useState<Donation[]>(storageService.getDonations());
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>(storageService.getExpenses());
  const [transfers, setTransfers] = useState<AccountTransfer[]>(storageService.getTransfers());
  const [hundiCounts, setHundiCounts] = useState<HundiCount[]>(storageService.getHundiCounts());
  const [currentUser] = useState(storageService.getCurrentUser());

  // Filter for money-holding accounts (In-Hand Cash, Bank accounts, FDs)
  const moneyAccounts = useMemo(() => {
    return accounts.filter(a => a.category === 'ASSET' || a.id.startsWith('acc-10'));
  }, [accounts]);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return moneyAccounts[0]?.id || 'acc-101';
  });

  const [filterType, setFilterType] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Account Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccType, setNewAccType] = useState<'CASH' | 'BANK'>('BANK');
  const [newAccOpeningBal, setNewAccOpeningBal] = useState<string>('0');
  const [newAccDesc, setNewAccDesc] = useState<string>('');
  const [newAccBankName, setNewAccBankName] = useState<string>('');
  const [newAccNumber, setNewAccNumber] = useState<string>('');

  // Transfer Modal State (Cash ⇄ Bank)
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferMode, setTransferMode] = useState<'DEPOSIT_TO_BANK' | 'WITHDRAW_FROM_BANK' | 'CUSTOM'>('DEPOSIT_TO_BANK');
  const [transferFromId, setTransferFromId] = useState<string>('acc-101');
  const [transferToId, setTransferToId] = useState<string>('acc-103');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferRefNo, setTransferRefNo] = useState<string>('');
  const [transferHandledBy, setTransferHandledBy] = useState<string>(currentUser.name);
  const [transferAuthorizedBy, setTransferAuthorizedBy] = useState<string>('Dr. K. V. Sharma (Trustee)');
  const [transferPurpose, setTransferPurpose] = useState<string>('Counter cash deposit to operational bank account');

  useEffect(() => {
    const handleUpdate = () => {
      setAccounts(storageService.getAccounts());
      setDonations(storageService.getDonations());
      setExpenses(storageService.getExpenses());
      setTransfers(storageService.getTransfers());
      setHundiCounts(storageService.getHundiCounts());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  const selectedAccount = moneyAccounts.find((a) => a.id === selectedAccountId) || moneyAccounts[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Build the complete transaction ledger for the selected account
  const ledgerTransactions = useMemo<TransactionLine[]>(() => {
    if (!selectedAccount) return [];
    const lines: TransactionLine[] = [];
    const isCashAccount = selectedAccount.id === 'acc-101' || selectedAccount.name.toLowerCase().includes('cash') || selectedAccount.name.toLowerCase().includes('in-hand');
    const isBankMainAccount = selectedAccount.id === 'acc-103' || selectedAccount.name.toLowerCase().includes('bank');

    // 1. Process Donations (Money In / Credited)
    donations.forEach(d => {
      if (d.donationType === 'MONETARY' && d.amount > 0) {
        const matchesThisAccount = d.depositAccountId
          ? d.depositAccountId === selectedAccount.id
          : (isCashAccount && d.paymentMode === 'CASH') ||
            (isBankMainAccount && d.paymentMode !== 'CASH' && d.paymentMode !== 'IN_KIND') ||
            (!isCashAccount && !isBankMainAccount && d.paymentMode === 'BANK_TRANSFER');

        if (matchesThisAccount) {
          const dt = new Date(`${d.date}T${d.time || '00:00:00'}`);
          lines.push({
            id: d.id,
            date: d.date,
            time: d.time || '',
            type: 'DONATION',
            refNo: d.receiptNo,
            partyName: `${d.donorFirstName} ${d.donorSecondName}`.trim() || d.donorName,
            description: `Donation for ${d.sevaName} (${d.donorVillage || 'Devotee'})`,
            categoryOrSeva: d.sevaName,
            paymentMode: d.paymentMode,
            credited: d.amount,
            deducted: 0,
            timestamp: isNaN(dt.getTime()) ? Date.now() : dt.getTime(),
          });
        }
      }
    });

    // 2. Process Expenses (Money Out / Deducted)
    expenses.forEach(e => {
      const matchesThisAccount =
        e.creditAccountId === selectedAccount.id ||
        (isCashAccount && e.paymentMode === 'CASH' && !e.creditAccountId) ||
        (isBankMainAccount && e.paymentMode !== 'CASH' && !e.creditAccountId);

      if (matchesThisAccount) {
        const dt = new Date(`${e.date}T${e.time || '00:00:00'}`);
        lines.push({
          id: e.id,
          date: e.date,
          time: e.time || '',
          type: 'EXPENSE',
          refNo: e.sanctionOrderNo || e.voucherNo,
          partyName: e.payeeName,
          description: e.purpose,
          categoryOrSeva: e.sevaName || e.category || 'Temple Expense',
          paymentMode: e.paymentMode,
          credited: 0,
          deducted: e.amount,
          timestamp: isNaN(dt.getTime()) ? Date.now() : dt.getTime(),
        });
      }
    });

    // 3. Process Transfers (Cash ⇄ Bank)
    transfers.forEach(t => {
      const dt = new Date(`${t.date}T${t.time || '00:00:00'}`);
      const ts = isNaN(dt.getTime()) ? Date.now() : dt.getTime();

      // If money moved OUT of this account
      if (t.fromAccountId === selectedAccount.id) {
        lines.push({
          id: `out-${t.id}`,
          date: t.date,
          time: t.time,
          type: 'TRANSFER_OUT',
          refNo: t.transferNo,
          partyName: `Transferred to: ${t.toAccountName}`,
          description: `${t.purpose} (${t.referenceNo ? 'Slip: ' + t.referenceNo : 'Direct'}) • Handled: ${t.handledBy}`,
          categoryOrSeva: 'Internal Transfer',
          paymentMode: 'CONTRA',
          credited: 0,
          deducted: t.amount,
          timestamp: ts,
        });
      }

      // If money moved INTO this account
      if (t.toAccountId === selectedAccount.id) {
        lines.push({
          id: `in-${t.id}`,
          date: t.date,
          time: t.time,
          type: 'TRANSFER_IN',
          refNo: t.transferNo,
          partyName: `Received from: ${t.fromAccountName}`,
          description: `${t.purpose} (${t.referenceNo ? 'Slip: ' + t.referenceNo : 'Direct'}) • Handled: ${t.handledBy}`,
          categoryOrSeva: 'Internal Transfer',
          paymentMode: 'CONTRA',
          credited: t.amount,
          deducted: 0,
          timestamp: ts,
        });
      }
    });

    // 4. Process Hundi / Danpatra Collections (Money In / Credited)
    hundiCounts.forEach(h => {
      const depositAccountId = h.depositToAccountId || 'acc-101';
      if (depositAccountId !== selectedAccount.id) return;
      if (!(h.totalAmount > 0)) return;

      const dt = new Date(`${h.unsealDate}T00:00:00`);
      const createdTs = h.createdAt ? new Date(h.createdAt).getTime() : NaN;
      const timeStr = h.createdAt ? new Date(h.createdAt).toTimeString().split(' ')[0] : '';
      lines.push({
        id: h.id,
        date: h.unsealDate,
        time: timeStr,
        type: 'DONATION',
        refNo: h.batchNo,
        partyName: h.hundiName || 'Hundi Collection',
        description: `Hundi Unsealing Collection • Witnesses: ${h.witnesses.join(', ')}`,
        categoryOrSeva: 'Hundi / Danpatra',
        paymentMode: 'CASH',
        credited: h.totalAmount,
        deducted: 0,
        timestamp: !isNaN(createdTs) ? createdTs : (isNaN(dt.getTime()) ? Date.now() : dt.getTime()),
      });
    });

    // Sort chronologically (oldest first to calculate running balance accurately)
    lines.sort((a, b) => a.timestamp - b.timestamp);
    return lines;
  }, [selectedAccount, donations, expenses, transfers, hundiCounts]);

  // Compute running balance from starting point
  const computedLedger = useMemo(() => {
    const running = selectedAccount?.balance || 0;
    const totalCredited = ledgerTransactions.reduce((acc, l) => acc + l.credited, 0);
    const totalDeducted = ledgerTransactions.reduce((acc, l) => acc + l.deducted, 0);
    const openingBal = Math.max(0, running - totalCredited + totalDeducted);

    let cur = openingBal;
    const withRunning = ledgerTransactions.map(row => {
      cur = cur + row.credited - row.deducted;
      return {
        ...row,
        runningBalance: cur
      };
    });

    return {
      openingBal,
      totalCredited,
      totalDeducted,
      entries: [...withRunning].reverse()
    };
  }, [ledgerTransactions, selectedAccount]);

  const filteredEntries = useMemo(() => {
    return computedLedger.entries.filter(row => {
      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'INFLOW' && row.credited > 0) ||
        (filterType === 'OUTFLOW' && row.deducted > 0);

      const matchesSearch =
        row.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.categoryOrSeva.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [computedLedger, filterType, searchQuery]);

  // Handle Transfer Direction Quick Buttons
  const handleSetTransferPreset = (mode: 'DEPOSIT_TO_BANK' | 'WITHDRAW_FROM_BANK' | 'CUSTOM') => {
    setTransferMode(mode);
    const cashAcc = moneyAccounts.find(a => a.id === 'acc-101' || a.name.toLowerCase().includes('cash')) || moneyAccounts[0];
    const bankAcc = moneyAccounts.find(a => a.id === 'acc-103' || a.name.toLowerCase().includes('bank')) || moneyAccounts[1] || moneyAccounts[0];

    if (mode === 'DEPOSIT_TO_BANK') {
      setTransferFromId(cashAcc?.id || 'acc-101');
      setTransferToId(bankAcc?.id || 'acc-103');
      setTransferPurpose('Counter cash deposit to operational bank account');
    } else if (mode === 'WITHDRAW_FROM_BANK') {
      setTransferFromId(bankAcc?.id || 'acc-103');
      setTransferToId(cashAcc?.id || 'acc-101');
      setTransferPurpose('Cash withdrawal from bank for counter float / festival requirements');
    }
  };

  const fromAccountObj = moneyAccounts.find(a => a.id === transferFromId);
  const toAccountObj = moneyAccounts.find(a => a.id === transferToId);

  // Submit Fund Transfer
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      notify('Please enter a valid transfer amount in ₹.', 'error');
      return;
    }

    if (transferFromId === transferToId) {
      notify('Source and destination accounts must be different.', 'error');
      return;
    }

    if (fromAccountObj && amt > fromAccountObj.balance) {
      notify(`Insufficient balance in ${fromAccountObj.name}. Available: ₹${fromAccountObj.balance.toLocaleString('en-IN')}`, 'error');
      return;
    }

    const t = storageService.createTransfer({
      fromAccountId: transferFromId,
      fromAccountName: fromAccountObj?.name || 'Cash Account',
      toAccountId: transferToId,
      toAccountName: toAccountObj?.name || 'Bank Account',
      amount: amt,
      transferType: transferMode === 'DEPOSIT_TO_BANK' ? 'CASH_DEPOSIT' : transferMode === 'WITHDRAW_FROM_BANK' ? 'CASH_WITHDRAWAL' : 'INTERNAL_TRANSFER',
      referenceNo: transferRefNo.trim() || undefined,
      handledBy: transferHandledBy.trim() || currentUser.name,
      authorizedBy: transferAuthorizedBy.trim() || 'Trustee',
      purpose: transferPurpose.trim() || 'Internal fund transfer',
    });

    setShowTransferModal(false);
    setTransferAmount('');
    setTransferRefNo('');
    showToast(`Successfully transferred ₹${amt.toLocaleString('en-IN')} from ${t.fromAccountName} to ${t.toAccountName}!`);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      notify('Please provide an account name.', 'error');
      return;
    }

    if (newAccType === 'BANK' && (!newAccBankName.trim() || !newAccNumber.trim())) {
      notify('Bank name and account number are required for a bank account.', 'error');
      return;
    }

    const openAmt = parseFloat(newAccOpeningBal) || 0;
    const newAcc = storageService.createAccount({
      name: newAccName.trim(),
      type: newAccType,
      openingBalance: openAmt,
      description: newAccDesc.trim(),
      bankName: newAccType === 'BANK' ? newAccBankName.trim() : undefined,
      accountNumber: newAccType === 'BANK' ? newAccNumber.trim() : undefined,
    });

    setSelectedAccountId(newAcc.id);
    setShowAddModal(false);
    setNewAccName('');
    setNewAccOpeningBal('0');
    setNewAccDesc('');
    setNewAccBankName('');
    setNewAccNumber('');
    showToast(
      openAmt > 0
        ? `Account "${newAcc.name}" created with ₹${openAmt.toLocaleString('en-IN')} opening balance (posted to Corpus Fund).`
        : `Account "${newAcc.name}" created successfully!`
    );
  };

  return (
    <div className="p-4 animate-fade-in max-w-7xl mx-auto space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <PageHeader
        icon={Wallet}
        title="Cash & Bank Ledgers"
        subtitle="In-hand cash and bank passbooks"
        actions={
          <>
            <button
              onClick={() => {
                handleSetTransferPreset('DEPOSIT_TO_BANK');
                setShowTransferModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Move Money</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 4 Columns: Money Accounts Directory */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-orange-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-orange-100">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-orange-600" />
                <span>Temple Money Accounts</span>
              </span>
              <span className="text-[10px] text-stone-400 font-semibold">{moneyAccounts.length} Active</span>
            </div>

            {/* Money Accounts List */}
            <div className="space-y-2">
              {moneyAccounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                const isCash = acc.name.toLowerCase().includes('cash') || acc.name.toLowerCase().includes('in-hand') || acc.id === 'acc-101';
                const isFD = acc.name.toLowerCase().includes('fd') || acc.name.toLowerCase().includes('deposit');

                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50/60 border-orange-500 shadow-xs ring-1 ring-orange-400'
                        : 'bg-stone-50/70 border-stone-200/80 hover:bg-orange-50/30 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        isCash
                          ? 'bg-emerald-100 text-emerald-800'
                          : isFD
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isCash ? '💵' : isFD ? '🏛️' : '🏦'}
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-stone-900">{acc.name}</div>
                        <div className="text-[10px] text-stone-500 line-clamp-1">
                          {acc.description || (isCash ? 'Physical Cash Float' : 'Operational Bank')}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-stone-900 font-mono">
                        ₹{acc.balance.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-emerald-700 font-semibold uppercase tracking-wider">
                        Available
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Transfer Banner Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-2xl p-4 border border-amber-300/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                <span>Move Money Anytime</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Depositing counter cash to SBI? Or withdrawing bank funds for festival expenses? Use the <strong>Move Money</strong> button to transfer amounts with full bank reference & challan records.
            </p>
            <button
              onClick={() => {
                handleSetTransferPreset('DEPOSIT_TO_BANK');
                setShowTransferModal(true);
              }}
              className="w-full py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
            >
              Deposit In-Hand Cash to Bank ➔
            </button>
          </div>
        </div>

        {/* Right 8 Columns: Selected Account Live Passbook Ledger */}
        <div className="lg:col-span-8 space-y-4">
          {selectedAccount ? (
            <>
              {/* Account Top Banner */}
              <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-400/30">
                      {selectedAccount.name.toLowerCase().includes('cash') ? 'In-Hand Cash Float' : 'Bank Passbook'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{selectedAccount.name}</h3>
                  <p className="text-xs text-stone-300 max-w-md">{selectedAccount.description}</p>
                </div>

                <div className="text-left sm:text-right bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-white/10 sm:border-none">
                  <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                    Current Available Balance
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    ₹{selectedAccount.balance.toLocaleString('en-IN')}.00
                  </div>
                </div>
              </div>

              {/* Account Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-stone-500 text-xs">
                    <span className="font-semibold">Credited (+) Inflow</span>
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-base font-extrabold text-emerald-700 font-mono">
                    +₹{computedLedger.totalCredited.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-stone-400">Donations & Transfers In</div>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-rose-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-stone-500 text-xs">
                    <span className="font-semibold">Deducted (-) Outflow</span>
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-base font-extrabold text-rose-700 font-mono">
                    -₹{computedLedger.totalDeducted.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-stone-400">Expenses & Transfers Out</div>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-orange-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-stone-500 text-xs">
                    <span className="font-semibold">Net Movement</span>
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className={`text-base font-extrabold font-mono ${
                    computedLedger.totalCredited - computedLedger.totalDeducted >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}>
                    ₹{(computedLedger.totalCredited - computedLedger.totalDeducted).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-stone-400">Total Net Inflow / Outflow</div>
                </div>
              </div>

              {/* Passbook Ledger Table */}
              <div className="bg-white rounded-2xl p-4 border border-orange-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-100">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Passbook Statement
                    </span>
                    <span className="text-[11px] text-stone-400">({filteredEntries.length} transactions)</span>
                  </div>

                  {/* Filter Inflow / Outflow */}
                  <div className="flex items-center gap-2">
                    <div className="flex bg-stone-100 p-0.5 rounded-lg text-xs font-semibold">
                      <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                          filterType === 'ALL' ? 'bg-white text-orange-900 shadow-2xs font-bold' : 'text-stone-600'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilterType('INFLOW')}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                          filterType === 'INFLOW' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-stone-600'
                        }`}
                      >
                        Credited (+)
                      </button>
                      <button
                        onClick={() => setFilterType('OUTFLOW')}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                          filterType === 'OUTFLOW' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-stone-600'
                        }`}
                      >
                        Deducted (-)
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ref or party..."
                        className="pl-7 pr-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none w-36 sm:w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[480px] border border-stone-200/80 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Ref No</th>
                        <th className="py-2.5 px-3">Party & Particulars</th>
                        <th className="py-2.5 px-3 text-right">Credited (+₹)</th>
                        <th className="py-2.5 px-3 text-right">Deducted (-₹)</th>
                        <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-stone-400 text-xs">
                            No transactions found for this account.
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((row) => (
                          <tr key={row.id} className="hover:bg-orange-50/30 transition">
                            <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                              <div>{row.date}</div>
                              {row.time && <div className="text-[10px] text-stone-400">{row.time}</div>}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                row.type === 'DONATION'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : row.type === 'EXPENSE'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {row.refNo}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                                <span>{row.partyName}</span>
                                {row.type.startsWith('TRANSFER') && (
                                  <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                    Contra
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-500">{row.description}</div>
                              {row.categoryOrSeva && (
                                <span className="inline-block mt-0.5 text-[9px] bg-stone-100 px-1.5 py-0.2 rounded text-stone-600">
                                  {row.categoryOrSeva}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                              {row.credited > 0 ? `+₹${row.credited.toLocaleString('en-IN')}` : '—'}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                              {row.deducted > 0 ? `-₹${row.deducted.toLocaleString('en-IN')}` : '—'}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                              ₹{row.runningBalance.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-stone-400 text-xs">
              Select an account on the left to view its passbook ledger.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Move Money (Cash ⇄ Bank Fund Transfer) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex min-h-full items-center justify-center overflow-y-auto p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-orange-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Move Money (Cash ⇄ Bank Transfer)</h3>
                  <p className="text-[10px] text-stone-500">Internal contra transfer with full bank challan and authorization details</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Direction Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSetTransferPreset('DEPOSIT_TO_BANK')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  transferMode === 'DEPOSIT_TO_BANK'
                    ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-1 ring-amber-400'
                    : 'bg-stone-50 border-stone-200 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏦</span>
                  <div>
                    <div className="font-bold text-xs text-stone-900">Deposit Cash to Bank</div>
                    <div className="text-[10px] text-stone-500">In-Hand Cash ➔ Bank A/c</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSetTransferPreset('WITHDRAW_FROM_BANK')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  transferMode === 'WITHDRAW_FROM_BANK'
                    ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-1 ring-amber-400'
                    : 'bg-stone-50 border-stone-200 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">💵</span>
                  <div>
                    <div className="font-bold text-xs text-stone-900">Withdraw Cash from Bank</div>
                    <div className="text-[10px] text-stone-500">Bank A/c ➔ In-Hand Cash</div>
                  </div>
                </div>
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5 text-xs">
              {/* Visual Transfer Visualizer */}
              <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200/80 flex items-center justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Deduct From</span>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full p-1.5 bg-white border border-stone-300 rounded-lg font-bold text-xs text-stone-900 focus:outline-none"
                  >
                    {moneyAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (₹{a.balance.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-stone-500 block">
                    Avail: <strong className="text-emerald-700">₹{fromAccountObj?.balance.toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                <div className="p-2 rounded-full bg-white border border-orange-200 shadow-2xs text-orange-600">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Credit Into</span>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full p-1.5 bg-white border border-stone-300 rounded-lg font-bold text-xs text-stone-900 focus:outline-none"
                  >
                    {moneyAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (₹{a.balance.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-stone-500 block">
                    Cur: <strong className="text-stone-700">₹{toAccountObj?.balance.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>

              {/* Amount and Quick Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-700 block">Transfer Amount (INR) *</label>
                  {fromAccountObj && fromAccountObj.balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setTransferAmount(fromAccountObj.balance.toString())}
                      className="text-[10px] font-bold text-orange-700 hover:text-orange-900 underline cursor-pointer"
                    >
                      Move All (₹{fromAccountObj.balance.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-sm text-stone-900 focus:outline-none"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex gap-1.5 mt-2">
                  {[5000, 10000, 25000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTransferAmount(val.toString())}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-orange-100 text-stone-700 hover:text-orange-900 text-[10px] font-semibold transition cursor-pointer"
                    >
                      +₹{val.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Details */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Bank Challan / Cheque / Ref No</label>
                  <input
                    type="text"
                    placeholder="e.g. SBI Challan #44921"
                    value={transferRefNo}
                    onChange={(e) => setTransferRefNo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Handled By (Staff / Cashier) *</label>
                  <input
                    type="text"
                    required
                    value={transferHandledBy}
                    onChange={(e) => setTransferHandledBy(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Authorized By (Trustee) *</label>
                  <input
                    type="text"
                    required
                    value={transferAuthorizedBy}
                    onChange={(e) => setTransferAuthorizedBy(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Purpose / Narration</label>
                  <input
                    type="text"
                    value={transferPurpose}
                    onChange={(e) => setTransferPurpose(e.target.value)}
                    placeholder="e.g. Weekly counter cash deposit"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Move Funds</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Account */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex min-h-full items-center justify-center overflow-y-auto p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-orange-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <h3 className="font-bold text-stone-900 text-sm">Add New Bank or Cash Account</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Account Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canara Bank Savings / Goshala Cash Box"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Account Type</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-medium"
                  >
                    <option value="BANK">🏦 Bank Account</option>
                    <option value="CASH">💵 In-Hand Cash Float</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Starting Balance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newAccOpeningBal}
                    onChange={(e) => setNewAccOpeningBal(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              {newAccType === 'BANK' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Canara Bank"
                      value={newAccBankName}
                      onChange={(e) => setNewAccBankName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1092840192"
                      value={newAccNumber}
                      onChange={(e) => setNewAccNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dedicated account for online donations / temple building..."
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer btn-press"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
