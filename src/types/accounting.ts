export type UserRole = 'cashier' | 'accountant' | 'trustee' | 'admin' | 'auditor' | 'chief';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  actorName: string;
  actorRole: UserRole | string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  amount?: number;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  password?: string;
  role: UserRole;
  counterName: string;
  pin?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface TempleProfile {
  id: string;
  name: string;
  deity: string;
  trustName: string;
  registrationNo: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  upiVpa: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
}

export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export interface Account {
  id: string;
  code: string;
  name: string;
  nameHindi?: string;
  category: AccountCategory;
  subCategory: string;
  balance: number;
  isSystem: boolean;
  description?: string;
  isActive?: boolean;
  bankName?: string;
  accountNumber?: string;
}

export interface Donor {
  id: string;
  firstName: string;
  secondName: string;
  name: string;
  phone: string;
  village: string;
  email?: string;
  address?: string;
  pan?: string;
  gotra?: string;
  nakshatra?: string;
  rashi?: string;
  totalDonated: number;
  lastDonationDate?: string;
  createdAt: string;
}

export type CollectionCategoryType = 'REGULAR_SEVA' | 'YEARLY_REGULAR' | 'CUSTOM_NAME';

export interface SevaType {
  id: string;
  code: string;
  name: string;
  nameHindi?: string;
  startDate?: string;
  endDate?: string;
  category: 'DAILY_SEVA' | 'FESTIVAL_EVENT' | 'SPECIAL_POOJA' | 'ANNADANAM' | 'BUILDING_FUND' | 'HUNDI_DANAM' | 'IN_KIND';
  defaultAmount?: number;
  deity?: string;
  description?: string;
  isActive: boolean;
  budgetEstimated?: number;
  periodLabel?: string;
  isSpecialEvent?: boolean;
  eventId?: string;
  eventName?: string;
}

export type PaymentMode = 'CASH' | 'UPI' | 'CHEQUE' | 'BANK_TRANSFER' | 'CARD' | 'IN_KIND';

export type InKindCategory = 'GOLD_SILVER' | 'PROVISIONS_GROCERY' | 'VASTRA_SAREE' | 'VESSEL_UTENSIL' | 'OTHER';

export interface InKindDetail {
  category: InKindCategory;
  itemDescription: string;
  quantity: string;
  unit?: string;
  estimatedValue?: number;
  metalPurity?: string;
  weightGrams?: number;
}

// Unified Single Donation Model
export interface Donation {
  id: string;
  receiptNo: string;
  offlineTempId?: string;
  date: string;
  time: string;
  
  // Devotee Details (First Name, Second Name, Mobile & Village Mandatory; Gotra & Nakshatra Optional)
  donorId?: string;
  donorFirstName: string;
  donorSecondName: string;
  donorName: string;
  donorPhone: string;
  donorVillage: string;
  donorGotra?: string;
  donorNakshatra?: string;
  donorAddress?: string;

  // Donation Stream Classification (No Event based)
  eventId?: string;
  eventName?: string;
  collectionType: CollectionCategoryType;
  yearlyPeriod?: string; // e.g. "Yearly Collection 2026-27"
  customPurposeName?: string; // Custom purpose name

  donationType: 'MONETARY' | 'IN_KIND';
  sevaTypeId: string;
  sevaName: string;
  amount: number;
  paymentMode: PaymentMode;
  depositAccountId?: string;
  depositAccountName?: string;
  transactionRef?: string;
  inKindDetails?: InKindDetail;
  cashierId: string;
  cashierName: string;
  counterName: string;
  notes?: string;
  isSynced: boolean;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  status?: 'ISSUED' | 'VOIDED';
  voidedAt?: string;
  voidedReason?: string;
}

export interface ExpenseVoucher {
  id: string;
  voucherNo: string;
  sanctionOrderNo: string;
  date: string;
  time: string;
  debitAccountId: string;
  debitAccountName: string;
  creditAccountId: string;
  creditAccountName: string;
  payeeName: string;
  sevaTypeId?: string;
  sevaName?: string;
  eventId?: string;
  eventName?: string;
  purpose: string;
  category: string;
  amount: number;
  paymentMode: PaymentMode;
  refNo?: string;
  sanctionedBy: string;
  status: 'SANCTIONED' | 'PAID' | 'VOIDED';
  voidedAt?: string;
  voidedReason?: string;
  billAttachment?: string;
  notes?: string;
  isSynced: boolean;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  voucherNo: string;
  date: string;
  time: string;
  narration: string;
  referenceType?: 'DONATION' | 'EXPENSE' | 'HUNDI' | 'ASSET' | 'MANUAL' | 'TRANSFER';
  referenceId?: string;
  lines: JournalLine[];
  createdBy: string;
  isSynced: boolean;
}

export interface HundiDenominations {
  note500: number;
  note200: number;
  note100: number;
  note50: number;
  note20: number;
  note10: number;
  coins: number;
}

export interface HundiCount {
  id: string;
  batchNo: string;
  unsealDate: string;
  hundiName: string;
  denominations: HundiDenominations;
  totalAmount: number;
  witnesses: string[];
  depositToAccountId: string;
  isPosted: boolean;
  notes?: string;
  isSynced: boolean;
  createdAt: string;
}

export interface AssetCategoryItem {
  id: string;
  code: string;
  name: string;
  nameHindi?: string;
  description?: string;
  icon: string;
  isActive: boolean;
  isSystem?: boolean;
}

export type AssetCategory =
  | 'SACRED_JEWELRY'
  | 'LAND_PROPERTY'
  | 'SANCTUM_EQUIPMENT'
  | 'KITCHEN_INVENTORY'
  | 'GOSHALA_CATTLE'
  | string;

export type CustodyStatus = 'IN_VAULT' | 'IN_SANCTUM' | 'IN_TRANSIT' | 'ACTIVE_USE' | 'UNDER_REPAIR';

export interface TempleAsset {
  id: string;
  code: string;
  name: string;
  nameHindi?: string;
  category: AssetCategory;
  assignedDeity?: string;
  metalPurity?: string;
  grossWeightGrams?: number;
  netWeightGrams?: number;
  surveyNo?: string;
  areaDescription?: string;
  locationAddress?: string;
  tenantName?: string;
  monthlyRentAmount?: number;
  valuation: number;
  location: string;
  custodyStatus: CustodyStatus;
  currentCustodian: string;
  acquisitionDate: string;
  sourceOfAcquisition: 'DONATION' | 'TEMPLE_PURCHASE' | 'ANCIENT_HERITAGE';
  donorName?: string;
  photoUrl?: string;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_POLISHING' | 'MAINTENANCE';
  notes?: string;
  isSynced: boolean;
}

export interface AssetMovement {
  id: string;
  assetId: string;
  assetName: string;
  movementDate: string;
  movementTime: string;
  fromLocation: string;
  toLocation: string;
  purpose: string;
  issuedTo: string;
  authorizedBy: string;
  returnedDate?: string;
  returnedVerifiedBy?: string;
  status: 'CHECKED_OUT' | 'RETURNED_SAFE';
}

export interface SyncQueueItem {
  id: string;
  entityType: 'DONATION' | 'EXPENSE' | 'JOURNAL_ENTRY' | 'HUNDI' | 'DONOR' | 'ASSET' | 'ASSET_MOVEMENT';
  entityId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';
  retryCount: number;
  errorMessage?: string;
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  isConfigured: boolean;
  lastSyncedAt?: string;
  autoSyncEnabled: boolean;
}


export interface TempleEvent {
  id: string;
  code: string;
  name: string;
  financialYear: string; // e.g. "2025-2026"
  startDate: string;
  endDate: string;
  description?: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  budgetEstimated?: number;
  totalCollected: number;
  totalSpent: number;
  isDefault?: boolean;
}

export interface BalanceSourceItem {
  id: string;
  type: 'CASH' | 'BANK' | 'FIXED_DEPOSIT' | 'OTHER';
  sourceName: string;
  accountNumber?: string;
  bankName?: string;
  openingAmount: number;
  closingAmount?: number;
  auditedAmount?: number;
  notes?: string;
}

export interface AuditAdjustmentItem {
  id: string;
  description: string;
  sourceId: string;
  sourceName: string;
  type: 'ADD' | 'SUBTRACT';
  amount: number;
}

export interface FinancialYearPeriod {
  id: string;
  label: string; // e.g. "2024-2025", "2025-2026", "2026-2027"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isAuditLocked: boolean;
  auditedDate?: string;
  auditorName?: string;
  auditorRegistrationNo?: string;
  openingBalances: BalanceSourceItem[];
  closingBalances?: BalanceSourceItem[];
  auditAdjustments?: AuditAdjustmentItem[];
  notes?: string;
}

export interface AccountTransfer {
  id: string;
  transferNo: string; // e.g. "TRF-2026-00001"
  date: string;
  time: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  transferType: 'CASH_DEPOSIT' | 'CASH_WITHDRAWAL' | 'INTERNAL_TRANSFER';
  referenceNo?: string; // Challan #, Cheque #, UTR #, ATM slip
  handledBy: string; // Staff / Cashier / Priest who handled cash/bank
  authorizedBy: string; // Trustee / Secretary sign-off
  purpose: string;
  notes?: string;
  isSynced: boolean;
}

// --- Bank Reconciliation ---
export interface LedgerLine {
  id: string;
  date: string;
  refNo: string;
  description: string;
  credited: number; // money into the account (deposit)
  deducted: number; // money out of the account (withdrawal)
}

export interface BankStatementLine {
  id: string;
  date: string;
  description: string;
  amount: number; // signed: positive = credit/deposit, negative = debit/withdrawal
  matchedLineId?: string;
}

export interface ReconciliationState {
  accountId: string;
  statementClosingBalance?: number;
  statementDate?: string;
  clearedLineIds: string[];
  statementLines: BankStatementLine[];
  lastUpdated: string;
}


// --- 11 Distinct Indian Temple Receipt Layout Designs ---
export type ReceiptTemplateId =
  | 'temple-a5-official'
  | 'thermal-80mm-slip';

export interface ReceiptTemplateConfig {
  id: ReceiptTemplateId;
  name: string;
  designStyle: string;
  description: string;
  // Trustee-configurable text & info
  invocation: string;
  subInvocation: string;
  blessingText: string;
  show80GNotice: boolean;
  taxExemptionText: string;
  showPrasadamNote: boolean;
  prasadamNoteText: string;
  signatoryLabel: string;
  showTrusteeSign: boolean;
  showDevoteeSign: boolean;
  showGothraNakshatra: boolean;
  showQrCode: boolean;
  // Visual styling & Layout
  primaryColor: string;
  secondaryColor: string;
  accentBg: string;
  borderStyle: 'double' | 'dashed' | 'solid' | 'boxed' | 'ornate';
  paperWidth: 'A5' | '80mm' | '58mm';
  motif: string;
}

// --- Payment / Expense Sanction Order Templates ---
export type PaymentOrderTemplateId = 'a5-sanction-order' | 'a5-payment-voucher';

export interface PaymentOrderTemplateConfig {
  id: PaymentOrderTemplateId;
  name: string;
  designStyle: string;
  description: string;
  headerNote: string; // line under temple name
  orderTitle: string; // banner title
  amountLabel: string; // label above the sanctioned amount
  footerNote: string; // declaration/blessing line above signatures
  showAccountingBox: boolean; // debit/credit account block
  showPaymentMode: boolean;
  showAmountInWords: boolean;
  preparedByLabel: string;
  checkedByLabel: string;
  sanctionedByLabel: string;
  showPreparedBy: boolean;
  showCheckedBy: boolean;
  primaryColor: string;
  accentColor: string;
  borderStyle: 'double' | 'solid' | 'boxed';
  paperSize: 'A5' | 'A4';
}
