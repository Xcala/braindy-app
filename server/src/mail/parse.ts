// Reading an email for the requests inbox (pure functions, no network): who sent it and whether Google
// authenticated that sender, the new text without the quoted history, and its attachments.
import type { GMessage, Part } from './gmail.js';

export const header = (m: GMessage, name: string) =>
  m.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
const all = (m: GMessage, name: string) =>
  (m.payload?.headers ?? []).filter((h) => h.name.toLowerCase() === name.toLowerCase()).map((h) => h.value);

/** The bare address in «Karol Franco <Karol@Gmail.com>» → karol@gmail.com. */
export function addressOf(from: string): string {
  const m = from.match(/<([^>]+)>/) ?? from.match(/([^\s<>"]+@[^\s<>"]+)/);
  return (m?.[1] ?? '').trim().toLowerCase();
}

/**
 * The From address is only trusted when Google's own check (the Authentication-Results it adds on arrival) says
 * DMARC passed for that domain, or DKIM passed for that domain or one under it. Anyone can type any From.
 */
export function senderVerified(m: GMessage, address: string): boolean {
  const domain = address.split('@')[1] ?? '';
  if (!domain) return false;
  const results = all(m, 'Authentication-Results').filter((v) => /^\s*mx\.google\.com\s*;/i.test(v));
  const ar = results[0];
  if (!ar) return false;
  const esc = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`dmarc=pass[^;]*header\\.from=${esc}(\\s|;|$)`, 'i').test(ar)) return true;
  return new RegExp(`dkim=pass[^;]*header\\.(?:i|d)=@?(?:[a-z0-9-]+\\.)*${esc}(\\s|;|$)`, 'i').test(ar);
}

const decode = (data?: string) => (data ? Buffer.from(data, 'base64url').toString('utf8') : '');
function walk(p: Part | undefined, out: Part[] = []): Part[] {
  if (!p) return out;
  out.push(p);
  for (const c of p.parts ?? []) walk(c, out);
  return out;
}
const htmlToText = (h: string) => h
  .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
  .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Only what the person wrote this time: no quoted thread, no «On … wrote:», no signature after «-- ». */
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const next = `${l} ${lines[i + 1] ?? ''}`;
    if (/^\s*>/.test(l)) continue;
    if (/^--\s*$/.test(l)) break;
    if (/^-{2,}\s*(original message|mensaje original|forwarded message|mensaje reenviado)/i.test(l)) break;
    if (/^(on|el)\s.+(wrote|escribi[oó])\s*:\s*$/i.test(next.trim()) || /^(on|el)\s.+(wrote|escribi[oó])\s*:\s*$/i.test(l.trim())) break;
    if (/^(from|de):\s.+@/i.test(l) && /^(sent|enviado|date|fecha|to|para):/i.test(lines[i + 1] ?? '')) break;
    out.push(l);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function bodyText(m: GMessage): string {
  const parts = walk(m.payload).filter((p) => !p.filename);
  const plain = parts.find((p) => p.mimeType === 'text/plain' && p.body?.data);
  const html = parts.find((p) => p.mimeType === 'text/html' && p.body?.data);
  const raw = plain ? decode(plain.body?.data) : html ? htmlToText(decode(html.body?.data)) : '';
  return stripQuoted(raw).slice(0, 4000);
}

export type MailFile = { attachmentId: string; name: string; contentType: string; size: number };
const MAX = 25 * 1024 * 1024;
/** Real attachments (a name and an id), not the small images a signature carries inline. */
export function attachmentsOf(m: GMessage): MailFile[] {
  return walk(m.payload)
    .filter((p) => p.filename && p.body?.attachmentId && (p.body.size ?? 0) <= MAX)
    .filter((p) => !(/^image\//.test(p.mimeType ?? '') && (p.body?.size ?? 0) < 20_000 && /^(image\d*|outlook|logo)/i.test(p.filename ?? '')))
    .slice(0, 10)
    .map((p) => ({ attachmentId: p.body!.attachmentId!, name: String(p.filename).replace(/[\\/\r\n]/g, '_').slice(0, 200), contentType: p.mimeType || 'application/octet-stream', size: p.body?.size ?? 0 }));
}

/** «Re: Fw: Cambiar la foto» → «Cambiar la foto». */
export const cleanSubject = (s: string) => s.replace(/^\s*((re|fw|fwd|rv|reenviar)\s*:\s*)+/i, '').trim().slice(0, 160);
