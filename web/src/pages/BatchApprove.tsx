import { useState } from 'react';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useRequests, useVersions } from '../requests/useRequests';
import { useCanApprove } from '../requests/useCanApprove';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import { approveBatch } from '../requests/api';
import type { BrandRequest } from '../requests/types';

/** Approve a month of posts at once (design 14 · batch). */
export function BatchApprove() {
  const { current } = useBrands();
  const { t } = useI18n();
  const { list } = useRequests(current?.id);
  const canApprove = useCanApprove(current?.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const items = list.filter((r) => r.status === 'to_approve' && r.latestVersion);
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const all = selected.size === items.length && items.length > 0;

  async function approve() {
    setBusy(true);
    try {
      const r = await approveBatch(current!.id, items.filter((i) => selected.has(i.id)).map((i) => ({ requestId: i.id, versionId: i.latestVersion! })));
      setDone(r.approved); setSelected(new Set());
    } finally { setBusy(false); }
  }

  return (
    <div className="col g24">
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/requests">{t('nav.requests')}</Link><Icon name="chevronRight" size={14} /><span className="cur">{t('req.batchTitle')}</span></nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8"><p className="label">{current.name}</p><h1 className="h1"><span className="w9">{t('req.batchTitle')}.</span> {t('req.batchSub', { n: items.length })}</h1></div>
        <div className="row g12 wrap">
          <button className="btn btn-secondary" onClick={() => setSelected(all ? new Set() : new Set(items.map((i) => i.id)))}>{all ? t('req.selectNone') : t('req.selectAll')}</button>
          <button className="btn btn-primary" disabled={!canApprove || !selected.size || busy} onClick={approve}><Icon name="check" />{t('req.approveN', { n: selected.size })}</button>
        </div>
      </div>
      {!canApprove && <p className="t-sm t-mute">{t('req.cannotApprove')}</p>}
      {done !== null && <div className="toast self-start" role="status"><span className="ok"><Icon name="check" size={14} /></span>{t('req.batchDone', { n: done })}</div>}
      {items.length === 0 ? <div className="card empty"><p className="t-mute">{t('req.nothingToApprove')}</p></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((r) => <BatchTile key={r.id} brandId={current.id} r={r} on={selected.has(r.id)} onToggle={() => toggle(r.id)} />)}
        </div>
      )}
    </div>
  );
}

function BatchTile({ brandId, r, on, onToggle }: { brandId: string; r: BrandRequest; on: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  const versions = useVersions(brandId, r.id);
  const v = versions.find((x) => x.id === r.latestVersion);
  const url = useFileUrl(brandId, r.id, v);
  return (
    <label className={`tile ${on ? 'is-sel' : ''}`} style={{ cursor: 'pointer' }}>
      <div className="thumb" style={{ height: 200, overflow: 'hidden' }}>
        {url && isImage(v?.files?.[0]?.contentType) ? <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Icon name="file" size={36} />}
        <input type="checkbox" checked={on} onChange={onToggle} className="absolute left-3 top-3" style={{ width: 22, height: 22, accentColor: 'var(--azul)' }} aria-label={r.title} />
        {v && <span className="chip chip-plain c-type absolute right-3 top-3" style={{ background: '#fff' }}>v{v.n}</span>}
      </div>
      <div className="tile-meta">
        <span className="tile-name">{r.title}</span>
        <Link to={`/requests/${r.id}`} className="t-sm w7" onClick={(e) => e.stopPropagation()}>{t('req.review')}</Link>
      </div>
    </label>
  );
}
