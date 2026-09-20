import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from './storageService';

const balancedLines = () => [
  { id: 'l1', accountId: 'acc-101', accountCode: '1010', accountName: 'In-Hand Cash', debit: 500, credit: 0 },
  { id: 'l2', accountId: 'acc-302', accountCode: '3020', accountName: 'Donation Income', debit: 0, credit: 500 },
];

const journalData = (overrides: Partial<Parameters<typeof storageService.createJournalEntry>[0]> = {}) => ({
  date: '2026-01-01',
  time: '10:00:00',
  narration: 'Test entry',
  referenceType: 'MANUAL' as const,
  referenceId: 'test-1',
  createdBy: 'Tester',
  lines: balancedLines(),
  ...overrides,
});

describe('storageService accounting integrity', () => {
  beforeEach(() => {
    localStorage.clear();
    storageService.setTenantContext('t-test-alpha');
    localStorage.clear();
  });

  it('accepts a balanced journal entry', () => {
    const entry = storageService.createJournalEntry(journalData());
    expect(entry.id).toBeTruthy();
    expect(storageService.getJournalEntries().length).toBeGreaterThan(0);
  });

  it('rejects an unbalanced journal entry', () => {
    const unbalanced = journalData({
      lines: [
        { id: 'l1', accountId: 'acc-101', accountCode: '1010', accountName: 'Cash', debit: 500, credit: 0 },
        { id: 'l2', accountId: 'acc-302', accountCode: '3020', accountName: 'Income', debit: 0, credit: 400 },
      ],
    });
    expect(() => storageService.createJournalEntry(unbalanced)).toThrow(/Unbalanced/);
  });

  it('rejects a transfer with a non-positive amount', () => {
    expect(() =>
      storageService.createTransfer({
        fromAccountId: 'acc-101',
        fromAccountName: 'Cash',
        toAccountId: 'acc-103',
        toAccountName: 'Bank',
        amount: 0,
        transferType: 'CASH_DEPOSIT',
        handledBy: 'Tester',
        authorizedBy: 'Trustee',
        purpose: 'Test',
      })
    ).toThrow(/greater than zero/);
  });

  it('rejects a transfer to the same account', () => {
    expect(() =>
      storageService.createTransfer({
        fromAccountId: 'acc-101',
        fromAccountName: 'Cash',
        toAccountId: 'acc-101',
        toAccountName: 'Cash',
        amount: 100,
        transferType: 'INTERNAL_TRANSFER',
        handledBy: 'Tester',
        authorizedBy: 'Trustee',
        purpose: 'Test',
      })
    ).toThrow(/different/);
  });
});

describe('storageService tenant isolation', () => {
  it('does not leak journal entries between tenants', () => {
    localStorage.clear();

    storageService.setTenantContext('t-isolation-a');
    storageService.createJournalEntry(journalData({ referenceId: 'tenant-a-entry' }));
    const tenantACount = storageService.getJournalEntries().length;
    expect(tenantACount).toBeGreaterThan(0);

    storageService.setTenantContext('t-isolation-b');
    const tenantBEntries = storageService.getJournalEntries();
    expect(tenantBEntries.every((e) => e.referenceId !== 'tenant-a-entry')).toBe(true);
  });
});
