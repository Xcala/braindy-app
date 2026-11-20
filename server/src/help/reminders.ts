// Reminders the person asked the assistant for («remind me on Friday to check the video»). Saved when they confirm the
// card; on the day they get a push alert (daily job) and, when they open the app, the chat shows the ones that are due.
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { pushTo } from '../push/send.js';
import type { AuthEnv } from '../auth.js';

export const reminders = new Hono<AuthEnv>();

reminders.post('/help/reminders', async (c) => {
  const uid = c.get('user').uid;
  const b = (await c.req.json().catch(() => ({}))) as { brandId?: unknown; at?: unknown; text?: unknown };
  const brandId = String(b.brandId ?? ''), text = String(b.text ?? '').trim().slice(0, 600), at = Date.parse(String(b.at ?? ''));
  if (!/^[\w-]{1,80}$/.test(brandId) || !text || !Number.isFinite(at) || at > Date.now() + 366 * 86_400_000) return c.json({ error: 'bad_request' }, 400);
  if (!(await brandAccess(uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const open = await db.collection('helpReminders').where('uid', '==', uid).where('done', '==', false).count().get();
  if (open.data().count >= 50) return c.json({ error: 'too_many' }, 429);
  const ref = await db.collection('helpReminders').add({ uid, brandId, text, at: Timestamp.fromMillis(at), done: false, pushed: false, createdAt: FieldValue.serverTimestamp() });
  return c.json({ ok: true, id: ref.id });
});

/** The person's reminders in this brand that are due now; they are marked done once shown. */
reminders.get('/help/reminders/due', async (c) => {
  const uid = c.get('user').uid;
  const brandId = String(c.req.query('brandId') ?? '');
  if (!/^[\w-]{1,80}$/.test(brandId)) return c.json({ error: 'bad_request' }, 400);
  // Equalities only (no composite index); the date is checked here.
  const snap = await db.collection('helpReminders').where('uid', '==', uid).where('done', '==', false).limit(60).get();
  const due = snap.docs.filter((d) => d.get('brandId') === brandId && (d.get('at') as Timestamp).toMillis() <= Date.now());
  await Promise.all(due.map((d) => d.ref.update({ done: true, shownAt: FieldValue.serverTimestamp() })));
  return c.json({ due: due.map((d) => ({ id: d.id, text: String(d.get('text')), at: (d.get('at') as Timestamp).toMillis() })) });
});

/** Daily job: a push alert for each reminder due today or before that has not been alerted yet. */
export async function pushDueReminders() {
  const end = new Date(); end.setUTCHours(23, 59, 59, 999);
  const snap = await db.collection('helpReminders').where('pushed', '==', false).limit(500).get();
  const due = snap.docs.filter((d) => (d.get('at') as Timestamp).toMillis() <= end.getTime());
  for (const d of due) {
    const text = String(d.get('text'));
    await pushTo([String(d.get('uid'))], { kind: 'due', tag: `rem-${d.id}`, url: `/home?brand=${encodeURIComponent(String(d.get('brandId')))}`,
      title: { es: '⏰ Tu recordatorio', en: '⏰ Your reminder' }, body: { es: text.slice(0, 140), en: text.slice(0, 140) } }, { ignorePrefs: true }).catch(() => undefined);
    await d.ref.update({ pushed: true });
  }
  return { reminders: due.length };
}
