export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- TEMPLE ACCOUNTS & SEVA FINANCIAL MANAGEMENT SYSTEM
-- MASTER SUPABASE POSTGRESQL SCHEMA WITH DOUBLE-ENTRY LEDGER & RLS
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEMPLE PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.temple_profiles (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    deity TEXT,
    trust_name TEXT,
    registration_no TEXT,
    tax_exemption_80g TEXT,
    pan_number TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    upi_vpa TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CHART OF ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_hindi TEXT,
    category TEXT NOT NULL CHECK (category IN ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE')),
    sub_category TEXT,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    is_system BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SEVA TYPES MASTER TABLE
CREATE TABLE IF NOT EXISTS public.seva_types (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_hindi TEXT,
    default_amount NUMERIC(12, 2) NOT NULL,
    deity TEXT,
    category TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DONORS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.donors (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    pan TEXT,
    gotra TEXT,
    nakshatra TEXT,
    rashi TEXT,
    total_donated NUMERIC(15, 2) DEFAULT 0.00,
    last_donation_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DONATIONS & RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS public.donations (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    receipt_no TEXT NOT NULL UNIQUE,
    offline_temp_id TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    donor_id TEXT REFERENCES public.donors(id) ON DELETE SET NULL,
    donor_name TEXT NOT NULL,
    donor_phone TEXT NOT NULL,
    donor_address TEXT,
    donor_pan TEXT,
    donor_gotra TEXT,
    donor_nakshatra TEXT,
    seva_type_id TEXT,
    seva_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL,
    transaction_ref TEXT,
    is_80g_eligible BOOLEAN DEFAULT FALSE,
    cashier_id TEXT,
    cashier_name TEXT,
    counter_name TEXT,
    notes TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EXPENSE VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS public.expense_vouchers (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    voucher_no TEXT NOT NULL UNIQUE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    debit_account_id TEXT REFERENCES public.accounts(id),
    debit_account_name TEXT NOT NULL,
    credit_account_id TEXT REFERENCES public.accounts(id),
    credit_account_name TEXT NOT NULL,
    payee_name TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL,
    ref_no TEXT,
    approved_by TEXT,
    bill_attachment TEXT,
    notes TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. JOURNAL ENTRIES & LINES (DOUBLE-ENTRY LEDGER)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    voucher_no TEXT NOT NULL UNIQUE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    narration TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_lines (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES public.accounts(id),
    account_code TEXT,
    account_name TEXT,
    debit NUMERIC(15, 2) DEFAULT 0.00,
    credit NUMERIC(15, 2) DEFAULT 0.00
);

-- 8. HUNDI / DANPATRA COUNTING TABLE
CREATE TABLE IF NOT EXISTS public.hundi_counts (
    tenant_id TEXT NOT NULL,
    id TEXT PRIMARY KEY,
    batch_no TEXT NOT NULL UNIQUE,
    unseal_date DATE NOT NULL,
    hundi_name TEXT NOT NULL,
    denominations JSONB NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    witnesses TEXT[] NOT NULL,
    deposit_to_account_id TEXT REFERENCES public.accounts(id),
    is_posted BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ENABLE ROW LEVEL SECURITY (RLS) FOR MULTI-ROLE ACCESS
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);

ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hundi_counts ENABLE ROW LEVEL SECURITY;

-- Tenant isolation requires an authenticated user membership. The browser anon key
-- alone must never grant access to accounting data.
DROP POLICY IF EXISTS "Allow read for all" ON public.temple_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated/anon desktop" ON public.temple_profiles;
DROP POLICY IF EXISTS "Allow all for accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow all for donors" ON public.donors;
DROP POLICY IF EXISTS "Allow all for donations" ON public.donations;
DROP POLICY IF EXISTS "Allow all for expense_vouchers" ON public.expense_vouchers;
DROP POLICY IF EXISTS "Allow all for journal_entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow all for journal_lines" ON public.journal_lines;
DROP POLICY IF EXISTS "Allow all for hundi_counts" ON public.hundi_counts;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Tenant members can access profiles" ON public.temple_profiles;
DROP POLICY IF EXISTS "Tenant members can access accounts" ON public.accounts;
DROP POLICY IF EXISTS "Tenant members can access donors" ON public.donors;
DROP POLICY IF EXISTS "Tenant members can access donations" ON public.donations;
DROP POLICY IF EXISTS "Tenant members can access expenses" ON public.expense_vouchers;
DROP POLICY IF EXISTS "Tenant members can access journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Tenant members can access journal lines" ON public.journal_lines;
DROP POLICY IF EXISTS "Tenant members can access hundi counts" ON public.hundi_counts;

CREATE POLICY "Users can read own memberships" ON public.tenant_memberships
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Tenant members can access profiles" ON public.temple_profiles
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = temple_profiles.tenant_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = temple_profiles.tenant_id));

CREATE POLICY "Tenant members can access accounts" ON public.accounts
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = accounts.tenant_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = accounts.tenant_id));

CREATE POLICY "Tenant members can access donors" ON public.donors
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = donors.tenant_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = donors.tenant_id));

CREATE POLICY "Tenant members can access donations" ON public.donations
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = donations.tenant_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = donations.tenant_id));

CREATE POLICY "Tenant members can access expenses" ON public.expense_vouchers
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = expense_vouchers.tenant_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = expense_vouchers.tenant_id));

CREATE POLICY "Tenant members can access journal entries" ON public.journal_entries
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = journal_entries.tenant_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = journal_entries.tenant_id));

CREATE POLICY "Tenant members can access journal lines" ON public.journal_lines
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = journal_lines.tenant_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = journal_lines.tenant_id));

CREATE POLICY "Tenant members can access hundi counts" ON public.hundi_counts
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = hundi_counts.tenant_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = hundi_counts.tenant_id));

-- 10. INDEXES FOR HIGH-SPEED COUNTER QUERIES
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_receipt_no ON public.donations(receipt_no);
CREATE INDEX IF NOT EXISTS idx_donors_phone ON public.donors(phone);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(date DESC);
`;
