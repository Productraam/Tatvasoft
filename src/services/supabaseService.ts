import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { storageService } from './storageService';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = storageService.getCloudConfig();
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  const url = envUrl || config.supabaseUrl;
  const anonKey = envAnonKey || config.supabaseAnonKey;

  if (!url || !anonKey) {
    supabaseClient = null;
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Error creating Supabase client:', err);
      supabaseClient = null;
    }
  }

  return supabaseClient;
};

export const resetSupabaseClient = () => {
  supabaseClient = null;
};

export const getCurrentAuthSession = async () => {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
};

export const signInWithPassword = async (email: string, password: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Configure Supabase before signing in.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signInStaffMember = async (identifier: string, pass: string, tenantId?: string) => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cloud Authentication Error: Supabase project credentials are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const email = identifier.includes('@') ? identifier : `${identifier}@temple.org`;
  const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error(`Cloud Authentication Failed: ${error.message}`);

  // Verify active tenant membership in Supabase Postgres
  if (tenantId && data.user) {
    const { data: membership, error: memError } = await client
      .from('tenant_memberships')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (memError || !membership) {
      throw new Error(`Cloud Authorization Failed: User #${data.user.email} does not have an active staff membership for tenant #${tenantId}.`);
    }

    return { user: data.user, session: data.session, membership };
  }

  return { user: data.user, session: data.session };
};

export const signInPlatformAdmin = async (identifier: string, pass: string) => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cloud Authentication Error: Supabase project credentials are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const email = identifier.includes('@') ? identifier : `${identifier}@tatva.org`;
  const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error(`Cloud Authentication Failed: ${error.message}`);

  // Verify platform profile in Supabase Postgres
  const { data: profile, error: profError } = await client
    .from('platform_profiles')
    .select('*')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .single();

  if (profError || !profile) {
    throw new Error('Cloud Authorization Failed: Account does not have active Platform Administrator privileges in platform_profiles.');
  }

  // Check TOTP MFA status
  const { data: mfaAssurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  const requiresMfa = profile.mfa_required && mfaAssurance?.currentLevel !== 'aal2';

  return {
    requiresMfa,
    profile,
    user: data.user,
    session: data.session,
    currentLevel: mfaAssurance?.currentLevel || 'aal1',
  };
};

export const signOut = async () => {
  const client = getSupabaseClient();
  if (client) await client.auth.signOut();
};

export const enrollMfa = async (friendlyName = 'TATVa Authenticator') => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Configure Supabase before enrolling MFA.');
  const { data, error } = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName });
  if (error) throw error;
  return data;
};

export const challengeMfa = async (factorId: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Configure Supabase before challenging MFA.');
  const { data, error } = await client.auth.mfa.challenge({ factorId });
  if (error) throw error;
  return data;
};

export const verifyMfaCode = async (factorId: string, challengeId: string, code: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Configure Supabase before verifying MFA.');
  const { data, error } = await client.auth.mfa.verify({ factorId, challengeId, code });
  if (error) throw error;
  return data;
};

export const listMfaFactors = async () => {
  const client = getSupabaseClient();
  if (!client) return { totp: [] };
  const { data, error } = await client.auth.mfa.listFactors();
  if (error) throw error;
  return data;
};

export const getAuthenticatorLevel = async () => {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data.currentLevel;
};

export const invokePlatformFunction = async <T>(functionName: string, body?: unknown): Promise<T> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Configure Supabase before calling platform services.');
  const { data, error } = await client.functions.invoke(functionName, { body: body as Record<string, unknown> | undefined });
  if (error) throw error;
  return data as T;
};

export const testSupabaseConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> => {
  if (!url || !anonKey) {
    return { success: false, message: 'Supabase URL and Anon Key are required.' };
  }

  try {
    const testClient = createClient(url, anonKey);
    // Ping by attempting to read from a table or checking auth settings
    const { error } = await testClient.from('tenants').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase project! (Tables not yet created, run the SQL setup script).',
        };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Successfully connected and verified Supabase Master Database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed. Check your network and credentials.' };
  }
};
