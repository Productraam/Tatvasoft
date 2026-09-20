import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Calendar,
  Sparkles,
  CreditCard,
  Flame,
  Award,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  FileDown,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Donation, Donor, FinancialYearPeriod } from '../types/accounting';
import { generateDonor80GStatementPDF } from '../services/pdfService';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';

export const DonorsDirectoryPage: React.FC = () => {
  const { notify } = useFeedback();
  const [donors, setDonors] = useState<Donor[]>(storageService.getDonors());
  const [donations, setDonations] = useState<Donation[]>(storageService.getDonations());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const financialYears = storageService.getFinancialYears();
  const [statementFyId, setStatementFyId] = useState<string>(
    financialYears.find((f) => f.isCurrent)?.id || financialYears[0]?.id || ''
  );

  useEffect(() => {
    const handleUpdate = () => {
      setDonors(storageService.getDonors());
      setDonations(storageService.getDonations());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  const filteredDonors = donors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.gotra && d.gotra.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const donorDonations = selectedDonor
    ? donations.filter((d) => d.donorPhone === selectedDonor.phone || d.donorId === selectedDonor.id)
    : [];

  const handleDownload80G = () => {
    if (!selectedDonor) return;
    const fy = financialYears.find((f) => f.id === statementFyId);
    if (!fy) {
      notify('Please configure a financial year in Settings first.', 'warning');
      return;
    }
    const statementDonations = donorDonations.filter(
      (d) =>
        d.donationType === 'MONETARY' &&
        d.status !== 'VOIDED' &&
        d.date >= fy.startDate &&
        d.date <= fy.endDate
    );
    if (statementDonations.length === 0) {
      notify(`No monetary donations found for ${selectedDonor.name} in ${fy.label}.`, 'warning');
      return;
    }
    const pdf = generateDonor80GStatementPDF(selectedDonor, statementDonations, fy.label);
    pdf.save(`80G_Statement_${selectedDonor.name.replace(/[^a-z0-9]+/gi, '_')}_${fy.label}.pdf`);
  };

  const handleCreateDonor = () => {
    const firstName = window.prompt('First name:')?.trim() || '';
    const secondName = window.prompt('Surname:')?.trim() || '';
    const phone = window.prompt('10-digit mobile:')?.trim() || '';
    const village = window.prompt('Village / native town:')?.trim() || '';
    if (!firstName || !secondName || !/^\d{10}$/.test(phone) || !village) {
      notify('First name, surname, village, and a valid 10-digit mobile are required.', 'error');
      return;
    }
    storageService.saveDonor({ firstName, secondName, name: `${firstName} ${secondName}`, phone, village });
  };

  const handleEditDonor = (donor: Donor) => {
    const firstName = window.prompt('First name:', donor.firstName)?.trim();
    const secondName = window.prompt('Surname:', donor.secondName)?.trim();
    const village = window.prompt('Village / native town:', donor.village)?.trim();
    if (!firstName || !secondName || !village) return;
    storageService.saveDonor({ ...donor, firstName, secondName, village, name: `${firstName} ${secondName}` });
    setSelectedDonor({ ...donor, firstName, secondName, village, name: `${firstName} ${secondName}` });
  };

  const handleDeleteDonor = (donor: Donor) => {
    if (!window.confirm(`Remove devotee profile for ${donor.name}? Profiles with receipt history are protected.`)) return;
    try {
      storageService.deleteDonor(donor.id);
      setSelectedDonor(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to remove devotee profile.', 'error');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader
        icon={Users}
        title="Devotee Directory"
        subtitle="Devotee profiles & lifetime giving"
        actions={
          <>
            <button onClick={handleCreateDonor} className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"><Plus className="w-3.5 h-3.5" /> Add Devotee</button>
            <div className="bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
              <span className="text-stone-500">Enrolled:</span>
              <span className="font-bold text-stone-800">{donors.length}</span>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Columns: Devotees Directory */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-stone-200 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Mobile, Village, or Gotra..."
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredDonors.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs">No devotees found matching search.</div>
            ) : (
              filteredDonors.map((d) => {
                const isSelected = selectedDonor?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDonor(d)}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-saffron-50 border-saffron-500 shadow-sm ring-1 ring-saffron-400'
                        : 'bg-stone-50/70 border-stone-200 hover:bg-saffron-50/40 hover:border-saffron-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-stone-900">{d.name}</div>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{d.phone}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span className="font-semibold text-rose-900">{d.village || 'N/A'}</span>
                      </div>
                      {(d.gotra || d.nakshatra) && (
                        <div className="text-[10px] text-saffron-700 font-medium">
                          {d.gotra && `Gotra: ${d.gotra}`} {d.nakshatra && `• ${d.nakshatra}`}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] uppercase text-stone-400">Total Seva</div>
                      <div className="text-xs font-bold text-saffron-800">
                        ₹{(d.totalDonated || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 7 Columns: Selected Devotee Profile & Seva History */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 shadow-sm border border-stone-200 space-y-4">
          {selectedDonor ? (
            <>
              {/* Profile Card */}
              <div className="bg-gradient-to-br from-saffron-500 to-saffron-600 rounded-2xl p-4 text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg">
                      {selectedDonor.firstName?.charAt(0) || selectedDonor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-serif">{selectedDonor.name}</h3>
                      <div className="text-xs text-saffron-100 flex items-center gap-2">
                        <span>Mobile: {selectedDonor.phone}</span>
                        <span>•</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Village: {selectedDonor.village}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditDonor(selectedDonor)} title="Edit devotee profile" className="p-2 rounded-lg bg-white/20 hover:bg-white/30"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteDonor(selectedDonor)} title="Delete devotee profile" className="p-2 rounded-lg bg-white/20 hover:bg-white/30"><Trash2 className="w-3.5 h-3.5" /></button>
                  <div className="text-right bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                    <div className="text-[10px] uppercase text-saffron-100">Lifetime Offerings</div>
                    <div className="text-base font-bold text-white font-mono">
                      ₹{(selectedDonor.totalDonated || 0).toLocaleString('en-IN')}.00
                    </div>
                  </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-black/15 p-2.5 rounded-xl text-xs border border-white/10">
                  <div>
                    <span className="text-[10px] text-saffron-200 block">Gotra:</span>
                    <span className="font-semibold text-white">{selectedDonor.gotra || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-saffron-200 block">Nakshatra:</span>
                    <span className="font-semibold text-white">{selectedDonor.nakshatra || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-saffron-200 block">Native Village:</span>
                    <span className="font-semibold text-white truncate block">{selectedDonor.village}</span>
                  </div>
                </div>
              </div>

              {/* Seva History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-saffron-600" />
                    <span>Seva Offerings & Receipts History</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={statementFyId}
                      onChange={(e) => setStatementFyId(e.target.value)}
                      title="Financial year for the 80G statement"
                      className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px] font-medium text-stone-700 focus:outline-none"
                    >
                      {financialYears.map((fy) => (
                        <option key={fy.id} value={fy.id}>{fy.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleDownload80G}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" /> 80G Statement
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[380px] border border-stone-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b">
                      <tr>
                        <th className="py-2.5 px-3">Receipt No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Collection Stream / Purpose</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {donorDonations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-stone-400">
                            No donation receipts found for this devotee profile.
                          </td>
                        </tr>
                      ) : (
                        donorDonations.map((don) => (
                          <tr key={don.id} className="hover:bg-saffron-50/20">
                            <td className="py-2.5 px-3 font-mono font-bold text-saffron-800">{don.receiptNo}</td>
                            <td className="py-2.5 px-3 text-stone-500">{don.date}</td>
                            <td className="py-2.5 px-3 text-stone-800">
                              <div className="font-semibold">{don.sevaName}</div>
                              <div className="text-[10px] text-rose-800">
                                {don.collectionType === 'REGULAR_SEVA'
                                  ? `Seva: ${don.sevaName}`
                                  : don.collectionType === 'YEARLY_REGULAR'
                                  ? `Yearly: ${don.yearlyPeriod}`
                                  : `Custom: ${don.customPurposeName || don.sevaName}`}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-stone-600">{don.paymentMode}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-stone-900 font-mono">
                              ₹{don.amount.toLocaleString('en-IN')}.00
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
            <div className="text-center py-20 text-stone-400 text-xs">
              Select a devotee from the left panel to inspect their detailed profile and pooja history
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
