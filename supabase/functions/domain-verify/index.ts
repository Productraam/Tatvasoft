import { requirePlatformAdmin } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { admin, user } = await requirePlatformAdmin(request);
    const { domainId } = await request.json();
    const { data: domain, error } = await admin.from('tenant_domains').select('*').eq('id', domainId).single();
    if (error || !domain) return json({ error: 'Domain not found' }, 404);
    const response = await fetch(`https://${domain.hostname}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) }).catch(() => null);
    const verified = Boolean(response?.ok);
    await admin.from('tenant_domains').update({ verified_at: verified ? new Date().toISOString() : null, ssl_status: verified ? 'active' : 'pending' }).eq('id', domainId);
    await admin.from('audit_events').insert({ actor_user_id: user.id, tenant_id: domain.tenant_id, action: 'DOMAIN_VERIFIED', resource_type: 'tenant_domain', resource_id: domainId, after_data: { verified } });
    return json({ hostname: domain.hostname, verified, sslStatus: verified ? 'active' : 'pending' });
  } catch (error) {
    return handleError(error);
  }
});
