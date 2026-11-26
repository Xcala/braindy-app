import './options.css';

export type ClientLogo = { name: string; src: string };

/**
 * Client logos near «Accept» (L21, decision 6): in grey, small, without links. Renders nothing when there are no logos,
 * so the page never shows an empty row.
 */
export function ClientLogos({ logos, label }: { logos?: ClientLogo[]; label: string }) {
  const list = (logos ?? []).filter((l) => l.src);
  if (!list.length) return null;
  return (
    <div className="col g8">
      <p className="label">{label}</p>
      <div className="client-logos">{list.map((l) => <img key={l.src} src={l.src} alt={l.name} loading="lazy" />)}</div>
    </div>
  );
}
