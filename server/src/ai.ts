// Claude calls (backend only, never from the browser). Key in Secret Manager as ANTHROPIC_API_KEY.
// Without a key, aiConfigured() is false and callers use their non-AI fallback.
const KEY = process.env.ANTHROPIC_API_KEY?.trim();
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';

export const aiConfigured = () => !!KEY;

export async function claude(system: string, user: string, maxTokens = 2000): Promise<string> {
  if (!KEY) throw new Error('ai_not_configured');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!r.ok) throw new Error(`ai_http_${r.status}`);
  const j = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
  return (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('');
}

/** Asks for JSON and parses the first object in the answer. */
export async function claudeJson<T>(system: string, user: string, maxTokens = 2000): Promise<T> {
  const text = await claude(`${system}\nAnswer with one JSON object only, no prose.`, user, maxTokens);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('ai_bad_json');
  return JSON.parse(text.slice(start, end + 1)) as T;
}
