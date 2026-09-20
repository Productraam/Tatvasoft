import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  FileDown,
  Share2,
  Calendar,
  Filter,
  Eye,
  Gift,
  Ban,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Donation } from '../types/accounting';
import { ThermalReceiptModal } from '../components/receipts/ThermalReceiptModal';
import { generateDonationReceiptPDF } from '../services/pdfService';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';

export const ReceiptsHistoryPage: React.FC = () => {
  const { notify } = useFeedback();
  const [donations, setDonations] = useState<Donation[]>(storageService.getDonations());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setDonations(storageService.getDonations());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donorPhone.includes(searchQuery) ||
      d.sevaName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode = filterMode === 'ALL' || d.paymentMode === filterMode;
    const matchesType = filterType === 'ALL' || d.donationType === filterType;

    return matchesSearch && matchesMode && matchesType;
  });

  const totalFilteredAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);

  const handleDownloadPDF = (donation: Donation) => {
    const doc = generateDonationReceiptPDF(donation);
    doc.save(`Receipt_${donation.receiptNo}.pdf`);
  };

  const handleVoid = (donation: Donation) => {
    if (donation.status === 'VOIDED') return;
    const reason = window.prompt(`Reason for voiding ${donation.receiptNo}:`);
    if (!reason?.trim()) return;
    try {
      storageService.voidDonation(donation.id, reason);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to void receipt.', 'error');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader
        icon={Receipt}
        title="Receipts"
        subtitle="Issued donation & seva receipts"
        actions={
          <>
            <div className="px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs">
              <span className="text-stone-500">Value: </span>
              <span className="font-bold text-stone-800">₹{totalFilteredAmount.toLocaleString('en-IN')}.00</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs">
              <span className="text-stone-500">Count: </span>
              <span className="font-bold text-stone-800">{filteredDonations.length}</span>
            </div>
          </>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Receipt No, Devotee Name, Phone, Seva..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone-500 font-medium">Offering Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Offerings</option>
            <option value="MONETARY">Monetary Sevas</option>
            <option value="IN_KIND">In-Kind (Dravya Daan)</option>
          </select>

          <span className="text-stone-500 font-medium ml-2">Payment Mode:</span>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CHEQUE">Cheque</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="IN_KIND">In-Kind</option>
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/80 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Receipt No.</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-4">Devotee</th>
                <th className="py-3 px-4">Seva / Offering Particulars</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Amount / Value</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No donation receipts found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDonations.map((d) => (
                  <tr key={d.id} className={`hover:bg-saffron-50/40 transition ${d.status === 'VOIDED' ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4 font-mono font-bold text-saffron-800">{d.receiptNo}</td>
                    <td className="py-3 px-3 text-stone-600">
                      <div>{d.date}</div>
                      <div className="text-[10px] text-stone-400">{d.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{d.donorName} {d.status === 'VOIDED' && <span className="text-rose-700 text-[10px]">(VOIDED)</span>}</div>
                      <div className="text-[10px] text-stone-500">
                        {d.donorPhone} {d.donorGotra ? `• Gotra: ${d.donorGotra}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-800">{d.sevaName}</div>
                      <div className="text-[10px] text-stone-400">{d.counterName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.donationType === 'IN_KIND'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {d.paymentMode}
                      </span>
                      {d.donationType === 'MONETARY' && d.depositAccountName && (
                        <div className="text-[9px] text-stone-500 font-medium truncate max-w-[120px] mt-0.5">
                          {d.depositAccountName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-stone-900 text-sm">
                      ₹{d.amount.toLocaleString('en-IN')}.00
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedDonation(d)}
                          title="View & Reprint Thermal Receipt"
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-saffron-100 hover:text-saffron-800 text-stone-600 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(d)}
                          title="Download Official PDF Receipt"
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
                        >
                          <FileDown className="w-3.5 h-3.5 text-saffron-700" />
                        </button>
                        {d.status !== 'VOIDED' && (
                          <button onClick={() => handleVoid(d)} title="Void receipt with audit reason" className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Reprinting */}
      {selectedDonation && (
        <ThermalReceiptModal donation={selectedDonation} onClose={() => setSelectedDonation(null)} />
      )}
    </div>
  );
};
