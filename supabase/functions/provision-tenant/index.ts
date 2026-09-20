import { requirePlatformAdmin } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { admin, user } = await requirePlatformAdmin(request);
    if (request.method !== 'POST') return json({ error: 'POST required' }, 405);
    const input = await request.json();
    const slug = String(input.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const name = String(input.name ?? '').trim();
    const ownerUserId = String(input.ownerUserId ?? '');
    if (!slug || !name || !ownerUserId) return json({ error: 'name, slug and ownerUserId are required' }, 400);

    const tenantId = `tenant-${crypto.randomUUID()}`;
    const { data: tenant, error } = await admin.from('tenants').insert({ id: tenantId, slug, name, status: 'trial', plan_id: input.planId ?? 'starter' }).select().single();
    if (error) return json({ error: error.message }, 400);
    const { error: membershipError } = await admin.from('tenant_memberships').insert({ user_id: ownerUserId, tenant_id: tenantId, role: 'owner' });
    if (membershipError) {
      await admin.from('tenants').delete().eq('id', tenantId);
      return json({ error: membershipError.message }, 400);
    }
    await admin.from('tenant_domains').insert({ tenant_id: tenantId, hostname: `${slug}.localhost`, is_primary: true });
    await admin.from('audit_events').insert({ actor_user_id: user.id, tenant_id: tenantId, action: 'PROVISION', resource_type: 'tenant', resource_id: tenantId, after_data: tenant });
    return json({ tenant }, 201);
  } catch (error) {
    return handleError(error);
  }
});
