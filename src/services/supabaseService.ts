import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { storageService } from './storageService';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = storageService.getCloudConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    supabaseClient = null;
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
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

export const verifyMfa = async (factorId: string, code: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Configure Supabase before verifying MFA.');
  const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const { data, error } = await client.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
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
    const { error } = await testClient.from('temple_profiles').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's still reachable via PostgREST
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
