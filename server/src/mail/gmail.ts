// Gmail for the requests inbox: NickMark connects his mailbox once (OAuth offline, same Google client as the
// calendar); the refresh token is sealed with KMS and never leaves the server. Only what the inbox needs:
// read a message, its attachments, label it, and reply in its thread. Never log bodies or addresses.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { open, seal } from '../vault.js';

const CLIENT_ID = process.env.GOOGLE_CAL_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CAL_CLIENT_SECRET ?? '';
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const AAD = 'gmail-inbox';
export const MAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.modify openid email';
export const mailReady = () => !!CLIENT_ID;
export const mailIntegration = () => db.doc('integrations/gmailInbox');

let cached: { value: string; until: number } | null = null;

export async function gmailToken(): Promise<string | null> {
  if (cached && cached.until > Date.now()) return cached.value;
  const doc = await mailIntegration().get();
  if (!doc.exists || !doc.get('ciphertext') || !CLIENT_ID) return null;
  const refresh = await open(doc.get('ciphertext'), AAD, doc.get('scheme'));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: refresh, grant_type: 'refresh_token' }) });
  if (!r.ok) return null;
  const j = await r.json() as { access_token: string; expires_in: number };
  cached = { value: j.access_token, until: Date.now() + (j.expires_in - 60) * 1000 };
  return j.access_token;
}

/** Finishes the OAuth round trip that started in /admin/mail/connect (the calendar callback hands it over). */
export async function finishGmail(code: string, redirect: string, uid: string): Promise<boolean> {
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: redirect, grant_type: 'authorization_code' }) });
  if (!r.ok) return false;
  const j = await r.json() as { refresh_token?: string; id_token?: string; scope?: string };
  if (!j.refresh_token || !String(j.scope ?? '').includes('gmail.modify')) return false;
  let email: string | null = null;
  try { email = JSON.parse(Buffer.from(String(j.id_token).split('.')[1], 'base64url').toString()).email ?? null; } catch { /* only a label */ }
  const sealed = await seal(j.refresh_token, AAD);
  await mailIntegration().set({ ...sealed, email, by: uid, at: FieldValue.serverTimestamp() }, { merge: true });
  cached = null;
  return true;
}

export async function disconnectGmail() {
  await mailIntegration().set({ ciphertext: FieldValue.delete(), scheme: FieldValue.delete(), email: FieldValue.delete() }, { merge: true });
  cached = null;
}

async function gapi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await gmailToken();
  if (!token) throw new Error('gmail_not_connected');
  const r = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error(`gmail ${r.status}`);
  return r.json() as Promise<T>;
}

export type Part = { partId?: string; mimeType?: string; filename?: string; headers?: Array<{ name: string; value: string }>;
  body?: { data?: string; attachmentId?: string; size?: number }; parts?: Part[] };
export type GMessage = { id: string; threadId: string; labelIds?: string[]; payload?: Part };

export const listMessages = (q: string, max = 20) =>
  gapi<{ messages?: Array<{ id: string; threadId: string }> }>(`/messages?${new URLSearchParams({ q, maxResults: String(max) })}`).then((r) => r.messages ?? []);
export const getMessage = (id: string) => gapi<GMessage>(`/messages/${id}?format=full`);
export async function getAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
  const r = await gapi<{ data: string }>(`/messages/${messageId}/attachments/${attachmentId}`);
  return Buffer.from(r.data, 'base64url');
}

const labels = new Map<string, string>();
/** The id of a label, created the first time («Braindy/Pedido», «Braindy/Revisar»). */
export async function labelId(name: string): Promise<string> {
  if (labels.has(name)) return labels.get(name)!;
  const all = await gapi<{ labels?: Array<{ id: string; name: string }> }>('/labels');
  let id = all.labels?.find((l) => l.name === name)?.id;
  if (!id) id = (await gapi<{ id: string }>('/labels', { method: 'POST', body: JSON.stringify({ name, labelListVisibility: 'labelShow', messageListVisibility: 'show' }) })).id;
  labels.set(name, id);
  return id;
}
export const addLabel = async (messageId: string, name: string) =>
  gapi(`/messages/${messageId}/modify`, { method: 'POST', body: JSON.stringify({ addLabelIds: [await labelId(name)] }) });

const enc = (s: string) => `=?UTF-8?B?${Buffer.from(s).toString('base64')}?=`;
/** A short plain-text reply in the same thread, from the connected mailbox. */
export async function reply(to: string, subject: string, threadId: string, inReplyTo: string, text: string) {
  const subj = /^re:/i.test(subject) ? subject : `Re: ${subject || 'Solicitud'}`;
  const raw = [
    `To: ${to}`, `Subject: ${enc(subj)}`, ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`] : []),
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '',
    Buffer.from(text).toString('base64'),
  ].join('\r\n');
  return gapi('/messages/send', { method: 'POST', body: JSON.stringify({ raw: Buffer.from(raw).toString('base64url'), threadId }) });
}
