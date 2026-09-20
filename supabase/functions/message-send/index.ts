import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, handleError, json } from '../_shared/responses.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { admin, user } = await requireUser(request);
    const input = await request.json();
    const tenantId = String(input.tenantId ?? '');
    const recipient = String(input.recipient ?? '');
    const templateName = String(input.templateName ?? '');
    if (!tenantId || !recipient || !templateName) return json({ error: 'tenantId, recipient and templateName are required' }, 400);
    const { data: membership } = await admin.from('tenant_memberships').select('role').eq('tenant_id', tenantId).eq('user_id', user.id).eq('is_active', true).maybeSingle();
    if (!membership) return json({ error: 'Tenant membership required' }, 403);
    const token = Deno.env.get('META_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('META_PHONE_NUMBER_ID');
    if (!token || !phoneNumberId) return json({ error: 'WhatsApp provider is not configured' }, 503);
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: recipient, type: 'template', template: { name: templateName, language: { code: input.language ?? 'en' }, components: input.components ?? [] } }) });
    const providerPayload = await response.json();
    if (!response.ok) return json({ error: 'WhatsApp rejected the message', details: providerPayload }, 502);
    const { data: delivery, error } = await admin.from('message_deliveries').insert({ tenant_id: tenantId, provider: 'meta', recipient, provider_message_id: providerPayload.messages?.[0]?.id ?? null, status: 'sent' }).select().single();
    if (error) return json({ error: error.message }, 400);
    await admin.from('audit_events').insert({ actor_user_id: user.id, tenant_id: tenantId, action: 'MESSAGE_SENT', resource_type: 'message_delivery', resource_id: delivery.id, after_data: { recipient, templateName } });
    return json({ delivery });
  } catch (error) {
    return handleError(error);
  }
});
