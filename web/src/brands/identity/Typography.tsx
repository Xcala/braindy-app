import { useEffect } from 'react';

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

export function Typography({ fonts }: { fonts: Font[] }) {
  useGoogleFonts([...new Set(fonts.filter((f) => f.type === 'google' && f.fontFamily).map((f) => f.fontFamily!))]);
  if (!fonts.length) return null;
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {fonts.map((f) => {
        const link = f.downloadUrl || f.url;
        return (
          <div key={f.id ?? f.name} className="card col g20">
            <div className="row between g8">
              <p className="label">{f.role ?? ''}</p>
              {f.type && <span className="chip c-type">{f.type === 'google' ? 'Google Fonts' : f.type}</span>}
            </div>
            <p style={{ fontFamily: f.fontFamily, fontSize: 64, lineHeight: '64px', color: 'var(--ink)' }}>Aa</p>
            <div className="col g4">
              <span className="h3" style={{ fontFamily: f.fontFamily }}>{f.name ?? f.fontFamily}</span>
              {f.description && <p className="t-sm t-mute">{f.description}</p>}
            </div>
            {link && <a href={link} target="_blank" rel="noreferrer" className="t-sm w7">{f.fontFamily ?? f.name} ↗</a>}
          </div>
        );
      })}
    </div>
  );
}
