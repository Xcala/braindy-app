import { useNavigate } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsRequests } from '../requests/useBrandsRequests';
import { useCanApprove } from '../requests/useCanApprove';
import { GroupAnalysis } from '../brains/BrainPanels';
import { CompanyCard } from './CompanyCard';
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
  const open = (id: string, to = '/home') => { select(id); navigate(to); window.scrollTo({ top: 0 }); };

  return (
    <div className="col g32">
      <header className="col g4">
        <span className="label">{t('gh.kicker')} · {t('gh.companies', { n: companies.length })}</span>
        <h1 className="h1"><span className="w9">{group.name}.</span></h1>
      </header>
      <section className="col g16" aria-labelledby="gh-title">
        <div className="col g4">
          <h2 className="h2" id="gh-title">{t('gh.title')}</h2>
          <p className="t-sm t-mute">{t('gh.sub')}</p>
        </div>
        {companies.length === 0 && <div className="card t-mute">{t('gh.empty')}</div>}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 19rem), 1fr))' }}>
          {companies.map((b) => {
            const ids = new Set([b.id, ...below(b.id, brands).map((x) => x.id)]);
            return <CompanyCard key={b.id} brand={b} requests={reqs.filter((r) => ids.has(r.brandId))} go={(to) => open(b.id, to)} />;
          })}
        </div>
      </section>
      <GroupAnalysis groupId={group.id} canAsk={canAsk} />
    </div>
  );
}
