import { UserRole } from '../types/accounting';

// Temple workspace tab -> roles allowed to open it. Single source of truth used by
// both the Sidebar (visibility) and the workspace router (enforcement).
export const TAB_PERMISSIONS: Record<string, UserRole[]> = {
  pos: ['cashier', 'accountant', 'auditor', 'trustee', 'admin', 'chief'],
  receipts: ['cashier', 'accountant', 'auditor', 'trustee', 'admin', 'chief'],
  donors: ['cashier', 'accountant', 'auditor', 'trustee', 'admin', 'chief'],
  shift: ['cashier', 'accountant', 'trustee', 'admin', 'chief'],
  daybook: ['accountant', 'auditor', 'trustee', 'admin', 'chief'],
  expenses: ['accountant', 'auditor', 'trustee', 'admin', 'chief'],
  assets: ['accountant', 'auditor', 'trustee', 'admin', 'chief'],
  hundi: ['accountant', 'auditor', 'trustee', 'admin', 'chief'],
  accounts: ['accountant', 'auditor', 'trustee', 'admin', 'chief'],
  reports: ['accountant', 'auditor', 'trustee', 'admin', 'chief'],
  auditor: ['accountant', 'auditor', 'trustee', 'admin', 'chief'],
  catalogs: ['admin', 'trustee', 'chief'],
  settings: ['admin', 'trustee', 'chief'],
};

export const canAccessTab = (role: UserRole, tab: string): boolean => {
  const allowed = TAB_PERMISSIONS[tab];
  return !!allowed && allowed.includes(role);
};

// First tab this role is permitted to open, used as a safe landing/redirect target.
export const firstAllowedTab = (role: UserRole): string => {
  const tab = Object.keys(TAB_PERMISSIONS).find((t) => canAccessTab(role, t));
  return tab || 'pos';
};

// Only these roles may enter the platform Super Admin workspace.
export const canAccessAdmin = (role: UserRole): boolean => role === 'admin';
