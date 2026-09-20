import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Crown, 
  Building2, 
  Search, 
  Plus, 
  ExternalLink, 
  Filter, 
  X,
  MapPin,
  Mail,
  Phone,
  Globe,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Edit2,
  Trash2,
  MoreHorizontal,
  Activity,
  AlertTriangle,
  Users,
  ArrowUpRight
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { storageService } from '../../services/storageService';
import { Tenant, StaffAccount } from '../../types/saas';
import { useRouter } from '../../router/Router';

export const TenantsDirectoryPage: React.FC = () => {
  const { navigate } = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>(saasService.getTenants());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit Subdomain / Staff modal
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState<Tenant | null>(null);
  const [editSubdomain, setEditSubdomain] = useState('');
  const [editStaff, setEditStaff] = useState<StaffAccount[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State for new tenant onboarding
  const [formName, setFormName] = useState('');
  const [formSubdomain, setFormSubdomain] = useState('');
  const [formDeity, setFormDeity] = useState('');
  const [formTrust, setFormTrust] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('Karnataka');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPlan, setFormPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [formRegNo, setFormRegNo] = useState('');
  const [form80GNo, setForm80GNo] = useState('');
  const [formTrusteeName, setFormTrusteeName] = useState('Dr. K. V. Sharma (Trustee)');
  const [formTrusteeUsername, setFormTrusteeUsername] = useState('trustee');
  const [formTrusteePassword, setFormTrusteePassword] = useState('');
  const [formTrusteePhone, setFormTrusteePhone] = useState('');

  // Auto-generate subdomain from temple name if not manually modified
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!formSubdomain || formSubdomain === formName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)) {
      setFormSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12));
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.deity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subdomain && t.subdomain.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.trustName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = selectedPlanFilter === 'ALL' || t.planId === selectedPlanFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const tenantStats = {
    total: tenants.length,
    active: tenants.filter((tenant) => tenant.status === 'ACTIVE').length,
    trial: tenants.filter((tenant) => tenant.status === 'TRIAL').length,
    suspended: tenants.filter((tenant) => tenant.status === 'SUSPENDED').length,
    gmv: tenants.reduce((total, tenant) => total + (tenant.totalDonationGmv || 0), 0)
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

  const getPlanLabel = (planId: Tenant['planId']) => ({
    starter: 'Starter',
    pro: 'Professional',
    enterprise: 'Enterprise'
  }[planId]);

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const sub = (formSubdomain || formName).toLowerCase().replace(/[^a-z0-9-]/g, '');

    const newTenant = saasService.addTenant({
      name: formName,
      subdomain: sub,
      deity: formDeity,
      trustName: formTrust,
      city: formCity,
      state: formState,
      contactEmail: formEmail,
      contactPhone: formPhone,
      planId: formPlan,
      registrationNo: formRegNo || `TR-${new Date().getFullYear()}-001`,
      tax80GNo: form80GNo || 'APPLIED',
      staffAccounts: [
        {
          id: `usr-trustee-${Date.now()}`,
          name: formTrusteeName.trim() || 'Chief Trustee',
          username: formTrusteeUsername.trim().toLowerCase() || 'trustee',
          password: formTrusteePassword.trim(),
          role: 'trustee',
          counterName: 'Trustee Board',
          pin: formTrusteePassword.trim() || '3456',
          phone: formTrusteePhone.trim() || formPhone.trim(),
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ]
    });

    storageService.initializeNewTenantWorkspace(newTenant.id, newTenant, newTenant.staffAccounts || []);

    setTenants(saasService.getTenants());
    setIsModalOpen(false);
    showToast(`Successfully provisioned ${newTenant.name} at subdomain http://${sub}.localhost:5173/`);

    setFormName('');
    setFormSubdomain('');
    setFormDeity('');
    setFormTrust('');
    setFormCity('');
    setFormEmail('');
    setFormPhone('');
    setFormRegNo('');
    setForm80GNo('');
    setFormTrusteeName('Dr. K. V. Sharma (Trustee)');
    setFormTrusteeUsername('trustee');
    setFormTrusteePassword('');
    setFormTrusteePhone('');
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    saasService.updateTenant(id, { status: nextStatus as any });
    setTenants(saasService.getTenants());
    showToast(`Tenant status updated to ${nextStatus}`);
  };

  const handleDeleteTenant = (tenant: Tenant) => {
    if (tenant.status === 'ACTIVE') {
      showToast('Suspend the tenant before deprovisioning it.');
      return;
    }
    if (!window.confirm(`Deprovision ${tenant.name}? This removes the platform tenant record.`)) return;
    saasService.deleteTenant(tenant.id);
    setTenants(saasService.getTenants());
    showToast(`Deprovisioned ${tenant.name}`);
  };

  const handleLoginAsTemple = (tenant: Tenant) => {
    saasService.setActiveTenant(tenant.id);
    sessionStorage.setItem('ghost_impersonating_name', tenant.name);
    window.location.href = saasService.getSubdomainUrl(tenant.subdomain || tenant.slug);
  };

  const handleOpenEditModal = (tenant: Tenant) => {
    setSelectedTenantForEdit(tenant);
    setEditSubdomain(tenant.subdomain || tenant.slug);
    const trustee = (tenant.staffAccounts || []).find((s) => s.role === 'trustee') || {
      id: `usr-trustee-${tenant.id}`,
      name: `${tenant.trustName} Trustee`,
      username: `trustee_${(tenant.subdomain || tenant.slug).replace(/[^a-z0-9]/g, '')}`,
      password: 'trustee123',
      role: 'trustee',
      counterName: 'Trustee Board',
      pin: '3456',
      isActive: true,
      phone: tenant.contactPhone
    };
    setEditStaff(tenant.staffAccounts && tenant.staffAccounts.length > 0 ? [...tenant.staffAccounts] : [trustee]);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForEdit) return;

    const cleanSub = editSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    saasService.updateTenant(selectedTenantForEdit.id, {
      subdomain: cleanSub,
      staffAccounts: editStaff
    });

    setTenants(saasService.getTenants());
    setSelectedTenantForEdit(null);
    showToast(`Updated subdomain and staff credentials for ${selectedTenantForEdit.name}`);
  };

  const handleStaffPinChange = (index: number, newPin: string) => {
    const copy = [...editStaff];
    copy[index] = { ...copy[index], pin: newPin };
    setEditStaff(copy);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-700 mb-2">
            <Activity className="w-3.5 h-3.5" /> Platform operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-700" /> Tenant directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor temple workspaces, subscriptions, access, and operational readiness from one place.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20 flex items-center gap-2 self-start btn-press"
        >
          <Plus className="w-4 h-4" /> Add tenant
        </button>
      </div>

      {/* Operational summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total tenants', value: tenantStats.total, tone: 'text-slate-900', icon: Building2 },
          { label: 'Active', value: tenantStats.active, tone: 'text-emerald-700', icon: CheckCircle2 },
          { label: 'Trial', value: tenantStats.trial, tone: 'text-amber-700', icon: Activity },
          { label: 'Suspended', value: tenantStats.suspended, tone: 'text-rose-700', icon: AlertTriangle },
          { label: 'Donation GMV', value: formatCurrency(tenantStats.gmv), tone: 'text-slate-900', icon: ArrowUpRight }
        ].map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <div key={metric.label} className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400">
                <span>{metric.label}</span>
                <MetricIcon className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className={`mt-2 text-xl font-bold ${metric.tone}`}>{metric.value}</div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by temple name, subdomain (e.g. sidhodlur), deity, trust, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap px-1">
            <Filter className="w-3.5 h-3.5 text-emerald-700" /> Filters
          </div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            value={selectedPlanFilter}
            onChange={(e) => setSelectedPlanFilter(e.target.value)}
            aria-label="Filter by plan"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All SaaS Tiers</option>
            <option value="enterprise">Mahasamsthanam Enterprise</option>
            <option value="pro">Trust Professional</option>
            <option value="starter">Mandir Starter</option>
          </select>
        </div>
      </div>

      {/* Tenant operations table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">All tenants</h2>
            <p className="text-xs text-slate-500 mt-0.5">{filteredTenants.length} of {tenants.length} workspaces visible</p>
          </div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Operational view</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr className="text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-bold">Tenant</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Plan</th>
                <th className="px-4 py-3 font-bold">Owner & location</th>
                <th className="px-4 py-3 font-bold">Activity</th>
                <th className="px-4 py-3 font-bold">GMV</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((t) => {
          const subUrl = `http://${t.subdomain || t.slug}.localhost:5173/`;
                  const trustee = (t.staffAccounts || []).find((staff) => staff.role === 'trustee') || t.staffAccounts?.[0];
                  const statusStyles = t.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : t.status === 'TRIAL'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';
          return (
            <tr
              key={t.id}
              className="hover:bg-emerald-50/30 transition-colors"
            >
              <td className="px-5 py-4"><div className="flex items-center gap-3 min-w-[250px]"><div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">{t.name.charAt(0)}</div><div className="min-w-0"><div className="font-bold text-slate-900 truncate">{t.name}</div><a href={subUrl} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-emerald-700 hover:underline flex items-center gap-1 truncate">{t.subdomain || t.slug}<ExternalLink className="w-3 h-3 shrink-0" /></a><div className="text-[10px] text-slate-400 truncate">{t.deity}</div></div></div></td>
              <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${statusStyles}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{t.status}</span></td>
              <td className="px-4 py-4"><span className="text-xs font-bold text-slate-700">{getPlanLabel(t.planId)}</span><div className="text-[10px] text-slate-400 uppercase mt-0.5">{t.planId}</div></td>
              <td className="px-4 py-4"><div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Users className="w-3.5 h-3.5 text-amber-600" />{trustee?.name || 'Trustee not assigned'}</div><div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1"><MapPin className="w-3.5 h-3.5" />{t.city}, {t.state}</div></td>
              <td className="px-4 py-4"><div className="text-xs font-bold text-slate-800">{t.activeCounters} counters online</div><div className="text-[11px] text-slate-500 mt-1">{t.staffAccounts?.length || 0} staff accounts</div></td>
              <td className="px-4 py-4"><div className="text-xs font-bold text-slate-800">{formatCurrency(t.totalDonationGmv || 0)}</div><div className="text-[10px] text-slate-400 uppercase mt-1">lifetime GMV</div></td>
              <td className="px-5 py-4"><div className="flex justify-end items-center gap-1"><button onClick={() => handleOpenEditModal(t)} title="Manage tenant" aria-label={`Manage ${t.name}`} className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><a href={subUrl} target="_blank" rel="noreferrer" title="Open tenant login" aria-label={`Open ${t.name} login`} className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"><ExternalLink className="w-4 h-4" /></a><button onClick={() => handleToggleStatus(t.id, t.status)} title={t.status === 'ACTIVE' ? 'Suspend tenant' : 'Reactivate tenant'} aria-label={t.status === 'ACTIVE' ? `Suspend ${t.name}` : `Reactivate ${t.name}`} className={`p-2 rounded-lg ${t.status === 'ACTIVE' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}`}><ShieldCheck className="w-4 h-4" /></button><button onClick={() => handleLoginAsTemple(t)} title="Open support session" aria-label={`Open support session for ${t.name}`} className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"><Lock className="w-4 h-4" /></button><button onClick={() => handleDeleteTenant(t)} title={t.status === 'ACTIVE' ? 'Suspend tenant before deprovisioning' : 'Deprovision tenant'} aria-label={`Deprovision ${t.name}`} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button><MoreHorizontal className="w-4 h-4 text-slate-300 ml-1" /></div></td>
            </tr>
          );
                })}
            </tbody>
          </table>
          {filteredTenants.length === 0 && <div className="px-6 py-14 text-center"><Search className="w-8 h-8 text-slate-300 mx-auto" /><p className="text-sm font-semibold text-slate-700 mt-3">No tenants match these filters</p><p className="text-xs text-slate-500 mt-1">Try clearing the search or changing the status and plan.</p></div>}
        </div>
      </div>

      {/* Onboard New Temple Modal with Subdomain Definition */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex min-h-full items-start justify-center overflow-y-auto p-4 sm:py-8 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Onboard New Temple Trust</h2>
                <p className="text-xs text-slate-500">Define custom subdomain URL and initial trust parameters</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Temple Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shri Siddeswar Temple, Hodalur"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Presiding Deity *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LORD SHIVA"
                    value={formDeity}
                    onChange={(e) => setFormDeity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Subdomain Definition Field */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1.5">
                <label className="font-bold text-purple-900 block">
                  Define Temple Subdomain (Dedicated Portal URL) *
                </label>
                <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-purple-200">
                  <span className="text-slate-400 font-mono text-xs pl-2">http://</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sidhodlur"
                    value={formSubdomain}
                    onChange={(e) => setFormSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 py-1 px-1 font-mono font-bold text-purple-700 focus:outline-none text-xs"
                  />
                  <span className="text-slate-400 font-mono text-xs pr-2">.localhost:5173/</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Direct login URL for temple staff: <strong className="text-purple-700 font-mono">http://{formSubdomain || 'temple'}.localhost:5173/</strong>
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Legal Trust Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shri Siddeswar Devasthanam Charitable Trust"
                  value={formTrust}
                  onChange={(e) => setFormTrust(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City / Taluk *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hodalur"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Trust Registration No</label>
                  <input
                    type="text"
                    placeholder="e.g. TR-2018-8849"
                    value={formRegNo}
                    onChange={(e) => setFormRegNo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Section 80G Certificate No</label>
                  <input
                    type="text"
                    placeholder="e.g. AAATL9948PF20214"
                    value={form80GNo}
                    onChange={(e) => setForm80GNo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Admin Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="accounts@shrisiddeswar.org"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select SaaS Subscription Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'starter', name: 'Starter', price: '₹1,499/mo' },
                    { id: 'pro', name: 'Professional', price: '₹4,999/mo' },
                    { id: 'enterprise', name: 'Enterprise', price: '₹14,999/mo' }
                  ].map((tier) => (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => setFormPlan(tier.id as any)}
                      className={`p-3 rounded-xl border text-left font-semibold transition ${
                        formPlan === tier.id
                          ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{tier.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{tier.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Temple Trustee Login (Super Admin provisions exactly 1 Trustee) */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                    🏛️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950">Initial Temple Trustee Account</h4>
                    <p className="text-[11px] text-amber-800">
                      Super Admin creates the single primary Trustee login. The Trustee will then log in and create Cashier, Chief, Auditor, and Accountant logins.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 text-xs">Trustee Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. K. V. Sharma (Trustee)"
                      value={formTrusteeName}
                      onChange={(e) => setFormTrusteeName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 text-xs">Trustee Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. trustee"
                      value={formTrusteeUsername}
                      onChange={(e) => setFormTrusteeUsername(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 text-xs">Trustee Password *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. trustee123"
                      value={formTrusteePassword}
                      onChange={(e) => setFormTrusteePassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 btn-press cursor-pointer"
                >
                  Provision Temple & Subdomain
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Subdomain & Staff PINs Modal */}
      {selectedTenantForEdit && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex min-h-full items-start justify-center overflow-y-auto p-4 sm:py-8 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Manage Subdomain & Trustee Credentials</h2>
                <p className="text-xs text-slate-500">{selectedTenantForEdit.name}</p>
              </div>
              <button 
                onClick={() => setSelectedTenantForEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              {/* Subdomain edit */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1.5">
                <label className="font-bold text-purple-900 block">Subdomain Prefix</label>
                <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-purple-200">
                  <span className="text-slate-400 font-mono text-xs pl-2">http://</span>
                  <input
                    type="text"
                    required
                    value={editSubdomain}
                    onChange={(e) => setEditSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 py-1 px-1 font-mono font-bold text-purple-700 focus:outline-none text-xs"
                  />
                  <span className="text-slate-400 font-mono text-xs pr-2">.localhost:5173/</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Live link: <a href={`http://${editSubdomain || 'temple'}.localhost:5173/`} target="_blank" rel="noreferrer" className="text-purple-700 font-mono font-bold hover:underline">
                    http://{editSubdomain || 'temple'}.localhost:5173/
                  </a>
                </div>
              </div>

              {/* Staff PINs edit */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <KeyRound className="w-4 h-4 text-orange-600" />
                  <span>Authorized Staff Accounts & PINs</span>
                </div>
                <div className="space-y-2">
                  {editStaff.map((staff, idx) => (
                    <div key={staff.id} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <div className="font-bold text-slate-900">{staff.name}</div>
                        <div className="text-[10px] uppercase font-bold text-orange-700">{staff.role} · {staff.counterName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">PIN:</span>
                        <input
                          type="text"
                          maxLength={6}
                          value={staff.pin}
                          onChange={(e) => handleStaffPinChange(idx, e.target.value)}
                          className="w-16 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForEdit(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 btn-press cursor-pointer"
                >
                  Save Subdomain & Credentials
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
