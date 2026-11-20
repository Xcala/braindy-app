// Call history: ElevenLabs post-call webhook → `brands/{brandId}/calls/{conversationId}`, and the list the app shows.
// The webhook is signed (header `ElevenLabs-Signature: t=<unix>,v0=<hex HMAC-SHA256(secret, "t.body")>`).
// Never log transcripts, names or phone numbers.
import { createHmac } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import type { AuthEnv } from '../auth.js';
import { WEBHOOK_SECRET, agentConfig, same } from './config.js';

function signatureOk(raw: string, header: string | undefined): boolean {
  if (!WEBHOOK_SECRET || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 30 * 60) return false;
  return same(parts.v0 ?? '', createHmac('sha256', WEBHOOK_SECRET).update(`${parts.t}.${raw}`).digest('hex'));
}

type Turn = { role?: string; message?: string | null; time_in_call_secs?: number };
type PostCall = {
  type?: string;
  data?: {
    agent_id?: string; conversation_id?: string; status?: string;
    transcript?: Turn[];
    metadata?: { start_time_unix_secs?: number; call_duration_secs?: number; cost?: number; termination_reason?: string;
      phone_call?: { external_number?: string; agent_number?: string; direction?: string } };
    analysis?: { call_successful?: string; transcript_summary?: string; call_summary_title?: string;
      data_collection_results?: Record<string, { value?: unknown }> };
    conversation_initiation_client_data?: { dynamic_variables?: Record<string, unknown> };
  };
};

export const voiceWebhook = new Hono();

voiceWebhook.post('/voice/post-call', async (c) => {
  const raw = await c.req.text();
  if (!signatureOk(raw, c.req.header('elevenlabs-signature'))) return c.text('bad_signature', 401);
  let body: PostCall;
  try { body = JSON.parse(raw) as PostCall; } catch { return c.text('bad_json', 400); }
  if (body.type !== 'post_call_transcription' || !body.data?.conversation_id) return c.json({ ok: true, ignored: true });

  const d = body.data;
  const agent = await agentConfig(d.agent_id ?? '');
  if (!agent) return c.json({ ok: true, ignored: 'agent' }); // 200 so ElevenLabs does not retry for unknown agents

  const m = d.metadata ?? {};
  const a = d.analysis ?? {};
  const collected = Object.fromEntries(Object.entries(a.data_collection_results ?? {}).map(([k, v]) => [k, v?.value ?? null]));
  await db.doc(`brands/${agent.brandId}/calls/${d.conversation_id}`).set({
    agentId: d.agent_id, source: 'elevenlabs', status: d.status ?? null,
    startedAt: m.start_time_unix_secs ? Timestamp.fromMillis(m.start_time_unix_secs * 1000) : FieldValue.serverTimestamp(),
    durationSec: m.call_duration_secs ?? null,
    from: m.phone_call?.external_number ?? null,
    channel: m.phone_call ? 'telefono' : 'web',
    direction: m.phone_call?.direction ?? 'inbound',
    ended: m.termination_reason ?? null,
    successful: a.call_successful ?? null,
    title: a.call_summary_title ?? null,
    summary: a.transcript_summary ?? null,
    collected,
    transcript: (d.transcript ?? []).slice(0, 300).map((t) => ({ role: t.role ?? '', text: String(t.message ?? '').slice(0, 2000), at: t.time_in_call_secs ?? null })),
    cost: m.cost ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return c.json({ ok: true });
});

/** The brand's calls, newest first (no transcript in the list; open one call for it). */
export const voiceCalls = new Hono<AuthEnv>();

voiceCalls.get('/brands/:brandId/calls', async (c) => {
  const brandId = c.req.param('brandId');
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200);
  const snap = await db.collection(`brands/${brandId}/calls`).orderBy('startedAt', 'desc').limit(limit).get();
  return c.json({ calls: snap.docs.map((s) => {
    const { transcript: _t, ...rest } = s.data();
    return { id: s.id, ...rest, startedAt: (rest.startedAt as Timestamp | undefined)?.toMillis?.() ?? null };
  }) });
});

voiceCalls.get('/brands/:brandId/calls/:callId', async (c) => {
  const { brandId, callId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const s = await db.doc(`brands/${brandId}/calls/${callId}`).get();
  if (!s.exists) return c.json({ error: 'not_found' }, 404);
  const v = s.data()!;
  return c.json({ id: s.id, ...v, startedAt: (v.startedAt as Timestamp | undefined)?.toMillis?.() ?? null });
});
