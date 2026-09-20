import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Users,
  Phone,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  Sparkles,
  Printer,
  Calendar,
  Gift,
  MapPin,
  Building,
  History,
  Eye,
  Check,
  Package,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Landmark
} from 'lucide-react';
import { storageService } from '../services/storageService';
import {
  Account,
  CollectionCategoryType,
  Donation,
  Donor,
  InKindCategory,
  PaymentMode,
  SevaType,
  TempleProfile,
} from '../types/accounting';
import { ThermalReceiptModal } from '../components/receipts/ThermalReceiptModal';
import { useFeedback } from '../components/ui/Feedback';

const GOTRA_OPTIONS = [
  'Kashyapa', 'Bharadwaja', 'Vashistha', 'Vishwamitra', 'Gautama',
  'Jamadagni', 'Atri', 'Agastya', 'Harita', 'Kaundinya',
  'Shandilya', 'Gargya', 'Srivatsa', 'Mudgala', 'Other',
];

const NAKSHATRA_OPTIONS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati'
];

const YEARLY_PERIODS = [
  '2026-2027', '2027-2028', '2028-2029', '2025-2026', '2024-2025',
];

const MATERIAL_UNITS = [
  'Bags', 'Kg', 'Grams', 'Pieces / Units', 'Litres', 'Sets / Pairs', 'Meters', 'Tolas',
];

const QUICK_AMOUNTS = [51, 101, 251, 501, 1001, 2501, 5001];

// Clean, short bank name only (strip the parenthetical description) — e.g. "Canara Bank".
const cleanBankName = (acc: Account): string => acc.name.replace(/\s*\(.*\)\s*/, '').trim();

export const PosDonationPage: React.FC = () => {
  const { notify } = useFeedback();
  const [profile, setProfile] = useState<TempleProfile>(storageService.getTempleProfile());
  const [sevas, setSevas] = useState<SevaType[]>(storageService.getSevas());
  const [donors, setDonors] = useState<Donor[]>(storageService.getDonors());
  const [donations, setDonations] = useState<Donation[]>(storageService.getDonations());
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser());
  const [accounts, setAccounts] = useState<Account[]>(storageService.getAccounts());
  const [depositAccountId, setDepositAccountId] = useState<string>('acc-103');

  // Offering Type: Money vs Material
  const [offeringType, setOfferingType] = useState<'MONEY' | 'MATERIAL'>('MONEY');

  // Money / Seva Selection State (Name only, no predefined amount)
  const [selectedSevaId, setSelectedSevaId] = useState<string>(sevas.find(s => s.isActive !== false)?.id || '');
  const [customAmount, setCustomAmount] = useState<string>('501');
  const [selectedYearlyPeriod, setSelectedYearlyPeriod] = useState<string>(YEARLY_PERIODS[0]);
  const [customPurposeName, setCustomPurposeName] = useState<string>('');

  // Material / In-Kind Dravya Daan Fields
  const [materialCategory, setMaterialCategory] = useState<InKindCategory>('PROVISIONS_GROCERY');
  const [materialItemDesc, setMaterialItemDesc] = useState<string>('');
  const [materialQuantity, setMaterialQuantity] = useState<string>('');
  const [materialUnit, setMaterialUnit] = useState<string>(MATERIAL_UNITS[0]);
  const [materialMetalPurity, setMaterialMetalPurity] = useState<string>('22K Gold');
  const [materialWeightGrams, setMaterialWeightGrams] = useState<string>('');

  // Mandatory Devotee Fields
  const [donorFirstName, setDonorFirstName] = useState<string>('');
  const [donorSecondName, setDonorSecondName] = useState<string>('');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const templeVillage = profile.city || profile.address?.split(',')[0]?.trim() || '';
  const [donorVillage, setDonorVillage] = useState<string>(templeVillage);
  const [foundDonorMatch, setFoundDonorMatch] = useState<string | null>(null);

  // Optional Devotee Fields (Collapsed by default for compact UI)
  const [showOptionalDevotee, setShowOptionalDevotee] = useState<boolean>(false);
  const [donorGotra, setDonorGotra] = useState<string>('');
  const [donorNakshatra, setDonorNakshatra] = useState<string>('');
  const [donorAddress, setDonorAddress] = useState<string>('');

  // Payment Fields (For Money mode only)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Receipt Modal
  const [createdDonation, setCreatedDonation] = useState<Donation | null>(null);

  // Inline field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clearFieldError = (key: string) =>
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(storageService.getTempleProfile());
      const updatedSevas = storageService.getSevas();
      setSevas(updatedSevas);
      setDonors(storageService.getDonors());
      setDonations(storageService.getDonations());
      setCurrentUser(storageService.getCurrentUser());
      setAccounts(storageService.getAccounts());
      if (!selectedSevaId && updatedSevas.length > 0) {
        const firstActive = updatedSevas.find(s => s.isActive !== false) || updatedSevas[0];
        setSelectedSevaId(firstActive.id);
      }
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, [selectedSevaId]);

  // Today shift statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDonations = useMemo(() => {
    return donations.filter((d) => Boolean(d.date && d.date.startsWith(todayStr)));
  }, [donations, todayStr]);

  const todayTotalMoney = useMemo(() => {
    return todayDonations
      .filter((d) => d.donationType === 'MONETARY')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [todayDonations]);

  const todayCash = useMemo(() => {
    return todayDonations.filter((d) => d.paymentMode === 'CASH').reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [todayDonations]);

  const todayUpi = useMemo(() => {
    return todayDonations.filter((d) => d.paymentMode === 'UPI').reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [todayDonations]);

  const todayMaterialCount = useMemo(() => {
    return todayDonations.filter((d) => d.donationType === 'IN_KIND').length;
  }, [todayDonations]);

  const recentDonations = useMemo(() => {
    return [...donations].reverse().slice(0, 5);
  }, [donations]);

  const activeSevas = sevas.filter((s) => s.isActive !== false);
  const activeSeva = activeSevas.find((s) => s.id === selectedSevaId) || activeSevas[0] || ({} as SevaType);

  // Bank Accounts Filter (all bank asset accounts excluding In-Hand Cash)
  const bankAccounts = useMemo(() => {
    return accounts.filter(
      (a) =>
        a.id !== 'acc-101' &&
        !a.name.toLowerCase().includes('in-hand') &&
        !a.name.toLowerCase().includes('cash in hand') &&
        (a.id === 'acc-103' ||
          a.id === 'acc-104' ||
          a.category === 'ASSET' ||
          a.subCategory === 'Cash & Bank' ||
          a.subCategory === 'Bank Accounts' ||
          a.name.toLowerCase().includes('bank') ||
          a.name.toLowerCase().includes('sbi') ||
          a.name.toLowerCase().includes('canara'))
    );
  }, [accounts]);

  const selectedBankAcc = useMemo(() => {
    return bankAccounts.find((b) => b.id === depositAccountId) || bankAccounts[0];
  }, [bankAccounts, depositAccountId]);

  // Smartly pre-select bank account based on offering purpose (e.g. Building / Corpus)
  useEffect(() => {
    if (activeSeva) {
      const isCorpusOrBuilding =
        activeSeva.category === 'BUILDING_FUND' ||
        activeSeva.name?.toLowerCase().includes('building') ||
        activeSeva.name?.toLowerCase().includes('rajagopuram') ||
        activeSeva.name?.toLowerCase().includes('corpus');

      if (isCorpusOrBuilding) {
        const corpusBank = bankAccounts.find(
          (b) =>
            b.id === 'acc-104' ||
            b.name.toLowerCase().includes('building') ||
            b.name.toLowerCase().includes('corpus') ||
            b.name.toLowerCase().includes('canara')
        );
        if (corpusBank) {
          setDepositAccountId(corpusBank.id);
          return;
        }
      }
    }
  }, [selectedSevaId, activeSeva, bankAccounts]);

  const handleSevaDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sevaId = e.target.value;
    setSelectedSevaId(sevaId);
    if (sevaId === 'CUSTOM') {
      setCustomPurposeName('');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setDonorPhone(phone);
    if (phone.length >= 8) {
      const match = donors.find((d) => d.phone.includes(phone));
      if (match) {
        setDonorFirstName(match.firstName || match.name.split(' ')[0] || '');
        setDonorSecondName(match.secondName || match.name.split(' ').slice(1).join(' ') || '');
        setDonorVillage(match.village || templeVillage);
        setDonorGotra(match.gotra || '');
        setDonorNakshatra(match.nakshatra || '');
        setDonorAddress(match.address || '');
        setFoundDonorMatch(match.name || `${match.firstName} ${match.secondName}`);
        if (match.gotra || match.nakshatra || match.address) {
          setShowOptionalDevotee(true);
        }
      } else {
        setFoundDonorMatch(null);
      }
    } else {
      setFoundDonorMatch(null);
    }
  };

  const currentAmountNum = offeringType === 'MONEY' ? parseFloat(customAmount) || 0 : 0;

  const currentOfferingTitle =
    offeringType === 'MATERIAL'
      ? `Material: ${materialItemDesc.trim() || 'Dravya Daan'}`
      : selectedSevaId === 'CUSTOM'
      ? customPurposeName || 'Custom Offering'
      : selectedSevaId === 'YEARLY'
      ? `Yearly Seva (${selectedYearlyPeriod})`
      : activeSeva?.name || 'General Seva';

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errs: Record<string, string> = {};

    // Devotee Validation
    if (!donorFirstName.trim()) errs.donorFirstName = 'First name is required.';
    if (!donorSecondName.trim()) errs.donorSecondName = 'Surname is required.';
    if (!donorPhone.trim()) errs.donorPhone = 'Mobile number is required.';
    else if (!/^\+?\d{10,13}$/.test(donorPhone.replace(/[\s-]/g, '')))
      errs.donorPhone = 'Enter a valid mobile number.';
    if (!donorVillage.trim()) errs.donorVillage = 'Village / native town is required.';

    if (offeringType === 'MONEY') {
      if (selectedSevaId === 'CUSTOM' && !customPurposeName.trim())
        errs.customPurposeName = 'Specify the custom purpose name.';
      if (currentAmountNum <= 0) errs.customAmount = 'Enter a valid amount in ₹.';
    } else {
      if (!materialItemDesc.trim()) errs.materialItemDesc = 'Item description is required.';
      if (!materialQuantity.trim()) errs.materialQuantity = 'Quantity is required.';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      notify('Please correct the highlighted fields.', 'error');
      return;
    }
    setFieldErrors({});

    const effectiveCollectionType: CollectionCategoryType =
      offeringType === 'MATERIAL'
        ? 'REGULAR_SEVA'
        : selectedSevaId === 'CUSTOM'
        ? 'CUSTOM_NAME'
        : selectedSevaId === 'YEARLY'
        ? 'YEARLY_REGULAR'
        : 'REGULAR_SEVA';

    const effectiveYearlyPeriod =
      effectiveCollectionType === 'YEARLY_REGULAR' ? `Yearly Collection ${selectedYearlyPeriod}` : undefined;

    const effectiveCustomPurpose =
      effectiveCollectionType === 'CUSTOM_NAME' ? customPurposeName.trim() : undefined;

    const effectiveDepositId =
      offeringType === 'MONEY' && paymentMode === 'CASH'
        ? 'acc-101'
        : depositAccountId || 'acc-103';

    const effectiveDepositName =
      offeringType === 'MONEY' && paymentMode === 'CASH'
        ? 'In-Hand Cash'
        : (bankAccounts.find((b) => b.id === effectiveDepositId)?.name || selectedBankAcc?.name || 'Bank Account');

    const donation = storageService.createDonation({
      collectionType: effectiveCollectionType,
      yearlyPeriod: effectiveYearlyPeriod,
      customPurposeName: effectiveCustomPurpose,
      donationType: offeringType === 'MONEY' ? 'MONETARY' : 'IN_KIND',
      donorFirstName: donorFirstName.trim(),
      donorSecondName: donorSecondName.trim(),
      donorPhone: donorPhone.trim(),
      donorVillage: donorVillage.trim(),
      donorGotra: donorGotra.trim() || undefined,
      donorNakshatra: donorNakshatra.trim() || undefined,
      donorAddress: donorAddress.trim(),
      sevaTypeId:
        offeringType === 'MATERIAL'
          ? 'seva-material'
          : selectedSevaId === 'CUSTOM'
          ? 'seva-custom'
          : activeSeva?.id || 'seva-gen',
      sevaName: currentOfferingTitle,
      amount: offeringType === 'MONEY' ? currentAmountNum : 0,
      paymentMode: offeringType === 'MATERIAL' ? 'IN_KIND' : paymentMode,
      depositAccountId: effectiveDepositId,
      depositAccountName: effectiveDepositName,
      transactionRef: transactionRef.trim(),
      inKindDetails:
        offeringType === 'MATERIAL'
          ? {
              category: (() => {
                const lower = materialItemDesc.toLowerCase();
                if (lower.includes('gold') || lower.includes('silver')) return 'GOLD_SILVER';
                if (lower.includes('vastram') || lower.includes('saree') || lower.includes('dhoti') || lower.includes('silk') || lower.includes('cloth')) return 'VASTRA_SAREE';
                if (lower.includes('vessel') || lower.includes('brass') || lower.includes('copper') || lower.includes('bell') || lower.includes('utensil')) return 'VESSEL_UTENSIL';
                return 'PROVISIONS_GROCERY';
              })(),
              itemDescription: materialItemDesc.trim(),
              quantity: materialQuantity.trim(),
              unit: materialUnit,
              estimatedValue: 0,
              metalPurity: materialCategory === 'GOLD_SILVER' ? materialMetalPurity.trim() : undefined,
              weightGrams: materialCategory === 'GOLD_SILVER' ? parseFloat(materialWeightGrams) || 0 : undefined,
            }
          : undefined,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      counterName: currentUser.counterName,
      notes,
    });

    setCreatedDonation(donation);

    // Reset Form
    setDonorFirstName('');
    setDonorSecondName('');
    setDonorPhone('');
    setDonorVillage(templeVillage);
    setDonorGotra('');
    setDonorNakshatra('');
    setDonorAddress('');
    setFoundDonorMatch(null);
    setNotes('');
    setTransactionRef('');
    setCustomPurposeName('');
    setMaterialItemDesc('');
    setMaterialQuantity('');
    setMaterialWeightGrams('');
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="p-3 sm:p-4 lg:p-5 max-w-7xl mx-auto space-y-3.5 text-stone-800 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. COMPACT SACRED HEADER & DUAL-MODE PILL BAR                              */}
      {/* ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-amber-200/90 px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-stone-900 tracking-tight">Donation & Seva Counter</h1>
              <span className="text-[11px] bg-amber-100/80 text-amber-900 px-2 py-0.5 rounded-full font-semibold border border-amber-300/60">
                {currentUser.counterName || 'Counter 1'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Cashier: <strong className="text-stone-800 font-medium">{currentUser.name}</strong></span>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
              </span>
            </div>
          </div>
        </div>

        {/* PRIMARY MODE SEGMENTED PILL */}
        <div className="inline-flex p-1 bg-amber-50/90 border border-amber-200 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setOfferingType('MONEY')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              offeringType === 'MONEY'
                ? 'bg-orange-600 text-white'
                : 'text-stone-700 hover:text-stone-950 hover:bg-amber-100/60'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            <span>Monetary Offering (₹)</span>
          </button>
          <button
            type="button"
            onClick={() => setOfferingType('MATERIAL')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              offeringType === 'MATERIAL'
                ? 'bg-orange-600 text-white'
                : 'text-stone-700 hover:text-stone-950 hover:bg-amber-100/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>In-Kind Dravya Daan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TWO-COLUMN LAYOUT: FORM & LIVE RECEIPT TICKET                          */}
      {/* ========================================================================= */}
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* LEFT COLUMN (8 COLS): UNIFIED SEVA OFFERING & DEVOTEE SECTION */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* ============================================================= */}
          {/* UNIFIED CARD: SEVA, QUICK AMOUNT & DEVOTEE PARTICULARS        */}
          {/* ============================================================= */}
          <div className="bg-white rounded-2xl border-2 border-amber-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            {/* Unified Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-950">
                    {offeringType === 'MONEY' ? 'Seva Offering & Devotee Particulars' : 'Material Dravya & Devotee Details'}
                  </h2>
                  
                </div>
              </div>
              {foundDonorMatch ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Devotee: {foundDonorMatch}
                </span>
              ) : (
                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                  {offeringType === 'MONEY' ? 'Cash & Digital Receipt' : 'Non-Monetary Receipt'}
                </span>
              )}
            </div>

            {/* PART A: OFFERING SELECTION & QUICK AMOUNTS */}
            {offeringType === 'MONEY' ? (
              <div className="space-y-3 pb-3 border-b border-amber-100/80">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Event / Seva Name Dropdown */}
                  <div className="md:col-span-7">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Offering Name / Seva <span className="text-orange-600">*</span></span>
                    </label>
                    <select
                      value={selectedSevaId}
                      onChange={handleSevaDropdownChange}
                      className="w-full px-3.5 py-2.5 border-2 border-stone-200 hover:border-amber-300 rounded-xl text-sm font-semibold text-stone-900 bg-stone-50/60 focus:bg-white focus:ring-4 focus:ring-amber-500/15 focus:border-amber-500 focus:outline-none cursor-pointer transition shadow-2xs"
                    >
                      {activeSevas.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      <option disabled>──────────</option>
                      <option value="CUSTOM">Custom Purpose Offering...</option>
                      <option value="YEARLY">Yearly Saswatha Seva...</option>
                    </select>
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                      <CircleDollarSign className="w-3.5 h-3.5 text-amber-600" />
                      <span>Quick Amount (₹)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_AMOUNTS.map((amt) => {
                        const isSelected = customAmount === amt.toString();
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCustomAmount(amt.toString())}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                              isSelected
                                ? 'bg-orange-600 text-white'
                                : 'bg-amber-50/80 hover:bg-amber-100 text-amber-950 border border-amber-200/90'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Conditional Fields for Custom / Yearly */}
                {selectedSevaId === 'CUSTOM' && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Custom Purpose / Specific Deity Offering <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customPurposeName}
                      onChange={(e) => setCustomPurposeName(e.target.value)}
                      placeholder="e.g. Navagraha Shanti Homa, Deepotsava Oil, Gold Leafing"
                      className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                )}

                {selectedSevaId === 'YEARLY' && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                    <label className="block text-xs font-bold text-amber-950 mb-1">Financial Year (FY)</label>
                    <select
                      value={selectedYearlyPeriod}
                      onChange={(e) => setSelectedYearlyPeriod(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-lg text-xs text-stone-900 focus:outline-none"
                    >
                      {YEARLY_PERIODS.map((yr) => (
                        <option key={yr} value={yr}>
                          FY {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              /* MATERIAL MODE FIELDS (IN-KIND DRAVYA DAAN) */
              <div className="space-y-3 pb-3 border-b border-amber-100/80">
                {/* Big Boxes Grid for Item Name, Quantity, Unit */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Material Item Name (6 cols) */}
                  <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      <span>Material / Dravya Name <span className="text-orange-600">*</span></span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={materialItemDesc}
                        onChange={(e) => setMaterialItemDesc(e.target.value)}
                        placeholder="e.g. Sona Masoori Rice / Pure Desi Ghee"
                        className="w-full px-3.5 py-2.5 border-2 border-stone-200 hover:border-amber-300 rounded-xl text-sm font-semibold text-stone-900 bg-stone-50/60 focus:bg-white focus:ring-4 focus:ring-amber-500/15 focus:border-amber-500 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Quantity with Quick Chips (3 cols) */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                      <span>Quantity <span className="text-orange-600">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={materialQuantity}
                      onChange={(e) => setMaterialQuantity(e.target.value)}
                      placeholder="e.g. 5, 25, 50"
                      className="w-full px-3.5 py-2.5 border-2 border-stone-200 hover:border-amber-300 rounded-xl text-sm font-bold font-mono text-stone-900 bg-stone-50/60 focus:bg-white focus:ring-4 focus:ring-amber-500/15 focus:border-amber-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  {/* Unit (3 cols) */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                      <span>Unit <span className="text-orange-600">*</span></span>
                    </label>
                    <select
                      value={materialUnit}
                      onChange={(e) => setMaterialUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-stone-200 hover:border-amber-300 rounded-xl text-sm font-semibold text-stone-900 bg-stone-50/60 focus:bg-white focus:ring-4 focus:ring-amber-500/15 focus:border-amber-500 focus:outline-none cursor-pointer transition shadow-2xs"
                    >
                      {MATERIAL_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gold & Silver Details if applicable */}
                {(materialItemDesc.toLowerCase().includes('gold') || materialItemDesc.toLowerCase().includes('silver')) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Metal & Purity</label>
                      <input
                        type="text"
                        value={materialMetalPurity}
                        onChange={(e) => setMaterialMetalPurity(e.target.value)}
                        placeholder="22K Gold / 92.5 Silver"
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Net Weight (Grams)</label>
                      <input
                        type="number"
                        value={materialWeightGrams}
                        onChange={(e) => setMaterialWeightGrams(e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PART B: DEVOTEE PARTICULARS IN BIG BOXES (NAME, SURNAME, MOBILE, VILLAGE) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>Devotee Details (Sankalpa Info)</span>
                </h3>
                
              </div>

              {/* Big Input Boxes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Devotee Name (First Name) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                    <span>Devotee Name</span>
                    <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={donorFirstName}
                      onChange={(e) => { setDonorFirstName(e.target.value); clearFieldError('donorFirstName'); }}
                      aria-invalid={!!fieldErrors.donorFirstName}
                      placeholder="Devotee First Name"
                      className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-xl text-sm font-semibold text-stone-900 bg-stone-50/50 focus:bg-white focus:ring-4 focus:ring-amber-500/15 focus:outline-none transition shadow-2xs ${fieldErrors.donorFirstName ? 'border-rose-400 focus:border-rose-500' : 'border-stone-200 hover:border-amber-300 focus:border-amber-500'}`}
                    />
                  </div>
                  {fieldErrors.donorFirstName && <p role="alert" className="text-[10px] font-medium text-rose-600 mt-1">{fieldErrors.donorFirstName}</p>}
                </div>

                {/* 2. Surname / Family Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                    <span>Surname</span>
                    <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={donorSecondName}
                      onChange={(e) => { setDonorSecondName(e.target.value); clearFieldError('donorSecondName'); }}
                      aria-invalid={!!fieldErrors.donorSecondName}
                      placeholder="Family Surname"
                      className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-xl text-sm font-semibold text-stone-900 bg-stone-50/50 focus:bg-white focus:ring-4 focus:ring-amber-500/15 focus:outline-none transition shadow-2xs ${fieldErrors.donorSecondName ? 'border-rose-400 focus:border-rose-500' : 'border-stone-200 hover:border-amber-300 focus:border-amber-500'}`}
                    />
                  </div>
                  {fieldErrors.donorSecondName && <p role="alert" className="text-[10px] font-medium text-rose-600 mt-1">{fieldErrors.donorSecondName}</p>}
                </div>

                {/* 3. Mobile Number (Auto-fills on entry) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                    <span>Mobile Number</span>
                    <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={donorPhone}
                      onChange={(e) => { handlePhoneChange(e); clearFieldError('donorPhone'); }}
                      aria-invalid={!!fieldErrors.donorPhone}
                      placeholder="10-digit mobile"
                      className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-xl text-sm font-semibold font-mono text-stone-900 bg-stone-50/50 focus:bg-white focus:ring-4 focus:ring-amber-500/15 focus:outline-none transition shadow-2xs ${fieldErrors.donorPhone ? 'border-rose-400 focus:border-rose-500' : 'border-stone-200 hover:border-amber-300 focus:border-amber-500'}`}
                    />
                  </div>
                  {fieldErrors.donorPhone && <p role="alert" className="text-[10px] font-medium text-rose-600 mt-1">{fieldErrors.donorPhone}</p>}
                </div>

                {/* 4. Village (Defaults to temple village, editable) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                    <span>Village / Town</span>
                    <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-orange-500 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={donorVillage}
                      onChange={(e) => { setDonorVillage(e.target.value); clearFieldError('donorVillage'); }}
                      aria-invalid={!!fieldErrors.donorVillage}
                      placeholder="Village / Native Town"
                      className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-xl text-sm font-semibold text-stone-900 focus:bg-white focus:ring-4 focus:ring-amber-500/15 focus:outline-none transition shadow-2xs ${fieldErrors.donorVillage ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500' : 'border-amber-200 hover:border-amber-400 bg-amber-50/30 focus:border-amber-500'}`}
                    />
                  </div>
                  {fieldErrors.donorVillage && <p role="alert" className="text-[10px] font-medium text-rose-600 mt-1">{fieldErrors.donorVillage}</p>}
                </div>
              </div>

              {/* Optional Fields Toggle (Keeps Page Super Compact) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOptionalDevotee(!showOptionalDevotee)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 py-1 cursor-pointer"
                >
                  {showOptionalDevotee ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showOptionalDevotee ? 'Hide Optional Particulars' : '+ Add Gotra, Nakshatra, Sankalpa Address (Optional)'}</span>
                </button>

                {showOptionalDevotee && (
                  <div className="mt-2 pt-2.5 border-t border-amber-100/70 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Gotra</label>
                      <input
                        list="gotra-options"
                        value={donorGotra}
                        onChange={(e) => setDonorGotra(e.target.value)}
                        placeholder="Select / Type Gotra"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-400"
                      />
                      <datalist id="gotra-options">
                        {GOTRA_OPTIONS.map((g) => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Nakshatra</label>
                      <input
                        list="nakshatra-options"
                        value={donorNakshatra}
                        onChange={(e) => setDonorNakshatra(e.target.value)}
                        placeholder="Select / Type Nakshatra"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-400"
                      />
                      <datalist id="nakshatra-options">
                        {NAKSHATRA_OPTIONS.map((n) => (
                          <option key={n} value={n} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Address / Street</label>
                      <input
                        type="text"
                        value={donorAddress}
                        onChange={(e) => setDonorAddress(e.target.value)}
                        placeholder="Street, City, Pincode"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 COLS): LIVE RECEIPT TICKET & PAYMENT ACTION */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* SACRED TEMPLE RECEIPT CARD */}
          <div className="bg-gradient-to-b from-amber-50/60 via-orange-50/20 to-white rounded-2xl border-2 border-amber-300/80 p-4 shadow-sm space-y-3 relative overflow-hidden">
            {/* Top Golden Header */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Live Receipt Preview
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                NEW TOKEN
              </span>
            </div>

            {/* Quick Live Preview Badges */}
            <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200/60 text-xs space-y-1">
              <div className="flex justify-between items-center text-stone-500 text-[11px]">
                <span>Temple:</span>
                <span className="font-semibold text-stone-800 truncate max-w-[180px]">{profile.name}</span>
              </div>
              <div className="flex justify-between items-center text-stone-500 text-[11px]">
                <span>Offering:</span>
                <span className="font-bold text-amber-900 truncate max-w-[180px]">{currentOfferingTitle}</span>
              </div>
              <div className="flex justify-between items-center text-stone-500 text-[11px]">
                <span>Devotee:</span>
                <span className="font-medium text-stone-800 truncate max-w-[180px]">
                  {donorFirstName || donorSecondName
                    ? `${donorFirstName} ${donorSecondName} ${donorVillage ? `(${donorVillage})` : ''}`
                    : 'Awaiting name...'}
                </span>
              </div>
            </div>

            {/* MONETARY PANEL DETAILS */}
            {offeringType === 'MONEY' ? (
              <div className="space-y-3">
                {/* Offering Hero Amount Box */}
                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-100/30 p-3 rounded-xl border border-amber-300 text-center">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-900 block">
                    Offering Amount
                  </span>
                  <div className="flex items-center justify-center gap-1 my-0.5">
                    <span className="text-2xl font-black text-amber-700 font-mono">₹</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-32 text-2xl font-black text-amber-950 bg-transparent text-center focus:outline-none border-b-2 border-amber-400 font-mono"
                    />
                  </div>
                </div>

                {/* Compact Payment Mode Pills */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER'] as PaymentMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-1.5 px-0.5 rounded-lg text-[11px] font-bold border transition text-center cursor-pointer ${
                          paymentMode === mode
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50'
                        }`}
                      >
                        {mode === 'BANK_TRANSFER' ? 'NEFT' : mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Account Selection (for non-cash modes) */}
                {paymentMode !== 'CASH' && (
                  <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 space-y-1.5 animate-fadeIn text-xs">
                    <label className="font-bold text-amber-950 flex items-center gap-1 text-[11px]">
                      <Landmark className="w-3.5 h-3.5 text-amber-700" />
                      <span>Deposit Bank</span>
                    </label>
                    <select
                      value={depositAccountId}
                      onChange={(e) => setDepositAccountId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-stone-900 focus:outline-none cursor-pointer"
                    >
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {cleanBankName(acc)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reference ID for non-cash modes (UPI, Card, Cheque, Transfer) */}
                {paymentMode !== 'CASH' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-[11px] font-semibold text-stone-700">
                      {paymentMode === 'UPI'
                        ? 'UPI Reference / UTR No.'
                        : paymentMode === 'CHEQUE'
                        ? 'Cheque No. & Bank'
                        : paymentMode === 'CARD'
                        ? 'Card Auth / POS Txn ID'
                        : 'NEFT / RTGS / UTR No.'}{' '}
                      <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder={
                        paymentMode === 'UPI'
                          ? 'e.g. 12-digit UPI UTR No.'
                          : paymentMode === 'CHEQUE'
                          ? 'e.g. Chq #004128 (HDFC Bank)'
                          : paymentMode === 'CARD'
                          ? 'e.g. Auth #883921'
                          : 'e.g. UTR #SBIN202688491'
                      }
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sankalpam / Special Notes (Optional)"
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Submit / Print Action Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer tracking-wide"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print & Complete (Ctrl + Enter)</span>
                </button>
              </div>
            ) : (
              /* MATERIAL PANEL DETAILS (IN UNITS ONLY) */
              <div className="space-y-3">
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                    Dravya Daan Summary
                  </span>
                  <div className="text-base font-extrabold text-stone-900">
                    {materialQuantity ? `${materialQuantity} ${materialUnit}` : 'Quantity & Unit'}
                  </div>
                  <div className="text-xs font-medium text-stone-700 truncate">
                    {materialItemDesc || 'Item Description'}
                  </div>
                  <div className="text-[10px] text-stone-500 pt-1 border-t border-amber-200/60">
                    {materialCategory.replace('_', ' ')}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sankalpam / Storage Notes (Optional)"
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none"
                  />
                </div>

                {/* Submit Material Receipt Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer tracking-wide"
                >
                  <Printer className="w-4 h-4" />
                  <span>Issue Dravya Daan Receipt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* 3. COMPACT BOTTOM SHIFT BAR & RECENT RECEIPTS                             */}
      {/* ========================================================================= */}
      <div className="bg-white/95 rounded-xl border border-amber-200/80 px-3.5 py-2 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-stone-600">
          <div className="flex items-center gap-1.5 font-semibold text-stone-900">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Today's Shift:</span>
            <span className="font-bold font-mono text-orange-600">₹{todayTotalMoney.toLocaleString('en-IN')}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 text-stone-500 pl-2.5 border-l border-amber-200">
            <span>Cash: <strong className="text-stone-800 font-mono">₹{todayCash.toLocaleString('en-IN')}</strong></span>
            <span>UPI: <strong className="text-stone-800 font-mono">₹{todayUpi.toLocaleString('en-IN')}</strong></span>
            <span>Materials: <strong className="text-stone-800">{todayMaterialCount}</strong></span>
          </div>
        </div>

        {recentDonations.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-stone-400 font-medium shrink-0">Recent:</span>
            {recentDonations.map((rd) => (
              <button
                key={rd.id}
                type="button"
                onClick={() => setCreatedDonation(rd)}
                className="px-2 py-0.5 bg-amber-50/60 hover:bg-amber-100 border border-amber-200/80 rounded-md text-stone-700 font-medium transition flex items-center gap-1 shrink-0 cursor-pointer"
                title="Click to view/print receipt"
              >
                <span className="font-semibold text-stone-900">{rd.donorFirstName || rd.donorName?.split(' ')[0]}</span>
                <span className="text-amber-800 font-mono font-bold">
                  {rd.donationType === 'IN_KIND'
                    ? `${rd.inKindDetails?.quantity || ''} ${rd.inKindDetails?.unit || 'Units'}`
                    : `₹${rd.amount}`}
                </span>
                <Eye className="w-2.5 h-2.5 text-stone-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {createdDonation && (
        <ThermalReceiptModal donation={createdDonation} onClose={() => setCreatedDonation(null)} />
      )}
    </div>
  );
};
