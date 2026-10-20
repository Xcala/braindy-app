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
import { Icon } from './Icon';
import type { StringKey } from '../i18n/strings';

type Item = { id: string; group: StringKey; label: string; hint?: string; run: () => void; brand?: { name: string; logoUrl: string | null } };

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
        <Icon name="search" size={16} /><span className="t-mute">{t('search.short')}</span><span className="kbd t-xs t-mute">⌘K</span>
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
  const scope = current ? [current.id, ...brands.filter((b) => b.groupId && (b.groupId === current.id || brands.find((p) => p.id === b.groupId)?.groupId === current.id)).map((b) => b.id)] : [];
  const requests = useBrandsRequests(scope);
  const { list: proposals } = useProposals.optional(isAdmin);
  const index = useBrandDoc(current?.id, 'context/fileIndex');
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);

  const items = useMemo<Item[]>(() => {
    const go = (path: string) => () => { navigate(path); onClose(); };
    const pages: Item[] = ([['/home', 'nav.home'], ['/brand', 'nav.brand'], ['/assets', 'nav.assets'], ['/ask', 'nav.ask'], ['/requests', 'nav.requests'], ['/accesses', 'nav.accesses'], ['/settings', 'nav.settings']] as Array<[string, StringKey]>)
      .concat(isAdmin ? [['/admin/brands', 'nav.brands'], ['/admin/proposals', 'nav.proposals'], ['/team', 'nav.team']] : [])
      .map(([p, k]) => ({ id: p, group: 'search.pages' as StringKey, label: t(k), run: go(p) }));
    const brandItems: Item[] = brands.map((b) => ({ id: `b-${b.id}`, group: 'search.brands' as StringKey, label: b.name, brand: b, hint: b.kind === 'group' ? t('brand.group') : undefined, run: () => { select(b.id); onClose(); } }));
    const reqItems: Item[] = requests.map((r) => ({ id: `r-${r.id}`, group: 'search.requests' as StringKey, label: r.title, hint: `${r.brandId !== current?.id ? `${brands.find((b) => b.id === r.brandId)?.name ?? ''} · ` : ''}${t(`req.status.${r.status}`)}`, run: () => { if (r.brandId !== current?.id) select(r.brandId); go(`/requests/${r.id}`)(); } }));
    const propItems: Item[] = proposals.map((p) => ({ id: `p-${p.id}`, group: 'search.proposals' as StringKey, label: `${p.prospect?.company ?? ''} ${p.title}`.trim(), hint: t(`proposals.status.${p.status}`), run: go(`/admin/proposals/${p.id}`) }));
    const folderItems: Item[] = ((index.data?.folders as Array<{ path: string }>) ?? []).filter((f) => f.path)
      .map((f) => ({ id: `f-${f.path}`, group: 'search.folders' as StringKey, label: f.path.split('/').pop()!, hint: f.path, run: go('/assets') }));
    return [...pages, ...brandItems, ...reqItems, ...propItems, ...folderItems];
  }, [brands, current?.id, requests, proposals, index.data, isAdmin, navigate, onClose, select, t]);

  const needle = normalizeSearch(q);
  const shown = (needle ? items.filter((i) => normalizeSearch(`${i.label} ${i.hint ?? ''}`).includes(needle)) : items.filter((i) => i.group === 'search.pages' || i.group === 'search.requests')).slice(0, 40);
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
                  <span className="grow truncate">{i.label}</span>
                  {i.hint && <span className="t-xs t-mute truncate" style={{ maxWidth: 220 }}>{i.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <p className="t-xs t-mute" style={{ padding: '8px 12px 4px' }}>{t('search.keys')}</p>
      </div>
    </div>
  );
}
