import { useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { asTree, useBrands, type Brand } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { normalizeSearch } from '../../lib/text';
import { Icon } from '../../components/Icon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { StringKey } from '../../i18n/strings';

type Status = 'all' | 'active' | 'archived';
const COLS = 'minmax(0,1fr) 110px 220px 170px';

export function AdminBrands() {
  const { brands } = useBrands();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [groupsOnly, setGroupsOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Brand | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const needle = normalizeSearch(q);
    const tree = asTree(brands);
    const hiddenBy = (b: Brand) => brands.find((x) => x.id === b.groupId && collapsed.has(x.id));
    return tree.filter(({ brand }) => {
      if (groupsOnly && brand.kind !== 'group') return false;
      if (status !== 'all' && brand.status !== status) return false;
      if (needle) return normalizeSearch(brand.name).includes(needle);
      let p = hiddenBy(brand);
      while (p) { if (collapsed.has(p.id)) return false; p = hiddenBy(p); }
      return true;
    });
  }, [brands, q, status, groupsOnly, collapsed]);

  const toggleCollapse = (id: string) => setCollapsed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function applyToggle() {
    if (!pending) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'brands', pending.id), {
        status: pending.status === 'archived' ? 'active' : 'archived', statusUpdatedAt: serverTimestamp(),
      });
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  const active = brands.filter((b) => b.status === 'active').length;
  return (
    <section className="col g24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8">
          <p className="label">{t('role.admin')}</p>
          <h1 className="h1"><span className="w9">{t('admin.brands.title')}.</span> {t('admin.brands.summary', { active, total: brands.length })}</h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="search w-full sm:w-[320px]">
          <Icon name="search" />
          <input className="input" placeholder={t('admin.brands.search')} aria-label={t('brand.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg" role="group" aria-label={t('admin.brands.statusFilter')}>
          {(['all', 'active', 'archived'] as Status[]).map((s) => (
            <button key={s} className={status === s ? 'is-on' : ''} aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === 'all' ? t('admin.brands.all') : t(`status.${s}`)}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label={t('admin.brands.kindFilter')}>
          <button className={!groupsOnly ? 'is-on' : ''} aria-pressed={!groupsOnly} onClick={() => setGroupsOnly(false)}>{t('admin.brands.groupsAndBrands')}</button>
          <button className={groupsOnly ? 'is-on' : ''} aria-pressed={groupsOnly} onClick={() => setGroupsOnly(true)}>{t('admin.brands.groupsOnly')}</button>
        </div>
        <span className="grow" />
        <span className="t-sm t-mute">{t('admin.brands.count', { n: rows.length })}</span>
      </div>

      <div className="table overflow-x-auto">
        <div className="trow head label min-w-[760px]" style={{ gridTemplateColumns: COLS }}>
          <span>{t('admin.brands.colBrand')}</span><span>{t('admin.brands.colKind')}</span><span>{t('admin.brands.colFrom')}</span><span>{t('admin.brands.colStatus')}</span>
        </div>
        {rows.map(({ brand, depth }) => (
          <Row key={brand.id} brand={brand} depth={depth} collapsed={collapsed.has(brand.id)}
            onCollapse={() => toggleCollapse(brand.id)} onToggle={() => setPending(brand)} />
        ))}
      </div>

      {pending && (
        <ConfirmDialog
          title={pending.status === 'archived' ? t('admin.brands.confirmActivate', { name: pending.name }) : t('admin.brands.confirmArchiveTitle', { name: pending.name })}
          confirmLabel={pending.status === 'archived' ? t('admin.brands.activate') : t('admin.brands.archive')}
          danger={pending.status !== 'archived'} busy={busy} onConfirm={applyToggle} onCancel={() => setPending(null)}>
          {pending.status !== 'archived' && t('admin.brands.confirmArchive', { name: pending.name })}
        </ConfirmDialog>
      )}
    </section>
  );
}

function Row({ brand, depth, collapsed, onCollapse, onToggle }: {
  brand: Brand; depth: number; collapsed: boolean; onCollapse: () => void; onToggle: () => void;
}) {
  const { t } = useI18n();
  const { select } = useBrands();
  const on = brand.status === 'active';
  return (
    <div className={`trow min-w-[760px] ${depth ? 'child' : ''} ${on ? '' : 'is-archived'}`} style={{ gridTemplateColumns: COLS }}>
      <span className="row g12" style={{ paddingLeft: depth * 44 }}>
        {brand.kind === 'group' ? (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCollapse} aria-expanded={!collapsed}
            aria-label={`${collapsed ? t('admin.brands.expand') : t('admin.brands.collapse')} ${brand.name}`} style={{ width: 32, color: 'var(--ink)' }}>
            <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} size={16} />
          </button>
        ) : <span style={{ width: 32 }} />}
        <span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none' }}><BrandMark brand={brand} /></span>
        <button onClick={() => select(brand.id)} className="w7 truncate text-left" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}>{brand.name}</button>
      </span>
      <span><span className={`chip ${brand.kind === 'group' ? 'c-group' : 'c-type'}`}>{brand.kind === 'group' ? t('brand.group') : t('admin.brands.brand')}</span></span>
      <span className="row g4 wrap">
        {brand.sources.length ? brand.sources.map((s) => <span key={s} className="chip c-type">{t(`admin.brands.src.${s}` as StringKey)}</span>)
          : <span className="t-sm t-mute">{t('admin.brands.newInApp')}</span>}
      </span>
      <span className="row g12">
        <button className={`switch ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} aria-label={`${brand.name} ${t('status.active')}`} onClick={onToggle} />
        <span className="t-sm w7" style={{ color: on ? 'var(--success)' : 'var(--graphite)' }}>{t(`status.${brand.status}`)}</span>
      </span>
    </div>
  );
}
