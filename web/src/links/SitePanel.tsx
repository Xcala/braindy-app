import { useEffect, useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { pct, pointsFor, STATUSES, useSiteChanges } from './SiteChanges';
import type { BrandLink } from './useBrandLinks';
import type { SiteFrame } from './useSpot';
import { SiteComments, useSiteComments, type SiteComment } from './SiteComments';
import { SiteAsk } from './SiteAsk';
import { SiteDone } from './SiteDone';
import { Point } from './SitePoint';

type Tab = 'adjust' | 'comments' | 'done';

/**
 * The narrow column beside the site in the viewer, in three tabs by what is happening to the work:
 * Adjust (what is open + ask for one more), Comment (talk about a part of the page: write it or click it) and
 * Delivered (everything that already happened: delivered adjustments and resolved comments, newest first).
 */
export function SitePanel({ brandId, link, links, frame }: { brandId: string; link: BrandLink; links: BrandLink[]; frame?: SiteFrame }) {
  const { t, lang } = useI18n();
  const onShow = frame?.go, active = frame?.active;
  const comments = useSiteComments(brandId, link.url);
  const all = useSiteChanges(brandId);
  const list = pointsFor(all, link, links);
  const open = list.filter((x) => x.status !== 'delivered' && x.status !== 'discarded');
  const done = list.filter((x) => x.status === 'delivered');
  const openComments = comments.filter((c) => !c.resolved).length;
  const doneCount = done.length + comments.filter((c) => c.resolved).length;
  const total = pct(list);
  const counts = STATUSES.map((s) => [s, list.filter((x) => x.status === s).length] as const).filter(([, n]) => n);
  const [tab, setTab] = useState<Tab>('adjust');

  // A pin clicked on the site, or comment mode turned on, brings the Comment tab forward.
  useEffect(() => { if (frame?.pinned || frame?.picking) setTab('comments'); }, [frame?.pinned, frame?.picking]);
  // In the Comment tab the page is already listening for a click; leaving the tab puts the page back to normal.
  useEffect(() => {
    if (!frame) return;
    if (tab === 'comments') { if (!frame.picked) frame.setPicking(true); } else if (frame.picking) frame.setPicking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /** NickMark turns a comment into an adjustment point (in progress); the comment keeps the key it became. */
  async function toPoint(c: SiteComment) {
    const nums = all.map((x) => /^CM(\d+)$/.exec(x.key)).filter((m): m is RegExpExecArray => !!m).map((m) => Number(m[1]));
    const key = `CM${String(Math.max(0, ...nums) + 1).padStart(2, '0')}`;
    const spot = c.spot?.text || c.spot?.selector;
    await addDoc(collection(db, 'brands', brandId, 'siteChanges'), {
      key, group: lang === 'es' ? 'Comentarios' : 'Comments', title: c.text.split('\n')[0].slice(0, 90), status: 'in_progress',
      request: `${c.authorName ? `${c.authorName}: ` : ''}${c.text}`.slice(0, 1500), source: `${t('sp.kindComment')} #${c.n}`,
      link: c.url, ...(spot ? { spot } : {}), siteUrl: link.url,
      order: Math.max(-1, ...all.map((x) => x.order ?? 0)) + 1, updatedAt: serverTimestamp(), createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'brands', brandId, 'siteComments', c.id), { asPoint: key });
  }

  const tabs: [Tab, string, number][] = [['adjust', t('sp.tAdjust'), open.length], ['comments', t('sp.tComment'), openComments], ['done', t('sp.tDone'), doneCount]];
  return (
    <aside id="site-panel" className="spanel sx" aria-labelledby="sp-title">
      <header className="col g8">
        <span className="sx-by"><span className="brain b-builder"><img src="/brand/brains/builder.png" alt="" /></span>{t('site.by')}</span>
        <div className="row between g12">
          <h2 className="h3" id="sp-title" style={{ margin: 0 }}>{t('site.title')}</h2>
          {list.length > 0 && <button type="button" className="spanel-pct" aria-label={`${total}% ${t('site.pct')}`} onClick={() => setTab('done')}><b>{total}</b>%</button>}
        </div>
        {list.length > 0 && <>
          <div className="sx-bar" aria-hidden="true">{counts.map(([s, n]) => <span key={s} className={`is-${s}`} style={{ flexGrow: n }} />)}</div>
          <p className="t-xs spanel-legend" style={{ margin: 0 }}>
            <button type="button" className="spanel-textbtn" onClick={() => setTab('done')}>{t('sp.nDone', { n: done.length })}</button>
            {' · '}
            <button type="button" className="spanel-textbtn" onClick={() => setTab('adjust')}>{t('sp.nTodo', { n: open.length })}</button>
          </p>
        </>}
      </header>

      <div className="seg sc-tabs" role="tablist" aria-label={t('site.title')}>
        {tabs.map(([id, label, n]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}{n ? ` (${n})` : ''}</button>
        ))}
      </div>

      {tab === 'adjust' && (
        <div className="col g8">
          <SiteAsk brandId={brandId} url={link.url} />
          {open.length === 0 ? <p className="t-sm t-mute" style={{ margin: 0 }}>{t('sp.empty')}</p> : <>
            <p className="label" style={{ margin: 0 }}>{t('sp.nTodo', { n: open.length })}</p>
            {open.map((x) => <Point key={x.id} brandId={brandId} x={x} onShow={onShow} on={active === x.key} />)}
          </>}
        </div>
      )}
      {tab === 'comments' && <SiteComments brandId={brandId} siteUrl={link.url} list={comments} frame={frame} onToPoint={toPoint} />}
      {tab === 'done' && <SiteDone brandId={brandId} points={list} comments={comments} frame={frame} />}
    </aside>
  );
}
