import { requirePlatformAdmin } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { admin, user } = await requirePlatformAdmin(request);
    const { data: jobs, error } = await admin.from('automation_jobs').select('*').eq('status', 'queued').lte('run_after', new Date().toISOString()).order('run_after').limit(50);
    if (error) return json({ error: error.message }, 400);
    for (const job of jobs ?? []) {
      await admin.from('automation_jobs').update({ status: 'running', attempts: job.attempts + 1 }).eq('id', job.id);
      await admin.from('audit_events').insert({ actor_user_id: user.id, tenant_id: job.tenant_id, action: 'AUTOMATION_STARTED', resource_type: job.job_type, resource_id: job.id, after_data: job.payload });
    }
    return json({ claimed: jobs?.length ?? 0 });
  } catch (error) {
    return handleError(error);
  }
});
