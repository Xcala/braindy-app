import { useEffect, useRef, useState } from 'react';
import { useConfirm } from '../../components/useConfirm';
import { useL } from '../../plan/HostingParts';
import { api } from '../../lib/api';
import type { Plan } from '../../billing/useBilling';

export type HostRow = Plan & { brandId: string; hostingSite?: string | null; hostingPaused?: boolean; hostingFailedAt?: { toDate(): Date } };
type L = ReturnType<typeof useL>;
const a = (id: string) => `/v1/admin/brands/${encodeURIComponent(id)}/site`;
const DAY = 864e5;
const SITE_RE = /^[a-z0-9-]{3,63}$/;

/** Days since a hosting charge failed (null when it has not failed). */
export const failedDays = (r?: HostRow) => { const f = r?.hostingFailedAt?.toDate(); return f ? Math.floor((Date.now() - f.getTime()) / DAY) : null; };

/** One line for the site of a brand: plan, linked site and payment state; `bad` when it needs a look. */
export function siteState(r: HostRow | undefined, L: L): { text: string; bad: boolean } | null {
  if (!r?.hosting && !r?.hostingSite) return null;
  const days = failedDays(r);
  if (r.hostingPaused) return { text: L(['Sitio en pausa', 'Site paused']), bad: true };
  if (days != null) return { text: L([`Sitio: pago pendiente · día ${days} de 15`, `Site: unpaid · day ${days} of 15`]), bad: true };
  if (!r.hostingSite) return { text: L(['Sitio sin conectar', 'Site not linked']), bad: false };
  if (r.hostingStatus === 'active') return { text: L(['Sitio al día', 'Site paid']), bad: false };
  return { text: L(['Sitio sin pago activo', 'Site with no active payment']), bad: false };
}

/** Admin · Billing · inside a brand's plan window: its Firebase Hosting site, payment state and the approved rule
 *  (notice day 0 and 7, pause day 15, back on payment). Link the site in Braindy's own window; pause and resume by hand. */
export function SiteHostingAdmin({ brandId, brandName, row, reload }: { brandId: string; brandName: string; row?: HostRow; reload: () => void }) {
  const [dialog, ask] = useConfirm();
  const L = useL();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const act = async (path: string, init: RequestInit) => {
    setBusy(true); setErr(null);
    try { await api(`${a(brandId)}/${path}`, init); reload(); return true; } catch (e) { setErr(String((e as Error).message)); return false; } finally { setBusy(false); }
  };
  const st = siteState(row, L);
  const plan = row?.hosting ? `${row.hosting[0].toUpperCase()}${row.hosting.slice(1)}${row.hostingBill === 'y' ? L([' · anual', ' · yearly']) : ''}` : null;

  return (
    <section className="col g8" aria-labelledby={`sh-${brandId}`}>
      {dialog}
      <h3 className="h3" id={`sh-${brandId}`}>{L(['Hosting del sitio', 'Website hosting'])}</h3>
      <p className="t-xs t-mute">{L(['Si un cobro falla: aviso el día 0 y el 7, el sitio se pausa el día 15 y vuelve solo al pagar. Nada se borra.', 'If a charge fails: notice on day 0 and 7, the site pauses on day 15 and comes back on payment. Nothing is deleted.'])}</p>
      <p className="t-sm">{[plan, st?.text].filter(Boolean).join(' · ') || L(['Sin hosting', 'No hosting'])}</p>
      {err && <p role="alert" className="t-sm" style={{ color: 'var(--danger)' }}>{err}</p>}
      <div className="row g8 wrap">
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setLinking(true)}>
          {row?.hostingSite ? L([`Sitio: ${row.hostingSite}`, `Site: ${row.hostingSite}`]) : L(['Conectar sitio', 'Link site'])}
        </button>
        {row?.hostingSite && (row.hostingPaused
          ? <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void act('resume', { method: 'POST', body: '{}' })}>{L(['Reactivar', 'Resume'])}</button>
          : <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={async () => { if (await ask({ title: L([`¿Pausar el sitio de ${brandName}?`, `Pause ${brandName}'s site?`]), body: L(['Se ve la página «Sitio en pausa» hasta reactivarlo.', 'It shows the "Site paused" page until resumed.']), confirmLabel: L(['Pausar', 'Pause']), danger: true })) void act('pause', { method: 'POST', body: '{}' }); }}>{L(['Pausar', 'Pause'])}</button>)}
      </div>
      {linking && <SiteDialog brandId={brandId} brandName={brandName} current={row?.hostingSite ?? ''} busy={busy} onClose={() => setLinking(false)}
        onSave={async (site) => { if (await act('hosting', { method: 'PUT', body: JSON.stringify({ site }) })) setLinking(false); }} />}
    </section>
  );
}

/** «Conectar el sitio de {marca}» in a Braindy window (not window.prompt): the site ID, checked as you type, with
 *  suggestions from the brand's id. Empty unlinks it. */
function SiteDialog({ brandId, brandName, current, busy, onClose, onSave }: {
  brandId: string; brandName: string; current: string; busy: boolean; onClose: () => void; onSave: (site: string) => void;
}) {
  const L = useL();
  const [v, setV] = useState(current);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  const id = v.trim().toLowerCase();
  const bad = id !== '' && !SITE_RE.test(id);
  const sugs = [...new Set([`${brandId}-web`, brandId, `${brandId}-site`].map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')))];

  return (
    <div className="scrim fixed inset-0 z-[60] flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal w-full max-w-[26rem]" role="dialog" aria-modal="true" aria-labelledby="site-h" onSubmit={(e) => { e.preventDefault(); if (!bad) onSave(id); }}>
        <h2 className="h2" id="site-h">{L([`Conectar el sitio de ${brandName}`, `Link ${brandName}'s site`])}</h2>
        <div className="field">
          <label htmlFor="site-id">{L(['Sitio de Firebase Hosting', 'Firebase Hosting site'])}</label>
          <input ref={ref} id="site-id" className={`input${bad ? ' is-error' : ''}`} list="site-sugs" value={v} onChange={(e) => setV(e.target.value)}
            placeholder={`${brandId}-web`} autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-invalid={bad} aria-describedby="site-help" />
          <datalist id="site-sugs">{sugs.map((s) => <option key={s} value={s} />)}</datalist>
          <p id="site-help" className={`help${bad ? ' err' : ''}`}>
            {bad ? L(['Solo minúsculas, números y guiones (3 a 63).', 'Lowercase letters, numbers and dashes only (3 to 63).'])
              : L(['El ID que sale en la consola de Firebase Hosting (p. ej. pequeloop-web). Vacío para quitarlo.', 'The ID shown in the Firebase Hosting console (e.g. pequeloop-web). Empty to remove it.'])}
          </p>
        </div>
        <div className="row g12" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{L(['Cancelar', 'Cancel'])}</button>
          <button type="submit" className="btn btn-primary" disabled={bad || busy || id === current}>{id ? L(['Conectar', 'Link']) : L(['Quitar', 'Remove'])}</button>
        </div>
      </form>
    </div>
  );
}
