import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { createRequest } from '../requests/api';
import { useToast } from '../components/Toaster';
import type { SiteJob } from './useSiteWork';
import type { SiteFrame } from './useSpot';
import { QuotaCard } from './QuotaCard';
import { useAdjustQuota } from './useAdjustQuota';

/**
 * "Adjust" tab, top: one line that opens a box to ask for an adjustment (a web request routed to Builder, with the site's
 * address attached), and what was already sent, each card with where it stands: received, Builder on it (animated) or
 * ready, with «See the change» that reloads the site in the viewer. Talking about a part of the page is the Comment tab.
 */
export function SiteAsk({ brandId, url, jobs, frame }: { brandId: string; url: string; jobs: SiteJob[]; frame?: SiteFrame }) {
  const { t } = useI18n();
  const toast = useToast();
  const [openBox, setOpenBox] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<false | 'quota' | 'other'>(false);
  // The month's adjustments: asked again whenever one of them moves.
  const { quota, reload } = useAdjustQuota(brandId, jobs.map((j) => j.r.id + j.state).join('|'));
  const out = !!quota && quota.left < quota.per;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setBusy(true); setError(false);
    try {
      await createRequest(brandId, {
        category: 'web', siteAdjust: true, title: `${t('sp.reqTitle')}: ${v.split('\n')[0].slice(0, 70)}`,
        cards: { product: { text: v, links: [url], files: [] } },
      });
      setText(''); setOpenBox(false);
      toast({ text: t('sp.sentToast'), ms: 7000 });
      reload();
    } catch (e) { setError((e as { status?: number }).status === 409 ? 'quota' : 'other'); reload(); } finally { setBusy(false); }
  }

  return (
    <div className="col g8">
      {quota && <QuotaCard brandId={brandId} quota={quota} compact />}
      {out ? null : !openBox ? (
        <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setOpenBox(true)}>＋ {t('sp.askOpen')}</button>
      ) : (
        <form className="spanel-ask col g8" onSubmit={send}>
          <label htmlFor="sp-ask" className="w7 t-sm">{t('sp.ask')}</label>
          <textarea id="sp-ask" className="input" rows={3} autoFocus value={text} maxLength={4000} placeholder={t('sp.askPh')}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(e); }} />
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t('sp.askHint')} {t('sp.askHelp')}</p>
          <div className="row between g8">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setOpenBox(false); setText(''); }}>{t('sc.cancel')}</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>{busy ? `${t('sp.sending')}…` : t('sp.send')}</button>
          </div>
          {error && <p className="help err" role="alert" style={{ margin: 0 }}>{error === 'quota' && quota ? t('q.full', { date: quota.resets }) : t('sp.error')}</p>}
        </form>
      )}

      {jobs.length > 0 && (
        <div className="col g8">
          <p className="label" style={{ margin: 0 }}>{t('sp.received')}</p>
          {jobs.map(({ r, state, note }) => (
            <div key={r.id} className={`spanel-pt spanel-recv is-${state}`}>
              <span className="spanel-job" role="status">
                {state === 'working'
                  ? <span className="brain xs b-builder spanel-job-ico"><img src="/brand/brains/builder.png" alt="" /></span>
                  : <span className={`spanel-job-dot is-${state}`} aria-hidden="true">{state === 'done' ? '✓' : ''}</span>}
                <span className="t-xs w7">{t(`sp.job.${state}`)}</span>
              </span>
              <span className="spanel-ptitle">{(r.cards?.product?.text ?? r.title).split('\n')[0].slice(0, 90)}</span>
              {state === 'working' && <span className="spanel-job-bar" aria-hidden="true" />}
              {state === 'done' && note && <span className="t-sm">{note}</span>}
              <span className="row g8 wrap" style={{ alignItems: 'center' }}>
                {state === 'done' && frame && <button type="button" className="btn btn-primary btn-sm" onClick={frame.reload}>{t('sp.seeChange')}</button>}
                <Link to={`/requests/${r.id}`} className="t-xs t-mute">{t('sp.seeRequest')} →</Link>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
