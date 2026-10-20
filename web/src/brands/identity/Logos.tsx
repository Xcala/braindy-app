import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';

type LogoSet = { primary?: string; secondary?: string; icon?: string; variations?: string[] } | null;

const GROUNDS = [
  { key: 'white', style: { background: '#FFFFFF', border: '1px solid #E3E7F0' }, filter: undefined },
  { key: 'dark', style: { background: '#060D1E' }, filter: 'brightness(0) invert(1)' },
  { key: 'fog', style: { background: '#F4F6FB' }, filter: undefined },
  { key: 'mono', style: { background: '#FFFFFF', border: '1px solid #E3E7F0' }, filter: 'brightness(0)' },
] as const;

/** Each logo shown on four grounds, as in the design's logo matrix. */
export function Logos({ logos }: { logos: LogoSet }) {
  const { t } = useI18n();
  const rows = [
    [t('brand.logoPrimary'), logos?.primary],
    [t('brand.logoSecondary'), logos?.secondary],
    [t('brand.logoIcon'), logos?.icon],
  ].filter((r): r is [string, string] => typeof r[1] === 'string' && r[1].startsWith('http'));
  // Variations are often full artworks with their own background: shown as they are, never recolored.
  const variations = (logos?.variations ?? []).filter((v) => typeof v === 'string' && v.startsWith('http'));
  if (!rows.length && !variations.length) return null;

  return (
    <div className="col g24">
    {rows.length > 0 && <div className="overflow-x-auto">
      <div className="vgrid min-w-[720px]">
        <span />
        {GROUNDS.map((g) => <span key={g.key} className="label" style={{ textAlign: 'center' }}>{t(`brand.ground.${g.key}`)}</span>)}
        {rows.map(([label, url]) => (
          <Row key={url} label={label} url={url} downloadLabel={t('common.download')} />
        ))}
      </div>
    </div>}
    {variations.length > 0 && (
      <div className="col g12">
        <p className="label">{t('brand.logoVariations')}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {variations.map((url, i) => (
            <div key={url} className="vcell" style={{ background: '#FFFFFF', border: '1px solid #E3E7F0' }}>
              <img src={url} alt={`${t('brand.logoVariation')} ${i + 1}`} loading="lazy" />
              <a className="btn btn-ghost btn-icon btn-sm dl" href={url} target="_blank" rel="noreferrer" aria-label={`${t('common.download')} ${t('brand.logoVariation')} ${i + 1}`} style={{ width: 36 }}>
                <Icon name="download" size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    )}
    </div>
  );
}

function Row({ label, url, downloadLabel }: { label: string; url: string; downloadLabel: string }) {
  return (
    <>
      <div className="col g4" style={{ justifyContent: 'center' }}><span className="w7">{label}</span></div>
      {GROUNDS.map((g) => (
        <div key={g.key} className="vcell" style={g.style}>
          <img src={url} alt="" loading="lazy" style={{ filter: g.filter }} />
          <a className="btn btn-ghost btn-icon btn-sm dl" href={url} target="_blank" rel="noreferrer"
            aria-label={`${downloadLabel} ${label}`} style={{ width: 36, background: g.key === 'dark' ? 'rgba(255,255,255,.14)' : undefined, color: g.key === 'dark' ? '#fff' : undefined }}>
            <Icon name="download" size={16} />
          </a>
        </div>
      ))}
    </>
  );
}
