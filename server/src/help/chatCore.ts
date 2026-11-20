// One question to the assistant, for the JSON answer or the live (streamed) one. Checks access and the daily limit,
// asks the model (with tools when the app sends tools:true), saves the chat in helpChats and returns what to send back.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { aiConfigured, claudeChat, type ChatTurn } from '../ai.js';
import { answerWithTools, type Live } from './agent.js';
import type { ChatCard } from './reads.js';
import type { ActCard } from './actions.js';
import { readAttachments } from './attach.js';
import { helpSystem, readAnswer } from './guide.js';

const MODEL = process.env.HELP_MODEL ?? 'claude-sonnet-5-5';
const PER_DAY = 60; // questions per person per day
const TURNS = 12;
const CHARS = 1500;

export type Body = { brandId?: unknown; lang?: unknown; path?: unknown; messages?: unknown; chatId?: unknown; tools?: unknown; site?: unknown; files?: unknown };
type User = { uid: string; email?: string | null; name?: string };

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

export async function chat(user: User, b: Body, on?: Live) {
  const brandId = typeof b.brandId === 'string' ? b.brandId : '';
  const lang = b.lang === 'en' ? 'en' : 'es';
  const path = typeof b.path === 'string' ? b.path.slice(0, 120) : '/';
  const turns = turnsOf(b.messages);
  if (!brandId || !turns) return { status: 400 as const, body: { error: 'bad_request' } };
  if (!aiConfigured()) return { status: 503 as const, body: { error: 'ai_off' } };
  const access = await brandAccess(user.uid, brandId);
  if (!access.member) return { status: 403 as const, body: { error: 'forbidden' } };
  if (!(await spend(user.uid))) return { status: 429 as const, body: { error: 'limit' } };

  const [me, brand] = await Promise.all([db.doc(`users/${user.uid}`).get(), db.doc(`brands/${brandId}`).get()]);
  // Older app versions do not send tools: they keep the guide-only assistant until they update.
  const tools = b.tools === true;
  // In a group the assistant sends people to each company (a group has no work of its own).
  const group = brand.get('kind') === 'group'
    ? (await db.collection('brands').where('groupId', '==', brandId).limit(30).get()).docs.map((d) => String(d.get('name') ?? d.id)) : undefined;
  const att = tools ? await readAttachments(brandId, user.uid, access.admin, b.files) : { files: [], blocks: [] };
  const attached = att.files;
  const system = helpSystem({ tools,
    lang, path, sections: group ? access.sections.filter((s) => s === 'learn') : access.sections, group, role: access.admin ? 'admin' : access.role,
    canAsk: !group && (access.admin || access.sections.includes('requests')), today: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' }),
    name: String(me.get('name') ?? me.get('displayName') ?? user.name ?? ''), brand: String(brand.get('name') ?? brandId),
  });
  let answer: ReturnType<typeof readAnswer>;
  let cards: Array<ChatCard | ActCard> = [];
  try {
    const meta = { brandId, kind: 'help' };
    if (tools) {
      const out = await answerWithTools(system, turns, { brandId, access, lang, uid: user.uid, site: typeof b.site === 'string' ? b.site.slice(0, 300) : undefined, resultsOn: brand.get('resultsOn') === true }, { model: MODEL, meta, extra: att.blocks, on });
      answer = readAnswer(out.text);
      cards = [...answer.show.map((r) => out.cards.get(r)).filter((x): x is ChatCard => !!x), ...out.acts];
    } else answer = readAnswer(await claudeChat(system, turns, { model: MODEL, maxTokens: 1000, meta }));
  } catch {
    return { status: 502 as const, body: { error: 'ai_failed' } };
  }

  const ref = typeof b.chatId === 'string' && /^[\w-]{6,40}$/.test(b.chatId) ? db.doc(`helpChats/${b.chatId}`) : db.collection('helpChats').doc();
  const prev = await ref.get();
  if (prev.exists && prev.get('uid') !== user.uid) return { status: 403 as const, body: { error: 'forbidden' } };
  await ref.set({
    uid: user.uid, email: user.email ?? null, brandId, lang, path, next: answer.next,
    messages: [...turns, { role: 'assistant', content: answer.text }], ...(answer.draft ? { draft: answer.draft } : {}),
    // What the person saw (question with its files, answer with its cards), so the chat can be reopened from its history.
    view: [...((prev.get('view') as unknown[]) ?? []), { role: 'user', content: turns[turns.length - 1]!.content.replace(/\s*\[\[ADJUNTÉ[^\]]*\]\]/g, ''), ...(attached.length ? { files: attached } : {}) },
      { role: 'assistant', content: answer.text, next: answer.next, ...(answer.draft ? { draft: answer.draft } : {}), ...(cards.length ? { cards } : {}) }].slice(-40),
    title: prev.get('title') ?? turns.find((t) => t.role === 'user')!.content.replace(/\[\[[^\]]*\]\]/g, '').trim().slice(0, 80),
    updatedAt: FieldValue.serverTimestamp(), ...(prev.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true });
  return { status: 200 as const, body: { text: answer.text, next: answer.next, draft: answer.draft, cards, follow: answer.follow, chatId: ref.id } };
}
