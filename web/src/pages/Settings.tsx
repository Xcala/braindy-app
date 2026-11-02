import { useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { NoticesCard } from '../settings/NoticesCard';
import { MembersCard } from '../team/MembersCard';
import { BillingCard } from '../settings/BillingCard';
import type { StringKey } from '../i18n/strings';
import { BackToAccount } from './Account';

const TABS: Array<[string, StringKey]> = [['notices', 'set.tab.notices'], ['team', 'set.tab.team'], ['language', 'set.tab.language'], ['billing', 'set.tab.billing']];

/** Settings: WhatsApp and notices, team and approvers, language, billing. Per brand, in tabs like the other pages. */
export function Settings() {
  const { current } = useBrands();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab')! : 'notices';
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  // Same pattern as the rest of the app: title on top, a row of tabs, one section at a time.
  return (
    <div className="col g24">
      <div className="col g8">
        <BackToAccount />
        <p className="label">{current.name}</p>
        <h1 className="h1">{t('nav.settings')}</h1>
      </div>
      <nav className="seg seg-scroll" aria-label={t('nav.settings')}>
        {TABS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setParams({ tab: k }, { replace: true })} aria-pressed={tab === k} className={tab === k ? 'is-on' : ''}>{t(label)}</button>
        ))}
      </nav>
      {tab === 'notices' && <p className="t-mute" style={{ margin: 0 }}>{t('set.noticesTagline')}</p>}
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
  );
}
