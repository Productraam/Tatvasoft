import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Building2,
  Users,
  UserPlus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  Download,
  Database,
  Phone,
  Settings,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { TempleProfile, User, UserRole } from '../types/accounting';
import { useFeedback } from '../components/ui/Feedback';

type SettingsTab = 'PROFILE' | 'STAFF_USERS' | 'BACKUP_RESTORE';

export const TempleSettingsPage: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [profile, setProfile] = useState<TempleProfile>(storageService.getTempleProfile());
  const [staffUsers, setStaffUsers] = useState<User[]>(storageService.getUsers());
  const [deviceCode, setDeviceCode] = useState<string>(storageService.getDeviceCode());

  // Toast State
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Changes saved successfully!');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffUsername, setStaffUsername] = useState<string>('');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [staffRole, setStaffRole] = useState<UserRole>('cashier');
  const [staffCounter, setStaffCounter] = useState<string>('Counter 1');
  const [staffPhone, setStaffPhone] = useState<string>('');
  const [staffActive, setStaffActive] = useState<boolean>(true);

  // Refresh settings when another view updates the active tenant.
  useEffect(() => {
    const handleUpdate = () => {
      setProfile(storageService.getTempleProfile());
      setStaffUsers(storageService.getUsers());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('temple_storage_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('temple_storage_updated', handleUpdate);
    };
  }, []);

  // Primary root trustee account
  const primaryTrustee = staffUsers.find(u => u.role === 'trustee') || {
    id: 'usr-trustee',
    name: 'Board of Trustees',
    username: 'trustee',
    role: 'trustee' as UserRole,
    counterName: 'Executive Desk',
    phone: profile.phone || '',
    isActive: true,
  };

  // -------------------------------------------------------------
  // 1. PROFILE MANAGEMENT
  // -------------------------------------------------------------
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateTempleProfile(profile);
    storageService.setDeviceCode(deviceCode);
    setDeviceCode(storageService.getDeviceCode());
    showToast('Temple profile and banking details updated successfully!');
  };

  // -------------------------------------------------------------
  // 2. STAFF & ROLES GOVERNANCE
  // -------------------------------------------------------------
  const handleOpenCreateStaff = () => {
    setEditingStaffId(null);
    setStaffName('');
    setStaffUsername('');
    setStaffPassword('');
    setStaffRole('cashier');
    setStaffCounter(`Counter ${staffUsers.filter(u => u.role === 'cashier').length + 1}`);
    setStaffPhone('');
    setStaffActive(true);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (user: User) => {
    setEditingStaffId(user.id);
    setStaffName(user.name);
    setStaffUsername(user.username || '');
    setStaffPassword(user.password || '');
    setStaffRole(user.role);
    setStaffCounter(user.counterName || 'Counter 1');
    setStaffPhone(user.phone || '');
    setStaffActive(user.isActive !== false);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffUsername.trim() || !staffPassword.trim()) {
      notify('Name, Username, and Password are required.', 'error');
      return;
    }

    const cleanUsername = staffUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const existingUser = staffUsers.find(
      u => u.username?.toLowerCase() === cleanUsername && u.id !== editingStaffId
    );
    if (existingUser) {
      notify(`Username "@${cleanUsername}" is already in use by ${existingUser.name}. Please choose another.`, 'error');
      return;
    }

    if (editingStaffId) {
      storageService.updateUser(editingStaffId, {
        name: staffName.trim(),
        username: cleanUsername,
        password: staffPassword.trim(),
        role: staffRole,
        counterName: staffCounter.trim(),
        phone: staffPhone.trim(),
        isActive: staffActive,
      });

      showToast(`Updated login credentials for "${staffName}"`);
    } else {
      const newStaffId = `usr-${Date.now().toString(36)}`;
      const newUser: User = {
        id: newStaffId,
        name: staffName.trim(),
        username: cleanUsername,
        password: staffPassword.trim(),
        role: staffRole,
        counterName: staffCounter.trim(),
        phone: staffPhone.trim(),
        isActive: staffActive,
      };
      storageService.addUser(newUser);

      showToast(`Created staff login for "${staffName}"`);
    }

    setStaffUsers(storageService.getUsers());
    setIsStaffModalOpen(false);
  };

  const handleToggleStaffActive = (user: User) => {
    if (user.role === 'trustee') {
      notify('The root Trustee account must always remain active.', 'warning');
      return;
    }
    const nextState = user.isActive === false;
    storageService.updateUser(user.id, { isActive: nextState });
    setStaffUsers(storageService.getUsers());
    showToast(`${user.name} is now ${nextState ? 'Active' : 'Deactivated'}`);
  };

  const handleDeleteStaff = async (user: User) => {
    if (user.role === 'trustee') {
      notify('The primary Trustee account cannot be deleted.', 'warning');
      return;
    }
    const ok = await confirm({
      title: 'Delete Staff Login',
      message: `Delete login credentials for ${user.name} (@${user.username})?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      storageService.deleteUser(user.id);
      setStaffUsers(storageService.getUsers());
      showToast(`Removed user ${user.name}`);
    } catch (err: any) {
      notify(err.message || 'Cannot delete user', 'error');
    }
  };

  // -------------------------------------------------------------
  // 3. CLOUD & LOCAL BACKUP
  // -------------------------------------------------------------
  const handleExportBackup = () => {
    const data = {
      profile: storageService.getTempleProfile(),
      sevas: storageService.getSevas(),
      expenseCategories: storageService.getExpenseCategories(),
      assetCategories: storageService.getAssetCategories(),
      assets: storageService.getAssets(),
      accounts: storageService.getAccounts(),
      donations: storageService.getDonations(),
      vouchers: storageService.getExpenses(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name.replace(/[^a-z0-9]/gi, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported complete temple backup archive!');
  };

  return (
    <div className="p-3 sm:p-4 lg:p-5 max-w-7xl mx-auto space-y-4 animate-fade-in text-stone-800">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER WITH TEMPLE SETTINGS TABS */}
      <PageHeader
        icon={Settings}
        title="Temple Settings"
        subtitle="Profile, staff roles & backups"
        actions={
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 self-start md:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-white text-orange-600 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Temple Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STAFF_USERS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'STAFF_USERS'
                ? 'bg-white text-purple-700 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff & Roles ({staffUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BACKUP_RESTORE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BACKUP_RESTORE'
                ? 'bg-white text-amber-700 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & Restore</span>
          </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* TAB 1: TEMPLE & TRUST LEGAL PROFILE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'PROFILE' && (
        <form
          onSubmit={handleProfileSave}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-amber-200/70 space-y-4 max-w-4xl"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5 pb-2 border-b border-amber-100">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Temple & Trust Legal Information</span>
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-stone-800 mb-1">Temple Full Legal Name *</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Presiding Deity / Sanctum</label>
              <input
                type="text"
                value={profile.deity}
                onChange={(e) => setProfile({ ...profile, deity: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Trust Name</label>
              <input
                type="text"
                value={profile.trustName}
                onChange={(e) => setProfile({ ...profile, trustName: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Trust Registration No.</label>
              <input
                type="text"
                value={profile.registrationNo}
                onChange={(e) => setProfile({ ...profile, registrationNo: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Trust PAN Number</label>
              <input
                type="text"
                value={profile.panNumber}
                onChange={(e) => setProfile({ ...profile, panNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono uppercase focus:bg-white focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-orange-900 mb-1">
                Temple UPI Payee VPA (for Instant POS Payments) *
              </label>
              <input
                type="text"
                required
                value={profile.upiVpa}
                onChange={(e) => setProfile({ ...profile, upiVpa: e.target.value })}
                placeholder="e.g. shritemple@sbi / 9845012345@ybl"
                className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-xl font-mono font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Temple Address / Street</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">City / Town</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">State & Pincode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="State"
                  className="w-2/3 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  value={profile.pincode}
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  placeholder="PIN"
                  className="w-1/3 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Official Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 border-t border-stone-200 pt-3.5">
              <label className="block font-semibold text-stone-700 mb-1">Counter / Device Code</label>
              <input
                type="text"
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                placeholder="e.g. C1"
                maxLength={4}
                className="w-40 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none font-mono tracking-wider"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Prefixed into receipt &amp; order numbers (e.g. REC-{new Date().getFullYear()}-{deviceCode || 'C1'}-00001) so numbers issued offline on different counters never collide when they sync.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Temple Trust Details</span>
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAFF USERS & TRUSTEE GOVERNANCE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'STAFF_USERS' && (
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs">
                  Trustee Staff Governance
                </span>
                <span className="text-xs text-purple-200 font-medium">
                  Configured Logins: {staffUsers.length}
                </span>
              </div>
              <h3 className="text-lg font-bold font-serif mt-1">Staff Authentication & Role Permissions</h3>
              <p className="text-xs text-purple-200 max-w-2xl mt-0.5">
                The Super Admin created the initial Trustee account. In this Trustee panel, you can provision and manage operational logins for Cashiers, Chiefs, Statutory Auditors, and Accountants.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateStaff}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-50 shadow-sm transition cursor-pointer self-start sm:self-auto shrink-0 btn-press"
            >
              <UserPlus className="w-4 h-4 text-purple-600" />
              <span>+ Create Staff Login</span>
            </button>
          </div>

          {/* Primary Trustee Account Banner */}
          {primaryTrustee && (
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                  👑
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-stone-900">{primaryTrustee.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-mono font-bold text-[11px] border border-amber-300">
                      ID: {primaryTrustee.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px] uppercase tracking-wider">
                      Root Administrator
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-600 flex-wrap">
                    <span className="flex items-center gap-1 font-mono font-bold text-purple-800">
                      <span>Username:</span> @{primaryTrustee.username || 'trustee'}
                    </span>
                    <span>·</span>
                    <span>Desk: {primaryTrustee.counterName}</span>
                    {primaryTrustee.phone && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" /> {primaryTrustee.phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => handleOpenEditStaff(primaryTrustee)}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-950 rounded-xl font-bold text-xs hover:bg-amber-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-700" />
                  <span>Edit Credentials</span>
                </button>
              </div>
            </div>
          )}

          {/* Operational Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffUsers.filter(u => u.role !== 'trustee').map((user) => (
              <div
                key={user.id}
                className={`bg-white rounded-2xl p-4.5 border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                  user.isActive !== false ? 'border-purple-200/80 hover:border-purple-300' : 'border-stone-200 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-bold text-sm flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 leading-tight">{user.name}</h4>
                        <span className="font-mono text-[11px] font-bold text-purple-700">@{user.username}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'cashier'
                          ? 'bg-amber-100 text-amber-900'
                          : user.role === 'chief'
                          ? 'bg-blue-100 text-blue-900'
                          : user.role === 'auditor'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-stone-600 bg-stone-50/70 p-2.5 rounded-xl border border-stone-200/60 font-medium">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Desk / Counter:</span>
                      <span className="font-semibold text-stone-800">{user.counterName || 'Counter 1'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Password / PIN:</span>
                      <span className="font-mono font-bold text-stone-800">••••••</span>
                    </div>
                    {user.phone && (
                      <div className="flex justify-between">
                        <span className="text-stone-400">Phone:</span>
                        <span className="text-stone-700">{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleStaffActive(user)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                      user.isActive !== false
                        ? 'text-emerald-700 hover:bg-emerald-50'
                        : 'text-stone-400 hover:bg-stone-100'
                    }`}
                  >
                    {user.isActive !== false ? '● Active' : '○ Deactivated'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditStaff(user)}
                      className="p-1.5 text-stone-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                      title="Edit Login"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(user)}
                      className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Login"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Creating / Editing Staff Login */}
          {isStaffModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex min-h-full items-center justify-center overflow-y-auto p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-purple-200 space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>{editingStaffId ? 'Edit Staff Account' : 'Provision Staff Login'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="text-stone-400 hover:text-stone-600 text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sri Ramesh Pujari"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ramesh_pujari"
                        value={staffUsername}
                        onChange={(e) => setStaffUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-purple-800 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Password / PIN *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. pass123"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Role / Authority</label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer font-bold"
                      >
                        <option value="cashier">Cashier (POS & Shift)</option>
                        <option value="chief">Chief / Manager</option>
                        <option value="auditor">Auditor (Read-Only)</option>
                        <option value="accountant">Accountant (Daybook)</option>
                        <option value="trustee">Trustee (Administrator)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Counter / Desk</label>
                      <input
                        type="text"
                        placeholder="e.g. Counter 1"
                        value={staffCounter}
                        onChange={(e) => setStaffCounter(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Phone Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div>
                      <span className="font-bold text-stone-800 block text-xs">Account Status</span>
                      <span className="text-[11px] text-stone-500">Allow this staff user to log into the temple</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={staffActive}
                      onChange={(e) => setStaffActive(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsStaffModalOpen(false)}
                      className="px-4 py-2 border border-stone-300 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm cursor-pointer btn-press"
                    >
                      {editingStaffId ? 'Update Staff Account' : 'Create Staff Login'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DATABASE BACKUP */}
      {activeTab === 'BACKUP_RESTORE' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-amber-200/70 space-y-5 max-w-4xl">
          <div className="flex items-center justify-between pb-2 border-b border-amber-100">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-orange-600" />
              <span>Database Backup & Restore</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs max-w-md">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Download className="w-4 h-4 text-orange-600" />
                <span>Export Local Backup (JSON)</span>
              </div>
              <p className="text-stone-600 text-xs">
                Creates a snapshot of all donations, general ledger entries, devotee records, sevas, and temple settings.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-white hover:bg-orange-50 border border-stone-300 hover:border-orange-400 text-stone-800 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-orange-600" />
                <span>Download Backup File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
