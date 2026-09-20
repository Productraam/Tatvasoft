import { getAdminClient } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

const toHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

const verifyRazorpaySignature = async (payload: string, signature: string, secret: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toHex(digest) === signature;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const provider = Deno.env.get('PAYMENT_PROVIDER') ?? 'razorpay';
    const signature = request.headers.get('x-razorpay-signature') ?? request.headers.get('x-webhook-signature');
    const secret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
    if (!secret || !signature) return json({ error: 'Payment webhook is not configured' }, 503);
    const payloadText = await request.text();
    if (provider === 'razorpay' && !(await verifyRazorpaySignature(payloadText, signature, secret))) {
      return json({ error: 'Invalid payment webhook signature' }, 401);
    }
    const event = JSON.parse(payloadText);
    const providerEventId = String(event.id ?? event.event ?? crypto.randomUUID());
    const admin = getAdminClient();
    const { error: insertError } = await admin.from('webhook_events').insert({ provider, provider_event_id: providerEventId, event_type: event.event ?? 'unknown', payload: event });
    if (insertError?.code === '23505') return json({ received: true, duplicate: true });
    if (insertError) return json({ error: insertError.message }, 400);
    return json({ received: true });
  } catch (error) {
    return handleError(error);
  }
});
