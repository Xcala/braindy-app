import { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import { Scan } from '../../components/Scan';

type Font = { id?: string; name?: string; fontFamily?: string; role?: string; description?: string; type?: string; downloadUrl?: string; url?: string };

/** Loads Google Fonts used by the brand so the specimen renders in the real typeface. */
function useGoogleFonts(families: string[]) {
  const key = families.join('|');
  useEffect(() => {
    if (!key) return;
    const href = `https://fonts.googleapis.com/css2?${key.split('|').map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`).join('&')}&display=swap`;
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
    document.head.appendChild(link);
  }, [key]);
}

/** Every font gets a download link: its own file or link, else Google Fonts, Adobe Fonts or a search for it. */
export function fontLink(f: Font): { href: string; label: StringKey } {
  const own = f.downloadUrl || f.url;
  const family = (f.fontFamily ?? f.name ?? '').trim();
  const type = (f.type ?? '').toLowerCase();
  if (own) return { href: own, label: type.includes('adobe') && own.includes('adobe') ? 'brand.fontAdobe' : 'brand.fontDownload' };
  if (type === 'google') return { href: `https://fonts.google.com/specimen/${family.replace(/\s+/g, '+')}`, label: 'brand.fontDownload' };
  if (type.includes('adobe')) return { href: `https://fonts.adobe.com/fonts/${family.toLowerCase().replace(/\s+/g, '-')}`, label: 'brand.fontAdobe' };
  return { href: `https://www.google.com/search?q=${encodeURIComponent(`${family} font download`)}`, label: 'brand.fontFind' };
}

export function Typography({ fonts }: { fonts: Font[] }) {
  const { t } = useI18n();
  useGoogleFonts([...new Set(fonts.filter((f) => f.type === 'google' && f.fontFamily).map((f) => f.fontFamily!))]);
  if (!fonts.length) return null;
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {fonts.map((f) => {
        const link = fontLink(f);
        return (
          <div key={f.id ?? f.name ?? f.fontFamily} className="card col g20">
            <div className="row between g8">
              <p className="label">{f.role ?? ''}</p>
              {f.type && <span className="chip c-type">{f.type === 'google' ? 'Google Fonts' : f.type.toLowerCase().includes('adobe') ? 'Adobe Fonts' : f.type}</span>}
            </div>
            <p className="text-5xl sm:text-[4rem] sm:leading-[4rem]" style={{ fontFamily: f.fontFamily, color: 'var(--ink)' }}>Aa</p>
            <div className="col g4">
              <span className="h3" style={{ fontFamily: f.fontFamily }}>{f.name ?? f.fontFamily}</span>
              {f.description && <Scan text={f.description} points />}
            </div>
            <a href={link.href} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm self-start" style={{ textDecoration: 'none' }}>↓ {t(link.label)}</a>
          </div>
        );
      })}
    </div>
  );
}
