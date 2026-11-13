import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { countCopy, downloadResource, KIND_COLOR, sizeLabel, type Kind, type Resource } from './useResources';

const KIND_ICON: Record<Kind, string> = {
  skill: 'M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z',
  script: 'M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14',
  prompt: 'M5 5h14v10H10l-4 4v-4H5zM9 10h6',
  template: 'M4 4h16v16H4zM4 10h16M10 10v10',
  guide: 'M4 5h7a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4zM20 5h-6',
  tool: 'M14 6a4 4 0 0 0 5 5l-8 8a2 2 0 0 1-3-3l8-8a4 4 0 0 0-2-2z',
};

export function KindBadge({ kind, big }: { kind: Kind; big?: boolean }) {
  const s = big ? 44 : 36;
  return (
    <span className="res-kind" style={{ width: s, height: s, background: `${KIND_COLOR[kind]}1A`, color: KIND_COLOR[kind] }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={big ? 22 : 18} height={big ? 22 : 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={KIND_ICON[kind]} /></svg>
    </span>
  );
}

/** The quick actions of a resource: download its file, open its link, copy its text. */
export function ResourceActions({ r, primary }: { r: Resource; primary?: boolean }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const cls = (first: boolean) => `btn btn-sm ${first && primary ? 'btn-primary' : 'btn-secondary'}`;
  const copy = () => { void navigator.clipboard?.writeText(r.body ?? '').then(() => { setCopied(true); countCopy(r.id); setTimeout(() => setCopied(false), 2000); }); };
  const dl = async () => { setBusy(true); try { await downloadResource(r.id); } finally { setBusy(false); } };
  return (
    <span className="row g8 wrap">
      {r.file && <button type="button" className={cls(true)} disabled={busy} onClick={dl}>{t('res.download')}</button>}
      {r.url && <a className={cls(!r.file)} href={r.url} target="_blank" rel="noreferrer">{t('res.open')} ↗</a>}
      {r.body && <button type="button" className={cls(!r.file && !r.url)} onClick={copy}>{t(copied ? 'res.copied' : 'res.copy')}</button>}
    </span>
  );
}

/** One resource as a card (grid) or a row (list). Clicking the title opens the details. */
export function ResourceItem({ r, layout, onOpen, onEdit }: { r: Resource; layout: 'list' | 'grid'; onOpen: () => void; onEdit?: () => void }) {
  const { t, lang } = useI18n();
  const title = r.title[lang] || r.title.es;
  const summary = r.summary[lang] || r.summary.es;
  const meta = (
    <span className="row g8 wrap t-xs t-mute">
      <span className="w7" style={{ color: KIND_COLOR[r.kind] }}>{t(`res.kind.${r.kind}`)}</span>
      {r.file && <span>· {sizeLabel(r.file.size)}</span>}
      {r.status === 'draft' && <span className="chip c-draft">{t('res.draft')}</span>}
      {onEdit && <span>· {t('res.uses', { n: (r.downloads ?? 0) + (r.copies ?? 0) })}</span>}
    </span>
  );
  const edit = onEdit && <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>{t('res.edit')}</button>;
  if (layout === 'list') {
    return (
      <li className="res-row">
        <KindBadge kind={r.kind} />
        <span className="col g4 grow" style={{ minWidth: 0 }}>
          <button type="button" className="res-title truncate" onClick={onOpen}>{title}</button>
          <span className="t-sm t-mute truncate">{summary}</span>
          {meta}
        </span>
        <span className="row g8 shrink-0 res-row-actions"><ResourceActions r={r} />{edit}</span>
      </li>
    );
  }
  return (
    <li className="card col g12 res-card">
      <span className="row between g8"><KindBadge kind={r.kind} big />{edit}</span>
      <button type="button" className="res-title" onClick={onOpen}>{title}</button>
      <p className="t-sm t-mute res-clamp">{summary}</p>
      {r.tags.length > 0 && <span className="row g6 wrap">{r.tags.slice(0, 4).map((x) => <span key={x} className="res-tag">{x}</span>)}</span>}
      <span className="col g8" style={{ marginTop: 'auto' }}>{meta}<ResourceActions r={r} primary /></span>
    </li>
  );
}
