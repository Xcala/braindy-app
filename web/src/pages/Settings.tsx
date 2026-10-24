import { useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { NoticesCard } from '../settings/NoticesCard';
import { MembersCard } from '../team/MembersCard';
import { BillingCard } from '../settings/BillingCard';
import type { StringKey } from '../i18n/strings';

const TABS: Array<[string, StringKey]> = [['notices', 'set.tab.notices'], ['team', 'set.tab.team'], ['language', 'set.tab.language'], ['billing', 'set.tab.billing']];

/** Settings (design 20): WhatsApp and notices, team and approvers, language, billing. Per brand. */
export function Settings() {
  const { current } = useBrands();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab')! : 'notices';
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="col g4" aria-label={t('nav.settings')}>
        <p className="label" style={{ padding: '0 12px 8px' }}>{current.name}</p>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setParams({ tab: k })} aria-current={tab === k ? 'page' : undefined}
            className={`menu-item text-left ${tab === k ? 'is-on' : ''}`} style={{ border: 0, cursor: 'pointer', background: tab === k ? 'var(--niebla)' : 'none' }}>
            {t(label)}
          </button>
        ))}
      </nav>
      <div className="col g24">
        <div className="col g8">
          <h1 className="h1">{t('nav.settings')}</h1>
          {tab === 'notices' && <p className="t-mute">{t('set.noticesTagline')}</p>}
        </div>
        {tab === 'notices' && <NoticesCard brandId={current.id} />}
        {tab === 'team' && <MembersCard brandId={current.id} brandName={current.name} />}
        {tab === 'language' && (
          <div className="card row between g16 wrap">
            <span className="col"><span className="w7">{t('set.tab.language')}</span><span className="t-sm t-mute">{t('set.langSub')}</span></span>
            <LangToggle />
          </div>
        )}
        {tab === 'billing' && <BillingCard brandId={current.id} />}
      </div>
    </div>
  );
}
