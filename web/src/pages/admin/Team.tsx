import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { MembersCard } from '../../team/MembersCard';

/** Admin Team: the people of the brand picked in the top bar (access, approvers, invites). Cross-brand work lives in Today and Studio. */
export function AdminTeam() {
  const { t } = useI18n();
  const { current } = useBrands();
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  return (
    <div className="col g24">
      <div className="col g8"><p className="label">{current.name}</p><h1 className="h1">{t('nav.team')}</h1></div>
      <MembersCard key={current.id} brandId={current.id} brandName={current.name} />
      <p className="t-xs t-mute">{t('team.membersHint')}</p>
    </div>
  );
}
