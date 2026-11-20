import { useNavigate } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsRequests } from '../requests/useBrandsRequests';
import { useCanApprove } from '../requests/useCanApprove';
import { GroupAnalysis } from '../brains/BrainPanels';
import { PageHeader } from '../components/PageHeader';
import { BrandMark } from './BrandMark';
import { useBrands, type Brand } from './BrandProvider';

/** Every brand below a group, at any depth (a group inside a group counts its own companies too). */
export const below = (id: string, all: Brand[]): Brand[] =>
  all.filter((b) => b.groupId === id).flatMap((b) => [b, ...(b.kind === 'group' ? below(b.id, all) : [])]);

/**
 * Home of a group (2026-11-20): only its companies, each one a card that opens it. A group has no requests, brand
 * or files of its own; everything lives inside each company, and whoever has the group has every company in it.
 */
export function GroupHome({ group }: { group: Brand }) {
  const { t } = useI18n();
  const { brands, select } = useBrands();
  const navigate = useNavigate();
  const canAsk = useCanApprove(group.id);
  const companies = brands.filter((b) => b.groupId === group.id && b.status === 'active');
  const reqs = useBrandsRequests(below(group.id, brands).map((b) => b.id));
  const open = (id: string) => { select(id); navigate('/home'); window.scrollTo({ top: 0 }); };

  return (
    <div className="col g32">
      <PageHeader title={group.name} sub={`${t('gh.kicker')} · ${t('gh.companies', { n: companies.length })}`} />
      <section className="col g16" aria-labelledby="gh-title">
        <div className="col g4">
          <h2 className="h2" id="gh-title">{t('gh.title')}</h2>
          <p className="t-sm t-mute">{t('gh.sub')}</p>
        </div>
        {companies.length === 0 && <div className="card t-mute">{t('gh.empty')}</div>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((b) => {
            const ids = new Set([b.id, ...below(b.id, brands).map((x) => x.id)]);
            const mine = reqs.filter((r) => ids.has(r.brandId));
            const approve = mine.filter((r) => r.status === 'to_approve').length;
            const prod = mine.filter((r) => r.status === 'in_production').length;
            return (
              <button key={b.id} type="button" className="card row g16 text-left" onClick={() => open(b.id)}
                style={{ cursor: 'pointer', color: 'var(--ink)', alignItems: 'center', ...(approve ? { borderColor: '#F5D98A' } : {}) }}>
                <BrandMark brand={b} />
                <span className="col grow" style={{ minWidth: 0 }}>
                  <span className="w7 truncate">{b.name}</span>
                  <span className="t-xs t-mute">
                    {b.kind === 'group' ? `${t('brand.group')} · ` : ''}
                    {approve || prod
                      ? [approve && t('gh.toApprove', { n: approve }), prod && t('gh.inProd', { n: prod })].filter(Boolean).join(' · ')
                      : t('gh.quiet')}
                  </span>
                </span>
                <span className="btn btn-sm">{t('gh.open')}</span>
              </button>
            );
          })}
        </div>
      </section>
      <GroupAnalysis groupId={group.id} canAsk={canAsk} />
    </div>
  );
}
