import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { asTree, useBrands, type Brand } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { normalizeSearch } from '../../lib/text';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toaster';
import { useOpenWork } from '../../team/useWork';
import { daysFrom } from '../../lib/dates';
import { BrandCards, HealthBits, type Health, type Item } from './BrandCards';
import { BrandManage } from './BrandManage';
import { NewBrand } from './NewBrand';

/** UX MA3: one selector. Active brands, archived brands, and groups (groups don't count toward the cap). */
type Tab = 'active' | 'archived' | 'groups';
type Section = { key: string; title?: string; items: Item[] };
const TABS: Tab[] = ['active', 'archived', 'groups'];
const COLS = 'minmax(0,1fr) 16rem 9rem';

/** Active brands Nicolas takes on at once. Groups are not clients, so they don't count. */
const CAP = 50;

export function AdminBrands() {
  const { brands } = useBrands();
  const { t, lang } = useI18n();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('active');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toast = useToast();
  // The brand being managed lives in the URL (?manage=id), so other pages can link straight to it.
  const [params, setParams] = useSearchParams();
  const managing = brands.find((b) => b.id === params.get('manage'));
  const manage = (id: string | null) => setParams(id ? { manage: id } : {}, { replace: true });
  const { items: work } = useOpenWork();
  const health = useMemo(() => {
    const m = new Map<string, Health>();
    for (const i of work) {
      const h = m.get(i.brandId) ?? { open: 0, late: 0, last: 0 };
      h.open++;
      if (i.status === 'in_production' && i.dueDate && (daysFrom(i.dueDate) ?? 0) < 0) h.late++;
      h.last = Math.max(h.last, i.updatedAt?.toMillis() ?? i.createdAt?.toMillis() ?? 0);
      m.set(i.brandId, h);
    }
    return m;
  }, [work]);

  const byId = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const pools = useMemo(() => ({
    active: brands.filter((b) => b.kind !== 'group' && b.status === 'active'),
    archived: brands.filter((b) => b.kind !== 'group' && b.status !== 'active'),
    groups: brands.filter((b) => b.kind === 'group'),
  }), [brands]);
  const groupOf = (b: Brand) => (b.groupId ? byId.get(b.groupId)?.name : undefined);
  const kids = (id: string) => brands.filter((b) => b.groupId === id).length;

  const needle = normalizeSearch(q);
  const match = (b: Brand) => !needle || normalizeSearch(b.name).includes(needle) || normalizeSearch(groupOf(b) ?? '').includes(needle);
  const flat = (list: Brand[]): Item[] => list.filter(match)
    .map((brand) => ({ brand, depth: 0, group: groupOf(brand), kids: kids(brand.id) }))
    .sort((a, b) => a.brand.name.localeCompare(b.brand.name, lang));

  const sections = ((): Section[] => {
    if (tab === 'archived') return [{ key: 'archived', items: flat(pools.archived) }];
    if (tab === 'groups') {
      // The groups with their brands, folded (UX MA3). While searching, matches show flat with their group.
      const tree = asTree(brands).filter(({ brand }) => brand.kind === 'group' || !!brand.groupId);
      if (needle) return [{ key: 'groups', items: flat(tree.map((x) => x.brand)) }];
      const shown = tree.filter(({ brand }) => {
        let g = brand.groupId ? byId.get(brand.groupId) : undefined;
        while (g) { if (!open.has(g.id)) return false; g = g.groupId ? byId.get(g.groupId) : undefined; }
        return true;
      });
      return [{ key: 'groups', items: shown.map(({ brand, depth }) => ({ brand, depth, kids: kids(brand.id) })) }];
    }
    // UX MA4: by health (need attention, with work, quiet), each by name.
    const all = flat(pools.active);
    const late = all.filter((i) => health.get(i.brand.id)?.late);
    const busy = all.filter((i) => !health.get(i.brand.id)?.late && health.get(i.brand.id)?.open);
    const quiet = all.filter((i) => !health.get(i.brand.id)?.open);
    return [
      { key: 'late', title: t('brandsA.attention', { n: late.length }), items: late },
      { key: 'busy', title: t('brandsA.working', { n: busy.length }), items: busy },
      { key: 'quiet', title: t('brandsA.quiet', { n: quiet.length }), items: quiet },
    ].filter((s) => s.items.length);
  })();

  const flip = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Archiving asks first inside «Gestionar» (BrandManageMore); here it acts and offers Undo (design 30).
  async function toggle(brand: Brand) {
    const to = brand.status === 'archived' ? 'active' : 'archived';
    const set = (status: string) => updateDoc(doc(db, 'brands', brand.id), { status, statusUpdatedAt: serverTimestamp() });
    await set(to);
    toast({ text: t(to === 'archived' ? 'toast.archived' : 'toast.activated', { name: brand.name }), undo: () => set(brand.status) });
  }

  const n = pools.active.length;
  const shownCount = sections.reduce((s, x) => s + x.items.length, 0);
  // Matches in the other views, so a search never dead-ends on the wrong tab.
  const elsewhere = needle && !shownCount
    ? TABS.filter((x) => x !== tab).map((x) => ({ tab: x, n: pools[x].filter(match).length })).filter((x) => x.n) : [];

  return (
    <section className="col g16">
      <div className="row between g12">
        <h1 className="h1 row g12" style={{ alignItems: 'baseline', minWidth: 0 }}>
          <span className="w9">{t('admin.brands.title')}</span>
          <span className="md:hidden t-sm t-mute" style={{ fontWeight: 400 }}>{t('brandsA.ofCap', { n, cap: CAP })}</span>
        </h1>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> {t('anav.new')}</button>
      </div>
      <p className="hidden md:block t-sm t-mute">{t('brandsA.summary', { brands: n, groups: pools.groups.length, archived: pools.archived.length })}</p>
      <Capacity n={n} />
      <div className="search w-full">
        <Icon name="search" />
        <input className="input" placeholder={t('brandsA.search')} aria-label={t('brand.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="seg seg-scroll" role="group" aria-label={t('brandsA.view')}>
        {TABS.map((x) => (
          <button key={x} className={tab === x ? 'is-on' : ''} aria-pressed={tab === x} onClick={() => setTab(x)}>
            {t(`brandsA.${x}`, { n: pools[x].length })}
          </button>
        ))}
      </div>

      {!shownCount && (
        <div className="col g8">
          <p className="t-sm t-mute">{needle ? t('brandsA.noMatch', { q: q.trim() }) : t('brandsA.none')}</p>
          {elsewhere.length > 0 && <span className="row g8 wrap">{elsewhere.map((x) => (
            <button key={x.tab} type="button" className="btn btn-secondary btn-sm" onClick={() => setTab(x.tab)}>{t(`brandsA.${x.tab}`, { n: x.n })}</button>
          ))}</span>}
        </div>
      )}
      {sections.map((s) => (
        <div key={s.key} className="col">
          {s.title && <h2 className="bsec-title">{s.title}</h2>}
          <BrandCards items={s.items} health={health} open={open} onFlip={flip} onManage={manage} />
          <div className="hidden md:block"><div className="table">
            {s.items.map((item) => (
              <Row key={item.brand.id} item={item} h={health.get(item.brand.id)} open={open.has(item.brand.id)} folding={tab === 'groups' && !needle}
                onFlip={() => flip(item.brand.id)} onManage={() => manage(item.brand.id)} />
            ))}
          </div></div>
        </div>
      ))}
      {adding && <NewBrand onClose={() => setAdding(false)} onCreated={(id) => { setAdding(false); manage(id); }} />}
      {managing && <BrandManage brand={managing} onToggle={() => toggle(managing)} onClose={() => manage(null)} />}
    </section>
  );
}

/** Desktop row (UX MA2 + MA4): name, health, open count and one button. Kind, city and the on/off switch moved to «Gestionar». */
function Row({ item, h, open, folding, onFlip, onManage }: {
  item: Item; h?: Health; open: boolean; folding: boolean; onFlip: () => void; onManage: () => void;
}) {
  const { t } = useI18n();
  const { select } = useBrands();
  const navigate = useNavigate();
  const { brand, depth, group } = item;
  const isGroup = brand.kind === 'group';
  return (
    <div className={`trow ${depth ? 'child' : ''} ${brand.status === 'active' ? '' : 'is-archived'}`} style={{ gridTemplateColumns: COLS }}>
      <span className="row g12" style={{ paddingLeft: depth * 44, minWidth: 0 }}>
        {folding && (isGroup ? (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onFlip} aria-expanded={open}
            aria-label={`${open ? t('admin.brands.collapse') : t('admin.brands.expand')} ${brand.name}`} style={{ width: '2rem', color: 'var(--ink)' }}>
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} />
          </button>
        ) : <span style={{ width: '2rem', flex: 'none' }} />)}
        <span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none', flex: 'none' }}><BrandMark brand={brand} /></span>
        <button onClick={() => { select(brand.id); navigate('/brand'); }} className="truncate text-left" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit', minWidth: 0 }}>
          <span className="w7">{brand.name}</span>{group ? <span className="t-sm t-mute"> · {t('brandsA.inGroup', { group })}</span> : null}
        </button>
      </span>
      <span><HealthBits item={item} h={h} /></span>
      <span className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onManage}>{t('anav.manage')} <Icon name="chevronRight" size={14} /></button>
      </span>
    </div>
  );
}

/** UX MA1: the same number as the summary, «32 of 50 · 18 left». On a phone it sits next to the title, without the bar. */
function Capacity({ n }: { n: number }) {
  const { t } = useI18n();
  const left = CAP - n;
  return (
    <div className="bcap hidden md:flex flex-col">
      <div className="row between g12">
        <b className="t-sm">{t('brandsA.capacity', { n, cap: CAP })}</b>
        <span className="t-xs t-mute">{left >= 0 ? t('brandsA.left', { n: left }) : t('brandsA.over', { n: -left })}</span>
      </div>
      <div className="bar"><i style={{ width: `${Math.min(100, (n / CAP) * 100)}%`, background: n > CAP * 0.8 ? 'var(--warning)' : 'var(--azul)' }} /></div>
    </div>
  );
}
