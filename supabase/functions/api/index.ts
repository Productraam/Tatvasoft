import { requirePlatformAdmin } from '../_shared/auth.ts';
import { handleError, json, corsHeaders } from '../_shared/responses.ts';

const allowedResources = new Set(['tenants', 'memberships', 'domains', 'subscriptions', 'audit_events', 'health_checks', 'analytics_daily', 'automation_jobs']);
const mutableResources = new Set(['tenants', 'memberships', 'domains', 'subscriptions', 'automation_jobs']);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { admin, user } = await requirePlatformAdmin(request);
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const resource = parts.at(-1) ?? '';
    const id = parts.length > 1 ? parts.at(-1) : undefined;
    const table = parts.length > 1 ? parts.at(-2) : resource;
    const target = allowedResources.has(table) ? table : resource;
    if (!allowedResources.has(target)) return json({ error: 'Unsupported resource' }, 404);

    if (request.method === 'GET') {
      const { data, error } = await admin.from(target).select('*').limit(500);
      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }
    if (!mutableResources.has(target)) return json({ error: 'Read-only resource' }, 405);
    const payload = await request.json();
    const idempotencyKey = request.headers.get('Idempotency-Key');
    const result = request.method === 'POST'
      ? await admin.from(target).insert(payload).select().single()
      : request.method === 'PATCH' && id
        ? await admin.from(target).update(payload).eq('id', id).select().single()
        : request.method === 'DELETE' && id
          ? await admin.from(target).delete().eq('id', id)
          : null;
    if (!result) return json({ error: 'Invalid mutation' }, 400);
    if (result.error) return json({ error: result.error.message }, 400);
    await admin.from('audit_events').insert({
      actor_user_id: user.id,
      action: request.method,
      resource_type: target,
      resource_id: id ?? null,
      after_data: payload ?? null,
      reason: idempotencyKey ? `idempotency:${idempotencyKey}` : null,
    });
    return json({ data: result.data ?? null });
  } catch (error) {
    return handleError(error);
  }
});
