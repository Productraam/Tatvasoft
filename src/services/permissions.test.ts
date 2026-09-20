import { describe, it, expect } from 'vitest';
import { canAccessTab, firstAllowedTab, canAccessAdmin } from './permissions';

describe('permissions', () => {
  it('grants cashier access to the donation counter', () => {
    expect(canAccessTab('cashier', 'pos')).toBe(true);
  });

  it('denies cashier access to financial reports and settings', () => {
    expect(canAccessTab('cashier', 'reports')).toBe(false);
    expect(canAccessTab('cashier', 'settings')).toBe(false);
  });

  it('grants trustee access to settings and catalogs', () => {
    expect(canAccessTab('trustee', 'settings')).toBe(true);
    expect(canAccessTab('trustee', 'catalogs')).toBe(true);
  });

  it('denies accountant access to settings', () => {
    expect(canAccessTab('accountant', 'settings')).toBe(false);
  });

  it('returns false for unknown tabs', () => {
    expect(canAccessTab('admin', 'nonexistent-tab')).toBe(false);
  });

  it('picks a valid landing tab for each role', () => {
    expect(canAccessTab('cashier', firstAllowedTab('cashier'))).toBe(true);
    expect(canAccessTab('accountant', firstAllowedTab('accountant'))).toBe(true);
    expect(canAccessTab('auditor', firstAllowedTab('auditor'))).toBe(true);
  });

  it('restricts the super admin workspace to the admin role', () => {
    expect(canAccessAdmin('admin')).toBe(true);
    expect(canAccessAdmin('trustee')).toBe(false);
    expect(canAccessAdmin('cashier')).toBe(false);
  });
});
