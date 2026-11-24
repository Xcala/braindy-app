import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { normalizeSearch } from '../lib/text';
import { Icon } from '../components/Icon';
import { asTree, useBrands, type Brand } from './BrandProvider';
import { BrandMark } from './BrandMark';

const RECENT_KEY = 'braindy.recentBrands';
const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; } };
const pushRecent = (id: string) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecent().filter((x) => x !== id)].slice(0, 3))); } catch { /* storage unavailable */ }
};

/** Brand selector from the design: search, recent, groups as a tree, admin entry. With `enter` (the admin space) it is a door into a brand, not a filter: no brand shows as picked. */
export function BrandMenu({ isAdmin, onPicked, enter }: { isAdmin: boolean; onPicked?: () => void; enter?: boolean }) {
  // Who is in, then which brand (bold name over the brand, as in the top bar of the reference Nicolas liked).
  const who = String((useAuth().profile as { name?: string } | null)?.name ?? '').trim();
  const { brands, current, select } = useBrands();
  const { t, lang } = useI18n();
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

  const sections = useMemo(() => brandSections(brands, lang), [brands, lang]);
  const needle = normalizeSearch(q);
  const found = needle ? brands.filter((b) => [b.name, ...b.previousNames].some((n) => normalizeSearch(n).includes(needle))) : null;
  const recent = readRecent().map((id) => brands.find((b) => b.id === id)).filter((b): b is Brand => !!b);

  const choose = (id: string) => { select(id); pushRecent(id); setOpen(false); setQ(''); onPicked?.(); };

  if (!current) return null;
  if (brands.length < 2) {
    return <div className="sel" style={{ cursor: 'default' }}><BrandMark brand={current} /><BrandName name={current.name} /></div>;
  }

  const item = (b: Brand) => (
    <button key={b.id} type="button" role="option" aria-selected={!enter && b.id === current.id} onClick={() => choose(b.id)}
      className={`menu-item w-full text-left ${!enter && b.id === current.id ? 'is-on' : ''}`}
      style={{ border: 0, background: undefined, cursor: 'pointer' }}>
      <BrandMark brand={b} />
      <span className="grow col min-w-0" style={{ opacity: b.status === 'archived' ? 0.55 : 1 }}>
        <span className="truncate">{b.name}</span>
        {b.previousNames.length > 0 && <span className="t-xs t-mute truncate">{t('ver.before', { name: b.previousNames.join(', ') })}</span>}
      </span>
      {b.kind === 'group' && <span className="chip c-group">{t('brand.group')}</span>}
      {b.status === 'archived' && b.kind !== 'group' && <span className="chip c-archived">{t('status.archived')}</span>}
      {!enter && b.id === current.id && <Icon name="check" size={16} />}
    </button>
  );

  return (
    <div ref={box} className="relative">
      {enter ? (
        <button type="button" className="sel" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} title={t('anav.enterHint')}>
          <span className="mark" style={{ background: 'var(--niebla)', color: 'var(--azul)' }}><Icon name="grid" size={16} /></span>
          <span className="w7 truncate"><span className="sm:hidden">{t('nav.brands')}</span><span className="hidden sm:inline">{t('anav.enter')}</span></span>
          <Icon name="chevronDown" size={16} />
        </button>
      ) : (
      <button type="button" className="sel" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <BrandMark brand={current} />
        <span className="flex flex-col items-start" style={{ lineHeight: '16px' }}>
          {who ? <span className="sel-who">{who}</span> : <span className="t-xs t-mute" style={{ fontWeight: 600 }}>{t('brand.switch')}</span>}
          <span className={who ? 'sel-brand' : undefined}><BrandName name={current.name} /></span>
        </span>
        <Icon name="chevronDown" size={16} />
      </button>
      )}
      {open && (
        <div className="menu bmenu absolute left-0 top-[3.5rem] z-40 flex max-h-[70vh] w-[min(380px,calc(100vw-32px))] flex-col overflow-y-auto" role="listbox" aria-label={t('brand.choose')}>
          <div className="search" style={{ margin: '0.25rem 0.25rem 0' }}>
            <Icon name="search" />
            <input className="input" autoFocus placeholder={t('brand.searchN', { n: brands.length })} aria-label={t('brand.search')}
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {isAdmin && !enter && !found && (
            <Link to="/admin/today" onClick={() => setOpen(false)} className="menu-item" style={{ background: 'var(--ink)', color: '#fff' }}>
              <span className="mark" style={{ background: '#fff' }}><img src="/brand/braindy-mark.svg" alt="" style={{ width: '0.875rem', height: '0.875rem' }} /></span>
              <span className="grow">{t('nav.backToAdmin')}</span>
              <span className="t-xs" style={{ color: '#C9D0DE' }}>{t('brand.admin')}</span>
            </Link>
          )}
          {found ? (
            <div className="bmenu-group">
              {found.length ? found.map((b) => item(b)) : <p className="t-sm t-mute" style={{ padding: '0.5rem 0.75rem' }}>{t('brand.noMatch')}</p>}
            </div>
          ) : (
            <>
              {recent.length > 0 && (
                <div className="bmenu-group" role="group" aria-label={t('brand.recent')}>
                  <p className="label bmenu-label">{t('brand.recent')}</p>
                  {recent.map((b) => item(b))}
                </div>
              )}
              {sections.groups.map(({ group, members }) => {
                const label = t(members.length === 1 ? 'bmenu.groupOne' : 'bmenu.groupN', { name: group.name, n: String(members.length) });
                const on = !enter && group.id === current.id;
                return (
                  <div key={group.id} className="bmenu-group" role="group" aria-label={label}>
                    {/* The group's name is the label, not one more brand row; it still opens the group's own page. */}
                    <button type="button" role="option" aria-selected={on} onClick={() => choose(group.id)} className={`label bmenu-label is-link${on ? ' is-on' : ''}`}>{label}</button>
                    {members.map((b) => item(b))}
                  </div>
                );
              })}
              {sections.loose.length > 0 && (
                <div className="bmenu-group" role="group" aria-label={t('bmenu.all')}>
                  {(recent.length > 0 || sections.groups.length > 0) && <p className="label bmenu-label">{t('bmenu.all')}</p>}
                  {sections.loose.map((b) => item(b))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const SMALL = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'of', 'the', 'and', '&']);
/** "Grupo Alternativas" → "GA": what a long brand name shows in the phone header. */
export const initials = (name: string) => name.split(/[\s_/-]+/).filter((w) => w && !SMALL.has(w.toLowerCase())).slice(0, 3).map((w) => w[0]).join('').toUpperCase();

/** The brand name in the selector; on phones a long name becomes its initials (full name stays in the tooltip and for screen readers). */
function BrandName({ name }: { name: string }) {
  const long = name.length > 12 && initials(name).length > 1;
  return (
    <span className={`bname max-w-[12rem] truncate${long ? ' is-long' : ''}`} title={name}>
      <span className="bname-full">{name}</span>
      {long && <span className="bname-short" aria-hidden="true">{initials(name)}</span>}
    </span>
  );
}

/** The picker's groups (lesson 01): each top-level group with every brand under it, then the brands outside any group, A–Z. */
function brandSections(brands: Brand[], lang: string) {
  const groups: Array<{ group: Brand; members: Brand[] }> = [];
  const loose: Brand[] = [];
  const tree = asTree(brands);
  let open: { group: Brand; members: Brand[] } | null = null;
  tree.forEach(({ brand, depth }, i) => {
    if (depth > 0 && open) { open.members.push(brand); return; }
    const hasKids = (tree[i + 1]?.depth ?? 0) > depth;
    if (brand.kind === 'group' || hasKids) { open = { group: brand, members: [] }; groups.push(open); return; }
    open = null;
    loose.push(brand);
  });
  loose.sort((a, b) => a.name.localeCompare(b.name, lang, { sensitivity: 'base' }));
  return { groups, loose };
}
