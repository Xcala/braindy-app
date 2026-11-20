// One Claude turn with tools, streamed: the text reaches `onText` as it is written, and the call returns the same
// { content, stop } as claudeTurn. Retried only before the first byte; logged and charged like the other calls.
import { claudeCost, recordClaude, tokensOf, type ClaudeUsage, type UsageMeta } from './usage.js';
import { recordCall } from './aiLog.js';
import type { Block, Tool } from './ai.js';

const KEY = process.env.ANTHROPIC_API_KEY?.trim();
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';
const RETRY = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

async function open(body: string) {
  let last = new Error('ai_failed');
  for (let n = 1; n <= 3; n++) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: AbortSignal.timeout(120_000), body,
        headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      });
      if (r.ok && r.body) return { r, attempts: n };
      // The reason comes back in the body (e.g. an invalid message); it is kept in the call log, never the prompt.
      const why = r.status < 500 ? (await r.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160) : '';
      last = Object.assign(new Error(`ai_http_${r.status}${why ? ` ${why}` : ''}`), { attempts: n });
      if (!RETRY.has(r.status)) throw last;
    } catch (e) {
      last = e as Error;
      if ((e as Error).message.startsWith('ai_http_4') && !(e as Error).message.startsWith('ai_http_429')) throw e;
    }
    await new Promise((res) => setTimeout(res, 1000 * 3 ** (n - 1)));
  }
  throw last;
}

export async function claudeTurnStream(system: string, messages: unknown[], tools: Tool[], onText: (d: string) => void,
  o: { maxTokens?: number; meta?: UsageMeta; model?: string; noTools?: boolean } = {}) {
  if (!KEY) throw new Error('ai_not_configured');
  const asked = o.model ?? MODEL;
  const t0 = Date.now();
  const log = { brandId: o.meta?.brandId ?? null, kind: o.meta?.kind ?? 'other', taskId: o.meta?.taskId ?? null, requestId: o.meta?.requestId ?? null };
  let attempts = 1;
  try {
    const opened = await open(JSON.stringify({ model: asked, max_tokens: o.maxTokens ?? 2000, system, messages, tools, stream: true, ...(o.noTools ? { tool_choice: { type: 'none' } } : {}) }));
    attempts = opened.attempts;
    const blocks: Block[] = [];
    const json: string[] = [];
    let usage: ClaudeUsage = {} as ClaudeUsage;
    let model = asked, stop = 'end_turn';
    const reader = opened.r.body!.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let cut: number;
      while ((cut = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, cut); buf = buf.slice(cut + 2);
        const data = chunk.split('\n').find((l) => l.startsWith('data:'))?.slice(5).trim();
        if (!data) continue;
        const ev = JSON.parse(data) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (ev.type === 'message_start') { model = ev.message?.model ?? model; usage = { ...usage, ...(ev.message?.usage ?? {}) }; }
        else if (ev.type === 'content_block_start') { blocks[ev.index] = { ...ev.content_block }; json[ev.index] = ''; }
        else if (ev.type === 'content_block_delta') {
          const b = blocks[ev.index]!;
          if (ev.delta?.type === 'text_delta') { b.text = (b.text ?? '') + ev.delta.text; onText(ev.delta.text); }
          else if (ev.delta?.type === 'input_json_delta') json[ev.index] += ev.delta.partial_json ?? '';
        } else if (ev.type === 'content_block_stop') {
          const b = blocks[ev.index];
          if (b?.type === 'tool_use') { try { b.input = json[ev.index] ? JSON.parse(json[ev.index]!) : {}; } catch { b.input = {}; } }
        } else if (ev.type === 'message_delta') { stop = ev.delta?.stop_reason ?? stop; usage = { ...usage, ...(ev.usage ?? {}) }; }
        else if (ev.type === 'error') throw new Error(`ai_stream_${ev.error?.type ?? 'error'}`);
      }
    }
    const t = tokensOf(usage);
    await Promise.all([
      recordClaude(o.meta, model, usage),
      recordCall({ ...log, model, ok: true, ms: Date.now() - t0, attempts, usd: claudeCost(model, t), input: t.input, output: t.output }),
    ]);
    // An empty text block (the model went straight to a tool) is rejected when sent back in the next round.
    return { content: blocks.filter((b) => b && !(b.type === 'text' && !b.text?.trim())), stop };
  } catch (e) {
    await recordCall({ ...log, model: asked, ok: false, error: (e as Error).message.slice(0, 240), ms: Date.now() - t0, attempts });
    throw e;
  }
}
