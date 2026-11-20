// What the chat assistant can look up about the brand (read only). Each read checks the same section the screen needs,
// returns a compact text for the model and the cards the person may see in the chat (request, file, post, site
// adjustment, number). Never touches accesses (credentials), billing or anything of another brand.
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import type { Access, Section } from '../access.js';
import { searchFiles } from '../search.js';

export type ChatCard =
  | { kind: 'request'; ref: string; id: string; title: string; status: string; due: string | null; brain: string; versions: number }
  | { kind: 'file'; ref: string; id: string; title: string; folder: string; contentType: string }
  | { kind: 'post'; ref: string; date: string; text: string; thumb: string; networks: string[]; status: string }
  | { kind: 'change'; ref: string; key: string; title: string; status: string }
  | { kind: 'stat'; ref: string; label: string; value: number; delta: number | null };

export type Ctx = { brandId: string; access: Access; resultsOn: boolean };
export type ReadOut = { text: string; cards: ChatCard[] };

const cut = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const day = (v: unknown) => (v instanceof Timestamp ? v.toDate().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' }) : null);
const closed = (s: Section): ReadOut => ({ text: `SIN_ACCESO: esta persona no tiene abierta la sección «${s}».`, cards: [] });
const can = (c: Ctx, s: Section) => c.access.admin || c.access.sections.includes(s);

const STATUS_Q: Record<string, string[]> = { por_aprobar: ['to_approve'], en_produccion: ['in_production'], aprobados: ['approved', 'published'] };

/** The brand's requests, newest activity first, optionally by state or words in the title. */
export async function listRequests(c: Ctx, estado?: string, buscar?: string): Promise<ReadOut> {
  if (!can(c, 'requests')) return closed('requests');
  const snap = await db.collection(`brands/${c.brandId}/requests`).orderBy('updatedAt', 'desc').limit(120).get();
  const want = STATUS_Q[estado ?? ''];
  const words = cut(buscar, 80).toLowerCase().split(' ').filter((w) => w.length > 2);
  const rows = snap.docs.filter((d) => !d.get('archived') && (!want || want.includes(d.get('status')))
    && words.every((w) => cut(d.get('title'), 200).toLowerCase().includes(w))).slice(0, 12);
  const cards: ChatCard[] = rows.map((d, i) => ({
    kind: 'request', ref: `p${i + 1}`, id: d.id, title: cut(d.get('title'), 120), status: String(d.get('status') ?? ''),
    due: (d.get('dueDate') as string | null) ?? null, brain: String(d.get('leadBrain') ?? ''), versions: Number(d.get('versionCount') ?? 0),
  }));
  const text = cards.length
    ? cards.map((x) => { const r = x as Extract<ChatCard, { kind: 'request' }>; return `${r.ref} · ${r.title} · estado ${r.status} · ${r.versions} versiones · lidera ${r.brain}${r.due ? ` · para ${r.due}` : ''} · actualizado ${day(rows[Number(r.ref.slice(1)) - 1]!.get('updatedAt')) ?? '?'} · id ${r.id}`; }).join('\n')
    : 'No hay pedidos con ese filtro.';
  return { text, cards };
}

/** One request in detail: plan, who is working, latest version and its approval, last comments. */
export async function getRequest(c: Ctx, id: string): Promise<ReadOut> {
  if (!can(c, 'requests')) return closed('requests');
  if (!/^[\w-]{4,60}$/.test(id)) return { text: 'Id inválido.', cards: [] };
  const ref = db.doc(`brands/${c.brandId}/requests/${id}`);
  const [r, vers, comments] = await Promise.all([
    ref.get(), ref.collection('versions').orderBy('n', 'desc').limit(1).get(), ref.collection('comments').orderBy('createdAt', 'desc').limit(5).get(),
  ]);
  if (!r.exists || r.get('archived')) return { text: 'No encontré ese pedido en esta marca.', cards: [] };
  const v = vers.docs[0];
  const steps = ((r.get('work.steps') as Array<{ brain: string; task: string; state: string }>) ?? []).map((s) => `${s.brain}: ${cut(s.task, 80)} (${s.state})`);
  const plan = r.get('plan') as { scope?: string[]; firstDelivery?: string; approved?: boolean } | null;
  const text = [
    `${cut(r.get('title'), 160)} · estado ${r.get('status')} · etapa ${r.get('stage')} · lidera ${r.get('leadBrain')}${r.get('dueDate') ? ` · para ${r.get('dueDate')}` : ''}`,
    `Lo que pidió: ${cut(r.get('cards.product.text'), 600)}`,
    plan && `Plan${plan.approved ? ' (aprobado)' : ' (por aprobar)'}: ${(plan.scope ?? []).map((s) => cut(s, 100)).join('; ')}${plan.firstDelivery ? ` · primera entrega ${plan.firstDelivery}` : ''}`,
    steps.length && `Equipo trabajando: ${steps.join(' | ')}`,
    v ? `Última versión: v${v.get('n')} del ${day(v.get('createdAt')) ?? '?'} · aprobación ${v.get('approval.state') ?? 'pendiente'} · ${((v.get('files') as unknown[]) ?? []).length} archivos${v.get('notes') ? ` · notas: ${cut(v.get('notes'), 400)}` : ''}` : 'Aún no hay versiones entregadas.',
    comments.size && `Últimos comentarios: ${comments.docs.map((d) => cut(d.get('text'), 160)).join(' | ')}`,
  ].filter(Boolean).join('\n');
  return {
    text: `p1 = este pedido\n${text}`,
    cards: [{ kind: 'request', ref: 'p1', id: r.id, title: cut(r.get('title'), 120), status: String(r.get('status') ?? ''), due: (r.get('dueDate') as string | null) ?? null, brain: String(r.get('leadBrain') ?? ''), versions: Number(r.get('versionCount') ?? 0) }],
  };
}

/** Files of the brand by words in the name, folder or what the file shows (same rules as the search box). */
export async function findFiles(c: Ctx, buscar: string): Promise<ReadOut> {
  if (!can(c, 'files')) return closed('files');
  const { total, files } = await searchFiles(c.brandId, c.access.admin, buscar, 8);
  const cards: ChatCard[] = files.map((f, i) => ({ kind: 'file', ref: `f${i + 1}`, id: f.id, title: cut(f.title, 120), folder: cut(f.folder, 120), contentType: f.contentType }));
  return { text: cards.length ? `${total} archivos encontrados${total > 8 ? ' (muestro 8)' : ''}:\n${files.map((f, i) => `f${i + 1} · ${f.title} · carpeta ${f.folder || '—'}`).join('\n')}` : 'No encontré archivos con esas palabras.', cards };
}

/** Posts on the social calendar between two dates (default: the next 14 days). */
export async function listPosts(c: Ctx, desde?: string, hasta?: string): Promise<ReadOut> {
  if (!can(c, 'files')) return closed('files');
  const ok = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const from = ok(desde) ? new Date(`${desde}T00:00:00-05:00`) : new Date();
  const to = ok(hasta) ? new Date(`${hasta}T23:59:59-05:00`) : new Date(from.getTime() + 14 * 864e5);
  const snap = await db.collection(`brands/${c.brandId}/socialPosts`).where('date', '>=', Timestamp.fromDate(from)).where('date', '<=', Timestamp.fromDate(to)).orderBy('date').limit(40).get();
  const docs = snap.docs.filter((d) => d.get('status') !== 'draft');
  const cards: ChatCard[] = docs.slice(0, 10).map((d, i) => ({
    kind: 'post', ref: `c${i + 1}`, date: (d.get('date') as Timestamp).toDate().toISOString(), text: cut(d.get('text') || d.get('title'), 160),
    thumb: String(d.get('thumb') || (d.get('media') as Array<{ url: string; kind: string }> | undefined)?.find((m) => m.kind === 'image')?.url || ''),
    networks: ((d.get('networks') as Array<{ network: string }>) ?? []).map((n) => n.network), status: String(d.get('status') ?? ''),
  }));
  const text = docs.length
    ? `${docs.length} publicaciones del ${from.toISOString().slice(0, 10)} al ${to.toISOString().slice(0, 10)}:\n${cards.map((x) => { const p = x as Extract<ChatCard, { kind: 'post' }>; return `${p.ref} · ${p.date.slice(0, 16).replace('T', ' ')} UTC · ${p.networks.join(', ')} · ${p.status} · ${p.text}`; }).join('\n')}`
    : 'No hay publicaciones en ese rango.';
  return { text, cards };
}

type Day = Record<string, number | null | string>;
const sum = (rows: Day[], k: string) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
const delta = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

/** Social and website numbers of the last 30 or 90 days against the period before. */
export async function results(c: Ctx, dias: number): Promise<ReadOut> {
  if (!can(c, 'results')) return closed('results');
  if (!c.resultsOn && !c.access.admin) return { text: 'Esta marca aún no tiene Resultados activados.', cards: [] };
  const n = dias === 90 ? 90 : 30;
  const since = new Date(Date.now() - n * 864e5).toISOString().slice(0, 10), before = new Date(Date.now() - 2 * n * 864e5).toISOString().slice(0, 10);
  const [social, web] = await Promise.all([db.collection(`brands/${c.brandId}/socialStats`).get(), db.doc(`brands/${c.brandId}/webStats/ga4`).get()]);
  const lines: string[] = [], cards: ChatCard[] = [];
  const add = (label: string, value: number, d: number | null) => { const ref = `s${cards.length + 1}`; cards.push({ kind: 'stat', ref, label, value: Math.round(value), delta: d }); lines.push(`${ref} · ${label}: ${Math.round(value)}${d == null ? '' : ` (${d > 0 ? '+' : ''}${d}% vs ${n} días antes)`}`); };
  for (const s of social.docs) {
    const daily = (s.get('daily') as Day[] | undefined) ?? [];
    const cur = daily.filter((r) => String(r.d) >= since), prev = daily.filter((r) => String(r.d) >= before && String(r.d) < since);
    if (!cur.length) continue;
    const net = s.id;
    const followers = [...cur].reverse().find((r) => r.followers != null)?.followers;
    if (followers != null) add(`${net} · seguidores`, Number(followers), null);
    for (const k of ['views', 'reach', 'interactions'] as const) if (cur.some((r) => r[k] != null)) add(`${net} · ${k}`, sum(cur, k), prev.length ? delta(sum(cur, k), sum(prev, k)) : null);
  }
  const tot = (web.get(`totals.${n}`) as { cur?: Record<string, number> | null; prev?: Record<string, number> | null } | undefined);
  if (tot?.cur) for (const k of ['users', 'sessions', 'views'] as const) add(`sitio web · ${k}`, tot.cur[k] ?? 0, tot.prev ? delta(tot.cur[k] ?? 0, tot.prev[k] ?? 0) : null);
  return { text: lines.length ? `Últimos ${n} días:\n${lines.join('\n')}` : 'No hay números guardados para este periodo.', cards: cards.slice(0, 12) };
}

/** The website adjustments (triage) of the brand, open ones first. */
export async function siteChanges(c: Ctx, abiertos = true): Promise<ReadOut> {
  if (!can(c, 'apps')) return closed('apps');
  const snap = await db.collection(`brands/${c.brandId}/siteChanges`).orderBy('order').limit(200).get();
  // What waits on the client first, then decisions, then what Builder is on, then the rest.
  const rank: Record<string, number> = { client: 0, decision: 1, in_progress: 2, delivered: 3 };
  const rows = snap.docs.filter((d) => d.get('status') !== 'discarded' && (!abiertos || d.get('status') !== 'delivered'))
    .sort((a, b) => (rank[a.get('status')] ?? 9) - (rank[b.get('status')] ?? 9)).slice(0, 25);
  const cards: ChatCard[] = rows.map((d, i) => ({ kind: 'change', ref: `a${i + 1}`, key: String(d.get('key') ?? d.id), title: cut(d.get('title'), 120), status: String(d.get('status') ?? '') }));
  const count = (s: string) => snap.docs.filter((d) => d.get('status') === s).length;
  return {
    text: `${snap.size} ajustes en total: ${count('delivered')} entregados, ${count('client')} esperan al cliente (client), ${count('decision')} esperan una decisión (decision), ${count('in_progress')} en curso con Builder (in_progress).${rows.length ? `\n${cards.map((x) => { const a = x as Extract<ChatCard, { kind: 'change' }>; return `${a.ref} · ${a.key} · ${a.title} · ${a.status}`; }).join('\n')}` : ' No hay ajustes con ese filtro.'}`,
    cards,
  };
}

/** The brand essentials the client sees in My brand: position, voice, audiences, colors, typography. */
export async function brandBasics(c: Ctx): Promise<ReadOut> {
  if (!can(c, 'brand')) return closed('brand');
  const [brain, identity] = await Promise.all([db.doc(`brands/${c.brandId}/context/brain`).get(), db.doc(`brands/${c.brandId}/context/identity`).get()]);
  const b = brain.data() ?? {};
  const colors = ((identity.get('colors') as Array<{ hex?: string; name?: string }>) ?? []).slice(0, 8).map((x) => `${x.name ?? ''} ${x.hex ?? ''}`.trim());
  const fonts = ((identity.get('typography') as Array<{ fontFamily?: string; name?: string }>) ?? []).slice(0, 4).map((f) => f.fontFamily ?? f.name);
  const text = [
    b.position && `Posición: ${cut(b.position, 500)}`, b.voice && `Voz: ${cut(b.voice, 500)}`, b.audiences && `Audiencias: ${cut(b.audiences, 500)}`,
    b.goals && `Objetivos: ${cut(b.goals, 400)}`, colors.length && `Colores: ${colors.join(', ')}`, fonts.length && `Tipografías: ${fonts.join(', ')}`,
  ].filter(Boolean).join('\n');
  return { text: text || 'La marca aún no tiene estrategia ni identidad cargadas.', cards: [] };
}
