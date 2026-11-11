import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import { LogoTile } from './LogoTile';
import { LogoDownload } from './LogoDownload';
import { loadSvg, recolorSvg, slug, svgDataUrl, type Tone } from './logoExport';

const FIRST = 5;

type LogoSet = { primary?: string; secondary?: string; icon?: string; variations?: string[] } | null;
type Ground = { key: 'white' | 'darkColor' | 'dark' | 'fog' | 'mono'; bg: string; border?: boolean; dark?: boolean; tone: Tone; filter?: string };

const GROUNDS: Ground[] = [
  { key: 'white', bg: '#FFFFFF', border: true, tone: 'none' },
  { key: 'darkColor', bg: '#060D1E', dark: true, tone: 'darkToWhite' },
  { key: 'dark', bg: '#060D1E', dark: true, tone: 'white', filter: 'brightness(0) invert(1)' },
  { key: 'fog', bg: '#F4F6FB', tone: 'none' },
  { key: 'mono', bg: '#FFFFFF', border: true, tone: 'black', filter: 'brightness(0)' },
];

/** For each SVG logo, its «on dark, in color» version: dark letters turn white and the colors stay. Missing when it would be all white anyway. */
function useDarkColor(urls: string[]) {
  const [map, setMap] = useState<Record<string, string>>({});
  const key = urls.join('|');
  useEffect(() => {
    let on = true;
    Promise.all(urls.map(async (u) => {
      const svg = await loadSvg(u);
      // Nothing dark to turn white (an icon in brand colors): the logo goes on dark as it is.
      const color = svg && (recolorSvg(svg, 'darkToWhite') ?? svg);
      return color && color !== recolorSvg(svg, 'white') ? [u, svgDataUrl(color)] as const : null;
    })).then((r) => on && setMap(Object.fromEntries(r.filter((x) => x !== null))));
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

/** Each logo shown on its grounds, as in the design's logo matrix; every cell downloads in the format asked. */
export function Logos({ logos, name = 'logo' }: { logos: LogoSet; name?: string }) {
  const { t } = useI18n();
  const rows = [
    [t('brand.logoPrimary'), logos?.primary],
    [t('brand.logoSecondary'), logos?.secondary],
    [t('brand.logoIcon'), logos?.icon],
  ].filter((r): r is [string, string] => typeof r[1] === 'string' && r[1].startsWith('http'));
  // Variations are often full artworks with their own background: never recolored; the viewer switches the ground behind them.
  const variations = (logos?.variations ?? []).filter((v) => typeof v === 'string' && v.startsWith('http'));
  const [all, setAll] = useState(false);
  const darkColor = useDarkColor(rows.map((r) => r[1]));
  if (!rows.length && !variations.length) return null;

  const withColor = Object.keys(darkColor).length > 0;
  const grounds = GROUNDS.filter((g) => g.key !== 'darkColor' || withColor);
  const groundName = (g: Ground) => t(`brand.ground.${g.key === 'dark' && withColor ? 'darkWhite' : g.key}` as StringKey);
  const cell = (g: Ground, url: string, label: string, showGround: boolean) => (
    <Cell key={g.key} g={g} url={url} label={label} ground={groundName(g)} showGround={showGround}
      src={g.key === 'darkColor' ? darkColor[url] : undefined} file={`${slug(name)}-${slug(label)}-${slug(groundName(g))}`} />
  );

  return (
    <div className="col g24">
    {rows.length > 0 && <div className="logos-m col g20">
      {rows.map(([label, url]) => (
        <div key={url} className="col g8">
          <span className="w7">{label}</span>
          <div className="grid grid-cols-2 gap-2">{grounds.map((g) => cell(g, url, label, true))}</div>
        </div>
      ))}
    </div>}
    {rows.length > 0 && <div className="logos-d overflow-x-auto">
      <div className="vgrid" style={{ gridTemplateColumns: `160px repeat(${grounds.length},minmax(0,1fr))`, minWidth: 180 * grounds.length }}>
        <span />
        {grounds.map((g) => <span key={g.key} className="label" style={{ textAlign: 'center' }}>{groundName(g)}</span>)}
        {rows.map(([label, url]) => (
          <div key={url} style={{ display: 'contents' }}>
            <div className="col g4" style={{ justifyContent: 'center' }}><span className="w7">{label}</span></div>
            {grounds.map((g) => cell(g, url, label, false))}
          </div>
        ))}
      </div>
    </div>}
    {variations.length > 0 && (
      <div className="col g12">
        <p className="label">{t('brand.logoVariations')}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {(all ? variations : variations.slice(0, FIRST)).map((url, i) => (
            <LogoTile key={url} url={url} label={`${t('brand.logoVariation')} ${i + 1}`} file={`${slug(name)}-${slug(t('brand.logoVariation'))}-${i + 1}`} />
          ))}
        </div>
        {variations.length > FIRST && <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setAll((a) => !a)}>{all ? t('common.showLess') : t('common.showAll', { n: String(variations.length) })}</button>}
      </div>
    )}
    </div>
  );
}

function Cell({ g, url, src, label, ground, showGround, file }: { g: Ground; url: string; src?: string; label: string; ground: string; showGround: boolean; file: string }) {
  // A raster logo has no «in color» version of its own: that cell shows it white, like the column beside it.
  const filter = g.key === 'darkColor' && !src ? 'brightness(0) invert(1)' : g.filter;
  return (
    <div className="vcell" style={{ background: g.bg, border: g.border ? '1px solid #E3E7F0' : undefined }}>
      {showGround && <span className="vground" style={{ color: g.dark ? '#C9D0DE' : undefined }}>{ground}</span>}
      <img src={src ?? url} alt="" loading="lazy" style={{ filter }} />
      <LogoDownload className="dl" url={url} tone={g.key === 'darkColor' && !src ? 'white' : g.tone} ground={g.bg} name={file} label={`${label} · ${ground}`}
        style={{ width: 36, background: g.dark ? 'rgba(255,255,255,.14)' : undefined, color: g.dark ? '#fff' : undefined }} />
    </div>
  );
}
