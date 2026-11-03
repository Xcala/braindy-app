import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import type { BrandRequest } from './types';
import { ASKEDS, DUES, NO_FILTERS, SORTS, TABS, inTab, isFiltered, type ReqFilters } from './requestFilters';
import '../assets/files.css';

/** Names of the brand's people, to say who asked for each request. */
function useMemberNames(brandId: string) {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => onSnapshot(collection(db, 'brands', brandId, 'members'),
    (s) => setNames(Object.fromEntries(s.docs.map((d) => [d.id, String(d.data().name || d.data().email || '')]))), () => setNames({})), [brandId]);
  return names;
}

type Props = {
  brandId: string; all: BrandRequest[]; narrowed: BrandRequest[]; shown: number; f: ReqFilters; set: (f: ReqFilters) => void;
  tags: string[]; onCsv: () => void; onPdf: () => void;
};

/**
 * Same two-row bar as Files: search and the selects first (who asked, due date, requested date, sort), then the
 * status tabs with their counts and "N of M". Every control is 40 px.
 */
export function RequestsToolbar({ brandId, all, narrowed, shown, f, set, tags, onCsv, onPdf }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const hasArchived = all.some((r) => r.archived);
  const copyLink = () => navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  const names = useMemberNames(brandId);
  const who = [...new Set(all.map((r) => r.createdBy).filter(Boolean))]
    .map((uid) => ({ uid, name: names[uid] || t('rf.team') }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const put = (p: Partial<ReqFilters>) => set({ ...f, ...p });
  const sel = (label: string, value: string, onChange: (v: string) => void, opts: Array<[string, string]>) => (
    <label className="fx-select">
      <span className="sr">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <Icon name="chevronDown" size={16} />
    </label>
  );

  return (
    <div className="card fx" style={{ padding: 0 }}>
      <div className="fx-bar" style={{ borderBottom: 0 }}>
        <div className="fx-row">
          <div className="fx-find" style={{ width: 'auto', flex: '1 1 260px', maxWidth: 420 }}>
            <div className="search grow">
              <Icon name="search" />
              <input className="input" type="search" value={f.q} onChange={(e) => put({ q: e.target.value })} placeholder={t('rf.search')} aria-label={t('rf.search')} />
            </div>
          </div>
          {who.length > 1 && sel(t('rf.who'), f.who, (v) => put({ who: v }), [['', t('rf.whoAll', { n: who.length })], ...who.map((w): [string, string] => [w.uid, w.name])])}
          {sel(t('rf.due'), f.due, (v) => put({ due: v as ReqFilters['due'] }), DUES.map((d) => [d, t(`rf.due.${d}`)]))}
          {sel(t('rf.asked'), f.asked, (v) => put({ asked: v as ReqFilters['asked'] }), ASKEDS.map((a) => [a, t(`rf.asked.${a}`)]))}
          {tags.length > 0 && sel(t('rf.tag'), f.tag, (v) => put({ tag: v }), [['', t('rf.tagAll')], ...tags.map((g): [string, string] => [g, `#${g}`])])}
          {sel(t('files.sort'), f.sort, (v) => put({ sort: v as ReqFilters['sort'] }), SORTS.map((s) => [s, t(`rf.sort.${s}`)]))}
        </div>
        <div className="fx-row">
          <div className="seg seg-scroll" role="group" aria-label={t('rf.status')} style={{ flex: '1 1 0', minWidth: 0 }}>
            {TABS.map((k) => (
              <button key={k} className={f.tab === k ? 'is-on' : ''} aria-pressed={f.tab === k} onClick={() => put({ tab: k })}>
                {t(`rf.tab.${k}`)} <span className="t-mute">{narrowed.filter((r) => inTab(k, r)).length}</span>
              </button>
            ))}
          </div>
          <span className="t-sm t-mute" aria-live="polite">{t('rf.count', { n: shown, total: all.length })}</span>
          {isFiltered(f) && <button type="button" className="fx-chip" onClick={() => set({ ...NO_FILTERS, sort: f.sort })}><Icon name="x" size={14} />{t('rf.clear')}</button>}
        </div>
        <div className="fx-row">
          {hasArchived && (
            <button type="button" className={`fx-chip${f.archived ? ' is-on' : ''}`} aria-pressed={f.archived} onClick={() => put({ archived: !f.archived, tab: 'all' })}>
              <Icon name="archive" size={14} />{t('rf.archived', { n: all.filter((r) => r.archived).length })}
            </button>
          )}
          <span className="fx-actions">
            {isFiltered(f) && <button type="button" className="fx-chip" onClick={copyLink}><Icon name={copied ? 'check' : 'link'} size={14} />{t(copied ? 'rf.linkCopied' : 'rf.copyLink')}</button>}
            <button type="button" className="fx-chip" onClick={onCsv} disabled={!shown}><Icon name="download" size={14} />{t('rf.excel')}</button>
            <button type="button" className="fx-chip" onClick={onPdf} disabled={!shown}><Icon name="file" size={14} />{t('rf.pdf')}</button>
          </span>
        </div>
      </div>
    </div>
  );
}
