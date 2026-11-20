import { api, apiResponse } from '../lib/api';

/**
 * Asks the assistant and shows the answer as it is written: `onText` gets the text so far (markers like [[VER …]]
 * hidden). Returns the full answer, same shape as POST /help/chat. If the live answer is not available it falls back
 * to the plain call.
 */
export async function streamChat<T>(body: unknown, onText: (soFar: string) => void): Promise<T> {
  let res: Response;
  try {
    res = await apiResponse('/v1/help/chat/stream', { method: 'POST', body: JSON.stringify(body) });
  } catch {
    return api<T>('/v1/help/chat', { method: 'POST', body: JSON.stringify(body) });
  }
  if (!res.ok || !res.body) {
    if (res.status === 404) return api<T>('/v1/help/chat', { method: 'POST', body: JSON.stringify(body) });
    throw new Error(`API ${res.status}`);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '', text = '', done: T | null = null;
  const shown = () => text.replace(/\[\[[\s\S]*?(\]\]|$)/g, '').replace(/\n{3,}/g, '\n\n').trimStart();
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buf += value;
    let cut: number;
    while ((cut = buf.indexOf('\n\n')) >= 0) {
      const chunk = buf.slice(0, cut); buf = buf.slice(cut + 2);
      const event = chunk.split('\n').find((l) => l.startsWith('event:'))?.slice(6).trim();
      const data = chunk.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n');
      if (!data) continue;
      if (event === 'delta') { text += JSON.parse(data) as string; onText(shown()); }
      else if (event === 'reset') { text = ''; onText(''); }
      else if (event === 'done') done = JSON.parse(data) as T;
    }
  }
  if (!done) throw new Error('API stream');
  const st = done as { status?: number; error?: string };
  if (st.status && st.status >= 400) throw new Error(`API ${st.status} ${st.error ?? ''}`);
  return done;
}
