import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Sparkles,
  Sliders,
  RotateCcw,
  QrCode,
  FileText,
  CheckCheck,
  Undo2,
  Receipt,
  Palette,
  Eye,
  PlusCircle,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Search,
  Save,
  Tag,
  Layers,
  Crown,
  Check,
  FolderPlus,
  ArrowRight
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Account, AssetCategoryItem, SevaType, ReceiptTemplateConfig, ReceiptTemplateId, PaymentOrderTemplateConfig, PaymentOrderTemplateId, ExpenseVoucher } from '../types/accounting';
import { useFeedback } from '../components/ui/Feedback';
import { generateExpenseSanctionOrderPDF } from '../services/pdfService';

type CatalogTab = 'SEVAS' | 'EXPENSE_HEADS' | 'ASSET_CATEGORIES' | 'RECEIPT_TEMPLATES' | 'PAYMENT_ORDERS';

export const CatalogManagementPage: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const [activeTab, setActiveTab] = useState<CatalogTab>('SEVAS');
  const [sevas, setSevas] = useState<SevaType[]>(storageService.getSevas());
  const [expenseCategories, setExpenseCategories] = useState<Account[]>(storageService.getExpenseCategories());
  const templeProfile = storageService.getTempleProfile();
  const [assetCategories, setAssetCategories] = useState<AssetCategoryItem[]>(storageService.getAssetCategories());
  const [templates, setTemplates] = useState<ReceiptTemplateConfig[]>(storageService.getAllReceiptTemplates());
  const [activeTemplateId, setActiveTemplateId] = useState<ReceiptTemplateId>(storageService.getActiveReceiptTemplateId());
  const [previewModalTemplate, setPreviewModalTemplate] = useState<ReceiptTemplateConfig | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ReceiptTemplateConfig | null>(null);
  const [customForm, setCustomForm] = useState<ReceiptTemplateConfig | null>(null);
  // Payment order templates
  const [payTemplates, setPayTemplates] = useState<PaymentOrderTemplateConfig[]>(storageService.getAllPaymentOrderTemplates());
  const [activePayId, setActivePayId] = useState<PaymentOrderTemplateId>(storageService.getActivePaymentOrderTemplateId());
  const [payForm, setPayForm] = useState<PaymentOrderTemplateConfig | null>(null);

  // Toast State
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Changes saved successfully!');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setSevas(storageService.getSevas());
      setExpenseCategories(storageService.getExpenseCategories());
      setAssetCategories(storageService.getAssetCategories());
      setActiveTemplateId(storageService.getActiveReceiptTemplateId());
      setPayTemplates(storageService.getAllPaymentOrderTemplates());
      setActivePayId(storageService.getActivePaymentOrderTemplateId());
    };
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => window.removeEventListener('temple_storage_updated', handleUpdate);
  }, []);


  
  const handleOpenCustomize = (tpl: ReceiptTemplateConfig) => {
    setEditingTemplate(tpl);
    setCustomForm({ ...tpl });
  };

  const handleSaveCustomization = (activateNow: boolean = false) => {
    if (!customForm) return;
    storageService.saveReceiptTemplate(customForm);
    if (activateNow) {
      storageService.setActiveReceiptTemplateId(customForm.id);
      setActiveTemplateId(customForm.id);
    }
    setTemplates(storageService.getAllReceiptTemplates());
    setEditingTemplate(null);
    setCustomForm(null);
    showToast(
      activateNow
        ? `Saved and set "${customForm.name}" as the ACTIVE POS receipt template.`
        : `Customizations saved for "${customForm.name}".`
    );
  };

  const handleResetToDefault = (id: ReceiptTemplateId) => {
    storageService.resetReceiptTemplate(id);
    const restored = storageService.getReceiptTemplate(id);
    setCustomForm({ ...restored });
    setTemplates(storageService.getAllReceiptTemplates());
    showToast(`Reset "${restored.name}" to factory default layout.`);
  };

  const handleSelectTemplate = (id: ReceiptTemplateId, name: string) => {
    storageService.setActiveReceiptTemplateId(id);
    setActiveTemplateId(id);
    showToast(`Active POS receipt template switched to "${name}".`);
  };

  // --- Payment Order template handlers ---
  const handleSavePayTemplate = (activateNow: boolean = false) => {
    if (!payForm) return;
    storageService.savePaymentOrderTemplate(payForm);
    if (activateNow) {
      storageService.setActivePaymentOrderTemplateId(payForm.id);
      setActivePayId(payForm.id);
    }
    setPayTemplates(storageService.getAllPaymentOrderTemplates());
    setPayForm(null);
    showToast(
      activateNow
        ? `Saved and set "${payForm.name}" as the ACTIVE payment order template.`
        : `Customizations saved for "${payForm.name}".`
    );
  };

  const handleResetPayTemplate = (id: PaymentOrderTemplateId) => {
    storageService.resetPaymentOrderTemplate(id);
    const restored = storageService.getPaymentOrderTemplate(id);
    setPayForm({ ...restored });
    setPayTemplates(storageService.getAllPaymentOrderTemplates());
    showToast(`Reset "${restored.name}" to factory default layout.`);
  };

  const handleSelectPayTemplate = (id: PaymentOrderTemplateId, name: string) => {
    storageService.setActivePaymentOrderTemplateId(id);
    setActivePayId(id);
    showToast(`Active payment order template switched to "${name}".`);
  };

  const handlePrintPaySample = (tpl: PaymentOrderTemplateConfig) => {
    const prevActive = storageService.getActivePaymentOrderTemplateId();
    storageService.setActivePaymentOrderTemplateId(tpl.id);
    const sample: ExpenseVoucher = {
      id: 'sample',
      voucherNo: 'SAMPLE-0001',
      sanctionOrderNo: 'ORD-SAMPLE-0001',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      payeeName: 'Sri Ramesh Sharma (Priest)',
      purpose: 'Purchase of pooja materials & flowers',
      category: 'Pooja Materials',
      amount: 5100,
      paymentMode: 'CASH',
      refNo: '',
      debitAccountId: 'exp-01',
      debitAccountName: 'Pooja & Ritual Expenses',
      creditAccountId: 'acc-101',
      creditAccountName: 'In-Hand Cash',
      sanctionedBy: 'Dr. K. V. Sharma (Trustee)',
      status: 'SANCTIONED',
      notes: '',
      isSynced: false,
    } as ExpenseVoucher;
    const doc = generateExpenseSanctionOrderPDF(sample);
    doc.save(`Sample_${tpl.name.replace(/\s+/g, '_')}.pdf`);
    storageService.setActivePaymentOrderTemplateId(prevActive);
    showToast(`Sample "${tpl.name}" PDF generated.`);
  };

  // =========================================================================
  // 1. SEVA & EVENT CATALOG STATE & HANDLERS (NAME ONLY, NO PREDEFINED AMOUNT)
  // =========================================================================
  const [editingSevaId, setEditingSevaId] = useState<string | null>(null);
  const [sevaName, setSevaName] = useState<string>('');
  const [sevaActive, setSevaActive] = useState<boolean>(true);
  const [sevaSearch, setSevaSearch] = useState<string>('');

  const handleStartEditSeva = (s: SevaType) => {
    setEditingSevaId(s.id);
    setSevaName(s.name);
    setSevaActive(s.isActive !== false);
  };

  const handleCancelEditSeva = () => {
    setEditingSevaId(null);
    setSevaName('');
    setSevaActive(true);
  };

  const handleSaveSeva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sevaName.trim()) {
      notify('Seva/Event Name is required.', 'error');
      return;
    }

    if (editingSevaId) {
      const existing = sevas.find(s => s.id === editingSevaId);
      storageService.saveSeva({
        id: editingSevaId,
        code: existing?.code || `SEVA-${Date.now()}`,
        name: sevaName.trim(),
        category: existing?.category || 'DAILY_SEVA',
        isActive: sevaActive,
      });
      showToast(`Updated "${sevaName}" in Seva Catalog.`);
    } else {
      storageService.saveSeva({
        name: sevaName.trim(),
        code: `SEVA-${String(sevas.length + 1).padStart(3, '0')}`,
        category: 'DAILY_SEVA',
        isActive: sevaActive,
      });
      showToast(`Added "${sevaName}" to Seva Catalog.`);
    }

    handleCancelEditSeva();
    setSevas(storageService.getSevas());
  };

  const handleDeleteSeva = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Remove Seva',
      message: `Are you sure you want to remove "${name}" from Seva Catalog?`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) {
      storageService.deleteSeva(id);
      setSevas(storageService.getSevas());
      showToast(`Removed "${name}" from Seva Catalog.`);
    }
  };

  const handleToggleSeva = (id: string) => {
    const newState = storageService.toggleSevaActive(id);
    setSevas(storageService.getSevas());
    showToast(`Seva status changed to ${newState ? 'Active on POS' : 'Inactive'}.`);
  };

  const filteredSevas = sevas.filter(s =>
    s.name.toLowerCase().includes(sevaSearch.toLowerCase())
  );

  // =========================================================================
  // 2. EXPENSE CATEGORIES STATE & HANDLERS
  // =========================================================================
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expName, setExpName] = useState<string>('');
  const [expSubCategory, setExpSubCategory] = useState<string>('Sanctum Operations');
  const [expActive, setExpActive] = useState<boolean>(true);
  const [expSearch, setExpSearch] = useState<string>('');

  const handleStartEditExp = (acc: Account) => {
    setEditingExpId(acc.id);
    setExpName(acc.name);
    setExpSubCategory(acc.subCategory || 'Sanctum Operations');
    setExpActive(acc.isActive !== false);
  };

  const handleCancelEditExp = () => {
    setEditingExpId(null);
    setExpName('');
    setExpSubCategory('Sanctum Operations');
    setExpActive(true);
  };

  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim()) {
      notify('Expense Category Name is required.', 'error');
      return;
    }

    if (editingExpId) {
      storageService.saveExpenseCategory({
        id: editingExpId,
        name: expName.trim(),
        subCategory: expSubCategory.trim(),
        isActive: expActive,
      });
      showToast(`Updated "${expName}" in Expense Categories.`);
    } else {
      storageService.saveExpenseCategory({
        name: expName.trim(),
        subCategory: expSubCategory.trim(),
        isActive: expActive,
      });
      showToast(`Added "${expName}" to Expense Categories.`);
    }

    handleCancelEditExp();
    setExpenseCategories(storageService.getExpenseCategories());
  };

  const handleDeleteExp = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Remove Expense Category',
      message: `Are you sure you want to remove expense category "${name}"?`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) {
      storageService.deleteExpenseCategory(id);
      setExpenseCategories(storageService.getExpenseCategories());
      showToast(`Removed "${name}" from Expense Categories.`);
    }
  };

  const handleToggleExp = (id: string) => {
    const newState = storageService.toggleExpenseCategoryActive(id);
    setExpenseCategories(storageService.getExpenseCategories());
    showToast(`Category status changed to ${newState ? 'Active on Vouchers' : 'Inactive'}.`);
  };

  const filteredExpenses = expenseCategories.filter(e =>
    e.name.toLowerCase().includes(expSearch.toLowerCase()) ||
    (e.subCategory && e.subCategory.toLowerCase().includes(expSearch.toLowerCase()))
  );

  // =========================================================================
  // 3. ASSET CATEGORIES STATE & HANDLERS
  // =========================================================================
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState<string>('');
  const [assetDescription, setAssetDescription] = useState<string>('');
  const [assetActive, setAssetActive] = useState<boolean>(true);
  const [assetSearch, setAssetSearch] = useState<string>('');

  const handleStartEditAsset = (item: AssetCategoryItem) => {
    setEditingAssetId(item.id);
    setAssetName(item.name);
    setAssetDescription(item.description || '');
    setAssetActive(item.isActive !== false);
  };

  const handleCancelEditAsset = () => {
    setEditingAssetId(null);
    setAssetName('');
    setAssetDescription('');
    setAssetActive(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      notify('Asset Category Name is required.', 'error');
      return;
    }

    if (editingAssetId) {
      storageService.saveAssetCategory({
        id: editingAssetId,
        name: assetName.trim(),
        description: assetDescription.trim(),
        icon: '👑',
        isActive: assetActive,
      });
      showToast(`Updated "${assetName}" in Asset Categories.`);
    } else {
      storageService.saveAssetCategory({
        name: assetName.trim(),
        description: assetDescription.trim(),
        icon: '👑',
        isActive: assetActive,
      });
      showToast(`Added "${assetName}" to Asset Categories.`);
    }

    handleCancelEditAsset();
    setAssetCategories(storageService.getAssetCategories());
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Remove Asset Category',
      message: `Are you sure you want to remove asset category "${name}"?`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) {
      storageService.deleteAssetCategory(id);
      setAssetCategories(storageService.getAssetCategories());
      showToast(`Removed "${name}" from Asset Categories.`);
    }
  };

  const handleToggleAsset = (id: string) => {
    const newState = storageService.toggleAssetCategoryActive(id);
    setAssetCategories(storageService.getAssetCategories());
    showToast(`Asset category status changed to ${newState ? 'Active on Vault' : 'Inactive'}.`);
  };

  const filteredAssets = assetCategories.filter(a =>
    a.name.toLowerCase().includes(assetSearch.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5 animate-fade-in text-stone-800">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <PageHeader
        icon={Layers}
        title="Catalog Management"
        subtitle="Sevas, expense heads & asset categories"
        actions={
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 self-start md:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('SEVAS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'SEVAS'
                ? 'bg-orange-600 text-white'
                : 'text-stone-700 hover:text-stone-950 hover:bg-amber-100/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sevas & Events</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10">
              {sevas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EXPENSE_HEADS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'EXPENSE_HEADS'
                ? 'bg-orange-600 text-white'
                : 'text-stone-700 hover:text-stone-950 hover:bg-amber-100/60'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Expense Categories</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10">
              {expenseCategories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ASSET_CATEGORIES')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'ASSET_CATEGORIES'
                ? 'bg-orange-600 text-white'
                : 'text-stone-700 hover:text-stone-950 hover:bg-amber-100/60'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Sacred Asset Categories</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10">
              {assetCategories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RECEIPT_TEMPLATES')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'RECEIPT_TEMPLATES'
                ? 'bg-orange-600 text-white'
                : 'text-stone-700 hover:text-stone-950 hover:bg-amber-100/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Receipt Templates</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10">
              {templates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PAYMENT_ORDERS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'PAYMENT_ORDERS'
                ? 'bg-orange-600 text-white'
                : 'text-stone-700 hover:text-stone-950 hover:bg-amber-100/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Payment Orders</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10">
              {payTemplates.length}
            </span>
          </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* TAB 1: SEVAS & EVENTS (NAME ONLY, NO AMOUNT, NO SUMMARY/SUB-EVENT)         */}
      {/* ========================================================================= */}
      {activeTab === 'SEVAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Add / Edit Seva Form (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>{editingSevaId ? 'Edit Seva / Event' : 'Add New Seva / Event'}</span>
              </h2>
              {editingSevaId && (
                <button
                  type="button"
                  onClick={handleCancelEditSeva}
                  className="text-xs text-stone-500 hover:text-stone-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSeva} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Seva / Event Name <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sevaName}
                  onChange={(e) => setSevaName(e.target.value)}
                  placeholder="e.g. Rudra Abhishekam / Maha Shivaratri Utsav"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>



              <div className="pt-1 flex items-center justify-between">
                <label className="text-[11px] font-semibold text-stone-700">
                  Active on POS Donation Counter
                </label>
                <input
                  type="checkbox"
                  checked={sevaActive}
                  onChange={(e) => setSevaActive(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingSevaId ? 'Save Changes' : 'Add to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sevas List Table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-amber-950">Sevas & Events Registry</h2>
                <span className="text-xs text-stone-500">({filteredSevas.length} items)</span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={sevaSearch}
                  onChange={(e) => setSevaSearch(e.target.value)}
                  placeholder="Search Seva or Event..."
                  className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-amber-100/80 text-[11px] text-stone-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Seva / Event Name</th>
                    <th className="py-2.5 px-3 text-center">POS Counter Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredSevas.map((s) => (
                    <tr key={s.id} className="hover:bg-amber-50/30 transition">
                      <td className="py-2.5 px-3 font-semibold text-stone-900">
                        {s.name}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSeva(s.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                            s.isActive !== false
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-stone-100 text-stone-500 border-stone-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.isActive !== false ? 'bg-emerald-500' : 'bg-stone-400'}`}></span>
                          <span>{s.isActive !== false ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditSeva(s)}
                            className="p-1 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            title="Edit Seva"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSeva(s.id, s.name)}
                            className="p-1 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete Seva"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSevas.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-400 italic">
                        No Sevas or Events match the search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPENSE CATEGORIES                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'EXPENSE_HEADS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Add / Edit Expense Category (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-600" />
                <span>{editingExpId ? 'Edit Expense Category' : 'Add Expense Category'}</span>
              </h2>
              {editingExpId && (
                <button
                  type="button"
                  onClick={handleCancelEditExp}
                  className="text-xs text-stone-500 hover:text-stone-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSaveExp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Category Name <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  placeholder="e.g. Pooja Flowers & Ghee, Sanctum Oil"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Expense Head / Group
                </label>
                <input
                  type="text"
                  value={expSubCategory}
                  onChange={(e) => setExpSubCategory(e.target.value)}
                  placeholder="e.g. Sanctum Operations / Feeding / Administration"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 bg-stone-50/50 focus:outline-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <label className="text-[11px] font-semibold text-stone-700">
                  Active on Expense Sanctions
                </label>
                <input
                  type="checkbox"
                  checked={expActive}
                  onChange={(e) => setExpActive(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingExpId ? 'Save Changes' : 'Add Category'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Expense Categories List Table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-amber-950">Expense Categories Master</h2>
                <span className="text-xs text-stone-500">({filteredExpenses.length} categories)</span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={expSearch}
                  onChange={(e) => setExpSearch(e.target.value)}
                  placeholder="Search Expense Category..."
                  className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-amber-100/80 text-[11px] text-stone-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Expense Category</th>
                    <th className="py-2.5 px-3">Head / Group</th>
                    <th className="py-2.5 px-3 text-center">Sanctions Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredExpenses.map((acc) => (
                    <tr key={acc.id} className="hover:bg-amber-50/30 transition">
                      <td className="py-2.5 px-3 font-semibold text-stone-900">
                        {acc.name}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        {acc.subCategory || 'General Expense'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleExp(acc.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                            acc.isActive !== false
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-stone-100 text-stone-500 border-stone-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${acc.isActive !== false ? 'bg-emerald-500' : 'bg-stone-400'}`}></span>
                          <span>{acc.isActive !== false ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditExp(acc)}
                            className="p-1 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExp(acc.id, acc.name)}
                            className="p-1 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-400 italic">
                        No expense categories match the search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SACRED ASSET CATEGORIES                                            */}
      {/* ========================================================================= */}
      {activeTab === 'ASSET_CATEGORIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Add / Edit Asset Category (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Crown className="w-4 h-4 text-orange-600" />
                <span>{editingAssetId ? 'Edit Asset Category' : 'Add Asset Category'}</span>
              </h2>
              {editingAssetId && (
                <button
                  type="button"
                  onClick={handleCancelEditAsset}
                  className="text-xs text-stone-500 hover:text-stone-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Category Name <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. Sacred Gold Jewels / Silver Utensils"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Description / Specification (Optional)
                </label>
                <input
                  type="text"
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  placeholder="e.g. Kept in Sacred Vault Under Dual Witness"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 bg-stone-50/50 focus:outline-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <label className="text-[11px] font-semibold text-stone-700">
                  Active on Sacred Asset Register
                </label>
                <input
                  type="checkbox"
                  checked={assetActive}
                  onChange={(e) => setAssetActive(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingAssetId ? 'Save Changes' : 'Add Category'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Asset Categories List Table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-amber-950">Sacred Asset Categories</h2>
                <span className="text-xs text-stone-500">({filteredAssets.length} categories)</span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Search Asset Category..."
                  className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-amber-100/80 text-[11px] text-stone-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Asset Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Register Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredAssets.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition">
                      <td className="py-2.5 px-3 font-semibold text-stone-900">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        {item.description || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAsset(item.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                            item.isActive !== false
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-stone-100 text-stone-500 border-stone-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive !== false ? 'bg-emerald-500' : 'bg-stone-400'}`}></span>
                          <span>{item.isActive !== false ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditAsset(item)}
                            className="p-1 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(item.id, item.name)}
                            className="p-1 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAssets.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-400 italic">
                        No asset categories match the search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    
      {/* ========================================================================= */}
      {/* TAB 4: DONATION RECEIPT TEMPLATES                                          */}
      {/* ========================================================================= */}
      {activeTab === 'RECEIPT_TEMPLATES' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-100/40 rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-600 text-white shadow-xs">
                  <Palette className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-stone-900">
                  Donation Receipt Templates
                </h2>
              </div>
              <p className="text-xs text-stone-600 max-w-2xl">
                Two ready-to-use layouts for <strong>{templeProfile.name}</strong> — a full-page <strong>A5 official receipt</strong> and a compact <strong>80mm thermal POS slip</strong>. As Trustee, you can <strong>customize every default detail</strong> — invocation shlokas, blessing text, 80G tax notices, prasadam instructions, signature lines, colours and paper size.
              </p>
            </div>

            {/* Currently Active Banner */}
            {(() => {
              const cur = templates.find((t) => t.id === activeTemplateId) || templates[0];
              return (
                <div
                  style={{ borderColor: cur.primaryColor }}
                  className="bg-white px-4 py-2.5 rounded-xl border-2 shadow-xs shrink-0 flex items-center gap-3"
                >
                  <div className="text-2xl">{cur.motif.split(' ')[0] || '🪔'}</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Currently Active on POS</div>
                    <div className="text-xs font-black text-stone-900">{cur.name}</div>
                    <div style={{ color: cur.primaryColor }} className="text-[10px] font-semibold">{cur.invocation}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Grid of Template Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((tpl) => {
              const isActive = tpl.id === activeTemplateId;
              return (
                <div
                  key={tpl.id}
                  style={{
                    borderColor: isActive ? tpl.primaryColor : '#e5e7eb',
                  }}
                  className={`bg-white rounded-2xl border-2 p-4 shadow-xs transition duration-200 flex flex-col justify-between relative overflow-hidden ${
                    isActive ? 'ring-2 ring-offset-1 ring-amber-500/30' : 'hover:border-amber-300'
                  }`}
                >
                  {/* Top Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xl">{tpl.motif}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                        {tpl.designStyle}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-stone-950 mb-0.5">{tpl.name}</h3>
                    <p className="text-[11px] text-stone-500 mb-2.5 line-clamp-2">{tpl.description}</p>

                    {/* Sacred Invocation Badge */}
                    <div
                      style={{
                        backgroundColor: `${tpl.primaryColor}10`,
                        color: tpl.primaryColor,
                        borderColor: `${tpl.primaryColor}30`,
                      }}
                      className="p-2 rounded-xl border mb-3 text-center"
                    >
                      <div className="text-xs font-bold font-serif">{tpl.invocation}</div>
                      {tpl.subInvocation && (
                        <div className="text-[9px] text-stone-600 mt-0.5 font-medium">{tpl.subInvocation}</div>
                      )}
                    </div>

                    {/* Mini Live Slip Preview formatted with REAL temple name */}
                    <div
                      style={{ borderColor: tpl.primaryColor }}
                      className="bg-stone-50/90 p-3 rounded-xl border border-dashed text-[10px] font-mono leading-tight text-stone-800 space-y-1 mb-3"
                    >
                      <div className="text-center pb-1 border-b border-stone-200">
                        <div className="font-bold text-[10px] uppercase text-stone-950 truncate">
                          {templeProfile.name}
                        </div>
                        <div className="text-[8px] text-stone-500 truncate">
                          {templeProfile.city || templeProfile.address || 'Sanctum'}
                        </div>
                      </div>
                      <div className="flex justify-between pb-1 border-b border-stone-200 font-semibold pt-0.5">
                        <span>REC-2026-00128</span>
                        <span style={{ color: tpl.primaryColor }}>₹501.00</span>
                      </div>
                      <div className="text-stone-600 truncate">Devotee: Rajesh Sharma</div>
                      <div className="text-stone-600 truncate">Seva: Rudrabhisheka Archana</div>
                      <div style={{ color: tpl.primaryColor }} className="text-[9px] font-bold truncate pt-0.5">
                        {tpl.blessingText}
                      </div>
                    </div>

                    {/* Paper & Features Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-stone-500 mb-3">
                      <span className="px-2 py-0.5 rounded bg-stone-100 font-medium">{tpl.paperWidth}</span>
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 font-medium capitalize">{tpl.borderStyle}</span>
                      {tpl.show80GNotice && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">80G</span>
                      )}
                      {tpl.showPrasadamNote && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">Prasadam</span>
                      )}
                      {tpl.showQrCode && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 font-semibold">QR Smart</span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModalTemplate(tpl)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCustomize(tpl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-amber-100/70 hover:bg-amber-200/80 transition cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-700" />
                        <span>Customize & Edit</span>
                      </button>
                    </div>

                    {isActive ? (
                      <div className="w-full text-center py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active on POS Printer</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                        style={{ backgroundColor: tpl.primaryColor }}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition cursor-pointer active:scale-98"
                      >
                        <span>Select for POS</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* TRUSTEE CUSTOMIZATION DRAWER / MODAL WITH REAL-TIME LIVE SLIP PREVIEW    */}
          {/* ========================================================================= */}
          {editingTemplate && customForm && (
            <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-amber-300 animate-fadeIn">
                {/* Modal Header */}
                <div
                  style={{ backgroundColor: customForm.primaryColor }}
                  className="px-5 py-3.5 text-white flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-1 bg-white/15 rounded-xl">{customForm.motif.split(' ')[0] || '🪔'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base leading-tight">
                          Customize Template: {customForm.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                          {customForm.designStyle}
                        </span>
                      </div>
                      <p className="text-xs text-white/85">
                        Trustee Configuration: Modify any field below. Changes update in real-time on the slip.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setCustomForm(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body: Split Layout (Left: Form controls, Right: Live Slip Preview) */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 bg-stone-50">
                  {/* LEFT: 7 Columns Form Fields */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Temple Notice */}
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Temple Identity:</strong> This receipt automatically uses your temple's active profile details (<strong>{templeProfile.name}</strong>, {templeProfile.city || templeProfile.address}).
                        <span className="text-stone-500 block text-[11px] mt-0.5">
                          To update your temple address or registration number, use Temple Settings.
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Sacred Invocations & Motifs */}
                    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3.5 shadow-2xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                        <Tag className="w-4 h-4 text-orange-600" />
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                          1. Sacred Invocations & Identity
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Primary Invocation / Shloka
                          </label>
                          <input
                            type="text"
                            value={customForm.invocation}
                            onChange={(e) => setCustomForm({ ...customForm, invocation: e.target.value })}
                            placeholder="e.g. ॥ श्री गणेशाय नमः ॥"
                            className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-serif"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Sub-Invocation / Spiritual Motto
                          </label>
                          <input
                            type="text"
                            value={customForm.subInvocation}
                            onChange={(e) => setCustomForm({ ...customForm, subInvocation: e.target.value })}
                            placeholder="e.g. ॥ धर्मो रक्षति रक्षितः ॥"
                            className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-serif"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Auspicious Deity Motif / Symbols
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customForm.motif}
                            onChange={(e) => setCustomForm({ ...customForm, motif: e.target.value })}
                            className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <div className="flex items-center gap-1">
                            {['🕉️ 🪔 🕉️', '🚩 ॐ 🚩', '🔱 🕉️ 🔱', '🪔 श्री 🪔', '☸️ 🪔 ☸️'].map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setCustomForm({ ...customForm, motif: m })}
                                className="px-1.5 py-1 text-xs rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 cursor-pointer"
                                title="Use this motif"
                              >
                                {m.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Blessings & Prasadam Instructions */}
                    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3.5 shadow-2xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                        <Crown className="w-4 h-4 text-orange-600" />
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                          2. Divine Blessing & Prasadam Notes
                        </h4>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Blessing Message / Shloka Text
                        </label>
                        <textarea
                          rows={2}
                          value={customForm.blessingText}
                          onChange={(e) => setCustomForm({ ...customForm, blessingText: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-2 pt-1 border-t border-stone-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-stone-800 cursor-pointer flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={customForm.showPrasadamNote}
                              onChange={(e) => setCustomForm({ ...customForm, showPrasadamNote: e.target.checked })}
                              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                            />
                            <span>Include Prasadam Collection Instruction on Receipt</span>
                          </label>
                        </div>

                        {customForm.showPrasadamNote && (
                          <input
                            type="text"
                            value={customForm.prasadamNoteText}
                            onChange={(e) => setCustomForm({ ...customForm, prasadamNoteText: e.target.value })}
                            placeholder="e.g. Please present this slip at Counter 2 for holy teertha and laddu prasadam."
                            className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                        )}
                      </div>
                    </div>

                    {/* Section 3: Legal, 80G Tax Exemption & Metadata */}
                    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3.5 shadow-2xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                          3. Legal 80G Notice & Devotee Metadata
                        </h4>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-stone-800 cursor-pointer flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={customForm.show80GNotice}
                              onChange={(e) => setCustomForm({ ...customForm, show80GNotice: e.target.checked })}
                              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                            />
                            <span>Print Section 80G Income Tax Exemption Note</span>
                          </label>
                        </div>

                        {customForm.show80GNotice && (
                          <input
                            type="text"
                            value={customForm.taxExemptionText}
                            onChange={(e) => setCustomForm({ ...customForm, taxExemptionText: e.target.value })}
                            placeholder="e.g. Donations are eligible for tax deduction under Section 80G of the Income Tax Act."
                            className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                        <label className="text-[11px] font-semibold text-stone-800 cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={customForm.showGothraNakshatra}
                            onChange={(e) => setCustomForm({ ...customForm, showGothraNakshatra: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span>Show Gotra & Nakshatra Lines</span>
                        </label>

                        <label className="text-[11px] font-semibold text-stone-800 cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={customForm.showQrCode}
                            onChange={(e) => setCustomForm({ ...customForm, showQrCode: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span>Show Verification QR Code Box</span>
                        </label>
                      </div>
                    </div>

                    {/* Section 4: Signatures & Authority */}
                    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3.5 shadow-2xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                        <Layers className="w-4 h-4 text-orange-600" />
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                          4. Signatures & Authority Lines
                        </h4>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Signatory Title / Authority Label
                        </label>
                        <input
                          type="text"
                          value={customForm.signatoryLabel}
                          onChange={(e) => setCustomForm({ ...customForm, signatoryLabel: e.target.value })}
                          placeholder="e.g. Authorized Signatory / Trustee"
                          className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label className="text-[11px] font-semibold text-stone-800 cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={customForm.showTrusteeSign}
                            onChange={(e) => setCustomForm({ ...customForm, showTrusteeSign: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span>Show Trustee Signature Line</span>
                        </label>

                        <label className="text-[11px] font-semibold text-stone-800 cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={customForm.showDevoteeSign}
                            onChange={(e) => setCustomForm({ ...customForm, showDevoteeSign: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span>Show Devotee Signature Line</span>
                        </label>
                      </div>
                    </div>

                    {/* Section 5: Layout & Styling */}
                    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3.5 shadow-2xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                        <Palette className="w-4 h-4 text-orange-600" />
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                          5. Thermal Roll Width & Colors
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Paper Size / Width
                          </label>
                          <select
                            value={customForm.paperWidth}
                            onChange={(e) => setCustomForm({ ...customForm, paperWidth: e.target.value as 'A5' | '80mm' | '58mm' })}
                            className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          >
                            <option value="A5">A5 (Full-Page Laser/Inkjet)</option>
                            <option value="80mm">80mm (Standard POS Roll)</option>
                            <option value="58mm">58mm (Compact Mobile Roll)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Border Frame
                          </label>
                          <select
                            value={customForm.borderStyle}
                            onChange={(e) => setCustomForm({ ...customForm, borderStyle: e.target.value as any })}
                            className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          >
                            <option value="double">Double Border (Classic)</option>
                            <option value="dashed">Dashed Perforated</option>
                            <option value="solid">Solid Frame</option>
                            <option value="boxed">Boxed Ledger Grid</option>
                            <option value="ornate">Ornate Flourished</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Theme Accent Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customForm.primaryColor}
                              onChange={(e) => setCustomForm({ ...customForm, primaryColor: e.target.value })}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 p-0.5"
                            />
                            <div className="flex items-center gap-1">
                              {['#991B1B', '#EA580C', '#B45309', '#065F46', '#1E1B4B'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setCustomForm({ ...customForm, primaryColor: c })}
                                  style={{ backgroundColor: c }}
                                  className="w-5 h-5 rounded-full border border-stone-200 cursor-pointer shadow-2xs"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: 5 Columns Sticky Live Slip Preview */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <div className="sticky top-2 w-full max-w-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          Live Real-Time Thermal Preview
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                          {customForm.paperWidth}
                        </span>
                      </div>

                      {/* Actual Thermal Slip Simulated */}
                      <div
                        style={{
                          borderColor: customForm.primaryColor,
                          borderStyle: customForm.borderStyle === 'double' ? 'double' : customForm.borderStyle === 'dashed' ? 'dashed' : 'solid',
                          borderWidth: customForm.borderStyle === 'double' ? '4px' : '2px',
                        }}
                        className={`bg-white p-4 shadow-lg rounded-sm font-mono text-[11px] leading-tight text-stone-900 space-y-2 ${
                          customForm.paperWidth === '58mm' ? 'w-64 mx-auto text-[10px]' : 'w-full'
                        }`}
                      >
                        {/* Header */}
                        <div className="text-center pb-2 border-b-2 border-dashed border-stone-300">
                          <div className="text-sm font-bold tracking-widest">{customForm.motif}</div>
                          <div style={{ color: customForm.primaryColor }} className="text-xs font-bold mt-0.5">
                            {customForm.invocation}
                          </div>
                          {customForm.subInvocation && (
                            <div className="text-[9px] text-stone-600 font-medium">{customForm.subInvocation}</div>
                          )}
                          <div className="font-extrabold text-xs text-stone-950 mt-1 uppercase">
                            {templeProfile.name}
                          </div>
                          <div className="text-[9px] text-stone-500">
                            {templeProfile.city || templeProfile.address || 'Karnataka'}
                          </div>
                          <div
                            style={{
                              backgroundColor: `${customForm.primaryColor}15`,
                              color: customForm.primaryColor,
                              borderColor: `${customForm.primaryColor}40`,
                            }}
                            className="text-[9px] font-bold mt-1.5 py-0.5 px-2 rounded border uppercase tracking-wider inline-block"
                          >
                            OFFICIAL SEVA RECEIPT
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="py-1 border-b-2 border-dashed border-stone-300 space-y-1">
                          <div className="flex justify-between">
                            <span>Receipt No:</span>
                            <strong className="font-mono">REC-2026-00128</strong>
                          </div>
                          <div className="flex justify-between text-[10px] text-stone-600">
                            <span>Date:</span>
                            <span>19-Sep-2026 09:30 AM</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-stone-600">
                            <span>Devotee:</span>
                            <strong className="text-stone-950">Rajesh Sharma</strong>
                          </div>
                          <div className="flex justify-between text-[10px] text-stone-600">
                            <span>Mobile:</span>
                            <span>9876543210</span>
                          </div>
                          {customForm.showGothraNakshatra && (
                            <div className="flex justify-between text-[10px] text-stone-600">
                              <span>Gotra / Nakshatra:</span>
                              <span>Kashyapa | Rohini</span>
                            </div>
                          )}
                        </div>

                        {/* Seva Items */}
                        <div className="py-1 border-b-2 border-dashed border-stone-300">
                          <div className="flex justify-between text-[10px] font-bold text-stone-700 pb-0.5 border-b border-stone-200">
                            <span>Particulars</span>
                            <span>Amount</span>
                          </div>
                          <div className="flex justify-between py-1 items-center">
                            <span className="font-bold text-xs">Maha Rudrabhishekam</span>
                            <span className="font-bold font-mono text-xs">₹501.00</span>
                          </div>
                        </div>

                        {/* Total Amount */}
                        <div className="py-1 border-b-2 border-dashed border-stone-300">
                          <div className="flex justify-between items-center text-xs font-black">
                            <span>TOTAL PAID:</span>
                            <span style={{ color: customForm.primaryColor }} className="text-sm font-mono">
                              ₹501.00
                            </span>
                          </div>
                          <div className="text-[9px] text-stone-600 italic">
                            (Five Hundred and One Rupees Only)
                          </div>
                        </div>

                        {/* Blessing Shloka */}
                        <div className="py-1.5 border-b-2 border-dashed border-stone-300 text-center">
                          <div className="text-[10px] font-bold text-stone-800 leading-snug">
                            {customForm.blessingText}
                          </div>
                          {customForm.showPrasadamNote && (
                            <div className="text-[9px] text-emerald-800 font-semibold mt-1 bg-emerald-50 py-0.5 px-1 rounded border border-emerald-200">
                              {customForm.prasadamNoteText}
                            </div>
                          )}
                          {customForm.show80GNotice && (
                            <div className="text-[8px] text-stone-500 mt-1 uppercase">
                              {customForm.taxExemptionText}
                            </div>
                          )}
                        </div>

                        {/* Optional QR Code */}
                        {customForm.showQrCode && (
                          <div className="py-1 border-b-2 border-dashed border-stone-300 text-center flex flex-col items-center">
                            <div className="w-16 h-16 border-2 border-stone-800 flex items-center justify-center p-1 bg-white">
                              <QrCode className="w-12 h-12 text-stone-800" />
                            </div>
                            <span className="text-[7px] text-stone-500 mt-0.5 font-mono">SCAN TO VERIFY RECEIPT</span>
                          </div>
                        )}

                        {/* Signatures */}
                        <div className="pt-1 text-center text-[9px] text-stone-500 space-y-1">
                          <div className="flex justify-between text-[9px]">
                            <span>Counter: Counter 1</span>
                            <span>Cashier: Cashier</span>
                          </div>
                          {(customForm.showTrusteeSign || customForm.showDevoteeSign) && (
                            <div className="pt-2 flex justify-between items-end text-[9px] text-stone-600">
                              <div>{customForm.showDevoteeSign ? 'Devotee Sign' : ''}</div>
                              <div className="text-right">
                                {customForm.showTrusteeSign && (
                                  <>
                                    <div className="font-semibold text-stone-800">For {templeProfile.name}</div>
                                    <div className="border-t border-stone-400 pt-0.5 mt-1">{customForm.signatoryLabel}</div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleResetToDefault(customForm.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Defaults</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null);
                        setCustomForm(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCustomization(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCustomization(true)}
                      style={{ backgroundColor: customForm.primaryColor }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer active:scale-98"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Save & Activate for POS</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Scale Receipt Preview Modal */}
          {previewModalTemplate && (
            <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-amber-200 animate-fadeIn">
                <div
                  style={{ backgroundColor: previewModalTemplate.primaryColor }}
                  className="px-4 py-3 flex items-center justify-between text-white"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{previewModalTemplate.motif.split(' ')[0]}</span>
                    <div>
                      <h3 className="font-bold text-xs leading-tight">{previewModalTemplate.name}</h3>
                      <p className="text-[10px] text-white/80">{previewModalTemplate.designStyle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewModalTemplate(null)}
                    className="p-1 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Slip content */}
                <div className="p-4 bg-stone-100 flex justify-center">
                  <div
                    style={{ borderColor: previewModalTemplate.primaryColor }}
                    className="bg-white p-4 w-76 shadow-md border-2 font-mono text-[11px] leading-tight text-stone-900 rounded-sm space-y-2"
                  >
                    <div className="text-center pb-2 border-b-2 border-dashed border-stone-300">
                      <div className="text-sm font-bold tracking-widest">{previewModalTemplate.motif}</div>
                      <div style={{ color: previewModalTemplate.primaryColor }} className="text-xs font-bold">
                        {previewModalTemplate.invocation}
                      </div>
                      <div className="font-extrabold text-xs text-stone-950 mt-1 uppercase">
                        {templeProfile.name}
                      </div>
                      <div className="text-[9px] text-stone-500">
                        {templeProfile.city || templeProfile.address || 'Karnataka'}
                      </div>
                      <div
                        style={{
                          backgroundColor: `${previewModalTemplate.primaryColor}15`,
                          color: previewModalTemplate.primaryColor,
                          borderColor: `${previewModalTemplate.primaryColor}40`,
                        }}
                        className="text-[9px] font-bold mt-1.5 py-0.5 px-2 rounded border uppercase tracking-wider inline-block"
                      >
                        OFFICIAL SEVA RECEIPT
                      </div>
                    </div>

                    <div className="py-1 border-b-2 border-dashed border-stone-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Receipt No:</span>
                        <strong className="font-mono">REC-2026-00128</strong>
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-600">
                        <span>Date & Time:</span>
                        <span>19-Sep-2026 09:30 AM</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-600">
                        <span>Devotee:</span>
                        <strong className="text-stone-950">Rajesh Sharma</strong>
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-600">
                        <span>Mobile:</span>
                        <span>9876543210</span>
                      </div>
                      {previewModalTemplate.showGothraNakshatra && (
                        <div className="flex justify-between text-[10px] text-stone-600">
                          <span>Gotra / Nakshatra:</span>
                          <span>Kashyapa | Rohini</span>
                        </div>
                      )}
                    </div>

                    <div className="py-1 border-b-2 border-dashed border-stone-300">
                      <div className="flex justify-between text-[10px] font-bold text-stone-700 pb-0.5 border-b border-stone-200">
                        <span>Particulars</span>
                        <span>Amount</span>
                      </div>
                      <div className="flex justify-between py-1 items-center">
                        <span className="font-bold text-xs">Maha Rudrabhishekam</span>
                        <span className="font-bold font-mono text-xs">₹501.00</span>
                      </div>
                    </div>

                    <div className="py-1 border-b-2 border-dashed border-stone-300">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span>TOTAL AMOUNT:</span>
                        <span style={{ color: previewModalTemplate.primaryColor }} className="text-sm font-mono">
                          ₹501.00
                        </span>
                      </div>
                      <div className="text-[9px] text-stone-600 italic">
                        (Five Hundred and One Rupees Only)
                      </div>
                    </div>

                    <div className="py-1.5 border-b-2 border-dashed border-stone-300 text-center">
                      <div className="text-[10px] font-bold text-stone-800 leading-snug">
                        {previewModalTemplate.blessingText}
                      </div>
                      {previewModalTemplate.showPrasadamNote && (
                        <div className="text-[9px] text-emerald-800 font-semibold mt-1">
                          {previewModalTemplate.prasadamNoteText}
                        </div>
                      )}
                    </div>

                    <div className="pt-1 text-center text-[9px] text-stone-500 space-y-1">
                      <div className="flex justify-between text-[9px]">
                        <span>Counter: Counter 1</span>
                        <span>Operator: Cashier</span>
                      </div>
                      {previewModalTemplate.showTrusteeSign && (
                        <div className="pt-2 flex justify-between text-[9px] text-stone-600">
                          <div>{previewModalTemplate.showDevoteeSign ? 'Devotee Sign' : ''}</div>
                          <div>{previewModalTemplate.signatoryLabel}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border-t border-stone-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const t = previewModalTemplate;
                      setPreviewModalTemplate(null);
                      handleOpenCustomize(t);
                    }}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Customize
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectTemplate(previewModalTemplate.id, previewModalTemplate.name);
                      setPreviewModalTemplate(null);
                    }}
                    style={{ backgroundColor: previewModalTemplate.primaryColor }}
                    className="w-full py-2 text-white rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 shadow-xs"
                  >
                    Apply to Counter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PAYMENT / EXPENSE SANCTION ORDER TEMPLATES                          */}
      {/* ========================================================================= */}
      {activeTab === 'PAYMENT_ORDERS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-500/10 via-slate-400/5 to-slate-100/40 rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-slate-800 text-white shadow-xs">
                  <FileText className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-stone-900">Payment Order Templates</h2>
              </div>
              <p className="text-xs text-stone-600 max-w-2xl">
                Two ready-to-use expense payout layouts for <strong>{templeProfile.name}</strong> — a formal{' '}
                <strong>Sanction &amp; Payment Order</strong> and a compact <strong>Payment Voucher</strong>. Customize
                titles, labels, accounting box, amount-in-words, signatures, colours and paper size. Every voucher you
                print uses the <strong>active</strong> template.
              </p>
            </div>
            {(() => {
              const cur = payTemplates.find((t) => t.id === activePayId) || payTemplates[0];
              return (
                <div
                  style={{ borderColor: cur.primaryColor }}
                  className="bg-white px-4 py-2.5 rounded-xl border-2 shadow-xs shrink-0"
                >
                  <div className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Active for Payouts</div>
                  <div className="text-xs font-black text-stone-900">{cur.name}</div>
                  <div style={{ color: cur.primaryColor }} className="text-[10px] font-semibold">
                    {cur.paperSize} • {cur.orderTitle}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Grid of Payment Order Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {payTemplates.map((tpl) => {
              const isActive = tpl.id === activePayId;
              return (
                <div
                  key={tpl.id}
                  style={{ borderColor: isActive ? tpl.primaryColor : undefined }}
                  className={`rounded-2xl border bg-white shadow-xs overflow-hidden flex flex-col ${
                    isActive ? 'border-2 ring-2 ring-offset-1' : 'border-stone-200'
                  }`}
                >
                  <div style={{ backgroundColor: tpl.primaryColor }} className="px-4 py-3 text-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">{tpl.name}</h3>
                      {isActive && (
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/80">{tpl.designStyle}</p>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-xs text-stone-600 mb-3">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-stone-500 mb-4">
                      <span className="px-2 py-0.5 rounded bg-stone-100 font-medium">{tpl.paperSize}</span>
                      <span className="px-2 py-0.5 rounded bg-stone-100 font-medium capitalize">{tpl.borderStyle} border</span>
                      {tpl.showAccountingBox && (
                        <span className="px-2 py-0.5 rounded bg-stone-100 font-medium">Accounting box</span>
                      )}
                      {tpl.showAmountInWords && (
                        <span className="px-2 py-0.5 rounded bg-stone-100 font-medium">Amount in words</span>
                      )}
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintPaySample(tpl)}
                        className="inline-flex items-center justify-center gap-1 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Sample
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayForm({ ...tpl })}
                        className="inline-flex items-center justify-center gap-1 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Customize
                      </button>
                      <button
                        type="button"
                        disabled={isActive}
                        onClick={() => handleSelectPayTemplate(tpl.id, tpl.name)}
                        style={{ backgroundColor: isActive ? undefined : tpl.primaryColor }}
                        className={`inline-flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg cursor-pointer ${
                          isActive ? 'bg-stone-100 text-stone-400 cursor-default' : 'text-white hover:opacity-90'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> {isActive ? 'Active' : 'Use'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Order Customize Modal */}
          {payForm && (
            <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-start justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden border border-stone-200 animate-fadeIn">
                <div style={{ backgroundColor: payForm.primaryColor }} className="px-5 py-3.5 flex items-center justify-between text-white">
                  <div>
                    <h3 className="font-bold text-sm">Customize: {payForm.name}</h3>
                    <p className="text-[11px] text-white/80">{payForm.designStyle}</p>
                  </div>
                  <button onClick={() => setPayForm(null)} className="p-1 rounded-lg hover:bg-white/20 cursor-pointer">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Header Note</label>
                      <input
                        value={payForm.headerNote}
                        onChange={(e) => setPayForm({ ...payForm, headerNote: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Order Title (Banner)</label>
                      <input
                        value={payForm.orderTitle}
                        onChange={(e) => setPayForm({ ...payForm, orderTitle: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Amount Label</label>
                      <input
                        value={payForm.amountLabel}
                        onChange={(e) => setPayForm({ ...payForm, amountLabel: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Paper Size</label>
                      <select
                        value={payForm.paperSize}
                        onChange={(e) => setPayForm({ ...payForm, paperSize: e.target.value as 'A5' | 'A4' })}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        <option value="A5">A5 (Compact)</option>
                        <option value="A4">A4 (Full Page)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Footer / Declaration Note</label>
                    <textarea
                      rows={2}
                      value={payForm.footerNote}
                      onChange={(e) => setPayForm({ ...payForm, footerNote: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Prepared / Paid By Label</label>
                      <input
                        value={payForm.preparedByLabel}
                        onChange={(e) => setPayForm({ ...payForm, preparedByLabel: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Checked / Received By Label</label>
                      <input
                        value={payForm.checkedByLabel}
                        onChange={(e) => setPayForm({ ...payForm, checkedByLabel: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Sanctioned / Approved By Label</label>
                      <input
                        value={payForm.sanctionedByLabel}
                        onChange={(e) => setPayForm({ ...payForm, sanctionedByLabel: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {([
                      ['showAccountingBox', 'Accounting Box'],
                      ['showPaymentMode', 'Payment Mode'],
                      ['showAmountInWords', 'Amount in Words'],
                      ['showPreparedBy', 'Prepared/Paid Sign'],
                      ['showCheckedBy', 'Checked/Received Sign'],
                    ] as [keyof PaymentOrderTemplateConfig, string][]).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(payForm[key])}
                          onChange={(e) => setPayForm({ ...payForm, [key]: e.target.checked })}
                          className="accent-amber-600"
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Primary Colour</label>
                      <input
                        type="color"
                        value={payForm.primaryColor}
                        onChange={(e) => setPayForm({ ...payForm, primaryColor: e.target.value })}
                        className="w-full h-9 border border-stone-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Accent Colour</label>
                      <input
                        type="color"
                        value={payForm.accentColor}
                        onChange={(e) => setPayForm({ ...payForm, accentColor: e.target.value })}
                        className="w-full h-9 border border-stone-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Border Frame</label>
                      <select
                        value={payForm.borderStyle}
                        onChange={(e) => setPayForm({ ...payForm, borderStyle: e.target.value as 'double' | 'solid' | 'boxed' })}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        <option value="double">Double Border</option>
                        <option value="solid">Solid Frame</option>
                        <option value="boxed">Boxed</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleResetPayTemplate(payForm.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
                  </button>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handlePrintPaySample(payForm)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Sample PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePayTemplate(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePayTemplate(true)}
                      style={{ backgroundColor: payForm.primaryColor }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs hover:opacity-90 cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" /> Save &amp; Activate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};