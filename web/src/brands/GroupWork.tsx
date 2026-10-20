import { useI18n } from '../i18n/I18nProvider';
import { useBrandsRequests } from '../requests/useBrandsRequests';
import { BrandMark } from './BrandMark';
import { useBrands, type Brand } from './BrandProvider';

/** Global view of a group: the work of every brand below it, side by side (multi-brand clients). */
export function GroupWork({ group, all }: { group: Brand; all: Brand[] }) {
  const { t } = useI18n();
  const { select } = useBrands();
  const below = all.filter((b) => b.groupId === group.id || all.find((p) => p.id === b.groupId)?.groupId === group.id);
  const reqs = useBrandsRequests([group.id, ...below.map((b) => b.id)]);
  const rows = [group, ...below].map((b) => {
    const r = reqs.filter((x) => x.brandId === b.id);
    return { b, prod: r.filter((x) => x.status === 'in_production').length, approve: r.filter((x) => x.status === 'to_approve').length, done: r.filter((x) => x.status === 'approved' || x.status === 'published').length };
  });
  const total = rows.reduce((n, r) => ({ prod: n.prod + r.prod, approve: n.approve + r.approve, done: n.done + r.done }), { prod: 0, approve: 0, done: 0 });

  return (
    <div className="col g16">
      <div className="grid grid-cols-3 gap-4">
        <div className="card card-tight col"><span className="h2">{total.prod}</span><span className="t-xs t-mute">{t('req.status.in_production')}</span></div>
        <div className="card card-tight col" style={total.approve ? { borderColor: '#F5D98A', background: '#FFFBF0' } : undefined}><span className="h2">{total.approve}</span><span className="t-xs t-mute">{t('req.status.to_approve')}</span></div>
        <div className="card card-tight col"><span className="h2">{total.done}</span><span className="t-xs t-mute">{t('group.delivered')}</span></div>
      </div>
      <div className="table overflow-x-auto">
        <div className="trow head label min-w-[560px]" style={{ gridTemplateColumns: 'minmax(0,1fr) 120px 120px 120px' }}>
          <span>{t('admin.brands.colBrand')}</span><span>{t('req.status.in_production')}</span><span>{t('req.status.to_approve')}</span><span>{t('group.delivered')}</span>
        </div>
        {rows.map(({ b, prod, approve, done }) => (
          <div key={b.id} className="trow min-w-[560px]" style={{ gridTemplateColumns: 'minmax(0,1fr) 120px 120px 120px', minHeight: 56 }}>
            <button className="row g12 text-left" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)' }} onClick={() => { select(b.id); window.scrollTo({ top: 0 }); }}>
              <span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none' }}><BrandMark brand={b} /></span>
              <span className={`truncate ${b.kind === 'group' ? 'w9' : 'w7'}`}>{b.name}</span>
            </button>
            <span>{prod}</span>
            <span style={approve ? { color: 'var(--warning)', fontWeight: 700 } : undefined}>{approve}</span>
            <span>{done}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
