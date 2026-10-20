import { useBrands } from '../brands/BrandProvider';
import { useBrandCollection } from '../brands/useBrandDoc';
import { BrandHeader } from '../brands/BrandHeader';
import { Section } from '../components/Section';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

type Asset = { id: string; type?: string; title?: string; url?: string | null; status?: string; data?: { coverImageUrl?: string; description?: string } };

const GROUPS: Array<{ type: string; label: StringKey }> = [
  { type: 'logodeck', label: 'assets.logodeck' },
  { type: 'marketmap', label: 'assets.marketmap' },
  { type: 'file', label: 'assets.file' },
];

export function MyAssets() {
  const { current } = useBrands();
  const { t } = useI18n();
  const { docs, loading } = useBrandCollection(current?.id, 'assets');
  if (!current) return <p className="text-black/55">{t('brand.none')}</p>;
  const assets = docs as Asset[];

  return (
    <div>
      <BrandHeader brand={current} />
      {loading && <p className="mt-8 text-black/50">{t('common.loading')}…</p>}
      {!loading && !assets.length && <p className="mt-8 text-black/55">{t('assets.empty')}</p>}
      {GROUPS.map(({ type, label }) => {
        const list = assets.filter((a) => a.type === type).sort((a, b) => String(a.title).localeCompare(String(b.title)));
        if (!list.length) return null;
        return (
          <Section key={type} title={t(label)}>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((a) => <AssetCard key={a.id} asset={a} />)}
            </ul>
          </Section>
        );
      })}
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  const { t } = useI18n();
  const cover = asset.data?.coverImageUrl;
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="aspect-[16/9] bg-black/5">
        {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-1 items-start justify-between gap-3 p-4">
        <div>
          <div className="font-medium">{asset.title}</div>
          {asset.data?.description && <p className="mt-1 line-clamp-2 text-sm text-black/55">{asset.data.description}</p>}
        </div>
        {asset.url && (
          <a href={asset.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-black/15 px-3 py-1 text-sm hover:bg-black/5">
            {t('common.open')}
          </a>
        )}
      </div>
    </li>
  );
}
