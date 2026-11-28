import { useState } from 'react';
import { useMemberNames } from './useMemberNames';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import type { BrandRequest } from './types';
import { ASKEDS, DUES, NO_FILTERS, SORTS, TABS, hiddenCount, inTab, isFiltered, type ReqFilters } from './requestFilters';
import { Popover } from './Popover';
import '../assets/files.css';


export type View = 'board' | 'list' | 'calendar';
type Props = {
  brandId: string; all: BrandRequest[]; narrowed: BrandRequest[]; shown: number; f: ReqFilters; set: (f: ReqFilters) => void;
  tags: string[]; isAdmin: boolean; view: View; setView: (v: View) => void; onCsv: () => void; onPdf: () => void;
};

/**
 * One row, like Files: search, status tabs, a "Filters" button that holds the rest (who, dates, campaign, order,
 * archived), the view switch and a ⋯ menu to export or share. Every control is 40 px. On phones (audit P2, 2026-11-26)
 * the bar is two lines: search + Filtros, then the tabs; the view and the export live inside Filtros (requests.css).
 */
export function RequestsToolbar({ brandId, all, narrowed, shown, f, set, tags, isAdmin, view, setView, onCsv, onPdf }: Props) {
  const { t } = useI18n();
  const phone = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const names = useMemberNames(brandId);
  const [copied, setCopied] = useState(false);
  const who = [...new Set(all.map((r) => r.createdBy).filter(Boolean))].map((uid) => ({ uid, name: names[uid] || t('rf.team') })).sort((a, b) => a.name.localeCompare(b.name));
  const archivedN = all.filter((r) => r.archived).length;
  const put = (p: Partial<ReqFilters>) => set({ ...f, ...p });
  const n = hiddenCount(f);
  const tabs = TABS.filter((k) => (k !== 'late' || isAdmin) && (k === 'all' || k === f.tab || narrowed.some((r) => inTab(k, r))));
  const sel = (label: string, value: string, onChange: (v: string) => void, opts: Array<[string, string]>) => (
    <label className="col g4"><span className="t-xs w7 t-mute">{label}</span>
      <span className="fx-select"><select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', maxWidth: 'none' }}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select><Icon name="chevronDown" size={16} /></span>
    </label>
  );

  return (
    <div className="card fx rq-bar" style={{ padding: 0 }}>
      <div className="fx-bar" style={{ borderBottom: 0 }}>
        <div className="fx-row">
          <div className="search" style={{ flex: '1 1 180px', maxWidth: '16.25rem' }}>
            <Icon name="search" />
            <input className="input" type="search" value={f.q} onChange={(e) => put({ q: e.target.value })} placeholder={t('rf.search')} aria-label={t('rf.search')} />
          </div>
          <div className="seg seg-scroll" role="group" aria-label={t('rf.status')} style={{ flex: '0 1 auto', minWidth: 0 }}>
            {tabs.map((k) => (
              <button key={k} className={f.tab === k ? 'is-on' : ''} aria-pressed={f.tab === k} onClick={() => put({ tab: k })}>
                {t(`rf.tab.${k}`)} <span className="t-mute">{narrowed.filter((r) => inTab(k, r)).length}</span>
              </button>
            ))}
          </div>
          <Popover align={phone ? 'right' : 'left'} label={<><Icon name="filter" size={14} />{t('rf.filters')}{n > 0 && <span className="chip" style={{ height: '1.25rem', padding: '0 0.4375rem', background: 'var(--azul-fill)', color: '#fff' }}>{n}</span>}</>}>
            {(close) => (
              <>
                {who.length > 1 && sel(t('rf.who'), f.who, (v) => put({ who: v }), [['', t('rf.whoAll', { n: who.length })], ...who.map((w): [string, string] => [w.uid, w.name])])}
                {sel(t('rf.due'), f.due, (v) => put({ due: v as ReqFilters['due'] }), DUES.filter((d) => d !== 'late').map((d) => [d, t(`rf.due.${d}`)]))}
                {sel(t('rf.asked'), f.asked, (v) => put({ asked: v as ReqFilters['asked'] }), ASKEDS.map((a) => [a, t(`rf.asked.${a}`)]))}
                {tags.length > 0 && sel(t('rf.tag'), f.tag, (v) => put({ tag: v }), [['', t('rf.tagAll')], ...tags.map((g): [string, string] => [g, `#${g}`])])}
                {phone && sel(t('files.view'), view, (v) => { setView(v as View); close(); }, (['list', 'board', 'calendar'] as View[]).map((v) => [v, t(v === 'calendar' ? 'rv.calendar' : v === 'list' ? 'req.list' : 'req.board')]))}
                {sel(t('files.sort'), f.sort, (v) => put({ sort: v as ReqFilters['sort'] }), SORTS.map((s) => [s, t(`rf.sort.${s}`)]))}
                {archivedN > 0 && (
                  <label className="row g8 t-sm"><input type="checkbox" checked={f.archived} onChange={() => put({ archived: !f.archived, tab: 'all' })} />{t('rf.archived', { n: archivedN })}</label>
                )}
                {phone && (
                  <span className="row g4 wrap">
                    <button type="button" className="btn btn-ghost btn-sm" disabled={!shown} onClick={() => { onCsv(); close(); }}><Icon name="download" size={16} />{t('rf.excelLong')}</button>
                    <button type="button" className="btn btn-ghost btn-sm" disabled={!shown} onClick={() => { onPdf(); close(); }}><Icon name="file" size={16} />{t('rf.pdfLong')}</button>
                  </span>
                )}
                <div className="row between">
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!isFiltered(f) && f.sort === 'action'} onClick={() => set(NO_FILTERS)}>{t('rf.clear')}</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={close}>{t('rf.done')}</button>
                </div>
              </>
            )}
          </Popover>
          <span className="fx-actions">
            {isFiltered(f) && <span className="t-sm t-mute" aria-live="polite">{t('rf.count', { n: shown, total: all.length })}</span>}
            <div className="seg" role="group" aria-label={t('files.view')}>
              {(['list', 'board', 'calendar'] as View[]).map((v) => (
                <button key={v} className={view === v ? 'is-on' : ''} aria-pressed={view === v} onClick={() => setView(v)}>{t(v === 'calendar' ? 'rv.calendar' : v === 'list' ? 'req.list' : 'req.board')}</button>
              ))}
            </div>
            <Popover align="right" className="fx-chip" label={<><Icon name="more" size={16} /><span className="sr">{t('rf.more')}</span></>}>
              {(close) => (
                <>
                  <button type="button" className="btn btn-ghost btn-sm self-start" disabled={!shown} onClick={() => { onCsv(); close(); }}><Icon name="download" size={16} />{t('rf.excelLong')}</button>
                  <button type="button" className="btn btn-ghost btn-sm self-start" disabled={!shown} onClick={() => { onPdf(); close(); }}><Icon name="file" size={16} />{t('rf.pdfLong')}</button>
                  <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })}>
                    <Icon name={copied ? 'check' : 'link'} size={16} />{t(copied ? 'rf.linkCopied' : 'rf.copyLink')}
                  </button>
                </>
              )}
            </Popover>
          </span>
        </div>
      </div>
    </div>
  );
}
