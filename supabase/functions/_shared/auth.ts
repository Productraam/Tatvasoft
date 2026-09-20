import { createClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

export const getAdminClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

export const getUserClient = (request: Request) => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } } },
);

export const requireUser = async (request: Request): Promise<{ client: ReturnType<typeof getUserClient>; user: User }> => {
  const client = getUserClient(request);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  return { client, user: data.user };
};

export const requirePlatformAdmin = async (request: Request) => {
  const { client, user } = await requireUser(request);
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('platform_profiles')
    .select('role,is_active,mfa_required')
    .eq('user_id', user.id)
    .single();
  if (error || !data?.is_active || !['platform_owner', 'platform_admin'].includes(data.role)) {
    throw new Response(JSON.stringify({ error: 'Platform administrator access required' }), { status: 403 });
  }
  return { client, admin, user, profile: data };
};
