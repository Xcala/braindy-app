import { useState } from 'react';
import { useBrands } from '../../brands/BrandProvider';
import { useL } from '../../plan/HostingParts';
import { api } from '../../lib/api';
import type { Plan } from '../../billing/useBilling';

type Row = Plan & { brandId: string; hostingSite?: string | null; hostingPaused?: boolean; hostingFailedAt?: { toDate(): Date } };
const a = (id: string) => `/v1/admin/brands/${encodeURIComponent(id)}/site`;
const DAY = 864e5;

/** Admin · Billing · Website hosting: which Firebase Hosting site is each brand's, its payment state, and the
 *  approved rule (notice day 0 and 7, pause day 15, back on payment). Pause and resume by hand too. */
export function SiteHostingAdmin({ rows, reload }: { rows: Row[]; reload: () => void }) {
  const { brands } = useBrands();
  const L = useL();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const act = async (id: string, path: string, init: RequestInit) => {
    setBusy(id); setErr(null);
    try { await api(`${a(id)}/${path}`, init); reload(); } catch (e) { setErr(String((e as Error).message)); }
    setBusy(null);
  };
  const setSite = (id: string, current?: string | null) => {
    const site = window.prompt(L(['ID del sitio en Firebase Hosting (p. ej. pequeloop-web). Vacío para quitarlo.', 'Firebase Hosting site ID (e.g. pequeloop-web). Empty to remove.']), current ?? '');
    if (site !== null) void act(id, 'hosting', { method: 'PUT', body: JSON.stringify({ site }) });
  };

  return (
    <section className="col g12" aria-labelledby="sh-h">
      <div className="col g4"><h2 className="h2" id="sh-h">{L(['Hosting de sitios web', 'Website hosting'])}</h2>
        <p className="t-sm t-mute">{L(['Si un cobro falla: aviso el día 0 y el 7, el sitio se pausa el día 15 y vuelve solo al pagar. Nada se borra.', 'If a charge fails: notice on day 0 and 7, the site pauses on day 15 and comes back on payment. Nothing is deleted.'])}</p></div>
      {err && <p role="alert" className="t-sm" style={{ color: 'var(--danger, #DC2626)' }}>{err}</p>}
      <div className="table overflow-x-auto">
        <div className="trow head label min-w-[46rem]" style={{ gridTemplateColumns: 'minmax(0,1.3fr) 1fr 1.2fr 1.3fr 9rem' }}>
          <span>{L(['Marca', 'Brand'])}</span><span>Plan</span><span>{L(['Sitio', 'Site'])}</span><span>{L(['Estado', 'State'])}</span><span />
        </div>
        {brands.filter((b) => b.status === 'active' && b.kind === 'brand').map((b) => {
          const r = rows.find((x) => x.brandId === b.id);
          const failed = r?.hostingFailedAt?.toDate();
          const days = failed ? Math.floor((Date.now() - failed.getTime()) / DAY) : null;
          const state = r?.hostingPaused ? L(['En pausa', 'Paused'])
            : days != null ? L([`Pago pendiente · día ${days} de 15`, `Unpaid · day ${days} of 15`])
            : r?.hostingStatus === 'active' ? L(['Al día', 'Paid']) : r?.hosting ? L(['Sin pago activo', 'No active payment']) : '—';
          return (
            <div key={b.id} className="trow min-w-[46rem]" style={{ gridTemplateColumns: 'minmax(0,1.3fr) 1fr 1.2fr 1.3fr 9rem' }}>
              <span className="w7 truncate">{b.name}</span>
              <span className="t-sm">{r?.hosting ? `${r.hosting[0].toUpperCase()}${r.hosting.slice(1)}${r.hostingBill === 'y' ? L([' · anual', ' · yearly']) : ''}` : '—'}</span>
              <button type="button" className="btn btn-ghost btn-sm" style={{ justifySelf: 'start' }} disabled={busy === b.id} onClick={() => setSite(b.id, r?.hostingSite)}>{r?.hostingSite || L(['Conectar sitio', 'Link site'])}</button>
              <span className="t-sm">{state}</span>
              {r?.hostingSite
                ? r.hostingPaused
                  ? <button type="button" className="btn btn-primary btn-sm" disabled={busy === b.id} onClick={() => void act(b.id, 'resume', { method: 'POST', body: '{}' })}>{L(['Reactivar', 'Resume'])}</button>
                  : <button type="button" className="btn btn-secondary btn-sm" disabled={busy === b.id} onClick={() => window.confirm(L([`¿Pausar el sitio de ${b.name}? Se ve la página «Sitio en pausa» hasta reactivarlo.`, `Pause ${b.name}'s site? It shows the "Site paused" page until resumed.`])) && void act(b.id, 'pause', { method: 'POST', body: '{}' })}>{L(['Pausar', 'Pause'])}</button>
                : <span />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
