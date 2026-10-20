import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { normalizeSearch } from '../lib/text';
import { Icon } from '../components/Icon';
import { asTree, useBrands, type Brand } from './BrandProvider';
import { BrandMark } from './BrandMark';

const RECENT_KEY = 'braindy.recentBrands';
const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; } };
const pushRecent = (id: string) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecent().filter((x) => x !== id)].slice(0, 3))); } catch { /* storage unavailable */ }
};

/** Brand selector from the design: search, recent, groups as a tree, admin entry. */
export function BrandMenu({ isAdmin, onPicked }: { isAdmin: boolean; onPicked?: () => void }) {
  const { brands, current, select } = useBrands();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const tree = useMemo(() => asTree(brands), [brands]);
  const childCount = (id: string) => brands.filter((b) => b.groupId === id).length;
  const needle = normalizeSearch(q);
  const found = needle ? brands.filter((b) => normalizeSearch(b.name).includes(needle)) : null;
  const recent = readRecent().map((id) => brands.find((b) => b.id === id)).filter((b): b is Brand => !!b);

  const choose = (id: string) => { select(id); pushRecent(id); setOpen(false); setQ(''); onPicked?.(); };

  if (!current) return null;
  if (brands.length < 2) {
    return <div className="sel" style={{ cursor: 'default' }}><BrandMark brand={current} /><span>{current.name}</span></div>;
  }

  const item = (b: Brand, depth = 0) => (
    <button key={b.id} type="button" role="option" aria-selected={b.id === current.id} onClick={() => choose(b.id)}
      className={`menu-item w-full text-left ${b.id === current.id ? 'is-on' : ''} ${depth === 1 ? 'tree-1' : depth >= 2 ? 'tree-2' : ''}`}
      style={{ border: 0, background: undefined, cursor: 'pointer' }}>
      <BrandMark brand={b} />
      <span className="grow truncate" style={{ opacity: b.status === 'archived' ? 0.55 : 1 }}>{b.name}</span>
      {b.kind === 'group' && <span className="chip c-group">{t('brand.group')} · {childCount(b.id)}</span>}
      {b.status === 'archived' && b.kind !== 'group' && <span className="chip c-archived">{t('status.archived')}</span>}
      {b.id === current.id && <Icon name="check" size={16} />}
    </button>
  );

  return (
    <div ref={box} className="relative">
      <button type="button" className="sel" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <BrandMark brand={current} />
        <span className="flex flex-col items-start" style={{ lineHeight: '16px' }}>
          <span className="t-xs t-mute" style={{ fontWeight: 600 }}>{t('brand.switch')}</span>
          <span className="max-w-[12rem] truncate">{current.name}</span>
        </span>
        <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div className="menu absolute left-0 top-[56px] z-40 flex max-h-[70vh] w-[min(380px,calc(100vw-32px))] flex-col gap-0.5 overflow-y-auto" role="listbox" aria-label={t('brand.choose')}>
          <div className="search" style={{ margin: '4px 4px 8px' }}>
            <Icon name="search" />
            <input className="input" autoFocus placeholder={t('brand.searchN', { n: brands.length })} aria-label={t('brand.search')}
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {isAdmin && !found && (
            <Link to="/admin/brands" onClick={() => setOpen(false)} className="menu-item" style={{ background: 'var(--ink)', color: '#fff' }}>
              <span className="mark" style={{ background: '#fff' }}><img src="/brand/braindy-mark.svg" alt="" style={{ width: 20, height: 20 }} /></span>
              <span className="grow">{t('brand.admin')}</span>
              <span className="t-xs" style={{ color: '#C9D0DE' }}>{t('nav.brands')}</span>
            </Link>
          )}
          {found ? (
            found.length ? found.map((b) => item(b)) : <p className="t-sm t-mute" style={{ padding: '8px 12px' }}>{t('brand.noMatch')}</p>
          ) : (
            <>
              {recent.length > 0 && (
                <>
                  <p className="label" style={{ padding: '6px 12px' }}>{t('brand.recent')}</p>
                  {recent.map((b) => item(b))}
                  <div className="divider" style={{ margin: '6px 0' }} />
                </>
              )}
              {tree.map(({ brand, depth }) => item(brand, depth))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
