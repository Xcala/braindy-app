// AI spend per brand (admin-only, Brand OS cost tracking). Every Claude call made by braindy-api is recorded
// in brands/{brandId}/usage with its tokens and API cost; the session importer writes Claude Code sessions there too.
// Costs are API list prices in USD; the Max subscription is prorated in the admin panel, not here.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { logError } from './guard.js';

/** USD per million tokens: input, output, cache read. Cache writes cost 1.25× input (5 min) or 2× input (1 h). */
const PRICES: Array<[prefix: string, input: number, output: number, cacheRead: number]> = [
  ['claude-fable-5-1', 10, 50, 0.25], ['claude-mythos-5-1', 10, 50, 0.25], ['claude-fable-5', 10, 50, 1],
  ['claude-opus-5-5', 4, 20, 0.2], ['claude-opus-5', 5, 25, 0.5], ['claude-opus-4', 5, 25, 0.5],
  ['claude-sonnet-5-5', 2, 10, 0.2], ['claude-sonnet-5', 2, 10, 0.2], ['claude-sonnet-4', 3, 15, 0.3],
  ['claude-haiku-5-5', 0.1, 0.5, 0.01], ['claude-haiku-4', 1, 5, 0.1],
];

export type ClaudeUsage = {
  input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number;
  cache_creation?: { ephemeral_5m_input_tokens?: number; ephemeral_1h_input_tokens?: number };
};

export type Tokens = { input: number; output: number; cacheWrite5m: number; cacheWrite1h: number; cacheRead: number };

export function tokensOf(u: ClaudeUsage | undefined): Tokens {
  const w1h = u?.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const w5m = u?.cache_creation?.ephemeral_5m_input_tokens ?? Math.max(0, (u?.cache_creation_input_tokens ?? 0) - w1h);
  return { input: u?.input_tokens ?? 0, output: u?.output_tokens ?? 0, cacheWrite5m: w5m, cacheWrite1h: w1h, cacheRead: u?.cache_read_input_tokens ?? 0 };
}

/** API list cost in USD; unknown models are priced as the current Opus. */
export function claudeCost(model: string, t: Tokens): number {
  const [, i, o, r] = PRICES.find(([p]) => model.startsWith(p)) ?? PRICES[3];
  return (t.input * i + t.cacheWrite5m * i * 1.25 + t.cacheWrite1h * i * 2 + t.cacheRead * r + t.output * o) / 1e6;
}

export const monthOf = (d = new Date()) => d.toISOString().slice(0, 7);

/** Who the work was for: Nicolas's agency work or the client's own Brand OS (self-serve with credits). */
export type UsageMeta = { brandId: string; kind: string; mode?: 'agency' | 'brandos'; requestId?: string; taskId?: string };

/** Records one Claude API call. Never throws: a failed record must not break the work it measures. */
export async function recordClaude(meta: UsageMeta | undefined, model: string, usage: ClaudeUsage | undefined) {
  if (!meta?.brandId) return;
  try {
    const t = tokensOf(usage);
    await db.collection(`brands/${meta.brandId}/usage`).add({
      platform: 'claude', source: 'api', model, ...t, usd: Math.round(claudeCost(model, t) * 1e6) / 1e6,
      kind: meta.kind, mode: meta.mode ?? 'agency', requestId: meta.requestId ?? null, taskId: meta.taskId ?? null,
      month: monthOf(), at: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    logError(e, { where: 'usage', brandId: meta.brandId });
  }
}
