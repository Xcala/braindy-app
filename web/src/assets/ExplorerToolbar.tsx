import { Fragment } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import type { FileKind } from './fileKinds';

export type Filter = 'all' | FileKind;
export type Sort = 'name' | 'new' | 'old' | 'big';
export const SORTS: Sort[] = ['name', 'new', 'old', 'big'];

type Props = {
  brandName: string; path: string; setPath: (p: string) => void;
  q: string; setQ: (q: string) => void; everywhere: boolean; setEverywhere: (on: boolean) => void;
  filter: Filter; setFilter: (f: Filter) => void; sort: Sort; setSort: (s: Sort) => void;
  view: 'grid' | 'list'; setView: (v: 'grid' | 'list') => void;
};

/** Top of the file browser: where you are, search (this folder or all of them), type filter, sort and view. */
export function ExplorerToolbar(p: Props) {
  const { t } = useI18n();
  const crumbs = p.path ? p.path.split('/') : [];
  return (
    <div className="flex flex-wrap items-center gap-4 border-b px-4 py-4 sm:px-6" style={{ borderColor: 'var(--line)' }}>
      <nav className="crumbs grow" aria-label="Breadcrumb" id="files-crumbs">
        <a href="#" onClick={(e) => { e.preventDefault(); p.setPath(''); }} className={crumbs.length ? '' : 'cur'}>{p.brandName}</a>
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            <Icon name="chevronRight" size={14} />
            {i === crumbs.length - 1 ? <span className="cur">{c}</span>
              : <a href="#" onClick={(e) => { e.preventDefault(); p.setPath(crumbs.slice(0, i + 1).join('/')); }}>{c}</a>}
          </Fragment>
        ))}
      </nav>
      <div className="col g4 w-full sm:w-[280px]">
        <div className="search">
          <Icon name="search" />
          <input className="input" value={p.q} onChange={(e) => p.setQ(e.target.value)} aria-label={t('files.search')}
            placeholder={p.everywhere ? t('files.searchIn', { name: p.brandName }) : t('files.searchIn', { name: crumbs[crumbs.length - 1] ?? p.brandName })} />
        </div>
        {p.path && (
          <label className="row g6 t-xs t-mute" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={p.everywhere} onChange={(e) => p.setEverywhere(e.target.checked)} style={{ accentColor: 'var(--azul)' }} />
            {t('files.everywhere')}
          </label>
        )}
      </div>
      <div className="seg seg-scroll fseg" role="group" aria-label={t('files.filter')}>
        {(['all', 'image', 'video', 'pdf', 'design'] as Filter[]).map((k) => (
          <button key={k} className={p.filter === k ? 'is-on' : ''} aria-pressed={p.filter === k} onClick={() => p.setFilter(k)}>{t(`files.kind.${k}`)}</button>
        ))}
      </div>
      <label className="row g6 t-sm"><span className="t-mute">{t('files.sort')}</span>
        <select className="input" value={p.sort} onChange={(e) => p.setSort(e.target.value as Sort)} style={{ width: 'auto', paddingRight: 28 }}>
          {SORTS.map((s) => <option key={s} value={s}>{t(`files.sort.${s}`)}</option>)}
        </select>
      </label>
      <div className="seg" role="group" aria-label={t('files.view')}>
        <button className={p.view === 'grid' ? 'is-on' : ''} aria-pressed={p.view === 'grid'} aria-label={t('files.grid')} onClick={() => p.setView('grid')}><Icon name="grid" /></button>
        <button className={p.view === 'list' ? 'is-on' : ''} aria-pressed={p.view === 'list'} aria-label={t('files.listView')} onClick={() => p.setView('list')}><Icon name="list" /></button>
      </div>
    </div>
  );
}
