// AI receptionist ("Recepcionista IA"): one ElevenLabs agent per brand that answers the phone (and WhatsApp/SMS),
// takes reservations and keeps the call history in Braindy. Shared secrets (Secret Manager, never logged):
//   VOICE_TOOL_KEY       header the ElevenLabs tools send (an ElevenLabs workspace secret holds the same value)
//   ELEVENLABS_WEBHOOK_SECRET  HMAC secret of the ElevenLabs post-call webhook
//   VOICE_FORWARD_SECRET master key; each client site gets only its derived key (siteKey), so one site's key
//                        cannot sign requests for another site.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '../firebase.js';

export const TOOL_KEY = process.env.VOICE_TOOL_KEY?.trim();
export const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET?.trim();
const FORWARD_SECRET = process.env.VOICE_FORWARD_SECRET?.trim();

export const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** `voiceAgents/{agentId}`: which brand an ElevenLabs agent belongs to and where its reservations go. */
export type VoiceAgent = {
  brandId: string;
  /** The client site's form endpoint (e.g. https://www.puertadelsol.us/api/form). Empty = keep only in Braindy. */
  forwardUrl?: string;
  active?: boolean;
};

const cache = new Map<string, { at: number; v: VoiceAgent | null }>();
export async function agentConfig(agentId: string): Promise<VoiceAgent | null> {
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(agentId)) return null;
  const hit = cache.get(agentId);
  if (hit && Date.now() - hit.at < 60_000) return hit.v;
  const snap = await db.doc(`voiceAgents/${agentId}`).get();
  const v = snap.exists && snap.get('active') !== false ? (snap.data() as VoiceAgent) : null;
  cache.set(agentId, { at: Date.now(), v });
  return v;
}

/** Per-site key: HMAC(master, brandId). Printed once by scripts/voice-site-key.ts and stored in the site's secrets. */
export function siteKey(brandId: string): string | null {
  return FORWARD_SECRET ? createHmac('sha256', FORWARD_SECRET).update(`site:${brandId}`).digest('hex') : null;
}

/** Signature header for a forwarded body: `t=<unix>,v1=<hex HMAC(siteKey, "t.body")>`. */
export function signBody(brandId: string, body: string): string | null {
  const key = siteKey(brandId);
  if (!key) return null;
  const t = Math.floor(Date.now() / 1000);
  return `t=${t},v1=${createHmac('sha256', key).update(`${t}.${body}`).digest('hex')}`;
}
