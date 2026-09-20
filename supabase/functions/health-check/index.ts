import { getAdminClient } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const started = performance.now();
    const admin = getAdminClient();
    const { error } = await admin.from('health_checks').select('id').limit(1);
    const result = { service: 'supabase', target: Deno.env.get('SUPABASE_URL') ?? 'configured', status: error ? 'degraded' : 'healthy', latency_ms: Math.round(performance.now() - started), details: error ? { message: error.message } : {} };
    if (!error) await admin.from('health_checks').insert(result);
    return json(result, error ? 503 : 200);
  } catch (error) {
    return handleError(error);
  }
});
