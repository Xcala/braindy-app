import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';
import { SitePanel } from './SitePanel';
import { useSpot } from './useSpot';
import { useSiteWork } from './useSiteWork';
import { useToast } from '../components/Toaster';
import { AddressBar } from './AddressBar';
import { ModeSwitch, useSiteMode, useSiteSignIn } from './SiteModes';
import type { BrandLink } from './useBrandLinks';
import './viewer.css';

const SIZES = { desktop: '100%', tablet: '820px', phone: '390px' } as const;
type Size = keyof typeof SIZES;

/**
 * A site or app opened inside Braindy, full screen, with a computer / tablet / phone width and a way out to a new tab.
 * Sites that refuse to be shown inside another page (checked when NickMark saves the link) get the new-tab button instead.
 */
export function LinkViewer({ brandId, link, links, onClose }: { brandId: string; link: BrandLink; links: BrandLink[]; onClose: () => void }) {
  const { t } = useI18n();
  const [size, setSize] = useState<Size>('desktop');
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // The page behind does not scroll while the viewer is open.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus(); };
  }, [onClose]);
  // Links saved before the check ask the API once (it keeps the answer on the link). undefined = still asking.
  const [frame, setFrame] = useState<boolean | null | undefined>(typeof link.embeddable === 'boolean' ? link.embeddable : undefined);
  useEffect(() => {
    if (frame !== undefined) return;
    api<{ embeddable: boolean | null }>(`/v1/brands/${brandId}/links/${link.id}/frame`).then((r) => setFrame(r.embeddable), () => setFrame(null));
  }, [brandId, link.id, frame]);
  const blocked = frame === false;
  const spot = useSpot(link.url);
  // The adjustments column: open by default where there is room, folded on phones.
  const hasPanel = link.section === 'apps';
  const [panel, setPanel] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768);
  // A site with its own editor opens in it («Hazlo tú», full width, same frame, already signed in); «Dímelo» is this panel.
  const sm = useSiteMode(link.id, spot, hasPanel && !blocked);
  useSiteSignIn(brandId, link.id, spot, hasPanel && !blocked && !!link.editorAuth);
  const editing = sm.mode === 'edit';
  // Builder's work on this site, live: a pill while it works, and when it finishes (or a deploy lands) «there is a new version».
  const work = useSiteWork(brandId, link.url);
  const toast = useToast();
  const { justDone, clearJustDone } = work;
  const markFresh = spot.markFresh;
  useEffect(() => {
    if (!justDone) return;
    markFresh();
    toast({ text: t('lv.freshDone', { what: justDone.note || (justDone.r.cards?.product?.text ?? justDone.r.title).split('\n')[0].slice(0, 70) }), ms: 8000, tone: 'ok' });
    clearJustDone();
  }, [justDone, clearJustDone, markFresh, toast, t]);
  // In the editor the comments stay one click away, folded.
  useEffect(() => { if (editing) setPanel(false); }, [editing]);

  return (
    <div className="lview" role="dialog" aria-modal="true" aria-label={link.title}>
      <div className="lview-bar">
        <button type="button" className="lview-back" onClick={onClose} aria-label={t('lv.backTo')} title={t('lv.backTo')}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>{t('lv.back')}</span>
        </button>
        <div className="col" style={{ minWidth: 0 }}>
          <span className="w7 truncate">{link.title}</span>
          {blocked && <span className="t-xs t-mute truncate">{link.url.replace(/^https:\/\//, '')}</span>}
        </div>
        {!blocked && !editing && <AddressBar spot={spot} home={link.url} />}
        {hasPanel && !blocked && (spot.fresh
          ? <span className="lview-live is-fresh" role="status">{t('lv.fresh')} <button type="button" className="btn btn-primary btn-sm" onClick={spot.reload}>{t('lv.seeNew')}</button></span>
          : work.working > 0 && <span className="lview-live is-working" role="status">{t('lv.working', { n: work.working })}</span>)}
        {sm.canEdit && <ModeSwitch mode={sm.mode} setMode={sm.setMode} />}
        {!blocked && !editing && (
          <div className="seg lview-sizes" role="group" aria-label={t('lv.size')}>
            {(Object.keys(SIZES) as Size[]).map((s) => (
              <button key={s} type="button" className={size === s ? 'is-on' : ''} aria-pressed={size === s} onClick={() => setSize(s)}>{t(`lv.${s}`)}</button>
            ))}
          </div>
        )}
        <button type="button" className="btn btn-secondary btn-sm lview-ai" onClick={() => window.dispatchEvent(new Event('bd-help-toggle'))}>✦ {t('help.dock')}</button>
        <a href={link.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">{t('lv.newTab')} ↗</a>
        <button ref={close} type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t('lb.close')}>✕</button>
      </div>
      <div className="lview-body">
        <div className="lview-stage">
          {frame === undefined ? <div className="skel lview-frame" style={{ width: SIZES[size] }} /> : blocked ? (
            <div className="card col g12 lview-blocked">
              <p className="h3" style={{ margin: 0 }}>{t('lv.blockedTitle')}</p>
              <p className="t-sm t-mute" style={{ margin: 0 }}>{t('lv.blocked')}</p>
              <a href={link.url} target="_blank" rel="noreferrer" className="btn btn-primary self-start">{t('lv.newTab')} ↗</a>
            </div>
          ) : (
            <>
              <iframe ref={spot.frame} title={link.title} src={link.url} className="lview-frame" style={{ width: editing ? '100%' : SIZES[size] }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
                referrerPolicy="no-referrer" allow="fullscreen; clipboard-write" />
              {frame === null && <p className="t-xs t-mute lview-hint">{t('lv.hint')}</p>}
              {spot.note && <p className="lview-note t-sm" role="status">{t(spot.note === 'moved' ? 'sp.noBridge' : spot.note === 'nobridge' ? 'sc.noBridge' : 'sp.notFound')} <button type="button" className="btn btn-ghost btn-sm" onClick={spot.dismiss} aria-label={t('lb.close')}>✕</button></p>}
            </>
          )}
        </div>
        {hasPanel && (
          <div className={`lview-side${panel ? ' is-open' : ''}`}>
            {/* One clear handle: a rail with the label when folded, a round button in the corner when open. */}
            <button type="button" className="lview-side-tog" aria-expanded={panel} aria-controls="site-panel" onClick={() => setPanel((p) => !p)}
              aria-label={t(panel ? 'sp.hide' : 'sp.show')} title={t(panel ? 'sp.hide' : 'sp.show')}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M13 6l6 6-6 6M5 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="lview-side-label">{t('sp.toggle')}</span>
            </button>
            <div className="lview-side-in" inert={!panel}><SitePanel brandId={brandId} link={link} links={links} frame={blocked || editing ? undefined : spot} jobs={work.jobs} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
