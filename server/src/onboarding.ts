// Onboarding, first 11 days (design 17-18): brief with the Researcher → Brand Brain draft → session with
// Nicolas → Nicolas signs → first delivery → live. State lives on brands/{id}.onboarding (backend writes only).
import { Hono } from 'hono';
import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { aiConfigured, claudeJson } from './ai.js';
import { notify } from './notify.js';
import type { AuthEnv } from './auth.js';

const now = () => FieldValue.serverTimestamp();
// Keep in sync with web/src/onboarding/questions.ts (the client shows the text).
export const BRIEF_KEYS = ['voice', 'audiences', 'competitors', 'offer', 'proof', 'references', 'avoid', 'goals'] as const;
type Brain = { voice: string; audiences: string; competitors: Array<{ name: string; promise: string; price: string }>; lookAndFeel: string; goals: string; avoid: string; position: string; criterio: string };

const brandRef = (id: string) => db.doc(`brands/${id}`);
const briefRef = (id: string) => db.doc(`brands/${id}/context/brief`);
const brainRef = (id: string) => db.doc(`brands/${id}/context/brain`);

async function member(uid: string, brandId: string) {
  return (await brandAccess(uid, brandId)).member;
}

/** Draft from the brief. With Claude: the Researcher writes it. Without: the answers, organized. */
async function draftBrain(brandName: string, answers: Record<string, string>): Promise<Brain> {
  const fallback: Brain = {
    voice: answers.voice ?? '', audiences: answers.audiences ?? '',
    competitors: (answers.competitors ?? '').split(/[,\n;]| y | and /).map((s) => s.trim()).filter(Boolean).slice(0, 5).map((name) => ({ name, promise: '', price: '' })),
    lookAndFeel: answers.references ?? '', goals: answers.goals ?? '', avoid: answers.avoid ?? '', position: '', criterio: '',
  };
  if (!aiConfigured()) return fallback;
  try {
    const out = await claudeJson<Partial<Brain>>(
      'You are the Researcher, one of the four Brains on the team of NickMark (Nicolas, founder of Braindy). With him, you turn a client brief into a Brand Brain draft that he will review and sign. Be concrete and short. Write in the language of the answers. Never invent numbers: leave unknown fields as empty strings.',
      `Brand: ${brandName}\nBrief answers (JSON): ${JSON.stringify(answers)}\n\nReturn {"voice": three traits plus "sounds like"/"never" examples, "audiences": main and secondary audience and what each needs to believe, "competitors": [{"name","promise","price"}], "lookAndFeel", "goals": goals in sales not likes, "avoid", "position": "", "criterio": ""}`,
    );
    return { ...fallback, ...out, competitors: Array.isArray(out.competitors) ? out.competitors.slice(0, 6) : fallback.competitors };
  } catch (e) {
    console.warn('brain draft fallback', String(e));
    return fallback;
  }
}

export const onboarding = new Hono<AuthEnv>();

onboarding.post('/brands/:brandId/brief/answer', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await member(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ key?: string; text?: string }>();
  if (!BRIEF_KEYS.includes(b.key as (typeof BRIEF_KEYS)[number])) return c.json({ error: 'invalid' }, 400);
  await briefRef(brandId).set({ answers: { [b.key!]: String(b.text ?? '').trim().slice(0, 4000) }, updatedBy: uid, updatedAt: now() }, { merge: true });
  await brandRef(brandId).set({ onboarding: { step: 'brief' } }, { merge: true });
  return c.json({ ok: true });
});

onboarding.post('/brands/:brandId/brief/complete', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await member(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const [brand, brief] = await Promise.all([brandRef(brandId).get(), briefRef(brandId).get()]);
  const answers = (brief.get('answers') ?? {}) as Record<string, string>;
  if (Object.values(answers).filter((v) => v?.trim()).length < 4) return c.json({ error: 'too_short' }, 400);
  const draft = await draftBrain(String(brand.get('name')), answers);
  await brainRef(brandId).set({ ...draft, status: 'draft', draftedBy: 'researcher', draftedWithAi: aiConfigured(), draftedAt: now() });
  await briefRef(brandId).set({ status: 'complete', completedAt: now() }, { merge: true });
  await brandRef(brandId).set({ onboarding: { step: 'brain', briefDoneAt: now() } }, { merge: true });
  await notify(brandId, 'brain_ready');
  return c.json({ ok: true, ai: aiConfigured() });
});

/** Next session slots (Bogotá): three business days, 9:00, 11:30 and 15:00, minus booked ones. */
onboarding.get('/brands/:brandId/session/slots', async (c) => {
  if (!(await member(c.get('user').uid, c.req.param('brandId')))) return c.json({ error: 'forbidden' }, 403);
  const slots: string[] = [];
  const d = new Date();
  while (slots.length < 9) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day === 0 || day === 6) continue;
    for (const [h, m] of [[9, 0], [11, 30], [15, 0]]) {
      slots.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h + 5, m)).toISOString()); // UTC-5
    }
  }
  const booked = new Set((await db.getAll(...slots.map((s) => db.doc(`sessions/${s}`)))).filter((s) => s.exists).map((s) => s.id));
  return c.json({ slots: slots.filter((s) => !booked.has(s)) });
});

onboarding.post('/brands/:brandId/session', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await member(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const { at } = await c.req.json<{ at?: string }>();
  const when = new Date(String(at));
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now()) return c.json({ error: 'invalid' }, 400);
  const id = when.toISOString();
  const ok = await db.runTransaction(async (tx) => {
    const slot = await tx.get(db.doc(`sessions/${id}`));
    if (slot.exists && slot.get('brandId') !== brandId) return false;
    tx.set(db.doc(`sessions/${id}`), { brandId, at: when, bookedBy: uid, createdAt: now() });
    return true;
  });
  if (!ok) return c.json({ error: 'taken' }, 409);
  await brandRef(brandId).set({ onboarding: { step: 'session', sessionAt: when } }, { merge: true });
  await notify(brandId, 'session_confirmed', { when: when.toLocaleString('es-CO', { weekday: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' }) });
  return c.json({ ok: true });
});

// ---------- admin ----------
export const adminOnboarding = new Hono<AuthEnv>();
adminOnboarding.use('/brands/:brandId/onboarding/*', async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, c.req.param('brandId')!)).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
});

adminOnboarding.post('/brands/:brandId/onboarding/start', async (c) => {
  const { brandId } = c.req.param();
  await brandRef(brandId).set({ onboarding: { step: 'brief', startedAt: now(), startedBy: c.get('user').uid } }, { merge: true });
  await notify(brandId, 'welcome');
  return c.json({ ok: true });
});

const BRAIN_FIELDS = ['voice', 'audiences', 'lookAndFeel', 'goals', 'avoid', 'position', 'criterio'] as const;

adminOnboarding.post('/brands/:brandId/onboarding/brain', async (c) => {
  const { brandId } = c.req.param();
  const b = await c.req.json<DocumentData>();
  const patch: DocumentData = { editedBy: c.get('user').uid, editedAt: now() };
  for (const k of BRAIN_FIELDS) if (typeof b[k] === 'string') patch[k] = b[k].slice(0, 4000);
  if (Array.isArray(b.competitors)) {
    patch.competitors = b.competitors.slice(0, 8).map((x: DocumentData) => ({ name: String(x.name ?? '').slice(0, 120), promise: String(x.promise ?? '').slice(0, 300), price: String(x.price ?? '').slice(0, 120), url: String(x.url ?? '').slice(0, 300) }));
  }
  await brainRef(brandId).set(patch, { merge: true });
  return c.json({ ok: true });
});

/** Signing locks this version: the Brains start and the client is told. */
adminOnboarding.post('/brands/:brandId/onboarding/sign', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  const brain = await brainRef(brandId).get();
  if (!brain.exists) return c.json({ error: 'no_draft' }, 400);
  const version = Number(brain.get('version') ?? 0) + 1;
  await db.batch()
    .set(brainRef(brandId), { status: 'signed', signedBy: uid, signedAt: now(), version }, { merge: true })
    .set(db.doc(`brands/${brandId}/context/brain/versions/v${version}`), { ...brain.data(), status: 'signed', signedBy: uid, signedAt: now(), version })
    .set(brandRef(brandId), { onboarding: { step: 'firstDelivery', signedAt: now() } }, { merge: true })
    .set(db.collection('audit').doc(), { type: 'brand_brain_signed', brandId, version, by: uid, at: now() })
    .commit();
  await notify(brandId, 'brain_signed');
  return c.json({ ok: true, version });
});

adminOnboarding.post('/brands/:brandId/onboarding/live', async (c) => {
  await brandRef(c.req.param('brandId')).set({ onboarding: { step: 'live', liveAt: now() } }, { merge: true });
  await notify(c.req.param('brandId'), 'live');
  return c.json({ ok: true });
});
