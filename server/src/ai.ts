// Claude calls (backend only, never from the browser). Key in Secret Manager as ANTHROPIC_API_KEY.
// Without a key, aiConfigured() is false and callers use their non-AI fallback.
// Every call is retried on overload / server errors and logged in aiCalls (admin · AI health).
import { claudeCost, recordClaude, tokensOf, type ClaudeUsage, type UsageMeta } from './usage.js';
import { recordCall } from './aiLog.js';

const KEY = process.env.ANTHROPIC_API_KEY?.trim();
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';
const ATTEMPTS = 3;
const TIMEOUT_MS = 120_000;
/** Worth another try: rate limit, overload, server errors. 4xx client errors are not. */
const RETRY = new Set([408, 409, 429, 500, 502, 503, 504, 529]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const aiConfigured = () => !!KEY;

type Answer = { model?: string; usage?: ClaudeUsage; content?: Array<{ type: string; text?: string }> };

/** One request with retries. Returns the answer and how many attempts it took; throws the last error. */
async function send(body: string): Promise<{ j: Answer; attempts: number }> {
  let last = new Error('ai_failed');
  for (let n = 1; n <= ATTEMPTS; n++) {
    let wait = 1000 * 3 ** (n - 1);
    let r: Response;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: AbortSignal.timeout(TIMEOUT_MS), body,
        headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      });
    } catch (e) {
      last = Object.assign(new Error((e as Error).name === 'TimeoutError' ? 'ai_timeout' : 'ai_network'), { attempts: n });
      if (n < ATTEMPTS) await sleep(wait);
      continue;
    }
    if (r.ok) return { j: (await r.json()) as Answer, attempts: n };
    last = Object.assign(new Error(`ai_http_${r.status}`), { attempts: n });
    if (!RETRY.has(r.status)) throw last;
    const after = Number(r.headers.get('retry-after'));
    if (after > 0) wait = Math.min(after * 1000, 15_000);
    if (n < ATTEMPTS) await sleep(wait);
  }
  throw last;
}

/** `meta` names the brand the call works for, so its tokens and cost land in that brand's usage. */
export async function claude(system: string, user: string, maxTokens = 2000, meta?: UsageMeta): Promise<string> {
  return claudeChat(system, [{ role: 'user', content: user }], { maxTokens, meta });
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

/** A conversation (the last turn must be the user's). `model` overrides the default, e.g. a lighter one for app help. */
export async function claudeChat(system: string, messages: ChatTurn[], o: { maxTokens?: number; meta?: UsageMeta; model?: string } = {}): Promise<string> {
  if (!KEY) throw new Error('ai_not_configured');
  const { maxTokens = 2000, meta } = o;
  const asked = o.model ?? MODEL;
  const t0 = Date.now();
  const log = { brandId: meta?.brandId ?? null, kind: meta?.kind ?? 'other', taskId: meta?.taskId ?? null, requestId: meta?.requestId ?? null };
  try {
    const { j, attempts } = await send(JSON.stringify({ model: asked, max_tokens: maxTokens, system, messages }));
    const model = j.model ?? asked;
    const t = tokensOf(j.usage);
    await Promise.all([
      recordClaude(meta, model, j.usage),
      recordCall({ ...log, model, ok: true, ms: Date.now() - t0, attempts, usd: claudeCost(model, t), input: t.input, output: t.output }),
    ]);
    return (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  } catch (e) {
    const err = e as Error & { attempts?: number };
    await recordCall({ ...log, model: asked, ok: false, error: err.message.slice(0, 80), ms: Date.now() - t0, attempts: err.attempts ?? ATTEMPTS });
    throw e;
  }
}

/** Asks for JSON and parses the first object in the answer. A bad answer is logged as its own failure. */
export async function claudeJson<T>(system: string, user: string, maxTokens = 2000, meta?: UsageMeta): Promise<T> {
  const text = await claude(`${system}\nAnswer with one JSON object only, no prose.`, user, maxTokens, meta);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  try {
    if (start < 0 || end < start) throw new Error('ai_bad_json');
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    await recordCall({ brandId: meta?.brandId ?? null, kind: meta?.kind ?? 'other', taskId: meta?.taskId ?? null, requestId: meta?.requestId ?? null, model: MODEL, ok: false, error: 'ai_bad_json', ms: 0, attempts: 1 });
    throw new Error('ai_bad_json');
  }
}
