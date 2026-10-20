import { useI18n } from '../i18n/I18nProvider';
import { useBrands, type Brand } from './BrandProvider';

export function BrandHeader({ brand }: { brand: Brand }) {
  const { brands, select } = useBrands();
  const { t } = useI18n();
  const parent = brand.groupId ? brands.find((b) => b.id === brand.groupId) : undefined;
  const children = brands.filter((b) => b.groupId === brand.id);

  return (
    <header className="flex flex-wrap items-center gap-5">
      {brand.logoUrl && (
        <img src={brand.logoUrl} alt="" className="h-16 w-16 rounded-xl border border-black/10 bg-white object-contain p-2" />
      )}
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-black/55">
          {brand.kind === 'group' && <span className="rounded-full bg-black/5 px-2 py-0.5">{t('brand.group')}</span>}
          {parent && (
            <button onClick={() => select(parent.id)} className="hover:text-ink">
              {t('brand.inGroup', { name: parent.name })}
            </button>
          )}
          {brand.status === 'archived' && <span className="rounded-full bg-black/5 px-2 py-0.5">{t('status.archived')}</span>}
        </div>
        <h1 className="text-4xl font-black tracking-tight">{brand.name}</h1>
      </div>
      {children.length > 0 && (
        <nav aria-label={t('brand.children')} className="flex w-full flex-wrap gap-2">
          {children.map((c) => (
            <button key={c.id} onClick={() => select(c.id)} className="rounded-full border border-black/15 px-3 py-1 text-sm hover:bg-black/5">
              {c.name}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
