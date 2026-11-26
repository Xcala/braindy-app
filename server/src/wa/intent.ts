// Is a WhatsApp message a request (work to do) or just conversation ("hola", "gracias", "¿cómo vas?")?
// Greetings and thanks are caught by a word list with no AI call; anything else is asked to a light model.
// When in doubt (no AI, AI fails), it is a request: losing a real request is worse than one extra card.
import { aiConfigured, claudeChat } from '../ai.js';

export type Intent = 'request' | 'chat';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Words that alone never ask for work. A message made only of these (plus emoji/punctuation) is small talk.
const SMALL = new Set(`
hola holi holaa ola buenas buenos buen dia dias tarde tardes noche noches que tal como estas esta estan vas va todo bien
y tu usted ustedes muy bien gracias muchas mil muchisimas grax thx thanks thank you ty ok okay okey oki vale dale listo
perfecto genial super excelente buenisimo chevere bacano entendido claro si no sip nop jaja jajaja jeje jiji lol
saludos un abrazo abrazos besos feliz fin de semana hi hello hey good morning afternoon evening night great cool nice
sure yes yeah got it np de nada a ti igualmente con gusto quedo atento atenta pendiente nico nicolas nicomarca
`.trim().split(/\s+/));

/** True when the text is only greetings, thanks or acknowledgements (and emoji), short enough to be just that. */
export function isSmallTalk(text: string) {
  const words = fold(text).replace(/[^a-z0-9ñ\s]+/g, ' ').split(/\s+/).filter(Boolean);
  return words.length <= 10 && words.every((w) => SMALL.has(w));
}

const SYSTEM = `You sort WhatsApp messages a client sends to their branding/marketing agency.
"request": they ask for, describe, change or send material for work (a design, a post, a change on the site, a file, a quote, a correction, a problem to fix), even if it starts with a greeting.
"chat": only conversation with nothing to do: greetings, thanks, small talk, "ok", confirmations, asking how someone is.
Reply with one word: request or chat.`;

/** Request or chat. Media (photos, files) always counts as a request: it is material to work with. */
export async function intentOf(text: string, hasMedia: boolean, brandId: string): Promise<Intent> {
  if (hasMedia) return 'request';
  if (!text.trim()) return 'chat';
  if (isSmallTalk(text)) return 'chat';
  if (!aiConfigured()) return 'request';
  try {
    const a = await claudeChat(SYSTEM, [{ role: 'user', content: text.slice(0, 1500) }], { maxTokens: 5, model: 'claude-haiku-5-5', meta: { brandId, kind: 'whatsapp_intent' } });
    return /chat/i.test(a) && !/request/i.test(a) ? 'chat' : 'request';
  } catch {
    return 'request';
  }
}
