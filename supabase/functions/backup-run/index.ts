import { requirePlatformAdmin } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { admin, user } = await requirePlatformAdmin(request);
    const input = await request.json().catch(() => ({}));
    const bucket = Deno.env.get('BACKUP_BUCKET') ?? 'platform-backups';
    const path = `${input.tenantId ?? 'platform'}/${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const { data, error } = await admin.from('backup_jobs').insert({ tenant_id: input.tenantId ?? null, storage_bucket: bucket, object_path: path, requested_by: user.id, status: 'queued' }).select().single();
    if (error) return json({ error: error.message }, 400);
    await admin.from('audit_events').insert({ actor_user_id: user.id, tenant_id: input.tenantId ?? null, action: 'BACKUP_REQUESTED', resource_type: 'backup_job', resource_id: data.id, after_data: { bucket, path } });
    return json({ job: data }, 202);
  } catch (error) {
    return handleError(error);
  }
});
