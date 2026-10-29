import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { BrandMark } from '../brands/BrandMark';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useBrandsRequests } from '../requests/useBrandsRequests';
import { useProposals } from '../proposals/useProposals';
import { useI18n } from '../i18n/I18nProvider';
import { normalizeSearch } from '../lib/text';
import { useCopy } from '../brands/identity/useCopy';
import { Icon } from './Icon';
import type { StringKey } from '../i18n/strings';

type Item = { id: string; group: StringKey; label: string; hint?: string; run: () => void; brand?: { name: string; logoUrl: string | null }; swatch?: string; path?: string };

const RECENT_KEY = 'braindy.cmdk.recent';
const readRecent = (): Array<{ id: string; label: string; path: string }> => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; } };
const pushRecent = (i: { id: string; label: string; path: string }) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([i, ...readRecent().filter((r) => r.id !== i.id)].slice(0, 6))); } catch { /* storage blocked */ } };

/** "Search everything" (design 16): Cmd/Ctrl+K opens it from anywhere in the app. */
export function CommandK() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <>
      <span className="hidden md:inline-flex"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)} aria-label={t('search.open')}>
        <Icon name="search" size={16} /><span className="t-mute">{t('search.short')}</span><span className="kbd t-xs t-mute">{/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K'}</span>
      </button></span>
      <span className="md:hidden"><button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label={t('search.open')}><Icon name="search" /></button></span>
      {open && <Palette onClose={() => setOpen(false)} />}
    </>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { brands, current, select } = useBrands();
  const [allBrands, setAllBrands] = useState(false);
  const { copy } = useCopy();
  const identity = useBrandDoc(current?.id, 'context/identity');
  const scope = allBrands && isAdmin ? brands.map((b) => b.id) : current ? [current.id, ...brands.filter((b) => b.groupId && (b.groupId === current.id || brands.find((p) => p.id === b.groupId)?.groupId === current.id)).map((b) => b.id)] : [];
  const requests = useBrandsRequests(scope);
  const { list: proposals } = useProposals.optional(isAdmin);
  const index = useBrandDoc(current?.id, 'context/fileIndex');
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);

  const items = useMemo<Item[]>(() => {
    const go = (path: string, id?: string, label?: string) => () => { if (id && label) pushRecent({ id, label, path }); navigate(path); onClose(); };
    const pages: Item[] = ([['/home', 'nav.home'], ['/brand', 'nav.brand'], ['/assets', 'nav.assets'], ['/ask', 'nav.ask'], ['/requests', 'nav.requests'], ['/accesses', 'nav.accesses'], ['/settings', 'nav.settings'], ['/report', 'nav.report'], ['/onboarding', 'nav.onboarding']] as Array<[string, StringKey]>)
      .concat(isAdmin ? [['/admin/today', 'today.title'], ['/admin/studio', 'st.nav'], ['/admin/brands', 'nav.brands'], ['/admin/proposals', 'nav.proposals'], ['/team', 'nav.team'], ['/admin/onboarding', 'nav.onboarding'], ['/admin/billing', 'nav.billing'], ['/admin/criterio', 'cra.nav']] : [['/learn', 'cr.nav']])
      .map(([p, k]) => ({ id: p, group: 'search.pages' as StringKey, label: t(k), run: go(p) }));
    const brandItems: Item[] = brands.map((b) => ({ id: `b-${b.id}`, group: 'search.brands' as StringKey, label: b.name, brand: b, hint: b.kind === 'group' ? t('brand.group') : undefined, run: () => { select(b.id); onClose(); } }));
    const reqItems: Item[] = requests.map((r) => ({ id: `r-${r.id}`, group: 'search.requests' as StringKey, label: r.title, hint: `${r.brandId !== current?.id ? `${brands.find((b) => b.id === r.brandId)?.name ?? ''} · ` : ''}${t(`req.status.${r.status}`)}`, run: () => { if (r.brandId !== current?.id) select(r.brandId); go(`/requests/${r.id}`)(); } }));
    const propItems: Item[] = proposals.map((p) => ({ id: `p-${p.id}`, group: 'search.proposals' as StringKey, label: `${p.prospect?.company ?? ''} ${p.title}`.trim(), hint: t(`proposals.status.${p.status}`), run: go(`/admin/proposals/${p.id}`, `p-${p.id}`, p.title) }));
    const folderItems: Item[] = ((index.data?.folders as Array<{ path: string }>) ?? []).filter((f) => f.path)
      .map((f) => ({ id: `f-${f.path}`, group: 'search.folders' as StringKey, label: f.path.split('/').pop()!, hint: f.path, run: go('/assets') }));
    const idn = (identity.data ?? {}) as { colors?: Array<{ hex?: string; name?: string }>; typography?: Array<{ fontFamily?: string; name?: string }> };
    const valueItems: Item[] = [
      ...(idn.colors ?? []).filter((c) => c.hex).map((c) => ({ id: `v-${c.hex}`, group: 'search.values' as StringKey, label: c.hex!.toUpperCase(), hint: c.name, swatch: c.hex, run: () => { copy(c.hex!.toUpperCase()); onClose(); } })),
      ...(idn.typography ?? []).map((f) => f.fontFamily ?? f.name).filter(Boolean).map((f) => ({ id: `v-${f}`, group: 'search.values' as StringKey, label: f!, hint: t('brand.typography'), run: () => { copy(f!); onClose(); } })),
    ];
    const recent: Item[] = readRecent().map((r) => ({ id: `rec-${r.id}`, group: 'search.recent' as StringKey, label: r.label, run: go(r.path, r.id, r.label) }));
    return [...recent, ...pages, ...valueItems, ...brandItems, ...reqItems, ...propItems, ...folderItems];
  }, [brands, current?.id, requests, proposals, index.data, identity.data, isAdmin, navigate, onClose, select, t, copy]);

  const needle = normalizeSearch(q);
  const shown = (needle ? items.filter((i) => i.group !== 'search.recent' && normalizeSearch(`${i.label} ${i.hint ?? ''}`).includes(needle)) : items.filter((i) => i.group === 'search.recent' || i.group === 'search.pages')).slice(0, 40);
  useEffect(() => setActive(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter' && shown[active]) shown[active].run();
  };

  let lastGroup = '';
  return (
    <div className="scrim fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cmdk menu w-full max-w-[640px]" role="dialog" aria-modal="true" aria-label={t('search.title')} onKeyDown={onKey} style={{ padding: 8 }}>
        <div className="search" style={{ margin: 4 }}>
          <Icon name="search" />
          <input ref={input} className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder', { name: current?.name ?? '' })}
            aria-label={t('search.title')} role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={shown[active]?.id} />
        </div>
        <div id="cmdk-list" role="listbox" className="col overflow-y-auto" style={{ maxHeight: '60vh', marginTop: 6 }}>
          {shown.length === 0 && <p className="t-sm t-mute" style={{ padding: '12px' }}>{t('search.noResults')}</p>}
          {shown.map((i, n) => {
            const header = i.group !== lastGroup ? <p className="label" style={{ padding: '8px 12px 4px' }}>{t(i.group)}</p> : null;
            lastGroup = i.group;
            return (
              <div key={i.id}>
                {header}
                <button id={i.id} role="option" aria-selected={n === active} onMouseEnter={() => setActive(n)} onClick={i.run}
                  className={`menu-item w-full text-left ${n === active ? 'is-on' : ''}`} style={{ border: 0, background: undefined, cursor: 'pointer' }}>
                  {i.brand && <BrandMark brand={i.brand} />}
                  {i.swatch && <i aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 6, background: i.swatch, border: '1px solid var(--line)', flex: 'none' }} />}
                  <span className="grow truncate">{i.label}</span>
                  {i.hint && <span className="t-xs t-mute truncate" style={{ maxWidth: 220 }}>{i.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="row between g8 wrap" style={{ padding: '8px 12px 4px' }}>
          <p className="t-xs t-mute">{t('search.keys')}</p>
          {isAdmin && <button type="button" className={`chip ${allBrands ? 'c-active' : 'chip-plain'}`} style={{ cursor: 'pointer', border: 0 }} aria-pressed={allBrands} onClick={() => setAllBrands((a) => !a)}>{t('search.allBrands')}</button>}
        </div>
      </div>
    </div>
  );
}
