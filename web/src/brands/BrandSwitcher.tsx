import { useI18n } from '../i18n/I18nProvider';
import { asTree, useBrands } from './BrandProvider';

export function BrandSwitcher() {
  const { brands, current, select } = useBrands();
  const { t } = useI18n();
  if (brands.length < 2) return current ? <span className="text-sm font-medium">{current.name}</span> : null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t('brand.switch')}</span>
      <select
        value={current?.id ?? ''}
        onChange={(e) => select(e.target.value)}
        className="max-w-[14rem] rounded-full border border-black/15 bg-white px-3 py-1.5"
      >
        {asTree(brands).map(({ brand, depth }) => (
          <option key={brand.id} value={brand.id}>
            {'  '.repeat(depth)}{brand.name}
            {brand.status === 'archived' ? ` · ${t('status.archived')}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
