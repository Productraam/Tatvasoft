import { storageService } from './storageService';
import { getSupabaseClient } from './supabaseService';
import { SyncQueueItem } from '../types/accounting';

class SyncEngine {
  private isSyncing = false;
  private syncTimer: any = null;
  public isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    this.init();
  }

  public init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });

    // Auto-sync heartbeat every 20 seconds if online and cloud is configured
    this.syncTimer = setInterval(() => {
      const config = storageService.getCloudConfig();
      if (this.isOnline && config.isConfigured && config.autoSyncEnabled && !this.isSyncing) {
        this.syncNow();
      }
    }, 20000);
  }

  public async syncNow(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    if (this.isSyncing) return { success: false, syncedCount: 0, errors: ['Sync already in progress'] };

    const config = storageService.getCloudConfig();
    if (!config.isConfigured || !config.supabaseUrl || !config.supabaseAnonKey) {
      return { success: false, syncedCount: 0, errors: ['Supabase cloud is not configured yet.'] };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, syncedCount: 0, errors: ['Unable to initialize Supabase client.'] };
    }

    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return { success: false, syncedCount: 0, errors: ['Sign in to Supabase before syncing tenant data.'] };
    }

    this.isSyncing = true;
    this.notifyStatusChange();

    const queue = storageService.getSyncQueue();
    const pendingItems = queue.filter((item) => item.status === 'PENDING' || item.status === 'ERROR');
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      for (const item of pendingItems) {
        try {
          item.status = 'SYNCING';
          await this.syncQueueItem(client, item);
          item.status = 'SYNCED';
          syncedCount++;
        } catch (err: any) {
          console.error(`Error syncing queue item ${item.id}:`, err);
          item.status = 'ERROR';
          item.retryCount = (item.retryCount || 0) + 1;
          item.errorMessage = err.message || 'Unknown sync error';
          errors.push(`${item.entityType} (${item.entityId}): ${item.errorMessage}`);
        }
      }

      // Update remaining queue
      storageService.saveSyncQueue(queue);

      // Update last synced timestamp
      config.lastSyncedAt = new Date().toISOString();
      config.isConnected = errors.length === 0;
      storageService.saveCloudConfig(config);

      return {
        success: errors.length === 0,
        syncedCount,
        errors,
      };
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }
  }

  private async syncQueueItem(client: any, item: SyncQueueItem): Promise<void> {
    const payload = item.payload;

    switch (item.entityType) {
      case 'DONOR': {
        const { error } = await client.from('donors').upsert({
          tenant_id: payload.tenantId,
          id: payload.id,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          pan: payload.pan,
          gotra: payload.gotra,
          nakshatra: payload.nakshatra,
          rashi: payload.rashi,
          total_donated: payload.totalDonated,
          last_donation_date: payload.lastDonationDate,
        });
        if (error) throw error;
        break;
      }

      case 'DONATION': {
        const { error } = await client.from('donations').upsert({
          tenant_id: payload.tenantId,
          id: payload.id,
          receipt_no: payload.receiptNo,
          offline_temp_id: payload.offlineTempId,
          date: payload.date,
          time: payload.time,
          donor_id: payload.donorId,
          donor_name: payload.donorName,
          donor_phone: payload.donorPhone,
          donor_address: payload.donorAddress,
          donor_pan: payload.donorPan,
          donor_gotra: payload.donorGotra,
          donor_nakshatra: payload.donorNakshatra,
          seva_type_id: payload.sevaTypeId,
          seva_name: payload.sevaName,
          amount: payload.amount,
          payment_mode: payload.paymentMode,
          transaction_ref: payload.transactionRef,
          is_80g_eligible: payload.is80GEligible,
          cashier_id: payload.cashierId,
          cashier_name: payload.cashierName,
          counter_name: payload.counterName,
          notes: payload.notes,
        });
        if (error) throw error;

        // Mark local donation as synced
        storageService.markDonationSynced(payload.id);
        break;
      }

      case 'EXPENSE': {
        const { error } = await client.from('expense_vouchers').upsert({
          tenant_id: payload.tenantId,
          id: payload.id,
          voucher_no: payload.voucherNo,
          date: payload.date,
          time: payload.time,
          debit_account_id: payload.debitAccountId,
          debit_account_name: payload.debitAccountName,
          credit_account_id: payload.creditAccountId,
          credit_account_name: payload.creditAccountName,
          payee_name: payload.payeeName,
          category: payload.category,
          amount: payload.amount,
          payment_mode: payload.paymentMode,
          ref_no: payload.refNo,
          approved_by: payload.approvedBy,
          bill_attachment: payload.billAttachment,
          notes: payload.notes,
        });
        if (error) throw error;

        // Mark local expense as synced
        storageService.markExpenseSynced(payload.id);
        break;
      }

      case 'JOURNAL_ENTRY': {
        const { error: entryError } = await client.from('journal_entries').upsert({
          tenant_id: payload.tenantId,
          id: payload.id,
          voucher_no: payload.voucherNo,
          date: payload.date,
          time: payload.time,
          narration: payload.narration,
          reference_type: payload.referenceType,
          reference_id: payload.referenceId,
          created_by: payload.createdBy,
        });
        if (entryError) throw entryError;

        if (payload.lines && payload.lines.length > 0) {
          const linesToInsert = payload.lines.map((l: any) => ({
            tenant_id: payload.tenantId,
            id: l.id,
            entry_id: payload.id,
            account_id: l.accountId,
            account_code: l.accountCode,
            account_name: l.accountName,
            debit: l.debit,
            credit: l.credit,
          }));
          const { error: linesError } = await client.from('journal_lines').upsert(linesToInsert);
          if (linesError) throw linesError;
        }
        break;
      }

      case 'HUNDI': {
        const { error } = await client.from('hundi_counts').upsert({
          tenant_id: payload.tenantId,
          id: payload.id,
          batch_no: payload.batchNo,
          unseal_date: payload.unsealDate,
          hundi_name: payload.hundiName,
          denominations: payload.denominations,
          total_amount: payload.totalAmount,
          witnesses: payload.witnesses,
          deposit_to_account_id: payload.depositToAccountId,
          is_posted: payload.isPosted,
          notes: payload.notes,
        });
        if (error) throw error;
        break;
      }
    }
  }

  public getPendingCount(): number {
    const queue = storageService.getSyncQueue();
    return queue.filter((item) => item.status === 'PENDING' || item.status === 'ERROR').length;
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  private notifyStatusChange() {
    window.dispatchEvent(new CustomEvent('temple_sync_status_changed'));
  }
}

export const syncEngine = new SyncEngine();
