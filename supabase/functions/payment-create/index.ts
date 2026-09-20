import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { admin, user } = await requireUser(request);
    if (request.method !== 'POST') return json({ error: 'POST required' }, 405);
    const input = await request.json();
    const tenantId = String(input.tenantId ?? '');
    const amountMinor = Number(input.amountMinor);
    const currency = String(input.currency ?? 'INR').toUpperCase();
    const idempotencyKey = request.headers.get('Idempotency-Key') ?? crypto.randomUUID();
    if (!tenantId || !Number.isInteger(amountMinor) || amountMinor <= 0) return json({ error: 'tenantId and positive integer amountMinor are required' }, 400);
    const { data: membership } = await admin.from('tenant_memberships').select('role').eq('tenant_id', tenantId).eq('user_id', user.id).eq('is_active', true).maybeSingle();
    if (!membership) return json({ error: 'Tenant membership required' }, 403);
    const provider = Deno.env.get('PAYMENT_PROVIDER') ?? 'razorpay';
    const { data: existing } = await admin.from('payment_transactions').select('*').eq('idempotency_key', idempotencyKey).maybeSingle();
    if (existing) return json({ transaction: existing, duplicate: true });
    let providerPaymentId: string | null = null;
    let providerPayload: Record<string, unknown> = { amount: amountMinor, currency };
    if (provider === 'razorpay') {
      const keyId = Deno.env.get('RAZORPAY_KEY_ID');
      const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
      if (!keyId || !keySecret) return json({ error: 'Razorpay is not configured' }, 503);
      const basic = btoa(`${keyId}:${keySecret}`);
      const response = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amountMinor, currency, receipt: idempotencyKey, notes: { tenantId } }) });
      providerPayload = await response.json();
      if (!response.ok) return json({ error: 'Payment provider rejected the order', details: providerPayload }, 502);
      providerPaymentId = String(providerPayload.id);
    } else {
      return json({ error: `Unsupported payment provider: ${provider}` }, 503);
    }
    const { data: transaction, error } = await admin.from('payment_transactions').insert({ tenant_id: tenantId, provider, provider_payment_id: providerPaymentId, idempotency_key: idempotencyKey, amount_minor: amountMinor, currency, status: 'pending', metadata: providerPayload }).select().single();
    if (error) return json({ error: error.message }, 400);
    await admin.from('audit_events').insert({ actor_user_id: user.id, tenant_id: tenantId, action: 'PAYMENT_CREATED', resource_type: 'payment_transaction', resource_id: transaction.id, after_data: { provider, amountMinor, currency } });
    return json({ transaction, provider: providerPayload });
  } catch (error) {
    return handleError(error);
  }
});
