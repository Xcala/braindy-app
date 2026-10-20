import { useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { asTree, useBrands, type Brand } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { normalizeSearch } from '../../lib/text';

type Filter = 'all' | 'active' | 'archived';

export function AdminBrands() {
  const { brands } = useBrands();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('active');

  const rows = useMemo(() => {
    const needle = normalizeSearch(q);
    return asTree(brands).filter(({ brand }) =>
      (filter === 'all' || brand.status === filter) && (!needle || normalizeSearch(brand.name).includes(needle)));
  }, [brands, q, filter]);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('admin.brands.title')}</h1>
          <p className="text-sm text-black/55">{t('admin.brands.count', { n: rows.length })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')}
            className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm"
          />
          <div role="group" className="flex rounded-full border border-black/15 p-0.5 text-sm">
            {(['active', 'archived', 'all'] as Filter[]).map((f) => (
              <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 ${filter === f ? 'bg-ink text-white' : 'text-black/60'}`}>
                {f === 'all' ? t('admin.brands.all') : t(`status.${f}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ul className="mt-6 divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
        {rows.map(({ brand, depth }) => <BrandRow key={brand.id} brand={brand} depth={depth} />)}
      </ul>
    </section>
  );
}

function BrandRow({ brand, depth }: { brand: Brand; depth: number }) {
  const { t } = useI18n();
  const { select } = useBrands();
  const [busy, setBusy] = useState(false);
  const archived = brand.status === 'archived';

  async function toggle() {
    const msg = archived ? t('admin.brands.confirmActivate', { name: brand.name }) : t('admin.brands.confirmArchive', { name: brand.name });
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'brands', brand.id), { status: archived ? 'active' : 'archived', statusUpdatedAt: serverTimestamp() });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3" style={{ paddingLeft: `${1 + depth * 1.5}rem` }}>
      <button onClick={() => select(brand.id)} className="flex min-w-0 items-center gap-2 text-left hover:underline">
        <span className={`truncate ${brand.kind === 'group' ? 'font-black' : ''} ${archived ? 'text-black/45' : ''}`}>{brand.name}</span>
        {brand.kind === 'group' && <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">{t('brand.group')}</span>}
      </button>
      <button
        onClick={toggle} disabled={busy}
        className={`shrink-0 rounded-full px-3 py-1 text-sm disabled:opacity-50 ${archived ? 'border border-black/15 hover:bg-black/5' : 'bg-black/5 hover:bg-black/10'}`}
      >
        {archived ? t('admin.brands.activate') : t('admin.brands.archive')}
      </button>
    </li>
  );
}
