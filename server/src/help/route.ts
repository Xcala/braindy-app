// The in-app help assistant: answers how to use Braindy from the tutorial guide, on a lighter model, charged to the brand.
// Every conversation is kept in helpChats (server only) so NickMark can see what people ask and improve the app and the guide.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { aiConfigured, claudeChat, type ChatTurn } from '../ai.js';
import { helpSystem, readAnswer } from './guide.js';
import type { AuthEnv } from '../auth.js';

const MODEL = process.env.HELP_MODEL ?? 'claude-sonnet-5-5';
const PER_DAY = 60; // questions per person per day
const TURNS = 12;
const CHARS = 1500;

export const help = new Hono<AuthEnv>();

type Body = { brandId?: unknown; lang?: unknown; path?: unknown; messages?: unknown; chatId?: unknown };

function turnsOf(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw)) return null;
  const turns = raw.slice(-TURNS).flatMap((m) => {
    const role = (m as ChatTurn)?.role, content = (m as ChatTurn)?.content;
    return (role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim() ? [{ role, content: content.slice(0, CHARS) }] : [];
  });
  while (turns[0]?.role === 'assistant') turns.shift(); // the API wants the user first
  return turns.length && turns[turns.length - 1]!.role === 'user' ? turns : null;
}

/** One more question today, or false when the person reached the daily limit. */
async function spend(uid: string) {
  const ref = db.doc(`helpUsage/${uid}_${new Date().toISOString().slice(0, 10)}`);
  return db.runTransaction(async (tx) => {
    const n = Number((await tx.get(ref)).get('n') ?? 0);
    if (n >= PER_DAY) return false;
    tx.set(ref, { n: n + 1, uid, at: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
}

help.post('/help/chat', async (c) => {
  const user = c.get('user');
  const b = (await c.req.json().catch(() => ({}))) as Body;
  const brandId = typeof b.brandId === 'string' ? b.brandId : '';
  const lang = b.lang === 'en' ? 'en' : 'es';
  const path = typeof b.path === 'string' ? b.path.slice(0, 120) : '/';
  const turns = turnsOf(b.messages);
  if (!brandId || !turns) return c.json({ error: 'bad_request' }, 400);
  if (!aiConfigured()) return c.json({ error: 'ai_off' }, 503);
  const access = await brandAccess(user.uid, brandId);
  if (!access.member) return c.json({ error: 'forbidden' }, 403);
  if (!(await spend(user.uid))) return c.json({ error: 'limit' }, 429);

  const [me, brand] = await Promise.all([db.doc(`users/${user.uid}`).get(), db.doc(`brands/${brandId}`).get()]);
  const system = helpSystem({
    lang, path, sections: access.sections, role: access.admin ? 'admin' : access.role,
    name: String(me.get('name') ?? me.get('displayName') ?? user.name ?? ''), brand: String(brand.get('name') ?? brandId),
  });
  let answer: ReturnType<typeof readAnswer>;
  try {
    answer = readAnswer(await claudeChat(system, turns, { model: MODEL, maxTokens: 700, meta: { brandId, kind: 'help' } }));
  } catch {
    return c.json({ error: 'ai_failed' }, 502);
  }

  const ref = typeof b.chatId === 'string' && /^[\w-]{6,40}$/.test(b.chatId) ? db.doc(`helpChats/${b.chatId}`) : db.collection('helpChats').doc();
  const prev = await ref.get();
  if (prev.exists && prev.get('uid') !== user.uid) return c.json({ error: 'forbidden' }, 403);
  await ref.set({
    uid: user.uid, email: user.email ?? null, brandId, lang, path, next: answer.next,
    messages: [...turns, { role: 'assistant', content: answer.text }],
    updatedAt: FieldValue.serverTimestamp(), ...(prev.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true });
  return c.json({ text: answer.text, next: answer.next, chatId: ref.id });
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
