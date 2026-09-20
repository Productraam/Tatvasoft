import React, { useState, useEffect } from 'react';
import {
  Crown,
  Building,
  ShieldCheck,
  PlusCircle,
  Search,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  FileSpreadsheet,
  Edit2,
  Trash2,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { AssetCategoryItem, AssetCategory, AssetMovement, CustodyStatus, TempleAsset } from '../types/accounting';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';

export const AssetManagementPage: React.FC = () => {
  const { notify } = useFeedback();
  const [assets, setAssets] = useState<TempleAsset[]>(storageService.getAssets());
  const [assetCategories, setAssetCategories] = useState<AssetCategoryItem[]>(storageService.getAssetCategories());
  const [movements, setMovements] = useState<AssetMovement[]>(storageService.getAssetMovements());
  const [activeTab, setActiveTab] = useState<AssetCategory | 'ALL' | 'MOVEMENTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Asset Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [category, setCategory] = useState<AssetCategory>('SACRED_JEWELRY');
  const [assignedDeity, setAssignedDeity] = useState('Lord Lakshmi Narayana');
  const [metalPurity, setMetalPurity] = useState('22K Gold (916 KDM)');
  const [grossWeightGrams, setGrossWeightGrams] = useState('');
  const [netWeightGrams, setNetWeightGrams] = useState('');
  const [valuation, setValuation] = useState('');
  const [location, setLocation] = useState('Strongroom Vault Locker #1');
  const [currentCustodian, setCurrentCustodian] = useState('Chief Archaka');
  const [surveyNo, setSurveyNo] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [monthlyRentAmount, setMonthlyRentAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Movement Check-out Modal State
  const [selectedAssetForMovement, setSelectedAssetForMovement] = useState<TempleAsset | null>(null);
  const [toLocation, setToLocation] = useState('Main Sanctum (Garbhagriha)');
  const [movementPurpose, setMovementPurpose] = useState('Festival Alankaram & Procession');
  const [issuedTo, setIssuedTo] = useState('Pt. Raghavendra Dixit (Chief Archaka)');
  const [authorizedBy, setAuthorizedBy] = useState('Dr. K. V. Sharma (Trustee)');

  useEffect(() => {
    const handleUpdate = () => {
      setAssets(storageService.getAssets());
      setMovements(storageService.getAssetMovements());
      setAssetCategories(storageService.getAssetCategories());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);

  const totalValuation = assets.reduce((sum, a) => sum + (a.valuation || 0), 0);
  const totalGoldWeight = assets
    .filter((a) => a.category === 'SACRED_JEWELRY' && (a.metalPurity?.includes('Gold') || a.metalPurity?.includes('22K')))
    .reduce((sum, a) => sum + (a.netWeightGrams || 0), 0);
  const totalSilverWeight = assets
    .filter((a) => a.category === 'SACRED_JEWELRY' && (a.metalPurity?.includes('Silver') || a.metalPurity?.includes('92.5')))
    .reduce((sum, a) => sum + (a.netWeightGrams || 0), 0);

  const filteredAssets = assets.filter((a) => {
    const matchesCategory = activeTab === 'ALL' || a.category === activeTab;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.assignedDeity && a.assignedDeity.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.location && a.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const code = storageService.getNextAssetCode(category);
    storageService.saveAsset({
      code,
      name: name.trim(),
      nameHindi: nameHindi.trim(),
      category,
      assignedDeity: assignedDeity.trim(),
      metalPurity: category === 'SACRED_JEWELRY' ? metalPurity.trim() : undefined,
      grossWeightGrams: parseFloat(grossWeightGrams) || 0,
      netWeightGrams: parseFloat(netWeightGrams) || 0,
      valuation: parseFloat(valuation) || 0,
      location: location.trim(),
      custodyStatus: category === 'SACRED_JEWELRY' ? 'IN_VAULT' : 'ACTIVE_USE',
      currentCustodian: currentCustodian.trim(),
      surveyNo: category === 'LAND_PROPERTY' ? surveyNo.trim() : undefined,
      areaDescription: category === 'LAND_PROPERTY' ? areaDescription.trim() : undefined,
      tenantName: tenantName.trim() || undefined,
      monthlyRentAmount: parseFloat(monthlyRentAmount) || undefined,
      acquisitionDate: new Date().toISOString().split('T')[0],
      sourceOfAcquisition: 'DONATION',
      condition: 'EXCELLENT',
      notes: notes.trim(),
    });

    setShowAddModal(false);
    // Reset Form
    setName('');
    setNameHindi('');
    setGrossWeightGrams('');
    setNetWeightGrams('');
    setValuation('');
    setSurveyNo('');
    setAreaDescription('');
    setTenantName('');
    setMonthlyRentAmount('');
    setNotes('');
  };

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForMovement) return;

    storageService.createAssetMovement({
      assetId: selectedAssetForMovement.id,
      assetName: selectedAssetForMovement.name,
      fromLocation: selectedAssetForMovement.location,
      toLocation,
      purpose: movementPurpose,
      issuedTo,
      authorizedBy,
    });

    setSelectedAssetForMovement(null);
  };

  const handleReturnMovement = (movementId: string) => {
    const verifiedBy = prompt('Enter Trustee / Custodian name verifying safe return to vault:', 'Dr. K. V. Sharma (Trustee)');
    if (verifiedBy) {
      storageService.returnAssetMovement(movementId, verifiedBy);
    }
  };

  const handleEditAsset = (asset: TempleAsset) => {
    const nextName = window.prompt('Asset item name:', asset.name)?.trim();
    const nextValuation = window.prompt('Estimated valuation (INR):', String(asset.valuation))?.trim();
    const nextLocation = window.prompt('Storage location:', asset.location)?.trim();
    if (!nextName || !nextValuation || !nextLocation || !Number.isFinite(Number(nextValuation))) return;
    storageService.saveAsset({ ...asset, name: nextName, valuation: Number(nextValuation), location: nextLocation });
  };

  const handleDeleteAsset = (asset: TempleAsset) => {
    if (!window.confirm(`Remove ${asset.name} from the asset register?`)) return;
    try {
      storageService.deleteAsset(asset.id);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to remove asset.', 'error');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader
        icon={Crown}
        title="Assets & Property Register"
        subtitle="Jewellery, land, leases & sanctum equipment"
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Asset</span>
          </button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Total Asset Valuation</span>
            <Crown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-900 font-mono">
            ₹{totalValuation.toLocaleString('en-IN')}.00
          </div>
          <div className="text-[10px] text-stone-400">{assets.length} Total Registered Assets</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-300 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Total Sacred Gold Weight</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono">
            {totalGoldWeight.toLocaleString('en-IN')} <span className="text-xs font-normal">Grams</span>
          </div>
          <div className="text-[10px] text-amber-700 font-semibold">
            ≈ {(totalGoldWeight / 11.66).toFixed(2)} Tolas (Pure 22K Gold)
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-300 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Total Sacred Silver Weight</span>
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono">
            {(totalSilverWeight / 1000).toFixed(2)} <span className="text-xs font-normal">Kilograms</span>
          </div>
          <div className="text-[10px] text-stone-500">{totalSilverWeight.toLocaleString('en-IN')} Grams Sterling Silver</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Monthly Rental Yield</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 font-mono">
            ₹
            {assets
              .reduce((sum, a) => sum + (a.monthlyRentAmount || 0), 0)
              .toLocaleString('en-IN')}
            .00
          </div>
          <div className="text-[10px] text-stone-400">From commercial shops & mandapam leases</div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All Assets' },
            ...assetCategories
              .filter(c => c.isActive !== false || assets.some(a => a.category === c.code))
              .map(c => ({ id: c.code, label: c.name.split('(')[0].trim() })),
            { id: 'MOVEMENTS', label: 'Vault Custody Log' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'MOVEMENTS' && (
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, title, deity, location..."
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* ASSET INVENTORY TABLE */}
      {activeTab !== 'MOVEMENTS' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Asset Item Name</th>
                  <th className="py-3 px-3">Deity / Purpose</th>
                  <th className="py-3 px-3">Metal / Spec</th>
                  <th className="py-3 px-3 text-right">Net Weight</th>
                  <th className="py-3 px-3 text-right">Est. Valuation</th>
                  <th className="py-3 px-3 text-center">Custody Status</th>
                  <th className="py-3 px-3">Locker / Location</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-400">
                      No temple assets found under this category.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-amber-50/20 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">{asset.code}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{asset.name}</div>
                        {asset.nameHindi && <div className="text-[10px] text-saffron-700">{asset.nameHindi}</div>}
                      </td>
                      <td className="py-3 px-3 text-stone-700">
                        <div>{asset.assignedDeity || asset.areaDescription || 'Temple Trust'}</div>
                        {asset.tenantName && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            Tenant: {asset.tenantName} (₹{asset.monthlyRentAmount}/mo)
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-600">{asset.metalPurity || asset.surveyNo || 'Standard'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                        {asset.netWeightGrams ? `${asset.netWeightGrams.toLocaleString('en-IN')} g` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-900">
                        ₹{asset.valuation.toLocaleString('en-IN')}.00
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            asset.custodyStatus === 'IN_VAULT'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : asset.custodyStatus === 'IN_SANCTUM'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {asset.custodyStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-600 text-[11px]">{asset.location}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {asset.category === 'SACRED_JEWELRY' && <button onClick={() => setSelectedAssetForMovement(asset)} title="Check-Out / Move from Vault to Sanctum" className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg"><ArrowRightLeft className="w-3 h-3" /></button>}
                          <button onClick={() => handleEditAsset(asset)} title="Edit asset" className="p-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDeleteAsset(asset)} title="Delete asset" className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VAULT CUSTODY & MOVEMENT AUDIT LOG */
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Sacred Jewelry Vault Custody & Movement Audit Log</span>
            </h3>
            <span className="text-xs text-stone-500">{movements.length} Movements Recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Sacred Ornament Item</th>
                  <th className="py-2.5 px-3">From Locker ➔ To Location</th>
                  <th className="py-2.5 px-3">Purpose of Movement</th>
                  <th className="py-2.5 px-3">Issued To (Archaka)</th>
                  <th className="py-2.5 px-3">Authorized By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      No jewelry movements recorded yet. All sacred ornaments are safely secured in the Vault.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-amber-50/20">
                      <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                        {m.movementDate} {m.movementTime}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">{m.assetName}</td>
                      <td className="py-2.5 px-3 text-stone-700">
                        <span className="font-semibold">{m.fromLocation}</span> ➔{' '}
                        <span className="text-emerald-800 font-semibold">{m.toLocation}</span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">{m.purpose}</td>
                      <td className="py-2.5 px-3 font-semibold text-stone-800">{m.issuedTo}</td>
                      <td className="py-2.5 px-3 text-stone-600">{m.authorizedBy}</td>
                      <td className="py-2.5 px-3 text-center">
                        {m.status === 'CHECKED_OUT' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            IN SANCTUM (CHECKED OUT)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            RETURNED SAFE TO VAULT
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {m.status === 'CHECKED_OUT' && (
                          <button
                            onClick={() => handleReturnMovement(m.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                          >
                            Verify & Return to Vault
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW TEMPLE ASSET */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-amber-200 space-y-4 my-8">
            <h3 className="font-serif font-bold text-base text-stone-900 border-b pb-2">
              Register New Temple Sacred Asset / Property
            </h3>

            <form onSubmit={handleSaveAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Asset Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AssetCategory)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-amber-300 rounded-lg focus:outline-none font-bold text-stone-900 cursor-pointer"
                  >
                    {assetCategories.filter(c => c.isActive !== false).map((cat) => (
                      <option key={cat.id} value={cat.code}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Assigned Deity / Sanctum</label>
                  <input
                    type="text"
                    value={assignedDeity}
                    onChange={(e) => setAssignedDeity(e.target.value)}
                    placeholder="e.g. Lord Lakshmi Narayana"
                    className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Asset Item Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 22K Gold Crown / Sy. No 142 Land"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none font-bold"
                />
              </div>

              {category === 'SACRED_JEWELRY' && (
                <div className="grid grid-cols-3 gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Metal & Purity</label>
                    <input
                      type="text"
                      value={metalPurity}
                      onChange={(e) => setMetalPurity(e.target.value)}
                      placeholder="22K Gold / 92.5 Silver"
                      className="w-full px-2 py-1 bg-white border rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Gross Wt (g)</label>
                    <input
                      type="number"
                      value={grossWeightGrams}
                      onChange={(e) => setGrossWeightGrams(e.target.value)}
                      placeholder="Grams"
                      className="w-full px-2 py-1 bg-white border rounded focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Net Wt (g)</label>
                    <input
                      type="number"
                      value={netWeightGrams}
                      onChange={(e) => setNetWeightGrams(e.target.value)}
                      placeholder="Grams"
                      className="w-full px-2 py-1 bg-white border rounded focus:outline-none font-bold"
                    />
                  </div>
                </div>
              )}

              {category === 'LAND_PROPERTY' && (
                <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2.5 rounded-xl border">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Survey No.</label>
                    <input
                      type="text"
                      value={surveyNo}
                      onChange={(e) => setSurveyNo(e.target.value)}
                      placeholder="e.g. Sy. No 142/2A"
                      className="w-full px-2 py-1 bg-white border rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Area (Acres/Sq Ft)</label>
                    <input
                      type="text"
                      value={areaDescription}
                      onChange={(e) => setAreaDescription(e.target.value)}
                      placeholder="e.g. 2.5 Acres"
                      className="w-full px-2 py-1 bg-white border rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Tenant Name (if leased)</label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="e.g. Balaji Stores"
                      className="w-full px-2 py-1 bg-white border rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      value={monthlyRentAmount}
                      onChange={(e) => setMonthlyRentAmount(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full px-2 py-1 bg-white border rounded focus:outline-none font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Est. Valuation (INR) *</label>
                  <input
                    type="number"
                    required
                    value={valuation}
                    onChange={(e) => setValuation(e.target.value)}
                    placeholder="₹ 0.00"
                    className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none font-bold text-amber-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Safe Storage Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Vault Locker #1"
                    className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Notes / Provenance</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, historical details or devotee notes..."
                  className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Save to Asset Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VAULT CHECK-OUT CUSTODY MOVEMENT */}
      {selectedAssetForMovement && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex min-h-full items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-amber-300 space-y-4">
            <h3 className="font-serif font-bold text-base text-amber-950 border-b pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Sacred Jewelry Vault Check-Out</span>
            </h3>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
              <div className="font-bold text-stone-900">{selectedAssetForMovement.name}</div>
              <div className="text-stone-600">
                Code: <strong>{selectedAssetForMovement.code}</strong> | Net Wt:{' '}
                <strong>{selectedAssetForMovement.netWeightGrams}g</strong>
              </div>
              <div className="text-stone-500">Current Location: {selectedAssetForMovement.location}</div>
            </div>

            <form onSubmit={handleCreateMovement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Destination Location</label>
                <input
                  type="text"
                  required
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  placeholder="Main Sanctum (Garbhagriha)"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Purpose of Removal</label>
                <input
                  type="text"
                  required
                  value={movementPurpose}
                  onChange={(e) => setMovementPurpose(e.target.value)}
                  placeholder="e.g. Vaikunta Ekadashi Deity Alankaram"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Issued To (Head Archaka / Priest) *</label>
                <input
                  type="text"
                  required
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Authorized By (Trustee) *</label>
                <input
                  type="text"
                  required
                  value={authorizedBy}
                  onChange={(e) => setAuthorizedBy(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssetForMovement(null)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Authorize Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
