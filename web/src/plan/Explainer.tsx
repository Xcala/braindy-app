import type { ReactNode } from 'react';
import type { Brand } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { brandColors, type Color } from '../brands/identity/Colors';
import './brandPieces.css';
import './explainers.css';

/** The brand's own kit (first three colors, logo, type), so every explainer is drawn on-brand. Braindy blues when empty. */
export type Kit = { c1: string; c2: string; c3: string; logo?: string; font?: string; name: string };
const FALLBACK = ['#2F4DE0', '#0B1220', '#06B6D4'];

export function useBrandKit(brand: Brand): Kit {
  const id = (useBrandDoc(brand.id, 'context/identity').data ?? {}) as { logos?: { primary?: string }; colors?: Color[]; typography?: Array<{ fontFamily?: string; name?: string }> };
  const hexes = brandColors(id.colors ?? []).map((c) => c.hex!).slice(0, 3);
  return {
    c1: hexes[0] ?? FALLBACK[0]!, c2: hexes[1] ?? FALLBACK[1]!, c3: hexes[2] ?? hexes[0] ?? FALLBACK[2]!,
    logo: id.logos?.primary ?? brand.logoUrl ?? undefined, font: id.typography?.[0]?.fontFamily ?? id.typography?.[0]?.name, name: brand.name,
  };
}
export const fontOf = (k: Kit) => (k.font ? `'${k.font}', var(--f-text)` : undefined);

/**
 * The top of a Mi plan tab: a label, a two-part title, one line, then an animated stage (10 s loop, five 2 s beats)
 * next to the five steps it tells, each lit in turn.
 */
export function Explainer({ label, title, strong, lead, stage, steps }: {
  label: string; title: string; strong: string; lead: string; stage: ReactNode; steps: Array<[string, string]>;
}) {
  return (
    <section className="bp-how card" aria-label={`${title}${strong}`}>
      <div className="col g8">
        <span className="label">{label}</span>
        <h2 className="h2">{title}<span className="w9">{strong}</span></h2>
        <p className="t-mute" style={{ margin: 0, maxWidth: 560 }}>{lead}</p>
      </div>
      <div className="bp-stage">
        <div className="bp-anim" aria-hidden="true">{stage}</div>
        <ol className="bp-steps">
          {steps.map(([t, body], i) => <li key={t} style={{ animationDelay: `${i * 2}s` }}><b><span>{i + 1}</span>{t}</b><small>{body}</small></li>)}
        </ol>
      </div>
    </section>
  );
}

/** A row of small illustrated cards under an explainer. */
export function ExampleRow({ title, sub, items }: { title: string; sub?: string; items: Array<{ key: string; label: string; note: string; art: ReactNode }> }) {
  return (
    <section className="col g16" aria-label={title}>
      <div className="col g4">
        <h2 className="h3">{title}</h2>
        {sub && <p className="t-sm t-mute" style={{ margin: 0 }}>{sub}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((p) => (
          <figure key={p.key} className="bp-ex card">
            <div className="bp-ex-art">{p.art}</div>
            <figcaption className="col"><span className="w7">{p.label}</span><span className="t-xs t-mute">{p.note}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
