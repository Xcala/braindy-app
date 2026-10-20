import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useBrands, type Brand } from './BrandProvider';
import { isHex } from './identity/useCopy';

/** Hero from the design: dark field tinted with the brand's own primary color. */
export function BrandHero({ brand, logo, essence, tags, accent }: {
  brand: Brand; logo?: string; essence?: string; tags: string[]; accent?: string;
}) {
  const { t } = useI18n();
  const { brands, select } = useBrands();
  const tint = isHex(accent) ? accent : '#2F4DE0';
  const parent = brand.groupId ? brands.find((b) => b.id === brand.groupId) : undefined;

  return (
    <section className="relative flex flex-wrap items-end justify-between gap-8 overflow-hidden p-8 text-white sm:p-14"
      style={{ borderRadius: 28, background: `radial-gradient(40% 70% at 88% 20%, ${tint}8C, transparent 70%), radial-gradient(30% 60% at 10% 110%, ${tint}59, transparent 70%), #060D1E` }}>
      <div className="col g24" style={{ maxWidth: 760 }}>
        <div className="row g8 wrap">
          <p className="label" style={{ color: '#C9D0DE' }}>{t('brand.heroLabel')}</p>
          {brand.kind === 'group' && <span className="chip c-group">{t('brand.group')}</span>}
          {brand.status === 'archived' && <span className="chip c-archived">{t('status.archived')}</span>}
        </div>
        {logo ? (
          <img src={logo} alt={brand.name} style={{ height: 56, width: 'auto', maxWidth: 320, alignSelf: 'flex-start', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        ) : (
          <h1 className="d-lg" style={{ color: '#fff' }}><span className="w9">{brand.name}.</span></h1>
        )}
        {essence && <p className="d-lg" style={{ fontSize: 28, lineHeight: '36px', color: '#fff' }}>{essence}</p>}
        <div className="row g12 wrap">
          {parent && (
            <button onClick={() => select(parent.id)} className="chip chip-plain glass-clear" style={{ color: '#fff', cursor: 'pointer' }}>
              {t('brand.inGroup', { name: parent.name })}
            </button>
          )}
          {tags.map((tag) => <span key={tag} className="chip chip-plain glass-clear" style={{ color: '#fff' }}>{tag}</span>)}
        </div>
      </div>
      <div className="col g12 flex-none">
        <Link className="btn btn-white" to="/assets"><Icon name="folder" />{t('brand.openFiles')}</Link>
      </div>
    </section>
  );
}
