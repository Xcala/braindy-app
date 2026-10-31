// Mirror of server/src/contract.ts (ContractSchema). Stored at brands/{brandId}/billing/contract.
export type Tone = 'strategy' | 'brand' | 'web' | 'content' | 'agents' | 'ads' | 'knowledge';
export type PackStatus = 'pending' | 'in_progress' | 'delivered';

export interface Pack {
  label?: string; name: string; subtitle?: string; price?: number; period: 'once' | 'month'; months?: number;
  includes: string[]; excludes: string[]; status: PackStatus;
}
export interface GanttRow {
  name: string; detail?: string; from: number; to: number; tone: Tone; milestone: boolean; label?: string; ready?: number; done: boolean;
}
export interface Schedule {
  title?: string; note?: string;
  periods: Array<{ label: string; sub?: string; from?: string }>;
  meetings?: { label: string; detail?: string; cells?: string[] };
  sections: Array<{ title: string; rows: GanttRow[] }>;
}
export interface Care {
  name: string; price?: number; period: 'month' | 'year'; note?: string;
  includes: Array<{ title: string; body?: string }>; excludes: string[]; metrics: Array<{ value: string; label: string }>;
  hosting?: 'esencial' | 'pro' | 'ultra'; siteUrl?: string; startsAfter?: string;
}
export interface Contract {
  title: string; summary?: string; currency: 'cop' | 'usd'; start?: string; end?: string; status: 'active' | 'done' | 'paused';
  packs: Pack[]; total?: { amount: number; label?: string }; payment: string[]; notIncluded: string[];
  schedule?: Schedule; care?: Care;
}

/** Bar colors: the Brains' palette, so the plan reads like the rest of the app. */
export const TONE_COLOR: Record<Tone, string> = {
  strategy: '#F5B301', brand: '#06B6D4', content: '#8B5CF6', web: '#2A7FFF', agents: '#2F4DE0', ads: '#E0428A', knowledge: '#10B981',
};
export const MILESTONE = 'linear-gradient(90deg,#F26B1D,#F7943C)';

/** Index of the period that contains today, or -1 when the periods have no dates or today is outside them. */
export function todayIndex(s: Schedule, now = new Date()): number {
  const iso = now.toISOString().slice(0, 10);
  let idx = -1;
  s.periods.forEach((p, i) => { if (p.from && p.from <= iso) idx = i; });
  const last = s.periods[s.periods.length - 1]?.from;
  if (idx === s.periods.length - 1 && last) {
    const span = s.periods.length > 1 && s.periods[0].from ? (Date.parse(last) - Date.parse(s.periods[0].from)) / (s.periods.length - 1) : 31 * 864e5;
    if (Date.parse(iso) > Date.parse(last) + span) return -1;
  }
  return idx;
}

/** Contract deliverables (milestones) delivered vs total. */
export function progress(c: Contract) {
  const ms = c.schedule?.sections.flatMap((s) => s.rows.filter((r) => r.milestone)) ?? [];
  return { done: ms.filter((r) => r.done).length, total: ms.length };
}
