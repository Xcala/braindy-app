import { useBrands, type Brand } from '../../brands/BrandProvider';
import { CityInput } from '../../brands/CityInput';
import { useI18n } from '../../i18n/I18nProvider';
import { useConfirm } from '../../components/useConfirm';

/**
 * The end of «Gestionar» (UX MA2 + MA4): the brand's details (city, kind) that left the list,
 * and archive / activate again. Archiving asks first, naming the brand; the Undo toast still follows.
 */
export function BrandManageMore({ brand, onToggle }: { brand: Brand; onToggle: () => void }) {
  const { t } = useI18n();
  const { brands } = useBrands();
  const [dialog, ask] = useConfirm();
  const group = brand.groupId ? brands.find((b) => b.id === brand.groupId)?.name : undefined;
  const isGroup = brand.kind === 'group';
  const on = brand.status === 'active';

  async function archive() {
    const ok = await ask({
      title: t('admin.brands.confirmArchiveTitle', { name: brand.name }),
      body: <p className="t-sm">{t('brandsA.archiveBody')}</p>,
      confirmLabel: isGroup ? t('brandsA.archiveGroupCta') : t('brandsA.archiveCta'),
      danger: true,
    });
    if (ok) onToggle();
  }

  return (
    <>
      <p className="label">{t('brandsA.details')}</p>
      <div className="card col g12" style={{ padding: '1rem' }}>
        <div className="row between g12 wrap">
          <span className="w7 t-sm">{t('admin.brands.colKind')}</span>
          <span className="t-sm t-mute">
            {isGroup ? t('brand.group') : t('admin.brands.brand')}{group ? ` · ${t('brandsA.inGroup', { group })}` : ''}
          </span>
        </div>
        {!isGroup && (
          <div className="field">
            <span className="label">{t('admin.brands.colCity')}</span>
            <CityInput brand={brand} />
          </div>
        )}
      </div>

      {on ? (
        <div className="card col g12" style={{ padding: '1rem' }}>
          <span className="w7">{t('brandsA.archiveHead', { name: brand.name })}</span>
          <p className="t-sm t-mute">{t('brandsA.archiveBody')}</p>
          <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={archive}>
            {isGroup ? t('brandsA.archiveGroupCta') : t('brandsA.archiveCta')}
          </button>
        </div>
      ) : (
        <div className="card col g12" style={{ padding: '1rem' }}>
          <span className="row g8"><span className="chip c-archived">{t('status.archived')}</span><span className="t-sm t-mute">{t('brandsA.archivedNote')}</span></span>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={onToggle}>{t('brandsA.reactivate')}</button>
        </div>
      )}
      {dialog}
    </>
  );
}
