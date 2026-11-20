// Tools the ElevenLabs agent calls during a call (server webhooks). Each action is kept on the call in Braindy
// and forwarded, signed, to the client site's form endpoint so it lands where the web form's entries land
// (Puerta del Sol: Firestore `envios` + the same Resend emails). Never log names, phones or emails.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { TOOL_KEY, agentConfig, same, signBody } from './config.js';

/** Tool action → `tipo` the client site understands. */
const ACTIONS = {
  reservar: 'book',       // new table reservation
  cambiar: 'change',      // change an existing reservation
  cancelar: 'cancel',     // cancel a reservation
  avisar: 'late',         // running late / message for the host
  evento: 'event',        // private or corporate event request
} as const;
type Action = keyof typeof ACTIONS;

const FIELDS = ['nombre', 'telefono', 'correo', 'personas', 'fecha', 'hora', 'tipo_reserva', 'mensaje', 'idioma'] as const;
const clean = (v: unknown, max = 300) => String(v ?? '').replace(/[\u0000-\u001F]/g, ' ').trim().slice(0, max);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{1,2}:\d{2}$/;

export const voiceTools = new Hono();

voiceTools.post('/voice/tool/:action', async (c) => {
  if (!TOOL_KEY || !same(c.req.header('x-voice-key') ?? '', TOOL_KEY)) return c.json({ ok: false }, 401);
  const action = c.req.param('action') as Action;
  if (!(action in ACTIONS)) return c.json({ ok: false, error: 'action' }, 404);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const agentId = clean(body.agent_id, 80);
  const conversationId = clean(body.conversation_id, 80) || 'sin-id';
  const agent = await agentConfig(agentId);
  if (!agent) return c.json({ ok: false, error: 'agent' }, 403);

  const data: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f, clean(body[f], f === 'mensaje' ? 1500 : 200)]));
  if (!data.telefono) data.telefono = clean(body.caller_id, 40); // the number that called, when the guest gives none
  // Tell the agent what is missing so it asks again instead of inventing it.
  const need: Record<Action, string[]> = {
    reservar: ['nombre', 'personas', 'fecha', 'hora'],
    cambiar: ['nombre', 'mensaje'],
    cancelar: ['nombre'],
    avisar: ['nombre', 'mensaje'],
    evento: ['nombre', 'personas', 'fecha'],
  };
  const missing = need[action].filter((f) => !data[f]);
  if (data.fecha && !DATE.test(data.fecha)) missing.push('fecha (YYYY-MM-DD)');
  if (data.hora && !TIME.test(data.hora)) missing.push('hora (HH:MM, 24 h)');
  if (missing.length) return c.json({ ok: false, error: 'missing', missing });

  const tipo = ACTIONS[action];
  const payload = { ...data, tipo, origen: 'telefono', canal: clean(body.canal, 20) || 'telefono', conversacion: conversationId, pagina: 'phone' };

  // Forward to the site (same storage and emails as the web form). A failure is kept so nothing is lost.
  let forward: 'ok' | 'error' | 'none' = 'none';
  if (agent.forwardUrl) {
    const raw = JSON.stringify(payload);
    const sig = signBody(agent.brandId, raw);
    const r = sig
      ? await fetch(agent.forwardUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-braindy-signature': sig }, body: raw, signal: AbortSignal.timeout(15_000) }).catch(() => null)
      : null;
    forward = r?.ok ? 'ok' : 'error';
    if (!r?.ok) console.warn('voice forward failed', agent.brandId, action, r?.status ?? (sig ? 'network' : 'no_key'));
  }

  await db.doc(`brands/${agent.brandId}/calls/${conversationId}`).set({
    agentId, source: 'elevenlabs', updatedAt: FieldValue.serverTimestamp(),
    actions: FieldValue.arrayUnion({ action, tipo, ...data, forward, at: new Date().toISOString() }),
  }, { merge: true });

  // What the agent hears back: short, so it can confirm to the guest.
  return c.json(forward === 'error'
    ? { ok: true, saved: true, note: 'Saved for the team; tell the guest the restaurant will confirm shortly.' }
    : { ok: true, saved: true });
});
