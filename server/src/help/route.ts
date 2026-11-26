// The in-app assistant: answers how to use Braindy from the tutorial guide and looks up the brand with read-only tools, charged to the brand.
// Every conversation is kept in helpChats (server only) so NickMark can see what people ask and improve the app and the guide.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { streamSSE } from 'hono/streaming';
import { chat, type Body } from './chatCore.js';
import type { AuthEnv } from '../auth.js';

export const help = new Hono<AuthEnv>();

help.post('/help/chat', async (c) => {
  const r = await chat(c.get('user'), (await c.req.json().catch(() => ({}))) as Body);
  return c.json(r.body, r.status);
});

/** The same question, answered live: «delta» events with the text as it is written («reset» when it goes to look something up), then «done» with the full answer. */
help.post('/help/chat/stream', async (c) => {
  const user = c.get('user');
  const b = (await c.req.json().catch(() => ({}))) as Body;
  return streamSSE(c, async (s) => {
    const send = (event: string, data: unknown) => { void s.writeSSE({ event, data: JSON.stringify(data) }); };
    const r = await chat(user, b, { text: (d: string) => send('delta', d), reset: () => send('reset', 1) });
    await s.writeSSE({ event: 'done', data: JSON.stringify({ status: r.status, ...r.body }) });
  });
});

/** The person passed the conversation to Nick (WhatsApp opens on their side); the chat is marked so it shows up for him. */
help.post('/help/handoff', async (c) => {
  const { chatId } = (await c.req.json().catch(() => ({}))) as { chatId?: unknown };
  if (typeof chatId !== 'string' || !/^[\w-]{6,40}$/.test(chatId)) return c.json({ error: 'bad_request' }, 400);
  const ref = db.doc(`helpChats/${chatId}`);
  const snap = await ref.get();
  if (!snap.exists || snap.get('uid') !== c.get('user').uid) return c.json({ error: 'not_found' }, 404);
  await ref.update({ handoff: true, handoffAt: FieldValue.serverTimestamp() });
  return c.json({ ok: true });
});

/** The person's own conversations in this brand, newest first (title and date), for «Your chats». */
help.get('/help/chats', async (c) => {
  const uid = c.get('user').uid;
  const brandId = String(c.req.query('brandId') ?? '');
  if (!/^[\w-]{1,80}$/.test(brandId)) return c.json({ error: 'bad_request' }, 400);
  // Two equalities and no order: no composite index needed; sorted here.
  const snap = await db.collection('helpChats').where('uid', '==', uid).where('brandId', '==', brandId).select('title', 'updatedAt', 'view', 'hidden').limit(200).get();
  const chats = snap.docs.filter((d) => Array.isArray(d.get('view')) && d.get('title') && !d.get('hidden'))
    .map((d) => ({ id: d.id, title: String(d.get('title')), at: (d.get('updatedAt') as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0 }))
    .sort((a, b) => b.at - a.at).slice(0, 30);
  return c.json({ chats });
});

/** One of the person's conversations, as they saw it. */
help.get('/help/chats/:id', async (c) => {
  const id = c.req.param('id');
  if (!/^[\w-]{6,40}$/.test(id)) return c.json({ error: 'bad_request' }, 400);
  const snap = await db.doc(`helpChats/${id}`).get();
  if (!snap.exists || snap.get('uid') !== c.get('user').uid || snap.get('hidden')) return c.json({ error: 'not_found' }, 404);
  return c.json({ id, brandId: snap.get('brandId'), view: snap.get('view') ?? [] });
});

/** Rename one of the person's chats (only its title in «Your chats»). */
help.patch('/help/chats/:id', async (c) => {
  const id = c.req.param('id');
  const { title } = (await c.req.json().catch(() => ({}))) as { title?: unknown };
  const clean = typeof title === 'string' ? title.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  if (!/^[\w-]{6,40}$/.test(id) || !clean) return c.json({ error: 'bad_request' }, 400);
  const ref = db.doc(`helpChats/${id}`);
  const snap = await ref.get();
  if (!snap.exists || snap.get('uid') !== c.get('user').uid) return c.json({ error: 'not_found' }, 404);
  await ref.update({ title: clean });
  return c.json({ ok: true, title: clean });
});

/** Delete from «Your chats»: it leaves the person's list for good; the record stays server-side so NickMark can improve the guide. */
help.delete('/help/chats/:id', async (c) => {
  const id = c.req.param('id');
  if (!/^[\w-]{6,40}$/.test(id)) return c.json({ error: 'bad_request' }, 400);
  const ref = db.doc(`helpChats/${id}`);
  const snap = await ref.get();
  if (!snap.exists || snap.get('uid') !== c.get('user').uid) return c.json({ error: 'not_found' }, 404);
  await ref.update({ hidden: true, hiddenAt: FieldValue.serverTimestamp() });
  return c.json({ ok: true });
});
