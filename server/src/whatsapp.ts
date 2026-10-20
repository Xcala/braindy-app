// WhatsApp Business (Meta Cloud API). Configured with WHATSAPP_TOKEN and WHATSAPP_PHONE_ID (Secret Manager).
// Business-initiated messages must use templates approved in Meta: see docs/setup-pending.md.
// Without configuration nothing is sent and callers fall back to a wa.me link Nicolas sends himself.
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const API = 'https://graph.facebook.com/v21.0';

export const whatsappConfigured = () => !!(TOKEN && PHONE_ID);

/** Digits only, with country code (Colombia by default for 10-digit mobiles). */
export function normalizePhone(raw: string): string | null {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('3')) return `57${d}`;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

export function waMeLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export async function sendTemplate(to: string, template: string, lang: 'es' | 'en', params: string[], buttonParam?: string) {
  if (!whatsappConfigured()) return { sent: false as const, reason: 'not_configured' };
  const components: unknown[] = [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text: text.slice(0, 900) })) }];
  if (buttonParam) components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: buttonParam }] });
  const r = await fetch(`${API}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'template', template: { name: template, language: { code: lang === 'es' ? 'es' : 'en' }, components } }),
  });
  if (!r.ok) {
    console.warn('whatsapp send failed', r.status); // never log the body (it holds the phone number)
    return { sent: false as const, reason: `http_${r.status}` };
  }
  const j = (await r.json()) as { messages?: Array<{ id: string }> };
  return { sent: true as const, messageId: j.messages?.[0]?.id ?? null };
}
