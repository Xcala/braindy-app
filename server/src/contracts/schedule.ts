// Anexo 2 (schedule, a Gantt by week) and Anexo 3 (kickoff checklist: information and accesses with dates).
// Presets follow the real schedules Nicolas made: Blacky Meals (brand + Brand OS, 3 months) and
// Grupo Alternativas (AI-First Marketing 360, 6 months by pillar). He edits them per contract.

export type RowStatus = 'pending' | 'doing' | 'done' | 'blocked';
export interface ScheduleRow { id: string; title: string; note: string; from: number; to: number; milestone: boolean; status: RowStatus }
export interface ScheduleGroup { id: string; title: string; rows: ScheduleRow[] }
export interface Schedule {
  /** Monday of week 1 (YYYY-MM-DD). */
  start: string;
  weeks: number;
  meeting: { weekday: number; time: string; minutes: number };
  groups: ScheduleGroup[];
}
export interface ChecklistItem { id: string; title: string; week: number; done: boolean }

const MAX_WEEKS = 52;
const STATUSES: RowStatus[] = ['pending', 'doing', 'done', 'blocked'];
const str = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const int = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};
const id = (v: unknown, i: number, p: string) => (/^[\w-]{1,40}$/.test(String(v)) ? String(v) : `${p}${i + 1}`);

/** Monday on or before the date (YYYY-MM-DD), or next Monday if the date is empty. */
export function mondayOf(date?: string): string {
  const d = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`) : new Date(Date.now() + 7 * 864e5);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** Validates a schedule coming from the admin editor. */
export function cleanSchedule(input: unknown): Schedule {
  const s = (input ?? {}) as Partial<Schedule>;
  const weeks = int(s.weeks, 1, MAX_WEEKS, 12);
  const m = (s.meeting ?? {}) as Partial<Schedule['meeting']>;
  return {
    start: mondayOf(str(s.start, 10)),
    weeks,
    meeting: { weekday: int(m.weekday, 1, 5, 4), time: /^\d{2}:\d{2}$/.test(String(m.time)) ? String(m.time) : '10:00', minutes: int(m.minutes, 15, 240, 60) },
    groups: (Array.isArray(s.groups) ? s.groups : []).slice(0, 12).map((g, gi) => ({
      id: id(g?.id, gi, 'g'),
      title: str(g?.title, 120),
      rows: (Array.isArray(g?.rows) ? g.rows : []).slice(0, 30).map((r, ri) => {
        const from = int(r?.from, 0, weeks - 1, 0);
        return {
          id: id(r?.id, ri, `${gi + 1}r`), title: str(r?.title, 160), note: str(r?.note, 300),
          from, to: int(r?.to, from, weeks - 1, from), milestone: r?.milestone === true,
          status: STATUSES.includes(r?.status as RowStatus) ? (r!.status as RowStatus) : 'pending',
        };
      }),
    })),
  };
}

export function cleanChecklist(input: unknown, weeks = MAX_WEEKS): ChecklistItem[] {
  return (Array.isArray(input) ? input : []).slice(0, 40).map((x, i) => ({
    id: id(x?.id, i, 'k'), title: str(x?.title, 200), week: int(x?.week, 0, weeks - 1, 0), done: x?.done === true,
  })).filter((x) => x.title);
}

type Row = [title: string, from: number, to: number, note?: string];
const group = (gid: string, title: string, rows: Row[], milestones: Array<[string, number, string?]> = []): ScheduleGroup => ({
  id: gid, title,
  rows: [
    ...rows.map(([t, from, to, note], i) => ({ id: `${gid}r${i + 1}`, title: t, note: note ?? '', from, to, milestone: false, status: 'pending' as const })),
    ...milestones.map(([t, at, note], i) => ({ id: `${gid}m${i + 1}`, title: t, note: note ?? '', from: at, to: at, milestone: true, status: 'pending' as const })),
  ],
});

export const PRESETS = {
  /** Brand + Brand OS in 3 months (Blacky Meals, Pack A + Pack C). */
  brand3m: (start: string): Schedule => ({
    start, weeks: 12, meeting: { weekday: 4, time: '10:00', minutes: 60 },
    groups: [
      group('marca', 'Marca', [
        ['Discovery, talleres y auditoría', 0, 1, 'Marca, producto y política de imagen'],
        ['Sistema de identidad', 1, 3, 'Símbolo, tipografía, color y tokens'],
        ['Manual, plantillas y empaque', 4, 5, 'Aplicación, prohibiciones y artes para impresión'],
      ], [['Entrega de identidad', 3, 'Símbolo, logotipo y sistema en SVG'], ['Entrega de manual y empaque', 5, 'Manual, kit editable y artes listas para el impresor']]),
      group('brandos', 'Brand OS y pauta', [
        ['Base de conocimiento', 6, 7, 'ADN, productos, precios y cobertura'],
        ['Agentes de identidad y contenido', 7, 8, 'Aplican el sistema y escriben con la voz de marca'],
        ['Agentes de producto, ventas y recompra', 8, 10],
        ['Setup de pauta', 9, 10, 'Píxel, catálogo y conversiones, con cuentas a nombre de la marca'],
        ['Campañas encendidas', 10, 11, 'Montadas y midiendo'],
      ], [['Entrega del Brand OS', 11, 'Agentes montados y pauta encendida']]),
    ],
  }),
  /** AI-First Marketing 360 in 6 months, by pillar (Grupo Alternativas). */
  marketing6m: (start: string): Schedule => ({
    start, weeks: 26, meeting: { weekday: 4, time: '10:00', minutes: 60 },
    groups: [
      group('estrategia', 'Estrategia e insights', [
        ['Investigación de marca y mercado', 0, 2, 'Deep research, competencia y huella digital'],
        ['Primal Branding y arquetipo', 2, 4],
        ['Estrategia y Brand Brain', 3, 5],
      ], [['Entrega de estrategia', 5]]),
      group('identidad', 'Identidad', [
        ['Sistema de identidad', 5, 9, 'Logo, color, tipografía y tokens'],
        ['Manual y plantillas', 9, 11],
      ], [['Entrega de identidad y manual', 11]]),
      group('producto', 'Producto digital', [
        ['Sitio web: arquitectura y diseño', 10, 14],
        ['Desarrollo y publicación', 14, 18],
      ], [['Sitio publicado', 18]]),
      group('activacion', 'Activación', [
        ['Contenido y calendario', 16, 25],
        ['Pauta y medición', 18, 25],
        ['Agentes de IA', 19, 24],
      ], [['Cierre y reporte final', 25]]),
    ],
  }),
  empty: (start: string): Schedule => ({ start, weeks: 12, meeting: { weekday: 4, time: '10:00', minutes: 60 }, groups: [] }),
};
export type PresetKey = keyof typeof PRESETS;

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  ['Datos de facturación y RUT', 0],
  ['Lista de personas que aprueban', 0],
  ['Logos y archivos de marca actuales', 0],
  ['Productos, precios, clientes ideales y competidores', 0],
  ['Accesos a redes sociales', 0],
  ['Accesos al sitio web, dominio y hosting', 1],
  ['Accesos a cuentas de pauta y Business Manager', 1],
  ['Fotos, videos y material de producto', 1],
].map(([title, week], i) => ({ id: `k${i + 1}`, title: String(title), week: Number(week), done: false }));

/** Date of a week (0-based) as YYYY-MM-DD. */
export const weekDate = (start: string, week: number, plusDays = 0) =>
  new Date(Date.parse(`${start}T12:00:00Z`) + (week * 7 + plusDays) * 864e5).toISOString().slice(0, 10);
