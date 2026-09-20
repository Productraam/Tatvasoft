import { getAdminClient } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const admin = getAdminClient();
    const payload = await request.json();
    const provider = Deno.env.get('MESSAGING_PROVIDER') ?? 'meta';
    const deliveries = Array.isArray(payload.deliveries) ? payload.deliveries : [payload];
    for (const delivery of deliveries) {
      if (!delivery.id) continue;
      await admin.from('message_deliveries').update({ status: delivery.status ?? 'delivered', delivered_at: delivery.status === 'delivered' ? new Date().toISOString() : null }).eq('id', delivery.id);
    }
    return json({ received: true, provider });
  } catch (error) {
    return handleError(error);
  }
});
