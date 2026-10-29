import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useReports } from '../report/useReports';
import { ReportEditor } from '../report/ReportEditor';
import { CONTACT } from '../proposals/public/copy';

/** Monthly report (design 19): sales, not likes. Made by the four Brains, signed by Nicolas. */
export function Report() {
  const { current } = useBrands();
  const { profile } = useAuth();
  const { t, lang } = useI18n();
  const admin = profile?.role === 'admin';
  const list = useReports(current?.id, admin);
  const [month, setMonth] = useState<string | null>(null);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  const shown = list.filter((r) => admin || r.published);
  const r = shown.find((x) => x.month === month) ?? shown[0];
  const money = (v: number | null | undefined) => v == null ? '—' : new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { style: 'currency', currency: r?.currency || 'COP', maximumFractionDigits: 0 }).format(v);
  const monthName = (m: string) => new Date(`${m}-15`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', year: 'numeric' });
  const max = Math.max(1, ...(r?.leadsByMonth ?? []).map((x) => x.n));

  return (
    <div className="col g32">
      <div className="row between g16 wrap">
        <div className="col g8">
          <p className="label">{t('rep.kicker')}{r ? ` · ${monthName(r.month)}` : ''}</p>
          <h1 className="h1">{t('rep.title')}</h1>
          <p className="t-mute">{t('rep.tagline')}</p>
        </div>
        {r && (
          <div className="row g8 wrap print:hidden">
            {shown.length > 1 && (
              <select className="input" style={{ width: 'auto' }} value={r.month} onChange={(e) => setMonth(e.target.value)} aria-label={t('rep.month')}>
                {shown.map((x) => <option key={x.month} value={x.month}>{monthName(x.month)}{x.published ? '' : ` · ${t('rep.draft')}`}</option>)}
              </select>
            )}
            <button className="btn btn-secondary" onClick={() => window.print()}>{t('rep.pdf')}</button>
            <a className="btn btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${current.name} · ${t('rep.title')} ${monthName(r.month)}: ${window.location.origin}/report`)}`}>{t('rep.share')}</a>
          </div>
        )}
      </div>
      {!r ? <div className="card t-mute">{t('rep.none')}</div> : (
        <>
          {!r.published && <div className="card t-sm" style={{ background: '#FFFBF0', borderColor: '#F5D98A' }}>{t('rep.draftNote')}</div>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card col g4"><span className="t-sm t-mute w7">{t('rep.sales')}</span><span className="h1">{money(r.salesAttributed)}</span><span className="t-xs t-mute">{t('rep.salesSub', { prev: money(r.salesPrev) })}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('rep.leads')}</span><span className="h1">{r.leads ?? '—'}</span><span className="t-xs t-mute">{t('rep.leadsSub')}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('rep.cpl')}</span><span className="h1">{money(r.costPerLead)}</span><span className="t-xs t-mute">{t('rep.cplSub')}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('rep.pieces')}</span><span className="h1">{r.pieces ?? 0}</span><span className="t-xs t-mute">{t('rep.piecesSub', { pct: r.firstTryPct ?? '—' })}</span></div>
          </div>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="card col g16">
              <h2 className="h3">{t('rep.byMonth')}</h2>
              {(r.leadsByMonth ?? []).length === 0 ? <p className="t-sm t-mute">{t('rep.noSeries')}</p> : (
                <div className="row g12" style={{ alignItems: 'flex-end', height: 180 }} role="img" aria-label={(r.leadsByMonth ?? []).map((x) => `${x.month}: ${x.n}`).join(', ')}>
                  {r.leadsByMonth.map((x) => (
                    <div key={x.month} className="col g4 grow" style={{ alignItems: 'center' }}>
                      <span className="t-xs w7">{x.n}</span>
                      <div style={{ width: '100%', maxWidth: 56, height: `${(x.n / max) * 130}px`, background: '#2F4DE0', borderRadius: 8 }} />
                      <span className="t-xs t-mute">{new Date(`${x.month}-15`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              )}
              {r.whatMoved && <div className="col g4"><p className="label">{t('rep.whatMoved')}</p><p className="t-sm">{r.whatMoved}</p></div>}
              <p className="t-xs t-mute">{t('rep.likesNote')}</p>
            </section>
            <aside className="col g16">
              <div className="card col g8"><h2 className="h3">{t('rep.next')}</h2><p className="t-xs t-mute">{t('rep.nextSub')}</p><p className="t-sm" style={{ whiteSpace: 'pre-wrap' }}>{r.nextMonth || '—'}</p></div>
              <div className="card row g12">
                <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-12 w-12 rounded-full object-cover" />
                <div className="col grow"><span className="t-sm w7">{t('rep.reviewed')}</span><span className="t-xs t-mute">{t('rep.book20')}</span></div>
                <a className="btn btn-secondary btn-sm print:hidden" href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer">{t('rep.book')}</a>
              </div>
            </aside>
          </div>
        </>
      )}
      {admin && <div className="print:hidden"><ReportEditor brandId={current.id} existing={list} /></div>}
    </div>
  );
}
