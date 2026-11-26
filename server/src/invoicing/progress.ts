// How far the work is, to set it beside what is paid (Nicolas, 2026-11-26): the live schedule (Anexo 2, its contract
// deliveries marked done) and the brand's requests (approved or published vs all, by month they were asked).
// Read-only; the admin screen compares both per project.
import { db } from '../firebase.js';

type Row = { milestone?: boolean; status?: string };
export type Progress = {
  schedule: { done: number; total: number; start: string; weeks: number; elapsed: number } | null;
  /** «2026-11» → [requests asked that month, of them approved or published]; cancelled ones are left out. */
  requests: Record<string, [number, number]>;
};

const ym = (v: unknown) => {
  const d = (v as { toDate?: () => Date })?.toDate?.();
  return d ? d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(0, 7) : null;
};

export async function projectProgress(brandId: string): Promise<Progress> {
  const [sch, reqs] = await Promise.all([
    db.doc(`brands/${brandId}/context/schedule`).get(),
    db.collection(`brands/${brandId}/requests`).select('status', 'cancelled', 'createdAt').get(),
  ]);
  let schedule: Progress['schedule'] = null;
  const s = sch.data() as { start?: string; weeks?: number; groups?: Array<{ rows?: Row[] }> } | undefined;
  const all = (s?.groups ?? []).flatMap((g) => g.rows ?? []);
  if (s?.start && s.weeks && all.length) {
    // Contract deliveries are the milestones; a schedule without them counts every activity (same as Mi plan).
    const rows = all.some((r) => r.milestone) ? all.filter((r) => r.milestone) : all;
    const weeksIn = (Date.now() - Date.parse(`${s.start}T00:00:00Z`)) / (7 * 864e5);
    schedule = { done: rows.filter((r) => r.status === 'done').length, total: rows.length, start: s.start, weeks: s.weeks, elapsed: Math.min(1, Math.max(0, weeksIn / s.weeks)) };
  }
  const requests: Progress['requests'] = {};
  for (const d of reqs.docs) {
    if (d.get('cancelled')) continue;
    const m = ym(d.get('createdAt'));
    if (!m) continue;
    const cell = (requests[m] ??= [0, 0]);
    cell[0] += 1;
    if (['approved', 'published'].includes(String(d.get('status')))) cell[1] += 1;
  }
  return { schedule, requests };
}
