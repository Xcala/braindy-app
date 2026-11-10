import { Fragment, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import type { FileKind } from './fileKinds';
import { APPROVED, UPLOADS } from './folderRules';

export type Filter = 'all' | FileKind;
export type Sort = 'name' | 'new' | 'old' | 'big';
export const SORTS: Sort[] = ['name', 'new', 'old', 'big'];

type Props = {
  path: string; setPath: (p: string) => void;
  q: string; setQ: (q: string) => void; everywhere: boolean; setEverywhere: (on: boolean) => void;
  filter: Filter; setFilter: (f: Filter) => void; sort: Sort; setSort: (s: Sort) => void;
  view: 'grid' | 'list'; setView: (v: 'grid' | 'list') => void;
  /** Rebranded brands only: which version's files to show (all, the current one or an earlier one). */
  eras?: { value: string; set: (v: string) => void; options: Array<[string, string]> };
  /** Right end of the second row (upload into this folder). */
  actions?: ReactNode;
};

/** Top of the file browser in two rows: where you are and search; then type filter, sort, view and actions. Every control is 40 px tall. */
export function ExplorerToolbar(p: Props) {
  const { t } = useI18n();
  const crumbs = p.path ? p.path.split('/') : [];
  // Uploads and the approved folder are fixed names in the data; people read them in their language.
  const label = (c: string, i: number) => (i === 0 && c === UPLOADS ? t('files.uploadsName') : i === 0 && c === APPROVED ? t('files.approvedName') : c);
  return (
    <div className="fx-bar">
      <div className="fx-row">
        <nav className="crumbs grow" aria-label="Breadcrumb" id="files-crumbs">
          {/* The brand is already in the page title: the path shows only inside a folder. */}
          {crumbs.length > 0 && <a href="#" onClick={(e) => { e.preventDefault(); p.setPath(''); }}>{t('files.title')}</a>}
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              <Icon name="chevronRight" size={14} />
              {i === crumbs.length - 1 ? <span className="cur">{label(c, i)}</span>
                : <a href="#" onClick={(e) => { e.preventDefault(); p.setPath(crumbs.slice(0, i + 1).join('/')); }}>{label(c, i)}</a>}
            </Fragment>
          ))}
        </nav>
        <div className="fx-find">
          <div className="search grow">
            <Icon name="search" />
            <input className="input" value={p.q} onChange={(e) => p.setQ(e.target.value)} aria-label={t('files.search')}
              placeholder={crumbs.length && !p.everywhere ? t('files.searchIn', { name: label(crumbs[crumbs.length - 1], crumbs.length - 1) }) : t('files.search')} />
          </div>
          {p.path && (
            <button type="button" className={`fx-chip${p.everywhere ? ' is-on' : ''}`} aria-pressed={p.everywhere} onClick={() => p.setEverywhere(!p.everywhere)}>
              {p.everywhere && <Icon name="check" size={14} />}{t('files.everywhere')}
            </button>
          )}
        </div>
      </div>
      <div className="fx-row">
        <div className="seg seg-scroll fseg" role="group" aria-label={t('files.filter')}>
          {(['all', 'image', 'video', 'pdf', 'design'] as Filter[]).map((k) => (
            <button key={k} className={p.filter === k ? 'is-on' : ''} aria-pressed={p.filter === k} onClick={() => p.setFilter(k)}>{t(`files.kind.${k}`)}</button>
          ))}
        </div>
        {p.eras && (
          <label className="fx-select">
            <span className="sr">{t('ver.files')}</span>
            <select value={p.eras.value} onChange={(e) => p.eras!.set(e.target.value)}>
              {p.eras.options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <Icon name="chevronDown" size={16} />
          </label>
        )}
        <label className="fx-select">
          <span className="sr">{t('files.sort')}</span>
          <select value={p.sort} onChange={(e) => p.setSort(e.target.value as Sort)}>
            {SORTS.map((s) => <option key={s} value={s}>{t(`files.sort.${s}`)}</option>)}
          </select>
          <Icon name="chevronDown" size={16} />
        </label>
        <div className="seg" role="group" aria-label={t('files.view')}>
          <button className={p.view === 'grid' ? 'is-on' : ''} aria-pressed={p.view === 'grid'} aria-label={t('files.grid')} onClick={() => p.setView('grid')}><Icon name="grid" /></button>
          <button className={p.view === 'list' ? 'is-on' : ''} aria-pressed={p.view === 'list'} aria-label={t('files.listView')} onClick={() => p.setView('list')}><Icon name="list" /></button>
        </div>
        {p.actions && <div className="fx-actions">{p.actions}</div>}
      </div>
    </div>
  );
}
