import {
  ReceiptTemplateConfig,
  ReceiptTemplateId,
  Account,
  AssetCategoryItem,
  AssetMovement,
  CloudConfig,
  Donation,
  Donor,
  ExpenseVoucher,
  HundiCount,
  JournalEntry,
  SevaType,
  SyncQueueItem,
  TempleAsset,
  TempleProfile,
  User,
} from '../types/accounting';
import {
  DEFAULT_ASSET_CATEGORIES,
  DEFAULT_CHART_OF_ACCOUNTS,
  DEFAULT_SEVA_TYPES,
  DEFAULT_TEMPLE_ASSETS,
  DEFAULT_TEMPLE_PROFILE,
  DEFAULT_USERS,
  DEFAULT_EVENTS,
  DEFAULT_FINANCIAL_YEARS,
} from './seedData';
import { TempleEvent, FinancialYearPeriod, BalanceSourceItem, AuditAdjustmentItem, AccountTransfer, AuditLogEntry, LedgerLine, ReconciliationState, PaymentOrderTemplateConfig, PaymentOrderTemplateId } from '../types/accounting';
import { StaffAccount } from '../types/saas';
import { INDIAN_TEMPLE_RECEIPT_TEMPLATES, DEFAULT_ACTIVE_TEMPLATE_ID } from './receiptTemplates';
import { PAYMENT_ORDER_TEMPLATES, DEFAULT_ACTIVE_PAYMENT_ORDER_ID } from './paymentOrderTemplates';

const STORAGE_KEYS = {
  TEMPLE_PROFILE: 'temple_profile_v4',
  USERS: 'temple_users_v4',
  CURRENT_USER: 'temple_current_user_v4',
  ACCOUNTS: 'temple_accounts_v4',
  SEVAS: 'temple_sevas_v6',
  EVENTS: 'temple_events_v6',
  FINANCIAL_YEARS: 'temple_financial_years_v5',
  DONORS: 'temple_donors_v5',
  DONATIONS: 'temple_donations_v5',
  EXPENSES: 'temple_expenses_v5',
  JOURNAL_ENTRIES: 'temple_journal_entries_v5',
  HUNDI_COUNTS: 'temple_hundi_counts_v5',
  TEMPLE_ASSETS: 'temple_assets_v5',
  ASSET_CATEGORIES: 'temple_asset_categories_v2',
  ASSET_MOVEMENTS: 'temple_asset_movements_v5',
  SYNC_QUEUE: 'temple_sync_queue_v4',
  AUDIT_LOG: 'temple_audit_log_v1',
  CLOUD_CONFIG: 'temple_cloud_config_v4',
  TRANSFERS: 'temple_transfers_v6',
  ACTIVE_RECEIPT_TEMPLATE: 'temple_active_receipt_template_v2',
  CUSTOMIZED_RECEIPT_TEMPLATES: 'temple_receipt_templates_custom_v3',
  ACTIVE_PAYMENT_ORDER_TEMPLATE: 'temple_active_payment_order_v1',
  CUSTOMIZED_PAYMENT_ORDER_TEMPLATES: 'temple_payment_order_custom_v1',
  RECEIPT_SEQ: 'temple_receipt_seq_v1',
  SANCTION_SEQ: 'temple_sanction_seq_v1',
  RECONCILIATIONS: 'temple_reconciliations_v1',
};

// Stable per-physical-device code (NOT tenant-scoped) so receipt numbers issued
// offline on different counters can never collide when they later sync.
const DEVICE_CODE_KEY = 'temple_device_code_v1';

const ACTIVE_TENANT_STORAGE_KEY = 'mandir_saas_active_tenant_id';
const DEFAULT_TENANT_ID = 't-101';
// Only this tenant is seeded with sample/demo data; every other tenant starts empty.
const DEMO_TENANT_ID = 't-102';
const LEGACY_STORAGE_MIGRATION_KEY = 'temple_tenant_storage_migrated_v1';

const getActiveTenantId = (): string => {
  const tenantId = globalThis.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
  return tenantId || DEFAULT_TENANT_ID;
};

const isDemoTenant = (): boolean => getActiveTenantId() === DEMO_TENANT_ID;

const getTenantStorageKey = (key: string): string => {
  return `temple_tenant_${getActiveTenantId()}_${key}`;
};

const localStorage = new Proxy(globalThis.localStorage, {
  get(target, property, receiver) {
    if (property === 'getItem') {
      return (key: string) => target.getItem(getTenantStorageKey(key));
    }
    if (property === 'setItem') {
      return (key: string, value: string) => target.setItem(getTenantStorageKey(key), value);
    }
    if (property === 'removeItem') {
      return (key: string) => target.removeItem(getTenantStorageKey(key));
    }
    return Reflect.get(target, property, receiver);
  },
});

class StorageService {
  private isInitialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized) return;

    this.migrateLegacyStorage();

    if (!localStorage.getItem(STORAGE_KEYS.TEMPLE_PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.TEMPLE_PROFILE, JSON.stringify(DEFAULT_TEMPLE_PROFILE));
    }
    const USERS_CLEAN_VER = 'v3_trustee_only';
    if (localStorage.getItem('temple_users_clean_ver') !== USERS_CLEAN_VER) {
      const existingRaw = localStorage.getItem(STORAGE_KEYS.USERS);
      let list: User[] = DEFAULT_USERS;
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          list = parsed.filter((u: any) => !['usr-1', 'usr-2', 'usr-4'].includes(u.id));
        } catch {
          list = DEFAULT_USERS;
        }
      }
      if (!list.some((u: any) => u.role === 'trustee')) {
        list.unshift(DEFAULT_USERS[0]);
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(list.find((u: any) => u.role === 'trustee') || list[0]));
      localStorage.setItem('temple_users_clean_ver', USERS_CLEAN_VER);
    }
    const ACCOUNTS_VERSION = 'v3_multiple_banks';
    if (localStorage.getItem('temple_coa_ver') !== ACCOUNTS_VERSION) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_CHART_OF_ACCOUNTS));
      localStorage.setItem('temple_coa_ver', ACCOUNTS_VERSION);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SEVAS)) {
      localStorage.setItem(STORAGE_KEYS.SEVAS, JSON.stringify(isDemoTenant() ? DEFAULT_SEVA_TYPES : []));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(isDemoTenant() ? DEFAULT_EVENTS : []));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FINANCIAL_YEARS)) {
      localStorage.setItem(STORAGE_KEYS.FINANCIAL_YEARS, JSON.stringify(DEFAULT_FINANCIAL_YEARS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSET_CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.ASSET_CATEGORIES, JSON.stringify(DEFAULT_ASSET_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLE_ASSETS)) {
      localStorage.setItem(STORAGE_KEYS.TEMPLE_ASSETS, JSON.stringify(isDemoTenant() ? DEFAULT_TEMPLE_ASSETS : []));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSET_MOVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ASSET_MOVEMENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DONORS)) {
      const initialDonors: Donor[] = isDemoTenant() ? [
        {
          id: 'dnr-1',
          firstName: 'Venkatesh',
          secondName: 'Ramanathan',
          name: 'Venkatesh Ramanathan',
          phone: '9845012345',
          village: 'Shivasamudram',
          email: 'venkat.ram@example.com',
          gotra: 'Kashyapa',
          nakshatra: 'Rohini',
          rashi: 'Vrishabha',
          totalDonated: 16001,
          lastDonationDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'dnr-2',
          firstName: 'Ananya',
          secondName: 'Deshmukh',
          name: 'Ananya Deshmukh',
          phone: '9731298765',
          village: 'Dharwad',
          gotra: 'Bharadwaja',
          nakshatra: 'Revati',
          rashi: 'Meena',
          totalDonated: 5001,
          lastDonationDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ] : [];
      localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(initialDonors));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DONATIONS)) {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES)) {
      localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HUNDI_COUNTS)) {
      localStorage.setItem(STORAGE_KEYS.HUNDI_COUNTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)) {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG)) {
      const defaultCloudConfig: CloudConfig = {
        supabaseUrl: '',
        supabaseAnonKey: '',
        isConnected: false,
        isConfigured: false,
        autoSyncEnabled: true,
      };
      localStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(defaultCloudConfig));
    }

    this.isInitialized = true;
  }

  public setTenantContext(tenantId: string, options?: { silent?: boolean }): void {
    if (!tenantId || tenantId === getActiveTenantId()) return;

    globalThis.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
    this.isInitialized = false;
    this.init();
    if (!options?.silent) this.notifyChange();
  }

  public initializeNewTenantWorkspace(tenantId: string, tenant: {
    name: string;
    deity: string;
    trustName: string;
    city: string;
    state: string;
    contactEmail: string;
    contactPhone: string;
    registrationNo?: string;
  }, staffAccounts: StaffAccount[]): void {
    const previousTenantId = getActiveTenantId();
    globalThis.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
    this.isInitialized = false;
    this.init();

    const profile = this.getTempleProfile();
    this.updateTempleProfile({
      ...profile,
      id: `temple-${tenantId}`,
      name: tenant.name,
      deity: tenant.deity,
      trustName: tenant.trustName,
      city: tenant.city,
      state: tenant.state,
      email: tenant.contactEmail,
      phone: tenant.contactPhone,
      registrationNo: tenant.registrationNo || profile.registrationNo,
    });

    const users: User[] = staffAccounts.map((staff) => ({
      id: staff.id,
      name: staff.name,
      username: staff.username || staff.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      password: staff.password || staff.pin || '',
      role: staff.role as User['role'],
      counterName: staff.counterName,
      pin: staff.pin,
      phone: staff.phone,
      email: staff.email,
      isActive: staff.isActive !== false,
      createdAt: staff.createdAt,
    }));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[0] || null));

    // Keep chart-of-accounts and financial-year structure, but remove all demo records.
    localStorage.setItem(STORAGE_KEYS.SEVAS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HUNDI_COUNTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TEMPLE_ASSETS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ASSET_MOVEMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify([]));

    globalThis.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, previousTenantId);
    this.isInitialized = false;
    this.init();
  }

  public getTenantContext(): string {
    return getActiveTenantId();
  }

  private migrateLegacyStorage(): void {
    if (getActiveTenantId() !== DEFAULT_TENANT_ID || globalThis.localStorage.getItem(LEGACY_STORAGE_MIGRATION_KEY)) {
      return;
    }

    const legacyKeys = [
      ...Object.values(STORAGE_KEYS),
      'temple_users_clean_ver',
      'temple_coa_ver',
    ];

    for (const key of legacyKeys) {
      const legacyValue = globalThis.localStorage.getItem(key);
      const scopedKey = getTenantStorageKey(key);
      if (legacyValue !== null && globalThis.localStorage.getItem(scopedKey) === null) {
        globalThis.localStorage.setItem(scopedKey, legacyValue);
      }
    }

    globalThis.localStorage.setItem(LEGACY_STORAGE_MIGRATION_KEY, 'true');
  }

  // --- Profile & User ---
  public getTempleProfile(): TempleProfile {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLE_PROFILE) || JSON.stringify(DEFAULT_TEMPLE_PROFILE));
  }

  public updateTempleProfile(profile: TempleProfile): void {
    localStorage.setItem(STORAGE_KEYS.TEMPLE_PROFILE, JSON.stringify(profile));
    this.notifyChange();
  }

  public getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let parsedList: User[] = DEFAULT_USERS;
    if (raw) {
      try {
        parsedList = JSON.parse(raw);
      } catch {
        parsedList = DEFAULT_USERS;
      }
    }
    // Clean out legacy demo accounts (usr-1, usr-2, usr-4)
    const filtered = parsedList.filter((u: any) => !['usr-1', 'usr-2', 'usr-4'].includes(u.id));
    if (!filtered.some((u: any) => u.role === 'trustee')) {
      filtered.unshift(DEFAULT_USERS[0]);
    }
    return filtered.map((u: any) => ({
      ...u,
      username: u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'user',
      password: u.password || u.pin || '1234',
      isActive: u.isActive !== false
    }));
  }

  public saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notifyChange();
  }

  public addUser(user: Omit<User, 'id'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: (user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, '')).trim().toLowerCase(),
      password: user.password || user.pin || '1234',
      isActive: user.isActive !== false,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      this.saveUsers(users);
      return users[idx];
    }
    return undefined;
  }

  public deleteUser(id: string): boolean {
    const users = this.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) return false;
    // Disallow deleting the last trustee
    const trusteeCount = users.filter(u => u.role === 'trustee' && u.id !== id).length;
    if (target.role === 'trustee' && trusteeCount === 0) {
      throw new Error('Cannot delete the primary Trustee account. At least one Trustee must exist.');
    }
    const filtered = users.filter(u => u.id !== id);
    this.saveUsers(filtered);
    return true;
  }

  public getCurrentUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return DEFAULT_USERS[0];
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS[0];
    }
  }

  public setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.notifyChange();
  }

  // --- Audit Log (immutable financial activity trail) ---
  public getAuditLogs(): AuditLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOG) || '[]');
    } catch {
      return [];
    }
  }

  public recordAudit(
    action: string,
    entityType: string,
    entityId: string,
    summary: string,
    amount?: number,
    actor?: { name: string; role: string }
  ): void {
    const who = actor || (() => {
      const u = this.getCurrentUser();
      return { name: u.name, role: u.role };
    })();

    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      tenantId: this.getTenantContext(),
      actorName: who.name,
      actorRole: who.role,
      action,
      entityType,
      entityId,
      summary,
      amount,
    };

    const logs = this.getAuditLogs();
    logs.unshift(entry);
    // Cap the local trail so localStorage cannot grow unbounded.
    const capped = logs.slice(0, 2000);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(capped));
  }

  // --- Accounts ---
  public getAccounts(): Account[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) return DEFAULT_CHART_OF_ACCOUNTS;
    try {
      const parsed = JSON.parse(raw);
      // If legacy accounts list with > 10 items or missing In-Hand Cash, reset to clean common list
      if (parsed.length > 10 || !parsed.some((a: Account) => a.name.includes('In-Hand')) || !parsed.some((a: Account) => a.id === 'acc-104')) {
        // Merge or upgrade to multi-bank accounts while preserving balances if possible
        const hasCanara = parsed.some((a: Account) => a.id === 'acc-104');
        if (!hasCanara) {
          const sbi = parsed.find((a: Account) => a.id === 'acc-103');
          if (sbi && sbi.name === 'Bank Account') {
            sbi.name = 'State Bank of India (Main Operational & UPI)';
          }
          parsed.splice(2, 0, {
            id: 'acc-104',
            code: '1025',
            name: 'Canara Bank (Corpus & Building Fund)',
            category: 'ASSET',
            subCategory: 'Cash & Bank',
            balance: 500000,
            isSystem: true,
            description: 'Dedicated bank account for temple construction, corpus donations and cheques',
          });
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(parsed));
          return parsed;
        }
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_CHART_OF_ACCOUNTS));
        return DEFAULT_CHART_OF_ACCOUNTS;
      }
      return parsed;
    } catch {
      return DEFAULT_CHART_OF_ACCOUNTS;
    }
  }

  public saveAccounts(accounts: Account[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    this.notifyChange();
  }

  // Validate a monetary amount at the boundary before it enters the ledger.
  private assertValidAmount(amount: number, label = 'Amount'): void {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error(`${label} must be a valid number.`);
    }
    if (amount <= 0) {
      throw new Error(`${label} must be greater than zero.`);
    }
  }

  // Run a multi-write mutation as an all-or-nothing unit. The affected storage
  // keys are snapshotted first; if the mutation throws, every key is restored to
  // its pre-transaction value so the ledger can never be left partially written.
  private runAtomic<T>(keys: string[], mutation: () => T): T {
    const snapshot = new Map<string, string | null>();
    for (const key of keys) {
      snapshot.set(key, localStorage.getItem(key));
    }
    try {
      return mutation();
    } catch (error) {
      for (const [key, value] of snapshot.entries()) {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      }
      throw error;
    }
  }

  public updateAccountBalance(accountId: string, delta: number, isDebit: boolean): void {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;

    const isNormalDebit = target.category === 'ASSET' || target.category === 'EXPENSE';
    if (isNormalDebit) {
      target.balance += isDebit ? delta : -delta;
    } else {
      target.balance += isDebit ? -delta : delta;
    }

    this.saveAccounts(accounts);
  }

  // Create a new ledger account. Any opening balance is posted as a proper,
  // auditable double-entry: Debit the new account, Credit "Corpus & Temple Fund"
  // (capital), so the trial balance stays balanced and the entry is traceable.
  public createAccount(data: {
    name: string;
    type: 'CASH' | 'BANK';
    openingBalance?: number;
    description?: string;
    openingBalanceEquityId?: string;
    bankName?: string;
    accountNumber?: string;
  }): Account {
    return this.runAtomic(
      [STORAGE_KEYS.ACCOUNTS, STORAGE_KEYS.JOURNAL_ENTRIES, STORAGE_KEYS.AUDIT_LOG],
      () => {
        const opening = Math.max(0, data.openingBalance || 0);
        const accounts = this.getAccounts();

        const newAcc: Account = {
          id: `acc-${Date.now()}`,
          code: data.type === 'CASH' ? 'CASH' : 'BANK',
          name: data.name.trim(),
          category: 'ASSET',
          subCategory: data.type === 'CASH' ? 'Cash in Hand' : 'Bank Accounts',
          balance: 0,
          isSystem: false,
          description:
            data.description?.trim() ||
            (data.type === 'CASH' ? 'In-Hand Cash Account' : 'Bank Account'),
          bankName: data.type === 'BANK' ? data.bankName?.trim() : undefined,
          accountNumber: data.type === 'BANK' ? data.accountNumber?.trim() : undefined,
        };
        accounts.push(newAcc);
        this.saveAccounts(accounts);

        if (opening > 0) {
          // Balancing capital account (Corpus & Temple Fund by default).
          const equityId = data.openingBalanceEquityId || 'acc-201';
          const equityAcc = this.getAccounts().find((a) => a.id === equityId);

          // Debit new asset (increase), Credit capital fund (increase).
          this.updateAccountBalance(newAcc.id, opening, true);
          this.updateAccountBalance(equityId, opening, false);

          const now = new Date();
          this.createJournalEntry({
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0],
            narration: `Opening balance for ${newAcc.name} brought into the books`,
            referenceType: 'MANUAL',
            referenceId: newAcc.id,
            createdBy: this.getCurrentUser().name,
            lines: [
              {
                id: `line-1-${Date.now()}`,
                accountId: newAcc.id,
                accountCode: newAcc.code,
                accountName: newAcc.name,
                debit: opening,
                credit: 0,
              },
              {
                id: `line-2-${Date.now()}`,
                accountId: equityId,
                accountCode: equityAcc?.code || '2010',
                accountName: equityAcc?.name || 'Corpus & Temple Fund',
                debit: 0,
                credit: opening,
              },
            ],
          });
        }

        this.recordAudit(
          'CREATE',
          'ACCOUNT',
          newAcc.id,
          `Ledger account "${newAcc.name}" created${opening > 0 ? ` with opening balance` : ''}`,
          opening > 0 ? opening : undefined
        );
        this.notifyChange();
        return newAcc;
      }
    );
  }

  // --- Seva Types ---
  public getSevas(): SevaType[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SEVAS);
    if (!raw) return DEFAULT_SEVA_TYPES;
    try {
      const parsed = JSON.parse(raw);
      const hasFestival = parsed.some((s: SevaType) => s.id === 'seva-shiva-1' || s.category === 'FESTIVAL_EVENT');
      if (!hasFestival) {
        const existingIds = new Set(parsed.map((s: SevaType) => s.id));
        const merged = [...parsed, ...DEFAULT_SEVA_TYPES.filter(s => !existingIds.has(s.id))];
        localStorage.setItem(STORAGE_KEYS.SEVAS, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return DEFAULT_SEVA_TYPES;
    }
  }

  public saveSevas(sevas: SevaType[]): void {
    localStorage.setItem(STORAGE_KEYS.SEVAS, JSON.stringify(sevas));
    this.notifyChange();
  }

  public saveSeva(sevaData: Omit<SevaType, 'id'> & { id?: string }): SevaType {
    const sevas = this.getSevas();
    let seva: SevaType;
    if (sevaData.id) {
      const idx = sevas.findIndex((s) => s.id === sevaData.id);
      if (idx >= 0) {
        sevas[idx] = { ...sevas[idx], ...sevaData };
        seva = sevas[idx];
      } else {
        seva = { ...sevaData, id: sevaData.id };
        sevas.push(seva);
      }
    } else {
      const nextCode = `SEVA-${String(sevas.length + 1).padStart(3, '0')}`;
      seva = {
        ...sevaData,
        id: `seva-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code: sevaData.code || nextCode,
        isActive: sevaData.isActive !== false,
      };
      sevas.push(seva);
    }
    this.saveSevas(sevas);
    return seva;
  }

  // --- Donors ---
  public getDonors(): Donor[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DONORS) || '[]');
  }

  public saveDonor(donorData: Omit<Donor, 'id' | 'totalDonated' | 'createdAt'> & { id?: string }): Donor {
    const donors = this.getDonors();
    let donor: Donor;
    const fullName = `${donorData.firstName} ${donorData.secondName}`.trim();

    if (donorData.id) {
      const idx = donors.findIndex((d) => d.id === donorData.id);
      if (idx >= 0) {
        donors[idx] = { ...donors[idx], ...donorData, name: fullName };
        donor = donors[idx];
      } else {
        donor = {
          ...donorData,
          name: fullName,
          id: donorData.id,
          totalDonated: 0,
          createdAt: new Date().toISOString(),
        };
        donors.push(donor);
      }
    } else {
      const existing = donors.find((d) => d.phone === donorData.phone && donorData.phone.length > 5);
      if (existing) {
        existing.firstName = donorData.firstName || existing.firstName;
        existing.secondName = donorData.secondName || existing.secondName;
        existing.name = `${existing.firstName} ${existing.secondName}`.trim();
        existing.village = donorData.village || existing.village;
        existing.gotra = donorData.gotra || existing.gotra;
        existing.nakshatra = donorData.nakshatra || existing.nakshatra;
        existing.address = donorData.address || existing.address;
        donor = existing;
      } else {
        donor = {
          ...donorData,
          name: fullName,
          id: `dnr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          totalDonated: 0,
          createdAt: new Date().toISOString(),
        };
        donors.unshift(donor);
      }
    }

    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
    this.enqueueSync('DONOR', donor.id, 'INSERT', donor);
    this.notifyChange();
    return donor;
  }

  public deleteDonor(id: string): boolean {
    const donations = this.getDonations();
    if (donations.some((donation) => donation.donorId === id)) {
      throw new Error('Donors with receipt history cannot be deleted. Edit the profile or anonymize it instead.');
    }
    const donors = this.getDonors();
    const next = donors.filter((donor) => donor.id !== id);
    if (next.length === donors.length) return false;
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(next));
    this.recordAudit('DELETE', 'DONOR', id, 'Donor profile removed');
    this.notifyChange();
    return true;
  }

  // --- Number Generators ---
  // Stable device/counter code, unique per physical device. Operators may set a
  // human-readable code (e.g. "C1") in Settings; otherwise one is auto-generated.
  public getDeviceCode(): string {
    let code = globalThis.localStorage.getItem(DEVICE_CODE_KEY);
    if (!code) {
      const rand =
        typeof crypto !== 'undefined' && crypto.getRandomValues
          ? crypto.getRandomValues(new Uint32Array(1))[0]
          : Math.floor(Math.random() * 0xffffffff);
      code = rand.toString(36).toUpperCase().slice(-3).padStart(3, 'X');
      globalThis.localStorage.setItem(DEVICE_CODE_KEY, code);
    }
    return code;
  }

  public setDeviceCode(code: string): void {
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (!clean) return;
    globalThis.localStorage.setItem(DEVICE_CODE_KEY, clean);
    this.notifyChange();
  }

  // Persisted monotonic counter. Never derived from array length, so voids/deletes
  // can never cause a number to be reused. Seeds from existing count on first use.
  private peekCounter(key: string, seed: number): number {
    const raw = localStorage.getItem(key);
    let current = raw !== null ? parseInt(raw, 10) : seed;
    if (Number.isNaN(current)) current = seed;
    return current + 1;
  }

  private consumeCounter(key: string, seed: number): number {
    const next = this.peekCounter(key, seed);
    localStorage.setItem(key, String(next));
    return next;
  }

  private formatSeqNo(prefix: string, seq: number): string {
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${this.getDeviceCode()}-${String(seq).padStart(5, '0')}`;
  }

  public getNextReceiptNo(): string {
    return this.formatSeqNo('REC', this.consumeCounter(STORAGE_KEYS.RECEIPT_SEQ, this.getDonations().length));
  }

  public peekNextReceiptNo(): string {
    return this.formatSeqNo('REC', this.peekCounter(STORAGE_KEYS.RECEIPT_SEQ, this.getDonations().length));
  }

  public getNextSanctionOrderNo(): string {
    return this.formatSeqNo('ORD', this.consumeCounter(STORAGE_KEYS.SANCTION_SEQ, this.getExpenses().length));
  }

  public peekNextSanctionOrderNo(): string {
    return this.formatSeqNo('ORD', this.peekCounter(STORAGE_KEYS.SANCTION_SEQ, this.getExpenses().length));
  }

  public getNextTransferNo(): string {
    const transfers = this.getTransfers();
    const count = transfers.length + 1;
    const year = new Date().getFullYear();
    return `TRF-${year}-${String(count).padStart(5, '0')}`;
  }

  public getNextJournalVoucherNo(): string {
    const journals = this.getJournalEntries();
    const count = journals.length + 1;
    const year = new Date().getFullYear();
    return `JRN-${year}-${String(count).padStart(5, '0')}`;
  }

  public getNextHundiBatchNo(): string {
    const hundis = this.getHundiCounts();
    const count = hundis.length + 1;
    const year = new Date().getFullYear();
    return `HND-${year}-${String(count).padStart(4, '0')}`;
  }

  public getNextAssetCode(category: TempleAsset['category']): string {
    const assets = this.getAssets().filter((a) => a.category === category);
    const count = assets.length + 1;
    const prefixes: Record<TempleAsset['category'], string> = {
      SACRED_JEWELRY: 'JWL',
      LAND_PROPERTY: 'LND',
      SANCTUM_EQUIPMENT: 'EQ',
      KITCHEN_INVENTORY: 'KIT',
      GOSHALA_CATTLE: 'COW',
    };
    return `${prefixes[category] || 'AST'}-${String(count).padStart(2, '0')}`;
  }

  // --- Unified Donations (Event-wise, Yearly Regular, Custom Name) ---
  public getDonations(): Donation[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DONATIONS) || '[]');
  }

  public markDonationSynced(id: string): void {
    const donations = this.getDonations();
    const donation = donations.find((item) => item.id === id);
    if (!donation) return;

    donation.isSynced = true;
    donation.syncStatus = 'SYNCED';
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
    this.notifyChange();
  }

  public createDonation(
    data: Omit<Donation, 'id' | 'receiptNo' | 'donorName' | 'date' | 'time' | 'isSynced' | 'syncStatus'>
  ): Donation {
    if (data.donationType === 'MONETARY') {
      this.assertValidAmount(data.amount, 'Donation amount');
    }
    const donations = this.getDonations();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const fullDonorName = `${data.donorFirstName} ${data.donorSecondName}`.trim();

    // Ensure donor is saved
    let donorId = data.donorId;
    if (data.donorFirstName && data.donorSecondName && data.donorPhone) {
      const savedDonor = this.saveDonor({
        id: data.donorId,
        firstName: data.donorFirstName,
        secondName: data.donorSecondName,
        name: fullDonorName,
        phone: data.donorPhone,
        village: data.donorVillage,
        address: data.donorAddress,
        gotra: data.donorGotra,
        nakshatra: data.donorNakshatra,
      });
      donorId = savedDonor.id;
    }

    const receiptNo = this.getNextReceiptNo();
    const donation: Donation = {
      ...data,
      donorName: fullDonorName,
      id: `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      receiptNo,
      offlineTempId: `OFFLINE-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      donorId,
      isSynced: false,
      syncStatus: 'PENDING',
      status: 'ISSUED',
    };

    donations.unshift(donation);
    return this.runAtomic(
      [
        STORAGE_KEYS.DONATIONS,
        STORAGE_KEYS.DONORS,
        STORAGE_KEYS.ACCOUNTS,
        STORAGE_KEYS.JOURNAL_ENTRIES,
        STORAGE_KEYS.TEMPLE_ASSETS,
        STORAGE_KEYS.SYNC_QUEUE,
      ],
      () => {
        localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));

    // Update Donor total
    if (donorId) {
      const donors = this.getDonors();
      const d = donors.find((x) => x.id === donorId);
      if (d) {
        d.totalDonated = (d.totalDonated || 0) + donation.amount;
        d.lastDonationDate = donation.date;
        localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
      }
    }

    // Double-Entry Ledger Posting for Monetary Donations
    if (donation.donationType === 'MONETARY') {
      const cashAccountId = donation.paymentMode === 'CASH'
        ? 'acc-101'
        : (donation.depositAccountId || 'acc-103');
      const incomeAccountId = 'acc-302';

      this.updateAccountBalance(cashAccountId, donation.amount, true);
      this.updateAccountBalance(incomeAccountId, donation.amount, false);

      const accounts = this.getAccounts();
      const debitAcc = accounts.find((a) => a.id === cashAccountId);
      const creditAcc = accounts.find((a) => a.id === incomeAccountId);

      // Save depositAccountName if not already set
      donation.depositAccountId = cashAccountId;
      donation.depositAccountName = debitAcc?.name || (donation.paymentMode === 'CASH' ? 'In-Hand Cash' : 'Bank Account');

      const streamTag =
        donation.collectionType === 'REGULAR_SEVA'
          ? `[Seva: ${donation.sevaName}]`
          : donation.collectionType === 'YEARLY_REGULAR'
          ? `[Yearly: ${donation.yearlyPeriod}]`
          : `[Custom: ${donation.customPurposeName || donation.sevaName}]`;

      this.createJournalEntry({
        date: dateStr,
        time: timeStr,
        narration: `Donation: ${streamTag} ${donation.sevaName} from ${donation.donorName} (${donation.donorVillage}) (${donation.receiptNo}) via ${donation.paymentMode}`,
        referenceType: 'DONATION',
        referenceId: donation.id,
        createdBy: donation.cashierName,
        lines: [
          {
            id: `line-1-${Date.now()}`,
            accountId: cashAccountId,
            accountCode: debitAcc?.code || '1010',
            accountName: debitAcc?.name || (donation.paymentMode === 'CASH' ? 'In-Hand Cash' : 'Bank Account'),
            debit: donation.amount,
            credit: 0,
          },
          {
            id: `line-2-${Date.now()}`,
            accountId: incomeAccountId,
            accountCode: creditAcc?.code || '3020',
            accountName: creditAcc?.name || 'Donation Income',
            debit: 0,
            credit: donation.amount,
          },
        ],
      });
    } else if (donation.donationType === 'IN_KIND' && donation.inKindDetails) {
      if (donation.inKindDetails.category === 'GOLD_SILVER') {
        this.saveAsset({
          code: this.getNextAssetCode('SACRED_JEWELRY'),
          name: donation.inKindDetails.itemDescription,
          category: 'SACRED_JEWELRY',
          metalPurity: donation.inKindDetails.metalPurity || '22K Gold / Silver',
          grossWeightGrams: donation.inKindDetails.weightGrams || 0,
          netWeightGrams: donation.inKindDetails.weightGrams || 0,
          valuation: donation.inKindDetails.estimatedValue || donation.amount,
          location: 'Strongroom Vault',
          custodyStatus: 'IN_VAULT',
          currentCustodian: 'Temple Head Priest',
          acquisitionDate: dateStr,
          sourceOfAcquisition: 'DONATION',
          donorName: donation.donorName,
          condition: 'EXCELLENT',
          notes: `In-kind offering received via Receipt #${receiptNo} from ${donation.donorName} (${donation.donorVillage})`,
        });
      }
    }

    this.enqueueSync('DONATION', donation.id, 'INSERT', donation);
    this.recordAudit(
      'CREATE',
      'DONATION',
      donation.id,
      `Donation ${donation.receiptNo} from ${donation.donorName} (${donation.sevaName})`,
      donation.amount,
      { name: donation.cashierName, role: this.getCurrentUser().role }
    );
    this.notifyChange();
    return donation;
      }
    );
  }

  public voidDonation(id: string, reason: string): Donation {
    const donations = this.getDonations();
    const donation = donations.find((item) => item.id === id);
    if (!donation) throw new Error('Donation not found');
    if (donation.status === 'VOIDED') throw new Error('Receipt is already voided');
    if (!reason.trim()) throw new Error('A void reason is required');

    return this.runAtomic(
      [STORAGE_KEYS.DONATIONS, STORAGE_KEYS.DONORS, STORAGE_KEYS.ACCOUNTS, STORAGE_KEYS.JOURNAL_ENTRIES],
      () => {
        const now = new Date();
        donation.status = 'VOIDED';
        donation.voidedAt = now.toISOString();
        donation.voidedReason = reason.trim();
        if (donation.donationType === 'MONETARY') {
          const depositId = donation.depositAccountId || (donation.paymentMode === 'CASH' ? 'acc-101' : 'acc-103');
          this.updateAccountBalance(depositId, donation.amount, false);
          this.updateAccountBalance('acc-302', donation.amount, true);
          const accounts = this.getAccounts();
          const incomeAcc = accounts.find((a) => a.id === 'acc-302');
          const depositAcc = accounts.find((a) => a.id === depositId);
          this.createJournalEntry({
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0],
            narration: `VOID ${donation.receiptNo}: ${reason.trim()}`,
            referenceType: 'DONATION',
            referenceId: donation.id,
            createdBy: this.getCurrentUser().name,
            lines: [
              { id: `void-debit-${Date.now()}`, accountId: 'acc-302', accountCode: incomeAcc?.code || '3020', accountName: incomeAcc?.name || 'Donation Income', debit: donation.amount, credit: 0 },
              { id: `void-credit-${Date.now()}`, accountId: depositId, accountCode: depositAcc?.code || '1010', accountName: depositAcc?.name || donation.depositAccountName || 'In-Hand Cash', debit: 0, credit: donation.amount },
            ],
          });
        }
        if (donation.donorId) {
          const donors = this.getDonors();
          const donor = donors.find((item) => item.id === donation.donorId);
          if (donor) {
            donor.totalDonated = Math.max(0, donor.totalDonated - donation.amount);
            localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
          }
        }
        localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
        this.recordAudit('VOID', 'DONATION', donation.id, `Voided receipt ${donation.receiptNo}: ${reason.trim()}`, donation.amount);
        this.notifyChange();
        return donation;
      }
    );
  }

  // --- Unified Expense & Sanction Order Copy ---
  public getExpenses(): ExpenseVoucher[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
  }

  public markExpenseSynced(id: string): void {
    const expenses = this.getExpenses();
    const expense = expenses.find((item) => item.id === id);
    if (!expense) return;

    expense.isSynced = true;
    expense.syncStatus = 'SYNCED';
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    this.notifyChange();
  }

  public createExpense(
    data: Omit<ExpenseVoucher, 'id' | 'voucherNo' | 'sanctionOrderNo' | 'date' | 'time' | 'isSynced' | 'syncStatus'>
  ): ExpenseVoucher {
    this.assertValidAmount(data.amount, 'Expense amount');
    const expenses = this.getExpenses();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const sanctionOrderNo = this.getNextSanctionOrderNo();
    const voucher: ExpenseVoucher = {
      ...data,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      voucherNo: sanctionOrderNo,
      sanctionOrderNo,
      date: dateStr,
      time: timeStr,
      isSynced: false,
      syncStatus: 'PENDING',
    };

    expenses.unshift(voucher);
    return this.runAtomic(
      [
        STORAGE_KEYS.EXPENSES,
        STORAGE_KEYS.ACCOUNTS,
        STORAGE_KEYS.JOURNAL_ENTRIES,
        STORAGE_KEYS.SYNC_QUEUE,
      ],
      () => {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    this.updateAccountBalance(voucher.debitAccountId, voucher.amount, true);
    this.updateAccountBalance(voucher.creditAccountId, voucher.amount, false);

    const accounts = this.getAccounts();
    const debitAcc = accounts.find((a) => a.id === voucher.debitAccountId);
    const creditAcc = accounts.find((a) => a.id === voucher.creditAccountId);

    this.createJournalEntry({
      date: dateStr,
      time: timeStr,
      narration: `Expense Sanction Order: ${voucher.purpose} to ${voucher.payeeName} (${voucher.sanctionOrderNo})`,
      referenceType: 'EXPENSE',
      referenceId: voucher.id,
      createdBy: voucher.sanctionedBy,
      lines: [
        {
          id: `line-1-${Date.now()}`,
          accountId: voucher.debitAccountId,
          accountCode: debitAcc?.code || '4010',
          accountName: debitAcc?.name || voucher.debitAccountName,
          debit: voucher.amount,
          credit: 0,
        },
        {
          id: `line-2-${Date.now()}`,
          accountId: voucher.creditAccountId,
          accountCode: creditAcc?.code || '1010',
          accountName: creditAcc?.name || voucher.creditAccountName,
          debit: 0,
          credit: voucher.amount,
        },
      ],
    });

    this.enqueueSync('EXPENSE', voucher.id, 'INSERT', voucher);
    this.recordAudit(
      'CREATE',
      'EXPENSE',
      voucher.id,
      `Expense ${voucher.sanctionOrderNo}: ${voucher.purpose} to ${voucher.payeeName}`,
      voucher.amount,
      { name: voucher.sanctionedBy, role: this.getCurrentUser().role }
    );
    this.notifyChange();
    return voucher;
      }
    );
  }

  public voidExpense(id: string, reason: string): ExpenseVoucher {
    const expenses = this.getExpenses();
    const expense = expenses.find((item) => item.id === id);
    if (!expense) throw new Error('Expense not found');
    if (expense.status === 'VOIDED') throw new Error('Expense is already voided');
    if (!reason.trim()) throw new Error('A void reason is required');

    return this.runAtomic(
      [STORAGE_KEYS.EXPENSES, STORAGE_KEYS.ACCOUNTS, STORAGE_KEYS.JOURNAL_ENTRIES],
      () => {
        const now = new Date();
        expense.status = 'VOIDED';
        expense.voidedAt = now.toISOString();
        expense.voidedReason = reason.trim();
        this.updateAccountBalance(expense.debitAccountId, expense.amount, false);
        this.updateAccountBalance(expense.creditAccountId, expense.amount, true);
        this.createJournalEntry({
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0],
          narration: `VOID ${expense.sanctionOrderNo}: ${reason.trim()}`,
          referenceType: 'EXPENSE',
          referenceId: expense.id,
          createdBy: this.getCurrentUser().name,
          lines: [
            { id: `void-debit-${Date.now()}`, accountId: expense.creditAccountId, accountCode: '1010', accountName: expense.creditAccountName, debit: expense.amount, credit: 0 },
            { id: `void-credit-${Date.now()}`, accountId: expense.debitAccountId, accountCode: '4010', accountName: expense.debitAccountName, debit: 0, credit: expense.amount },
          ],
        });
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
        this.recordAudit('VOID', 'EXPENSE', expense.id, `Voided expense ${expense.sanctionOrderNo}: ${reason.trim()}`, expense.amount);
        this.notifyChange();
        return expense;
      }
    );
  }

  // --- Seva Catalog Management ---
  public deleteSeva(id: string): boolean {
    const sevas = this.getSevas();
    const updated = sevas.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SEVAS, JSON.stringify(updated));
    this.notifyChange();
    return true;
  }

  public toggleSevaActive(id: string): boolean {
    const sevas = this.getSevas();
    const target = sevas.find(s => s.id === id);
    if (!target) return false;
    target.isActive = target.isActive === false ? true : false;
    localStorage.setItem(STORAGE_KEYS.SEVAS, JSON.stringify(sevas));
    this.notifyChange();
    return target.isActive;
  }

  // --- Expense Categories Management ---
  public getExpenseCategories(): Account[] {
    const accounts = this.getAccounts();
    return accounts.filter(a => a.category === 'EXPENSE');
  }

  public saveExpenseCategory(categoryData: {
    id?: string;
    code?: string;
    name: string;
    nameHindi?: string;
    description?: string;
    subCategory?: string;
    isActive?: boolean;
  }): Account {
    const accounts = this.getAccounts();
    let account: Account;

    if (categoryData.id) {
      const idx = accounts.findIndex(a => a.id === categoryData.id);
      if (idx >= 0) {
        accounts[idx] = {
          ...accounts[idx],
          ...categoryData,
          category: 'EXPENSE',
          name: categoryData.name.trim(),
          subCategory: categoryData.subCategory || accounts[idx].subCategory || 'General Expense',
          isActive: categoryData.isActive !== false,
        };
        account = accounts[idx];
      } else {
        account = {
          id: categoryData.id,
          code: categoryData.code || `40${accounts.filter(a => a.category === 'EXPENSE').length + 1}0`,
          name: categoryData.name.trim(),
          nameHindi: categoryData.nameHindi,
          description: categoryData.description,
          category: 'EXPENSE',
          subCategory: categoryData.subCategory || 'General Expense',
          balance: 0,
          isSystem: false,
          isActive: categoryData.isActive !== false,
        };
        accounts.push(account);
      }
    } else {
      account = {
        id: `acc-exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code: categoryData.code || `40${accounts.filter(a => a.category === 'EXPENSE').length + 1}0`,
        name: categoryData.name.trim(),
        nameHindi: categoryData.nameHindi,
        description: categoryData.description,
        category: 'EXPENSE',
        subCategory: categoryData.subCategory || 'General Expense',
        balance: 0,
        isSystem: false,
        isActive: categoryData.isActive !== false,
      };
      accounts.push(account);
    }

    this.saveAccounts(accounts);
    return account;
  }

  public toggleExpenseCategoryActive(id: string): boolean {
    const accounts = this.getAccounts();
    const target = accounts.find(a => a.id === id);
    if (!target) return false;
    target.isActive = target.isActive === false ? true : false;
    this.saveAccounts(accounts);
    return target.isActive;
  }

  public deleteExpenseCategory(id: string): boolean {
    const accounts = this.getAccounts();
    const target = accounts.find(a => a.id === id);
    if (!target) return false;
    if (target.isSystem) {
      throw new Error('System standard expense accounts cannot be deleted. You can deactivate them instead.');
    }
    const updated = accounts.filter(a => a.id !== id);
    this.saveAccounts(updated);
    return true;
  }

  // --- Asset Categories Management ---
  public getAssetCategories(): AssetCategoryItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSET_CATEGORIES);
    if (!raw) return DEFAULT_ASSET_CATEGORIES;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_ASSET_CATEGORIES;
    }
  }

  public saveAssetCategory(categoryData: Omit<AssetCategoryItem, 'id' | 'code'> & { id?: string; code?: string }): AssetCategoryItem {
    const categories = this.getAssetCategories();
    let cat: AssetCategoryItem;

    if (categoryData.id) {
      const idx = categories.findIndex(c => c.id === categoryData.id);
      const existing = idx >= 0 ? categories[idx] : undefined;
      const cleanCode = categoryData.code || existing?.code || categoryData.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 20);
      if (idx >= 0) {
        categories[idx] = {
          ...categories[idx],
          ...categoryData,
          code: cleanCode,
          isActive: categoryData.isActive !== false,
        };
        cat = categories[idx];
      } else {
        cat = {
          ...categoryData,
          id: categoryData.id,
          code: cleanCode,
          isActive: categoryData.isActive !== false,
        };
        categories.push(cat);
      }
    } else {
      const cleanCode = categoryData.code
        ? categoryData.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '')
        : categoryData.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 20);

      cat = {
        ...categoryData,
        id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code: cleanCode,
        isActive: categoryData.isActive !== false,
        isSystem: false,
      };
      categories.push(cat);
    }

    localStorage.setItem(STORAGE_KEYS.ASSET_CATEGORIES, JSON.stringify(categories));
    this.notifyChange();
    return cat;
  }

  public toggleAssetCategoryActive(id: string): boolean {
    const categories = this.getAssetCategories();
    const target = categories.find(c => c.id === id);
    if (!target) return false;
    target.isActive = target.isActive === false ? true : false;
    localStorage.setItem(STORAGE_KEYS.ASSET_CATEGORIES, JSON.stringify(categories));
    this.notifyChange();
    return target.isActive;
  }

  public deleteAssetCategory(id: string): boolean {
    const categories = this.getAssetCategories();
    const target = categories.find(c => c.id === id);
    if (!target) return false;
    if (target.isSystem) {
      throw new Error('Primary sacred asset categories cannot be deleted. You can deactivate them instead.');
    }
    const updated = categories.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.ASSET_CATEGORIES, JSON.stringify(updated));
    this.notifyChange();
    return true;
  }

  // --- Asset Management ---
  public getAssets(): TempleAsset[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLE_ASSETS) || JSON.stringify(DEFAULT_TEMPLE_ASSETS));
  }

  public saveAsset(assetData: Omit<TempleAsset, 'id' | 'isSynced'> & { id?: string }): TempleAsset {
    const assets = this.getAssets();
    let asset: TempleAsset;

    if (assetData.id) {
      const idx = assets.findIndex((a) => a.id === assetData.id);
      if (idx >= 0) {
        assets[idx] = { ...assets[idx], ...assetData, isSynced: false };
        asset = assets[idx];
      } else {
        asset = { ...assetData, id: assetData.id, isSynced: false };
        assets.push(asset);
      }
    } else {
      asset = {
        ...assetData,
        id: `ast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        isSynced: false,
      };
      assets.unshift(asset);
    }

    localStorage.setItem(STORAGE_KEYS.TEMPLE_ASSETS, JSON.stringify(assets));
    this.enqueueSync('ASSET', asset.id, 'INSERT', asset);
    this.notifyChange();
    return asset;
  }

  public deleteAsset(id: string): boolean {
    const movements = this.getAssetMovements();
    if (movements.some((movement) => movement.assetId === id && movement.status === 'CHECKED_OUT')) {
      throw new Error('Asset cannot be deleted while it is checked out. Return it to custody first.');
    }
    const assets = this.getAssets();
    const next = assets.filter((asset) => asset.id !== id);
    if (next.length === assets.length) return false;
    localStorage.setItem(STORAGE_KEYS.TEMPLE_ASSETS, JSON.stringify(next));
    this.enqueueSync('ASSET', id, 'DELETE', { id });
    this.recordAudit('DELETE', 'ASSET', id, 'Temple asset removed');
    this.notifyChange();
    return true;
  }

  public getAssetMovements(): AssetMovement[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSET_MOVEMENTS) || '[]');
  }

  public createAssetMovement(
    data: Omit<AssetMovement, 'id' | 'movementDate' | 'movementTime' | 'status'>
  ): AssetMovement {
    const movements = this.getAssetMovements();
    const now = new Date();
    const movement: AssetMovement = {
      ...data,
      id: `mov-${Date.now()}`,
      movementDate: now.toISOString().split('T')[0],
      movementTime: now.toTimeString().split(' ')[0],
      status: 'CHECKED_OUT',
    };

    movements.unshift(movement);
    localStorage.setItem(STORAGE_KEYS.ASSET_MOVEMENTS, JSON.stringify(movements));

    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === data.assetId);
    if (asset) {
      asset.custodyStatus = 'IN_SANCTUM';
      asset.location = data.toLocation;
      asset.currentCustodian = data.issuedTo;
      localStorage.setItem(STORAGE_KEYS.TEMPLE_ASSETS, JSON.stringify(assets));
    }

    this.enqueueSync('ASSET_MOVEMENT', movement.id, 'INSERT', movement);
    this.notifyChange();
    return movement;
  }

  public returnAssetMovement(movementId: string, returnedVerifiedBy: string): void {
    const movements = this.getAssetMovements();
    const movement = movements.find((m) => m.id === movementId);
    if (!movement) return;

    movement.status = 'RETURNED_SAFE';
    movement.returnedDate = new Date().toISOString().split('T')[0];
    movement.returnedVerifiedBy = returnedVerifiedBy;
    localStorage.setItem(STORAGE_KEYS.ASSET_MOVEMENTS, JSON.stringify(movements));

    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === movement.assetId);
    if (asset) {
      asset.custodyStatus = 'IN_VAULT';
      asset.location = movement.fromLocation;
      asset.currentCustodian = returnedVerifiedBy;
      localStorage.setItem(STORAGE_KEYS.TEMPLE_ASSETS, JSON.stringify(assets));
    }

    this.notifyChange();
  }

  // --- Journal Entries ---
  public getJournalEntries(): JournalEntry[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES) || '[]');
  }

  public createJournalEntry(data: Omit<JournalEntry, 'id' | 'voucherNo' | 'isSynced'>): JournalEntry {
    // A journal entry must balance: total debits equal total credits.
    const totalDebit = data.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    if (Math.round((totalDebit - totalCredit) * 100) !== 0) {
      throw new Error(
        `Unbalanced journal entry: debit (${totalDebit}) does not equal credit (${totalCredit}).`
      );
    }
    const journals = this.getJournalEntries();
    const voucherNo = this.getNextJournalVoucherNo();

    const entry: JournalEntry = {
      ...data,
      id: `jrn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      voucherNo,
      isSynced: false,
    };

    journals.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(journals));
    this.enqueueSync('JOURNAL_ENTRY', entry.id, 'INSERT', entry);
    this.notifyChange();
    return entry;
  }

  // --- Hundi / Danpatra Collections ---
  public getHundiCounts(): HundiCount[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HUNDI_COUNTS) || '[]');
  }

  public saveHundiCount(data: Omit<HundiCount, 'id' | 'batchNo' | 'isPosted' | 'isSynced' | 'createdAt'>): HundiCount {
    this.assertValidAmount(data.totalAmount, 'Hundi collection amount');
    const hundis = this.getHundiCounts();
    const batchNo = this.getNextHundiBatchNo();

    const count: HundiCount = {
      ...data,
      id: `hnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      batchNo,
      isPosted: true,
      isSynced: false,
      createdAt: new Date().toISOString(),
    };

    hundis.unshift(count);
    return this.runAtomic(
      [
        STORAGE_KEYS.HUNDI_COUNTS,
        STORAGE_KEYS.ACCOUNTS,
        STORAGE_KEYS.JOURNAL_ENTRIES,
        STORAGE_KEYS.SYNC_QUEUE,
      ],
      () => {
        localStorage.setItem(STORAGE_KEYS.HUNDI_COUNTS, JSON.stringify(hundis));

    const depositAccountId = count.depositToAccountId || 'acc-101';
    const hundiIncomeAccountId = 'acc-301';

    this.updateAccountBalance(depositAccountId, count.totalAmount, true);
    this.updateAccountBalance(hundiIncomeAccountId, count.totalAmount, false);

    const accounts = this.getAccounts();
    const debitAcc = accounts.find((a) => a.id === depositAccountId);
    const creditAcc = accounts.find((a) => a.id === hundiIncomeAccountId);

    const now = new Date();
    this.createJournalEntry({
      date: count.unsealDate,
      time: now.toTimeString().split(' ')[0],
      narration: `Hundi Unsealing Collection: ${count.hundiName} (${count.batchNo}) - Witnesses: ${count.witnesses.join(', ')}`,
      referenceType: 'HUNDI',
      referenceId: count.id,
      createdBy: count.witnesses[0] || 'Trustee',
      lines: [
        {
          id: `line-1-${Date.now()}`,
          accountId: depositAccountId,
          accountCode: debitAcc?.code || '1010',
          accountName: debitAcc?.name || 'Cash in Hand',
          debit: count.totalAmount,
          credit: 0,
        },
        {
          id: `line-2-${Date.now()}`,
          accountId: hundiIncomeAccountId,
          accountCode: creditAcc?.code || '3010',
          accountName: creditAcc?.name || 'Hundi Danpatra Income',
          debit: 0,
          credit: count.totalAmount,
        },
      ],
    });

    this.enqueueSync('HUNDI', count.id, 'INSERT', count);
    this.recordAudit(
      'CREATE',
      'HUNDI',
      count.id,
      `Hundi ${count.batchNo}: ${count.hundiName} unsealed`,
      count.totalAmount,
      { name: count.witnesses[0] || 'Trustee', role: this.getCurrentUser().role }
    );
    this.notifyChange();
    return count;
      }
    );
  }

  // --- Sync Queue ---
  public getSyncQueue(): SyncQueueItem[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE) || '[]');
  }

  public saveSyncQueue(queue: SyncQueueItem[]): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    this.notifyChange();
  }

  public enqueueSync(
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    action: SyncQueueItem['action'],
    payload: any
  ): void {
    const queue = this.getSyncQueue();
    queue.push({
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      entityId,
      action,
      payload: { ...payload, tenantId: this.getTenantContext() },
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    });
    this.saveSyncQueue(queue);

    if (typeof window !== 'undefined') {
      import('./syncEngine').then(({ syncEngine }) => {
        void syncEngine.syncNow();
      }).catch(() => undefined);
    }
  }

  // --- Cloud Configuration ---
  public getCloudConfig(): CloudConfig {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG) ||
        JSON.stringify({
          supabaseUrl: '',
          supabaseAnonKey: '',
          isConnected: false,
          isConfigured: false,
          autoSyncEnabled: true,
        })
    );
  }

  public saveCloudConfig(config: CloudConfig): void {
    localStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(config));
    this.notifyChange();
  }

  // --- Full Backup & Restore ---
  public exportFullBackupJSON(): string {
    const backup = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      templeProfile: this.getTempleProfile(),
      users: this.getUsers(),
      accounts: this.getAccounts(),
      sevas: this.getSevas(),
      donors: this.getDonors(),
      donations: this.getDonations(),
      expenses: this.getExpenses(),
      journalEntries: this.getJournalEntries(),
      hundiCounts: this.getHundiCounts(),
      templeAssets: this.getAssets(),
      assetCategories: this.getAssetCategories(),
      assetMovements: this.getAssetMovements(),
      transfers: this.getTransfers(),
      activeReceiptTemplateId: this.getActiveReceiptTemplateId(),
      customizedReceiptTemplates: this.getCustomizedTemplatesMap(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public restoreFullBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.templeProfile) localStorage.setItem(STORAGE_KEYS.TEMPLE_PROFILE, JSON.stringify(data.templeProfile));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.accounts) localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data.accounts));
      if (data.sevas) localStorage.setItem(STORAGE_KEYS.SEVAS, JSON.stringify(data.sevas));
      if (data.donors) localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(data.donors));
      if (data.donations) localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(data.donations));
      if (data.expenses) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
      if (data.journalEntries) localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(data.journalEntries));
      if (data.hundiCounts) localStorage.setItem(STORAGE_KEYS.HUNDI_COUNTS, JSON.stringify(data.hundiCounts));
      if (data.templeAssets) localStorage.setItem(STORAGE_KEYS.TEMPLE_ASSETS, JSON.stringify(data.templeAssets));
      if (data.assetCategories) localStorage.setItem(STORAGE_KEYS.ASSET_CATEGORIES, JSON.stringify(data.assetCategories));
      if (data.assetMovements) localStorage.setItem(STORAGE_KEYS.ASSET_MOVEMENTS, JSON.stringify(data.assetMovements));
      if (data.transfers) localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(data.transfers));
      if (data.activeReceiptTemplateId) localStorage.setItem(STORAGE_KEYS.ACTIVE_RECEIPT_TEMPLATE, data.activeReceiptTemplateId);
      if (data.customizedReceiptTemplates) localStorage.setItem(STORAGE_KEYS.CUSTOMIZED_RECEIPT_TEMPLATES, JSON.stringify(data.customizedReceiptTemplates));
      this.notifyChange();
      return true;
    } catch (e) {
      console.error('Failed to restore backup', e);
      return false;
    }
  }

  private notifyChange() {
    window.dispatchEvent(new CustomEvent('temple_storage_updated'));
  }
  // --- Account Transfers (In-Hand Cash ⇄ Bank) ---
  public getTransfers(): AccountTransfer[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS) || '[]');
  }

  // --- Bank Reconciliation ---
  // Unified book ledger lines for a single money account (donations in, expenses
  // out, transfers both ways, hundi deposits). Used by the reconciliation view.
  public getBankLedgerLines(accountId: string): LedgerLine[] {
    const account = this.getAccounts().find((a) => a.id === accountId);
    if (!account) return [];
    const nameLower = account.name.toLowerCase();
    const isCash = accountId === 'acc-101' || nameLower.includes('cash') || nameLower.includes('in-hand');
    const isBankMain = accountId === 'acc-103' || nameLower.includes('bank');
    const lines: LedgerLine[] = [];

    this.getDonations().forEach((d) => {
      if (d.status === 'VOIDED' || d.donationType !== 'MONETARY' || !(d.amount > 0)) return;
      const matches = d.depositAccountId
        ? d.depositAccountId === accountId
        : (isCash && d.paymentMode === 'CASH') ||
          (isBankMain && d.paymentMode !== 'CASH' && d.paymentMode !== 'IN_KIND');
      if (!matches) return;
      lines.push({
        id: d.id,
        date: d.date,
        refNo: d.receiptNo,
        description: `Donation • ${d.sevaName} • ${d.donorName}`,
        credited: d.amount,
        deducted: 0,
      });
    });

    this.getExpenses().forEach((e) => {
      if (e.status === 'VOIDED') return;
      const matches =
        e.creditAccountId === accountId ||
        (isCash && e.paymentMode === 'CASH' && !e.creditAccountId) ||
        (isBankMain && e.paymentMode !== 'CASH' && !e.creditAccountId);
      if (!matches) return;
      lines.push({
        id: e.id,
        date: e.date,
        refNo: e.sanctionOrderNo || e.voucherNo,
        description: `Expense • ${e.purpose} • ${e.payeeName}`,
        credited: 0,
        deducted: e.amount,
      });
    });

    this.getTransfers().forEach((t) => {
      if (t.fromAccountId === accountId) {
        lines.push({
          id: `out-${t.id}`,
          date: t.date,
          refNo: t.transferNo,
          description: `Transfer to ${t.toAccountName}${t.referenceNo ? ' • ' + t.referenceNo : ''}`,
          credited: 0,
          deducted: t.amount,
        });
      }
      if (t.toAccountId === accountId) {
        lines.push({
          id: `in-${t.id}`,
          date: t.date,
          refNo: t.transferNo,
          description: `Transfer from ${t.fromAccountName}${t.referenceNo ? ' • ' + t.referenceNo : ''}`,
          credited: t.amount,
          deducted: 0,
        });
      }
    });

    this.getHundiCounts().forEach((h) => {
      const dep = h.depositToAccountId || 'acc-101';
      if (dep !== accountId || !(h.totalAmount > 0)) return;
      lines.push({
        id: h.id,
        date: h.unsealDate,
        refNo: h.batchNo,
        description: `Hundi Collection • ${h.hundiName || 'Danpatra'}`,
        credited: h.totalAmount,
        deducted: 0,
      });
    });

    return lines.sort((a, b) => a.date.localeCompare(b.date));
  }

  private getAllReconciliations(): Record<string, ReconciliationState> {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECONCILIATIONS) || '{}');
    } catch {
      return {};
    }
  }

  public getReconciliation(accountId: string): ReconciliationState {
    const all = this.getAllReconciliations();
    return (
      all[accountId] || {
        accountId,
        clearedLineIds: [],
        statementLines: [],
        lastUpdated: new Date().toISOString(),
      }
    );
  }

  public saveReconciliation(state: ReconciliationState): void {
    const all = this.getAllReconciliations();
    all[state.accountId] = { ...state, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(all));
    this.notifyChange();
  }

  public createTransfer(
    data: Omit<AccountTransfer, 'id' | 'transferNo' | 'date' | 'time' | 'isSynced'>
  ): AccountTransfer {
    this.assertValidAmount(data.amount, 'Transfer amount');
    if (data.fromAccountId === data.toAccountId) {
      throw new Error('Source and destination accounts must be different.');
    }
    const transfers = this.getTransfers();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const transferNo = this.getNextTransferNo();
    const transfer: AccountTransfer = {
      ...data,
      id: `trf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transferNo,
      date: dateStr,
      time: timeStr,
      isSynced: false,
    };

    // Deduct from source account
    return this.runAtomic(
      [
        STORAGE_KEYS.TRANSFERS,
        STORAGE_KEYS.ACCOUNTS,
        STORAGE_KEYS.JOURNAL_ENTRIES,
        STORAGE_KEYS.SYNC_QUEUE,
      ],
      () => {
        this.updateAccountBalance(data.fromAccountId, data.amount, false);
    // Credit to destination account
    this.updateAccountBalance(data.toAccountId, data.amount, true);

    const accounts = this.getAccounts();
    const fromAcc = accounts.find((a) => a.id === data.fromAccountId);
    const toAcc = accounts.find((a) => a.id === data.toAccountId);

    this.createJournalEntry({
      date: dateStr,
      time: timeStr,
      narration: `Fund Transfer: Moved ₹${data.amount.toLocaleString('en-IN')} from ${data.fromAccountName} to ${data.toAccountName} (${data.referenceNo ? 'Ref: ' + data.referenceNo + ' ' : ''})by ${data.handledBy}`,
      referenceType: 'TRANSFER',
      referenceId: transfer.id,
      createdBy: data.handledBy,
      lines: [
        {
          id: `line-1-${Date.now()}`,
          accountId: data.toAccountId,
          accountCode: toAcc?.code || 'BANK',
          accountName: data.toAccountName,
          debit: data.amount,
          credit: 0,
        },
        {
          id: `line-2-${Date.now()}`,
          accountId: data.fromAccountId,
          accountCode: fromAcc?.code || 'CASH',
          accountName: data.fromAccountName,
          debit: 0,
          credit: data.amount,
        },
      ],
    });

    transfers.unshift(transfer);
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
    this.recordAudit(
      'CREATE',
      'TRANSFER',
      transfer.id,
      `Transfer ${transfer.transferNo}: ${data.fromAccountName} → ${data.toAccountName}`,
      data.amount,
      { name: data.handledBy, role: this.getCurrentUser().role }
    );
    this.notifyChange();
    return transfer;
      }
    );
  }

  // --- Events & Festivals ---
  public getEvents(): TempleEvent[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || JSON.stringify(DEFAULT_EVENTS));
  }

  public getEvent(id: string): TempleEvent | undefined {
    return this.getEvents().find((e) => e.id === id);
  }

  public saveEvents(events: TempleEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    window.dispatchEvent(new Event('temple_storage_updated'));
  }

  public saveEvent(eventData: Omit<TempleEvent, 'id' | 'totalCollected' | 'totalSpent'> & { id?: string }): TempleEvent {
    const events = this.getEvents();
    let event: TempleEvent;
    if (eventData.id) {
      const idx = events.findIndex((e) => e.id === eventData.id);
      if (idx >= 0) {
        events[idx] = { ...events[idx], ...eventData };
        event = events[idx];
      } else {
        event = { ...eventData, id: eventData.id, totalCollected: 0, totalSpent: 0 };
        events.push(event);
      }
    } else {
      event = {
        ...eventData,
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        totalCollected: 0,
        totalSpent: 0,
      };
      events.push(event);
    }
    this.saveEvents(events);
    return event;
  }

  public updateEventTotals(eventId: string, collectedDelta: number, spentDelta: number): void {
    const events = this.getEvents();
    const evt = events.find((e) => e.id === eventId);
    if (evt) {
      evt.totalCollected = Math.max(0, (evt.totalCollected || 0) + collectedDelta);
      evt.totalSpent = Math.max(0, (evt.totalSpent || 0) + spentDelta);
      this.saveEvents(events);
    }
  }

  // --- Financial Years & Opening Balances ---
  public getFinancialYears(): FinancialYearPeriod[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCIAL_YEARS) || JSON.stringify(DEFAULT_FINANCIAL_YEARS));
  }

  public saveFinancialYears(years: FinancialYearPeriod[]): void {
    localStorage.setItem(STORAGE_KEYS.FINANCIAL_YEARS, JSON.stringify(years));
    window.dispatchEvent(new Event('temple_storage_updated'));
  }

  public getCurrentFinancialYear(): FinancialYearPeriod {
    const years = this.getFinancialYears();
    return years.find((y) => y.isCurrent) || years[1] || years[0];
  }

  public updateOpeningBalances(yearId: string, sources: BalanceSourceItem[]): FinancialYearPeriod {
    const years = this.getFinancialYears();
    const yr = years.find((y) => y.id === yearId);
    if (!yr) throw new Error('Financial year not found');
    yr.openingBalances = sources;
    this.saveFinancialYears(years);
    return yr;
  }

  public addOpeningBalanceSource(yearId: string, source: Omit<BalanceSourceItem, 'id'>): FinancialYearPeriod {
    const years = this.getFinancialYears();
    const yr = years.find((y) => y.id === yearId);
    if (!yr) throw new Error('Financial year not found');
    const newSource: BalanceSourceItem = {
      ...source,
      id: `src-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    yr.openingBalances = [...(yr.openingBalances || []), newSource];
    this.saveFinancialYears(years);
    return yr;
  }

  public certifyAndLockFinancialYear(
    yearId: string,
    auditData: {
      auditorName: string;
      registrationNo: string;
      notes?: string;
      closingBalances: BalanceSourceItem[];
      auditAdjustments?: AuditAdjustmentItem[];
    }
  ): { certifiedYear: FinancialYearPeriod; nextYear: FinancialYearPeriod } {
    const years = this.getFinancialYears();
    const currentYearIndex = years.findIndex((y) => y.id === yearId);
    if (currentYearIndex < 0) throw new Error('Year not found');

    const currentYear = years[currentYearIndex];
    currentYear.isAuditLocked = true;
    currentYear.isCurrent = false;
    currentYear.auditedDate = new Date().toISOString().split('T')[0];
    currentYear.auditorName = auditData.auditorName;
    currentYear.auditorRegistrationNo = auditData.registrationNo;
    currentYear.notes = auditData.notes || currentYear.notes;
    currentYear.closingBalances = auditData.closingBalances;
    currentYear.auditAdjustments = auditData.auditAdjustments || [];

    // Auto-rollover: closing balances become opening balances for next year!
    const nextStartYear = parseInt(currentYear.label.split('-')[0]) + 1;
    const nextEndYear = nextStartYear + 1;
    const nextYearLabel = `${nextStartYear}-${nextEndYear}`;

    let nextYear = years.find((y) => y.label === nextYearLabel);
    const rolledOverOpeningBalances: BalanceSourceItem[] = auditData.closingBalances.map((cb) => ({
      id: `src-roll-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: cb.type,
      sourceName: cb.sourceName,
      accountNumber: cb.accountNumber,
      bankName: cb.bankName,
      openingAmount: cb.auditedAmount !== undefined ? cb.auditedAmount : (cb.closingAmount || cb.openingAmount),
      notes: `Auto-rolled over from audited closing balance of FY ${currentYear.label}`,
    }));

    if (nextYear) {
      nextYear.isCurrent = true;
      nextYear.openingBalances = rolledOverOpeningBalances;
    } else {
      nextYear = {
        id: `fy-${nextStartYear}-${String(nextEndYear).slice(-2)}`,
        label: nextYearLabel,
        startDate: `${nextStartYear}-04-01`,
        endDate: `${nextEndYear}-03-31`,
        isCurrent: true,
        isAuditLocked: false,
        notes: `Automatically initialized from certified audit rollover of FY ${currentYear.label}`,
        openingBalances: rolledOverOpeningBalances,
      };
      years.push(nextYear);
    }

    this.saveFinancialYears(years);
    return { certifiedYear: currentYear, nextYear };
  }


  // --- Receipt Templates Governance ---
  private getCustomizedTemplatesMap(): Record<string, Partial<ReceiptTemplateConfig>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMIZED_RECEIPT_TEMPLATES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public getActiveReceiptTemplateId(): ReceiptTemplateId {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_RECEIPT_TEMPLATE);
    if (raw && INDIAN_TEMPLE_RECEIPT_TEMPLATES.some(t => t.id === raw)) {
      return raw as ReceiptTemplateId;
    }
    return DEFAULT_ACTIVE_TEMPLATE_ID;
  }

  public setActiveReceiptTemplateId(id: ReceiptTemplateId): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_RECEIPT_TEMPLATE, id);
    this.notifyChange();
  }

  public getReceiptTemplate(id: ReceiptTemplateId): ReceiptTemplateConfig {
    const base = INDIAN_TEMPLE_RECEIPT_TEMPLATES.find(t => t.id === id) || INDIAN_TEMPLE_RECEIPT_TEMPLATES[0];
    const customMap = this.getCustomizedTemplatesMap();
    if (customMap[id]) {
      return { ...base, ...customMap[id] };
    }
    return { ...base };
  }

  public saveReceiptTemplate(config: ReceiptTemplateConfig): void {
    const customMap = this.getCustomizedTemplatesMap();
    customMap[config.id] = config;
    localStorage.setItem(STORAGE_KEYS.CUSTOMIZED_RECEIPT_TEMPLATES, JSON.stringify(customMap));
    this.notifyChange();
  }

  public resetReceiptTemplate(id: ReceiptTemplateId): void {
    const customMap = this.getCustomizedTemplatesMap();
    delete customMap[id];
    localStorage.setItem(STORAGE_KEYS.CUSTOMIZED_RECEIPT_TEMPLATES, JSON.stringify(customMap));
    this.notifyChange();
  }

  public getActiveReceiptTemplate(): ReceiptTemplateConfig {
    const id = this.getActiveReceiptTemplateId();
    return this.getReceiptTemplate(id);
  }

  public getAllReceiptTemplates(): ReceiptTemplateConfig[] {
    const customMap = this.getCustomizedTemplatesMap();
    return INDIAN_TEMPLE_RECEIPT_TEMPLATES.map(base => {
      if (customMap[base.id]) {
        return { ...base, ...customMap[base.id] };
      }
      return { ...base };
    });
  }

  // --- Payment / Expense Sanction Order Templates ---
  private getCustomizedPaymentOrderMap(): Record<string, Partial<PaymentOrderTemplateConfig>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMIZED_PAYMENT_ORDER_TEMPLATES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public getActivePaymentOrderTemplateId(): PaymentOrderTemplateId {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_PAYMENT_ORDER_TEMPLATE);
    if (raw && PAYMENT_ORDER_TEMPLATES.some(t => t.id === raw)) {
      return raw as PaymentOrderTemplateId;
    }
    return DEFAULT_ACTIVE_PAYMENT_ORDER_ID;
  }

  public setActivePaymentOrderTemplateId(id: PaymentOrderTemplateId): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PAYMENT_ORDER_TEMPLATE, id);
    this.notifyChange();
  }

  public getPaymentOrderTemplate(id: PaymentOrderTemplateId): PaymentOrderTemplateConfig {
    const base = PAYMENT_ORDER_TEMPLATES.find(t => t.id === id) || PAYMENT_ORDER_TEMPLATES[0];
    const customMap = this.getCustomizedPaymentOrderMap();
    if (customMap[id]) {
      return { ...base, ...customMap[id] };
    }
    return { ...base };
  }

  public savePaymentOrderTemplate(config: PaymentOrderTemplateConfig): void {
    const customMap = this.getCustomizedPaymentOrderMap();
    customMap[config.id] = config;
    localStorage.setItem(STORAGE_KEYS.CUSTOMIZED_PAYMENT_ORDER_TEMPLATES, JSON.stringify(customMap));
    this.notifyChange();
  }

  public resetPaymentOrderTemplate(id: PaymentOrderTemplateId): void {
    const customMap = this.getCustomizedPaymentOrderMap();
    delete customMap[id];
    localStorage.setItem(STORAGE_KEYS.CUSTOMIZED_PAYMENT_ORDER_TEMPLATES, JSON.stringify(customMap));
    this.notifyChange();
  }

  public getActivePaymentOrderTemplate(): PaymentOrderTemplateConfig {
    return this.getPaymentOrderTemplate(this.getActivePaymentOrderTemplateId());
  }

  public getAllPaymentOrderTemplates(): PaymentOrderTemplateConfig[] {
    const customMap = this.getCustomizedPaymentOrderMap();
    return PAYMENT_ORDER_TEMPLATES.map(base => {
      if (customMap[base.id]) {
        return { ...base, ...customMap[base.id] };
      }
      return { ...base };
    });
  }

}


export const storageService = new StorageService();
