// The WhatsApp agent (pilot brands with waAgent.on): it talks with the client, looks things up in the brand (requests,
// files, calendar, results, site adjustments, brand essentials) and decides what the message is: an answer it can
// give, a request (it offers to create it; the client confirms with a button), more material for a request in
// progress, or something for NickMark (it hands over and goes quiet). It never creates a request on its own.
// The conversation is kept per number in waThreads/{phone} (backend only). Never log bodies or phone numbers.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { claudeTurn, type Block, type Tool } from '../ai.js';
import { brandBasics, findFiles, getRequest, listPosts, listRequests, results, siteChanges, type Ctx } from '../help/reads.js';
import { adminUids, pushTo } from '../push/send.js';

const MODEL = process.env.WA_AGENT_MODEL ?? process.env.HELP_MODEL ?? 'claude-sonnet-5-5';
const ROUNDS = 4;
const KEEP = 20; // turns of memory
const FRESH_MS = 3 * 864e5; // a conversation quiet for 3 days starts over
export const PAUSE_MS = 2 * 3600_000; // after NickMark writes himself, the agent stays quiet this long

export type Turn = { role: 'user' | 'assistant'; content: string; at: number };
export type AgentOut =
  | { kind: 'reply'; text: string }
  | { kind: 'offer'; text: string; title: string; body: string }
  | { kind: 'add'; text: string; requestId: string; body: string }
  | { kind: 'handoff'; text: string; reason: string };

export const threadRef = (phone: string) => db.doc(`waThreads/${phone}`);
export const agentOn = async (brandId: string) => (await db.doc(`brands/${brandId}`).get()).get('waAgent.on') === true;

/** Adds turns to the number's memory (NickMark's own replies too, so the agent knows what he said). */
export async function remember(phone: string, brandId: string, turns: Array<Omit<Turn, 'at'>>) {
  const ref = threadRef(phone);
  const prev = ((await ref.get()).get('turns') as Turn[] | undefined) ?? [];
  const live = prev.filter((t) => Date.now() - t.at < FRESH_MS);
  await ref.set({ brandId, turns: [...live, ...turns.map((t) => ({ ...t, content: t.content.slice(0, 2000), at: Date.now() }))].slice(-KEEP), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

const TOOLS: Tool[] = [
  { name: 'pedidos', description: 'Pedidos de la marca (más recientes primero), para «cómo va X», «qué tengo por aprobar».',
    input_schema: { type: 'object', properties: { estado: { type: 'string', enum: ['por_aprobar', 'en_produccion', 'aprobados', 'todos'] }, buscar: { type: 'string' } } } },
  { name: 'pedido', description: 'Detalle de un pedido por id: qué se pidió, quién trabaja, última versión, aprobación, comentarios.',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'archivos', description: 'Busca archivos de la marca (logos, fotos, videos, documentos, entregas).',
    input_schema: { type: 'object', properties: { buscar: { type: 'string' } }, required: ['buscar'] } },
  { name: 'calendario', description: 'Publicaciones del calendario de redes entre dos fechas (por defecto los próximos 14 días).',
    input_schema: { type: 'object', properties: { desde: { type: 'string' }, hasta: { type: 'string' } } } },
  { name: 'resultados', description: 'Números de redes y del sitio de los últimos 30 o 90 días.',
    input_schema: { type: 'object', properties: { dias: { type: 'number', enum: [30, 90] } } } },
  { name: 'ajustes_sitio', description: 'Ajustes del sitio web ya pedidos (abiertos por defecto).',
    input_schema: { type: 'object', properties: { todos: { type: 'boolean' } } } },
  { name: 'marca', description: 'Lo esencial de la marca: posición, voz, audiencias, colores, tipografías.',
    input_schema: { type: 'object', properties: {} } },
  { name: 'crear_pedido', description: 'Cuando la persona pide trabajo nuevo y ya sabes qué es y para qué: ofrece crear el pedido. Ella confirma con un botón; tú no lo creas. Termina la conversación de este turno.',
    input_schema: { type: 'object', properties: { titulo: { type: 'string', description: 'corto, máx 80' }, texto: { type: 'string', description: 'lo que pidió, completo, con sus palabras y datos (fechas, medidas, enlaces)' } }, required: ['titulo', 'texto'] } },
  { name: 'agregar_al_pedido', description: 'Cuando manda información o material para un pedido que ya está en curso (búscalo antes con «pedidos»). Se agrega como comentario.',
    input_schema: { type: 'object', properties: { pedido_id: { type: 'string' }, texto: { type: 'string' } }, required: ['pedido_id', 'texto'] } },
  { name: 'pasar_a_nico', description: 'Para lo que debe ver NicoMarca en persona: quejas o molestia, precios, pagos o contrato, urgencias, decisiones de estrategia, algo que no sabes o que la persona pide hablar con él. Le avisa y tú dejas de responder.',
    input_schema: { type: 'object', properties: { motivo: { type: 'string' } }, required: ['motivo'] } },
];

function system(lang: 'es' | 'en', brand: string, name: string, today: string) {
  if (lang === 'en') return `You answer the WhatsApp of Braindy (NickMark's studio) for ${brand}. You are talking with ${name || 'a person from the brand'}. Today is ${today}.
- You are the AI assistant of NickMark's team. NickMark (Nicolas) is the author of every piece; the Brains help him. If asked, say plainly you are an AI assistant.
- WhatsApp style: short (2–4 lines), warm, no headings or lists unless needed, *bold* with one asterisk. Same language as the person.
- Greetings or thanks: answer briefly and, if it fits, ask what they need. Do not create anything.
- A question about their brand (how a request is going, a file, the calendar, results): look it up with the tools and answer. Never invent.
- New work: understand what it is and what for (at most ONE short question), then use crear_pedido.
- Material or details for a request in progress: agregar_al_pedido.
- Complaints, prices, payments, contract, urgencies, strategy decisions, anything you do not know or a request to talk with NickMark: pasar_a_nico.
- Never promise prices, dates or deliveries.`;
  return `Atiendes el WhatsApp de Braindy (el estudio de NicoMarca) para ${brand}. Hablas con ${name || 'una persona de la marca'}. Hoy es ${today}.
- Eres el asistente de IA del equipo de NicoMarca. NicoMarca (Nicolas) es el autor de cada pieza; los Brains lo aceleran. Si preguntan, di sin rodeos que eres un asistente de IA.
- Estilo WhatsApp: corto (2 a 4 líneas), cálido, sin títulos ni listas salvo que hagan falta, *negrita* con un asterisco. En el idioma de la persona.
- Saludos o agradecimientos: responde breve y, si viene al caso, pregunta en qué le ayudas. No crees nada.
- Una duda sobre su marca (cómo va un pedido, un archivo, el calendario, resultados): búscala con las herramientas y responde. Nunca inventes.
- Trabajo nuevo: entiende qué es y para qué (máximo UNA pregunta corta) y usa crear_pedido.
- Material o detalles para un pedido en curso: agregar_al_pedido.
- Quejas, precios, pagos, contrato, urgencias, decisiones de estrategia, lo que no sepas o si piden hablar con NicoMarca: pasar_a_nico.
- Nunca prometas precios, fechas ni entregas.`;
}

type In = Record<string, unknown>;
const s = (v: unknown) => (typeof v === 'string' ? v : '');

async function read(c: Ctx, name: string, i: In) {
  switch (name) {
    case 'pedidos': return listRequests(c, s(i.estado) || undefined, s(i.buscar) || undefined);
    case 'pedido': return getRequest(c, s(i.id));
    case 'archivos': return findFiles(c, s(i.buscar));
    case 'calendario': return listPosts(c, s(i.desde) || undefined, s(i.hasta) || undefined);
    case 'resultados': return results(c, Number(i.dias) || 30);
    case 'ajustes_sitio': return siteChanges(c, i.todos !== true);
    case 'marca': return brandBasics(c);
    default: return { text: 'Herramienta desconocida.', cards: [] };
  }
}

/** One turn of the conversation: the person's message (with a note when they sent files) → what to do. */
export async function agentTurn(a: { phone: string; uid: string; brandId: string; lang: 'es' | 'en'; text: string; files: number }): Promise<AgentOut> {
  const [access, brand, me, thread] = await Promise.all([
    brandAccess(a.uid, a.brandId), db.doc(`brands/${a.brandId}`).get(), db.doc(`users/${a.uid}`).get(), threadRef(a.phone).get(),
  ]);
  const ctx: Ctx = { brandId: a.brandId, access, resultsOn: brand.get('resultsOn') === true, lang: a.lang };
  const note = a.files ? (a.lang === 'es' ? `\n[Envió ${a.files} archivo(s): foto, video o documento]` : `\n[Sent ${a.files} file(s): photo, video or document]`) : '';
  const said = (a.text || '') + note;
  const past = (((thread.get('turns') as Turn[] | undefined) ?? []).filter((t) => Date.now() - t.at < FRESH_MS));
  // The API wants alternating roles starting with the user: merge neighbours of the same role.
  const messages: Array<{ role: string; content: unknown }> = [];
  for (const t of [...past, { role: 'user' as const, content: said, at: 0 }]) {
    const prev = messages[messages.length - 1];
    if (prev && prev.role === t.role) prev.content = `${prev.content}\n${t.content}`;
    else if (messages.length || t.role === 'user') messages.push({ role: t.role, content: t.content });
  }
  const sys = system(a.lang, String(brand.get('name') ?? a.brandId), String(me.get('name') ?? ''), new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' }));
  const meta = { brandId: a.brandId, kind: 'whatsapp_agent' };

  let out: AgentOut | null = null;
  for (let round = 0; round <= ROUNDS && !out; round++) {
    const { content, stop } = await claudeTurn(sys, messages, TOOLS, { model: MODEL, maxTokens: 800, meta, noTools: round === ROUNDS });
    const text = content.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('').trim();
    const uses = content.filter((b): b is Block & { id: string; name: string } => b.type === 'tool_use' && !!b.id && !!b.name);
    if (stop !== 'tool_use' || !uses.length) { out = { kind: 'reply', text }; break; }
    // Decisions end the turn; reads go back to the model.
    const pick = uses.find((u) => ['crear_pedido', 'agregar_al_pedido', 'pasar_a_nico'].includes(u.name));
    if (pick) {
      const i = (pick.input ?? {}) as In;
      if (pick.name === 'crear_pedido') out = { kind: 'offer', text, title: s(i.titulo).slice(0, 80) || said.slice(0, 80), body: s(i.texto) || said };
      else if (pick.name === 'agregar_al_pedido') out = { kind: 'add', text, requestId: s(i.pedido_id), body: s(i.texto) || a.text };
      else out = { kind: 'handoff', text, reason: s(i.motivo).slice(0, 300) };
      break;
    }
    messages.push({ role: 'assistant', content });
    const results = await Promise.all(uses.map(async (u) => ({ type: 'tool_result', tool_use_id: u.id, content: (await read(ctx, u.name, (u.input ?? {}) as In).catch(() => ({ text: 'ERROR al consultar.' }))).text.slice(0, 6000) })));
    messages.push({ role: 'user', content: results });
  }
  return out ?? { kind: 'reply', text: '' };
}

/** NickMark takes over: a push to him, and the agent stays quiet with this number for a while. */
export async function handOff(phone: string, brandId: string, brandName: string, reason: string) {
  await db.doc(`waContacts/${phone}`).set({ agentPausedUntil: Timestamp.fromMillis(Date.now() + 12 * 3600_000) }, { merge: true });
  await pushTo(await adminUids(), {
    kind: 'requests', tag: `wa-handoff-${phone.slice(-6)}`, url: '/admin/whatsapp',
    title: { es: `WhatsApp · ${brandName} te necesita`, en: `WhatsApp · ${brandName} needs you` },
    body: { es: reason || 'El agente te pasó la conversación.', en: reason || 'The agent handed you the conversation.' },
  }, { ignorePrefs: true });
}

/** NickMark wrote from the WhatsApp Business app (coexistence echo): the agent goes quiet and remembers what he said. */
export async function nickWrote(to: string, text: string) {
  if (!/^\d{8,15}$/.test(to)) return;
  await db.doc(`waContacts/${to}`).set({ agentPausedUntil: Timestamp.fromMillis(Date.now() + PAUSE_MS) }, { merge: true });
  const brandId = (await threadRef(to).get()).get('brandId') as string | undefined;
  if (brandId && text) await remember(to, brandId, [{ role: 'assistant', content: `[NicoMarca escribió] ${text}` }]);
}
