import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { createRequest } from '../requests/api';
import { useRequests } from '../requests/useRequests';
import type { BrandRequest } from '../requests/types';

const hostOf = (url?: string) => { try { return url ? new URL(url).host.replace(/^www\./, '') : ''; } catch { return ''; } };

/** Adjustment requests the client sent from this site that Builder has not turned into a point yet. */
function useReceived(brandId: string, url: string): BrandRequest[] {
  const { list } = useRequests(brandId);
  const host = hostOf(url);
  return list.filter((r) => r.category === 'web' && !r.archived && r.status !== 'approved' && r.status !== 'published'
    && /^(Ajuste del sitio|Site adjustment)/.test(r.title) && (r.cards?.product?.links ?? []).some((l) => hostOf(l) === host));
}

/**
 * "Adjust" tab, top: one line that opens a box to ask for an adjustment (a web request routed to Builder, with the site's
 * address attached), and what was already sent and is waiting for Builder. Talking about a part of the page is the Comment tab.
 */
export function SiteAsk({ brandId, url }: { brandId: string; url: string }) {
  const { t } = useI18n();
  const received = useReceived(brandId, url);
  const [openBox, setOpenBox] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setBusy(true); setError(false);
    try {
      await createRequest(brandId, {
        category: 'web', title: `${t('sp.reqTitle')}: ${v.split('\n')[0].slice(0, 70)}`,
        cards: { product: { text: v, links: [url], files: [] } },
      });
      setText(''); setOpenBox(false);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <div className="col g8">
      {!openBox ? (
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
          {error && <p className="help err" role="alert" style={{ margin: 0 }}>{t('sp.error')}</p>}
        </form>
      )}

      {received.length > 0 && (
        <div className="col g8">
          <p className="label" style={{ margin: 0 }}>{t('sp.received')}</p>
          {received.map((r) => (
            <Link key={r.id} to={`/requests/${r.id}`} className="spanel-pt spanel-recv">
              <span className="spanel-ptitle">{(r.cards?.product?.text ?? r.title).split('\n')[0].slice(0, 90)}</span>
              <span className="t-xs t-mute">{t('sp.seeRequest')} →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
