export interface StaffAccount {
  id: string;
  name: string;
  username?: string;
  password?: string;
  role: 'cashier' | 'accountant' | 'trustee' | 'auditor' | 'admin' | 'chief';
  counterName: string;
  pin?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface TenantModules {
  hundiCounting: boolean;
  assetManagement: boolean;
  whatsappReceipts: boolean;
  taxExemption80G: boolean;
  onlineDevoteePortal: boolean;
  multiCounter: boolean;
}

export interface Tenant {
  id: string;
  slug: string;
  subdomain: string;
  name: string;
  deity: string;
  trustName: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
  planId: 'starter' | 'pro' | 'enterprise';
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  activeCounters: number;
  totalDonationGmv: number;
  currency: string;
  createdAt: string;
  modules: TenantModules;
  registrationNo?: string;
  tax80GNo?: string;
  messageCredits?: number;
  customDomain?: string;
  staffAccounts?: StaffAccount[];
}

export interface SubscriptionPlan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  pricePerMonth: number;
  pricePerYear: number;
  maxCounters: number;
  features: string[];
  recommended?: boolean;
}

export interface PlatformInvoice {
  id: string;
  invoiceNo: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentMethod: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  tenantName: string;
  userEmail: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ipAddress: string;
}

export interface GatewayRoutingRule {
  id: string;
  name: string;
  provider: 'Razorpay' | 'Cashfree' | 'PhonePe' | 'PayU';
  platformFeePercent: number;
  flatFeePerTxn: number;
  settlementCycle: string;
  isActive: boolean;
  volumeShare: number;
}

export interface PlatformSettlementBatch {
  id: string;
  batchNo: string;
  tenantName: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  utrNumber: string;
  date: string;
  status: 'SETTLED' | 'PROCESSING' | 'HOLD';
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  channel: 'WHATSAPP' | 'SMS';
  category: 'E_RECEIPT' | 'SEVA_REMINDER' | 'FESTIVAL_BROADCAST' | '80G_CERTIFICATE';
  metaApprovalStatus: 'APPROVED' | 'IN_REVIEW' | 'REJECTED';
  contentSnippet: string;
  sampleVariables: string[];
}

export interface SecurityAnomaly {
  id: string;
  timestamp: string;
  tenantName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  type: 'HIGH_VALUE_HUNDI' | 'RAPID_VOIDS' | 'OFF_HOURS_ACCESS' | 'INTEGRITY_MISMATCH';
  title: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
}

export interface PlatformBroadcast {
  id: string;
  title: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'EMERGENCY';
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}
