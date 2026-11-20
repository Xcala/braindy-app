// The in-app assistant: answers how to use Braindy from the tutorial guide and looks up the brand with read-only tools, charged to the brand.
// Every conversation is kept in helpChats (server only) so NickMark can see what people ask and improve the app and the guide.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { aiConfigured, claudeChat, type ChatTurn } from '../ai.js';
import { answerWithTools } from './agent.js';
import type { ChatCard } from './reads.js';
import type { ActCard } from './actions.js';
import { readAttachments } from './attach.js';
import { helpSystem, readAnswer } from './guide.js';
import type { AuthEnv } from '../auth.js';

const MODEL = process.env.HELP_MODEL ?? 'claude-sonnet-5-5';
const PER_DAY = 60; // questions per person per day
const TURNS = 12;
const CHARS = 1500;

export const help = new Hono<AuthEnv>();

type Body = { brandId?: unknown; lang?: unknown; path?: unknown; messages?: unknown; chatId?: unknown; tools?: unknown; site?: unknown; files?: unknown };

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
  // Older app versions do not send tools: they keep the guide-only assistant until they update.
  const tools = b.tools === true;
  const att = tools ? await readAttachments(brandId, user.uid, access.admin, b.files) : { files: [], blocks: [] };
  const attached = att.files;
  const system = helpSystem({ tools,
    lang, path, sections: access.sections, role: access.admin ? 'admin' : access.role,
    canAsk: access.admin || access.sections.includes('requests'), today: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' }),
    name: String(me.get('name') ?? me.get('displayName') ?? user.name ?? ''), brand: String(brand.get('name') ?? brandId),
  });
  let answer: ReturnType<typeof readAnswer>;
  let cards: Array<ChatCard | ActCard> = [];
  try {
    const meta = { brandId, kind: 'help' };
    if (tools) {
      const out = await answerWithTools(system, turns, { brandId, access, lang, uid: user.uid, site: typeof b.site === 'string' ? b.site.slice(0, 300) : undefined, resultsOn: brand.get('resultsOn') === true }, { model: MODEL, meta, extra: att.blocks });
      answer = readAnswer(out.text);
      cards = [...answer.show.map((r) => out.cards.get(r)).filter((x): x is ChatCard => !!x), ...out.acts];
    } else answer = readAnswer(await claudeChat(system, turns, { model: MODEL, maxTokens: 1000, meta }));
  } catch {
    return c.json({ error: 'ai_failed' }, 502);
  }

  const ref = typeof b.chatId === 'string' && /^[\w-]{6,40}$/.test(b.chatId) ? db.doc(`helpChats/${b.chatId}`) : db.collection('helpChats').doc();
  const prev = await ref.get();
  if (prev.exists && prev.get('uid') !== user.uid) return c.json({ error: 'forbidden' }, 403);
  await ref.set({
    uid: user.uid, email: user.email ?? null, brandId, lang, path, next: answer.next,
    messages: [...turns, { role: 'assistant', content: answer.text }], ...(answer.draft ? { draft: answer.draft } : {}),
    // What the person saw (question with its files, answer with its cards), so the chat can be reopened from its history.
    view: [...((prev.get('view') as unknown[]) ?? []), { role: 'user', content: turns[turns.length - 1]!.content.replace(/\s*\[\[ADJUNTÉ[^\]]*\]\]/g, ''), ...(attached.length ? { files: attached } : {}) },
      { role: 'assistant', content: answer.text, next: answer.next, ...(answer.draft ? { draft: answer.draft } : {}), ...(cards.length ? { cards } : {}) }].slice(-40),
    title: prev.get('title') ?? turns.find((t) => t.role === 'user')!.content.replace(/\[\[[^\]]*\]\]/g, '').trim().slice(0, 80),
    updatedAt: FieldValue.serverTimestamp(), ...(prev.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true });
  return c.json({ text: answer.text, next: answer.next, draft: answer.draft, cards, chatId: ref.id });
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
