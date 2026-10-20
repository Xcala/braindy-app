import { useI18n } from '../../i18n/I18nProvider';

type Logos = { primary?: string; secondary?: string; icon?: string; variations?: string[] } | null;

export function Logos({ logos }: { logos: Logos }) {
  const { t } = useI18n();
  const items = [
    ['Primary', logos?.primary],
    ['Secondary', logos?.secondary],
    ['Icon', logos?.icon],
    ...(logos?.variations ?? []).map((v, i) => [`Variation ${i + 1}`, v] as const),
  ].filter((x): x is [string, string] => typeof x[1] === 'string' && x[1].startsWith('http'));
  if (!items.length) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(([label, url]) => (
        <li key={url} className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <div className="flex aspect-[4/3] items-center justify-center bg-[repeating-conic-gradient(#f3f3f1_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-6">
            <img src={url} alt={label} loading="lazy" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <span>{label}</span>
            <a href={url} target="_blank" rel="noreferrer" download className="text-black/60 hover:text-ink">
              {t('common.download')}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
