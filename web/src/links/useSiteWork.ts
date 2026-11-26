import { useEffect, useRef, useState } from 'react';
import { useRequests } from '../requests/useRequests';
import type { BrandRequest } from '../requests/types';

const hostOf = (url?: string) => { try { return url ? new URL(url).host.replace(/^www\./, '') : ''; } catch { return ''; } };

/** received: waiting for Builder · working: a Brain has the turn now · done: Builder finished it and it is on the site. */
export type JobState = 'received' | 'working' | 'done';
export type SiteJob = { r: BrandRequest; state: JobState; note?: string };

function stateOf(r: BrandRequest): SiteJob {
  const steps = r.work?.steps ?? [];
  const builder = steps.find((s) => s.brain === 'builder');
  if (r.work?.current || steps.some((s) => s.state === 'doing')) return { r, state: 'working' };
  if (builder?.state === 'done' || r.status === 'to_approve') return { r, state: 'done', note: builder?.note };
  return { r, state: 'received' };
}

/**
 * The adjustments the client asked for from this site (web requests titled «Ajuste del sitio» with the site's address),
 * while they are not approved yet, each with where it stands. Builder moves them with braindy_work_step:
 * "doing" turns the card on (working), "done" makes it ready to see on the site.
 */
export function useSiteWork(brandId: string, url: string) {
  const { list } = useRequests(brandId);
  const host = hostOf(url);
  const jobs = list
    .filter((r) => r.category === 'web' && !r.archived && r.status !== 'approved' && r.status !== 'published'
      && /^(Ajuste del sitio|Site adjustment)/.test(r.title) && (r.cards?.product?.links ?? []).some((l) => hostOf(l) === host))
    .map(stateOf);
  const working = jobs.filter((j) => j.state === 'working').length;

  // What just finished while the viewer is open (it was received or working a moment ago): the viewer offers to show it.
  const seen = useRef<Map<string, JobState> | null>(null);
  const [justDone, setJustDone] = useState<SiteJob | null>(null);
  const key = jobs.map((j) => `${j.r.id}:${j.state}`).join('|');
  useEffect(() => {
    const now = new Map(jobs.map((j) => [j.r.id, j.state] as const));
    if (seen.current) {
      const fin = jobs.find((j) => j.state === 'done' && seen.current!.has(j.r.id) && seen.current!.get(j.r.id) !== 'done');
      if (fin) setJustDone(fin);
    }
    seen.current = now;
  }, [key]);

  return { jobs, working, justDone, clearJustDone: () => setJustDone(null) };
}
