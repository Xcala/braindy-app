// WhatsApp Business (Meta Cloud API, through Dualhook's Graph-compatible Runtime API). Configured with
// WHATSAPP_TOKEN (dh_live_ key), WHATSAPP_PHONE_ID (Secret Manager) and WHATSAPP_API_BASE.
// Business-initiated messages outside the 24 h window must use templates approved in Meta: see docs/setup-pending.md.
// Without configuration nothing is sent and callers fall back to a wa.me link Nicolas sends himself.
// Never log message bodies or phone numbers.
const TOKEN = process.env.WHATSAPP_TOKEN?.trim();
const PHONE_ID = process.env.WHATSAPP_PHONE_ID?.trim();
// Dualhook: WHATSAPP_API_BASE=https://api.dualhook.com/v25.0 and a dh_live_ key as token.
const API = process.env.WHATSAPP_API_BASE?.trim() || 'https://graph.facebook.com/v21.0';

export const whatsappConfigured = () => !!(TOKEN && PHONE_ID);
export const ownPhoneId = () => PHONE_ID ?? null;

/** Digits only, with country code (Colombia by default for 10-digit mobiles). */
export function normalizePhone(raw: string): string | null {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('3')) return `57${d}`;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

export function waMeLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

type SendResult = { sent: true; messageId: string | null } | { sent: false; reason: string };

async function post(payload: Record<string, unknown>): Promise<SendResult> {
  if (!whatsappConfigured()) return { sent: false, reason: 'not_configured' };
  const r = await fetch(`${API}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  }).catch(() => null);
  if (!r?.ok) {
    console.warn('whatsapp send failed', r?.status ?? 'network', String(payload.type)); // never log the body
    return { sent: false, reason: `http_${r?.status ?? 'network'}` };
  }
  const j = (await r.json()) as { messages?: Array<{ id: string }> };
  return { sent: true, messageId: j.messages?.[0]?.id ?? null };
}

/** Quick-reply buttons of a template carry a payload we read back when the person taps them. */
export type TemplateButton = { type: 'url'; index: number; param: string } | { type: 'quick_reply'; index: number; payload: string };

export function sendTemplate(to: string, template: string, lang: 'es' | 'en', params: string[], buttons: string | TemplateButton[] = []) {
  const list: TemplateButton[] = typeof buttons === 'string' ? [{ type: 'url', index: 0, param: buttons }] : buttons;
  const components: unknown[] = [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text: text.slice(0, 900) })) }];
  for (const b of list) {
    components.push(b.type === 'url'
      ? { type: 'button', sub_type: 'url', index: String(b.index), parameters: [{ type: 'text', text: b.param }] }
      : { type: 'button', sub_type: 'quick_reply', index: String(b.index), parameters: [{ type: 'payload', payload: b.payload }] });
  }
  return post({ to, type: 'template', template: { name: template, language: { code: lang }, components } });
}

/** Free text: only inside the 24 h window after the person wrote. */
export function sendText(to: string, body: string, replyTo?: string) {
  return post({ to, type: 'text', text: { body: body.slice(0, 4000), preview_url: true }, ...(replyTo ? { context: { message_id: replyTo } } : {}) });
}

/** Up to 3 reply buttons (titles up to 20 characters); more options go in a list (up to 10 rows). */
export function sendChoices(to: string, body: string, options: Array<{ id: string; title: string }>, listLabel = 'Elegir') {
  const interactive = options.length <= 3
    ? { type: 'button', body: { text: body.slice(0, 1024) }, action: { buttons: options.map((o) => ({ type: 'reply', reply: { id: o.id.slice(0, 256), title: o.title.slice(0, 20) } })) } }
    : { type: 'list', body: { text: body.slice(0, 1024) }, action: { button: listLabel.slice(0, 20), sections: [{ title: 'Braindy', rows: options.slice(0, 10).map((o) => ({ id: o.id.slice(0, 200), title: o.title.slice(0, 24) })) }] } };
  return post({ to, type: 'interactive', interactive });
}

/** Downloads an inbound media file (image, document, audio, video). Media ids expire after 7 days. */
export async function downloadMedia(mediaId: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (!whatsappConfigured() || !/^[A-Za-z0-9_.-]{1,128}$/.test(mediaId)) return null;
  const auth = { Authorization: `Bearer ${TOKEN}` };
  const meta = await fetch(`${API}/${mediaId}`, { headers: auth }).catch(() => null);
  if (!meta?.ok) return null;
  const m = (await meta.json()) as { url?: string; mime_type?: string; file_size?: number };
  if (!m.url || (m.file_size ?? 0) > 100 * 1024 ** 2) return null;
  const file = await fetch(m.url, { headers: auth }).catch(() => null);
  if (!file?.ok) return null;
  return { bytes: Buffer.from(await file.arrayBuffer()), contentType: m.mime_type || 'application/octet-stream' };
}

/** The public WhatsApp Business profile (what clients see when they open Braindy's chat). */
export type WaProfile = { about: string; description: string; address: string; email: string; websites: string[]; vertical: string; photo: string | null };
const PROFILE_FIELDS = 'about,description,address,email,websites,vertical,profile_picture_url';

export async function getProfile(): Promise<WaProfile | null> {
  if (!whatsappConfigured()) return null;
  const r = await fetch(`${API}/${PHONE_ID}/whatsapp_business_profile?fields=${PROFILE_FIELDS}`, { headers: { Authorization: `Bearer ${TOKEN}` } }).catch(() => null);
  if (!r?.ok) { console.warn('whatsapp profile read failed', r?.status ?? 'network'); return null; }
  const d = ((await r.json()) as { data?: Array<Record<string, unknown>> }).data?.[0] ?? {};
  const s = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : '');
  return { about: s('about'), description: s('description'), address: s('address'), email: s('email'), websites: Array.isArray(d.websites) ? (d.websites as string[]) : [], vertical: s('vertical'), photo: s('profile_picture_url') || null };
}

/** Saves the text fields (the photo needs Meta's upload flow and is changed from the phone). */
export async function saveProfile(p: Omit<WaProfile, 'photo'>): Promise<{ ok: true } | { ok: false; status: number }> {
  if (!whatsappConfigured()) return { ok: false, status: 0 };
  const r = await fetch(`${API}/${PHONE_ID}/whatsapp_business_profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...p }),
  }).catch(() => null);
  if (!r?.ok) { console.warn('whatsapp profile save failed', r?.status ?? 'network'); return { ok: false, status: r?.status ?? 0 }; }
  return { ok: true };
}
