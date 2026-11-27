import { Navigate, useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { NoticesCard } from '../settings/NoticesCard';
import { MyWhatsappCard } from '../settings/MyWhatsappCard';
import { MembersCard } from '../team/MembersCard';
import { Fold } from '../components/Fold';

/**
 * Team and notices (2026-11-17), one page instead of three tabs: who can sign in to the brand's page stays open on top, the
 * WhatsApp number and notices fold below. Language moved to Account (it is each person's, not the brand's).
 * Old links: ?tab=notices opens the fold, ?tab=billing goes to Mi plan › Payments.
 */
export function Settings() {
  const { current } = useBrands();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const tab = params.get('tab');
  if (tab === 'billing') return <Navigate to="/plan?tab=payments" replace />;
  if (tab === 'language') return <Navigate to="/account" replace />;
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  return (
    <div className="col g24">
      <div className="col g8">
        <p className="label">{current.name}</p>
        <h1 className="h1">{t('set.tab.people')}</h1>
      </div>
      <MembersCard brandId={current.id} brandName={current.name} />
      <Fold id="notices" title={t('set.foldNotices')} sub={t('set.foldNoticesSub')} open={tab === 'notices'}>
        <p className="t-mute" style={{ margin: 0 }}>{t('set.noticesTagline')}</p>
        <MyWhatsappCard />
        <NoticesCard brandId={current.id} />
      </Fold>
    </div>
  );
}
