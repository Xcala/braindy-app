// The chat assistant with tools: it can look up the brand (requests, files, calendar, results, site adjustments, brand
// essentials) before answering. Read only: anything that changes something is a card the person confirms in the app.
import { claudeTurn, type Block, type ChatTurn, type Tool } from '../ai.js';
import { brandBasics, findFiles, getRequest, listPosts, listRequests, results, siteChanges, type ChatCard, type Ctx, type ReadOut } from './reads.js';

const ROUNDS = 4; // tool rounds per question, then it must answer

const TOOLS: Tool[] = [
  { name: 'pedidos', description: 'Lista los pedidos de la marca (más recientes primero). Úsala para «qué tengo por aprobar», «qué está en producción», «cómo va X».',
    input_schema: { type: 'object', properties: { estado: { type: 'string', enum: ['por_aprobar', 'en_produccion', 'aprobados', 'todos'] }, buscar: { type: 'string', description: 'Palabras del título' } } } },
  { name: 'pedido', description: 'Detalle de un pedido por id: lo que se pidió, plan, quién trabaja, última versión y su aprobación, últimos comentarios.',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'archivos', description: 'Busca archivos de la marca (logos, fotos, videos, documentos, entregas) por palabras del nombre, la carpeta o lo que muestran.',
    input_schema: { type: 'object', properties: { buscar: { type: 'string' } }, required: ['buscar'] } },
  { name: 'calendario', description: 'Publicaciones del calendario de redes entre dos fechas (por defecto los próximos 14 días).',
    input_schema: { type: 'object', properties: { desde: { type: 'string', description: 'AAAA-MM-DD' }, hasta: { type: 'string', description: 'AAAA-MM-DD' } } } },
  { name: 'resultados', description: 'Números de redes y del sitio web de los últimos 30 o 90 días, contra el periodo anterior.',
    input_schema: { type: 'object', properties: { dias: { type: 'number', enum: [30, 90] } } } },
  { name: 'ajustes_sitio', description: 'Ajustes del sitio web (triage): abiertos por defecto, o todos.',
    input_schema: { type: 'object', properties: { todos: { type: 'boolean' } } } },
  { name: 'marca', description: 'Lo esencial de la marca: posición, voz, audiencias, objetivos, colores y tipografías.',
    input_schema: { type: 'object', properties: {} } },
];

type In = Record<string, unknown>;
const s = (v: unknown) => (typeof v === 'string' ? v : undefined);

function run(c: Ctx, name: string, i: In): Promise<ReadOut> {
  switch (name) {
    case 'pedidos': return listRequests(c, s(i.estado), s(i.buscar));
    case 'pedido': return getRequest(c, s(i.id) ?? '');
    case 'archivos': return findFiles(c, s(i.buscar) ?? '');
    case 'calendario': return listPosts(c, s(i.desde), s(i.hasta));
    case 'resultados': return results(c, Number(i.dias) || 30);
    case 'ajustes_sitio': return siteChanges(c, i.todos !== true);
    case 'marca': return brandBasics(c);
    default: return Promise.resolve({ text: 'Herramienta desconocida.', cards: [] });
  }
}

/**
 * Asks the model, runs the tools it calls (up to ROUNDS) and returns the final text plus the cards it may show.
 * Card refs restart per tool call, so each one is prefixed with the round and call (r1.p2) to stay unique.
 */
export async function answerWithTools(system: string, turns: ChatTurn[], c: Ctx, o: { model: string; meta: { brandId: string; kind: string } }) {
  const messages: Array<{ role: string; content: unknown }> = turns.map((t) => ({ role: t.role, content: t.content }));
  const cards = new Map<string, ChatCard>();
  let call = 0;
  for (let round = 0; round <= ROUNDS; round++) {
    const last = round === ROUNDS;
    const { content, stop } = await claudeTurn(system, messages, TOOLS, { model: o.model, maxTokens: 1200, meta: o.meta, noTools: last });
    const uses = content.filter((b): b is Block & { id: string; name: string } => b.type === 'tool_use' && !!b.id && !!b.name);
    if (stop !== 'tool_use' || !uses.length || last) {
      return { text: content.filter((b) => b.type === 'text').map((b) => b.text ?? '').join(''), cards };
    }
    messages.push({ role: 'assistant', content });
    const outs = await Promise.all(uses.map(async (u) => {
      const tag = `t${++call}`;
      let out: ReadOut;
      try { out = await run(c, u.name, (u.input ?? {}) as In); } catch { out = { text: 'ERROR: no pude leer eso ahora.', cards: [] }; }
      for (const card of out.cards) cards.set(`${tag}.${card.ref}`, { ...card, ref: `${tag}.${card.ref}` });
      // Every ref in the text gets the same prefix the cards got, so [[VER t1.p2]] matches.
      const text = out.text.replace(/(^|\n)([pfcas]\d+) ·/g, `$1${tag}.$2 ·`).replace(/^p1 = /, `${tag}.p1 = `);
      return { type: 'tool_result', tool_use_id: u.id, content: text };
    }));
    messages.push({ role: 'user', content: outs });
  }
  return { text: '', cards };
}
