import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { Brand } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { brandColors, type Color } from '../brands/identity/Colors';
import { inkOn } from '../brands/identity/useCopy';
import type { Cur } from './hostingData';
import { Featured, useL } from './HostingParts';
import './hosting.css';
import './brandPieces.css';

const BRAINS = ['researcher', 'marketer', 'creator', 'builder'] as const;
const FALLBACK = ['#2F4DE0', '#0B1220', '#06B6D4'];

/**
 * Mi plan · Brand tab: on-brand piece design with the Brains, told visually. An animated loop of how one piece is made
 * (you ask, your brand loads, the Brains create, NickMark reviews, you receive it), examples drawn with this brand's own
 * logo, colors and type, and the price card (Braindy credits).
 */
export function BrandPieces({ brand }: { brand: Brand }) {
  const { lang } = useI18n();
  const L = useL();
  const [cur, setCur] = useState<Cur>(lang === 'es' ? 'cop' : 'usd');
  const id = (useBrandDoc(brand.id, 'context/identity').data ?? {}) as { logos?: { primary?: string; icon?: string }; colors?: Color[]; typography?: Array<{ fontFamily?: string; name?: string }> };
  const hexes = brandColors(id.colors ?? []).map((c) => c.hex!).slice(0, 3);
  const [c1, c2, c3] = [hexes[0] ?? FALLBACK[0], hexes[1] ?? FALLBACK[1], hexes[2] ?? hexes[0] ?? FALLBACK[2]];
  const logo = id.logos?.primary ?? brand.logoUrl ?? undefined;
  const font = id.typography?.[0]?.fontFamily ?? id.typography?.[0]?.name;
  const kit = { c1, c2, c3, logo, font, name: brand.name };

  const steps: Array<[string, string]> = [
    [L(['Pides', 'You ask']), L(['En una frase, desde Pedidos.', 'In one sentence, from Requests.'])],
    [L(['Tu marca se carga', 'Your brand loads']), L(['Logo, colores, tipografía y tono.', 'Logo, colors, type and tone.'])],
    [L(['Los Brains crean', 'The Brains create']), L(['Investigan, escriben y diseñan.', 'They research, write and design.'])],
    [L(['NicoMarca revisa', 'NickMark reviews']), L(['Nada sale sin su visto bueno.', 'Nothing ships without his OK.'])],
    [L(['Lo recibes', 'You receive it']), L(['Listo para publicar.', 'Ready to publish.'])],
  ];

  return (
    <div className="col g32">
      <section className="bp-how card" aria-labelledby="bp-how">
        <div className="col g8">
          <span className="label">{L(['Diseño de piezas on-brand', 'On-brand piece design'])}</span>
          <h2 id="bp-how" className="h2">{L(['Pides una pieza. ', 'Ask for a piece. '])}<span className="w9">{L(['Sale con tu marca.', 'It comes out on-brand.'])}</span></h2>
          <p className="t-mute" style={{ margin: 0, maxWidth: 560 }}>{L(['Carruseles, posts, historias, videos e investigaciones hechos por los Brains con tu identidad ya cargada, y revisados por NicoMarca antes de llegar a ti.', 'Carousels, posts, stories, videos and research made by the Brains with your identity already loaded, and reviewed by NickMark before they reach you.'])}</p>
        </div>
        <div className="bp-stage">
          <Stage kit={kit} head={L(['Gran lanzamiento', 'Big launch'])} ask={L(['Un carrusel para el lanzamiento', 'A carousel for the launch'])} done={L(['Entregado', 'Delivered'])} />
          <ol className="bp-steps">
            {steps.map(([title, body], i) => (
              <li key={title} style={{ animationDelay: `${i * 2}s` }}><b><span>{i + 1}</span>{title}</b><small>{body}</small></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="col g16" aria-labelledby="bp-ex">
        <div className="col g4">
          <h2 id="bp-ex" className="h3">{L(['Así se verían con tu marca', 'How they would look with your brand'])}</h2>
          <p className="t-sm t-mute" style={{ margin: 0 }}>{L(['Ejemplos dibujados con el logo y los colores de ', 'Examples drawn with the logo and colors of '])}{brand.name}.</p>
        </div>
        <Examples kit={kit} L={L} />
      </section>

      <div className="hp">
        <div className="hp-bar">
          <span className="hp-eyebrow">{L(['Cuánto cuesta', 'What it costs'])}</span>
          <div className="hp-seg" role="group" aria-label="Currency">{(['usd', 'cop'] as const).map((c) => <button key={c} type="button" aria-pressed={cur === c} onClick={() => setCur(c)}>{c.toUpperCase()}</button>)}</div>
        </div>
        <Featured cur={cur} brandName={brand.name} />
      </div>
    </div>
  );
}

type Kit = { c1: string; c2: string; c3: string; logo?: string; font?: string; name: string };

/** One piece being made, in a 10 s loop (CSS only; with reduced motion it rests on the finished piece). */
function Stage({ kit, head, ask, done }: { kit: Kit; head: string; ask: string; done: string }) {
  return (
    <div className="bp-anim" aria-hidden="true">
      <div className="bp-bubble">{ask}</div>
      <div className="bp-card" style={{ background: kit.c1, color: inkOn(kit.c1), fontFamily: kit.font ? `'${kit.font}', var(--f-text)` : undefined }}>
        <div className="bp-skel" />
        <div className="bp-fill">
          {kit.logo ? <img src={kit.logo} alt="" className="bp-logo" /> : <b className="bp-logo-txt">{kit.name}</b>}
          <span className="bp-head">{head}</span>
          <span className="bp-sub" style={{ background: kit.c3, color: inkOn(kit.c3) }}>Nuevo · New</span>
          <span className="bp-bar" style={{ background: kit.c2 }} />
        </div>
        <span className="bp-check">✓</span>
        <span className="bp-done">{done}</span>
      </div>
      <div className="bp-swatches">{[kit.c1, kit.c2, kit.c3].map((c, i) => <i key={i} style={{ background: c }} />)}</div>
      <div className="bp-brains">{BRAINS.map((b) => <img key={b} src={`/brand/brains/${b}.png`} alt="" />)}</div>
      <img className="bp-nico" src="/brand/proposal/nicolas-face.jpg" alt="" />
    </div>
  );
}

function Examples({ kit, L }: { kit: Kit; L: (x: readonly [string, string]) => string }) {
  const ink1 = inkOn(kit.c1), ink2 = inkOn(kit.c2);
  const ff = kit.font ? `'${kit.font}', var(--f-text)` : undefined;
  const Logo = ({ dark }: { dark?: boolean }) => kit.logo
    ? <img src={kit.logo} alt="" className="bp-x-logo" style={dark ? { filter: 'brightness(0) invert(1)' } : undefined} />
    : <b className="t-xs">{kit.name}</b>;
  const pieces = [
    { key: 'carousel', label: L(['Carrusel', 'Carousel']), note: L(['Instagram y LinkedIn', 'Instagram and LinkedIn']), art: (
      <div className="bp-x bp-x-car">
        {[kit.c2, kit.c3, kit.c1].map((bg, i) => (
          <div key={i} className="bp-x-slide" style={{ background: bg, color: inkOn(bg), fontFamily: ff, transform: `translate(${i * 14}px, ${i * -10}px)` }}>
            {i === 2 && <><Logo dark={ink1 === '#FFFFFF'} /><b>{L(['5 claves de tu sector', '5 keys of your industry'])}</b><small>1 / 5</small></>}
          </div>
        ))}
      </div>
    ) },
    { key: 'post', label: L(['Post', 'Post']), note: L(['Una imagen con mensaje', 'One image with a message']), art: (
      <div className="bp-x bp-x-post" style={{ background: kit.c2, color: ink2, fontFamily: ff }}>
        <span className="bp-x-blob" style={{ background: kit.c1 }} />
        <b>{L(['Lo que tu cliente necesita oír', 'What your client needs to hear'])}</b>
        <Logo dark={ink2 === '#FFFFFF'} />
      </div>
    ) },
    { key: 'story', label: L(['Historia o video', 'Story or video']), note: L(['Vertical, 9:16', 'Vertical, 9:16']), art: (
      <div className="bp-x bp-x-story" style={{ background: `linear-gradient(160deg, ${kit.c1}, ${kit.c2})`, color: ink1, fontFamily: ff }}>
        <span className="bp-x-play">▶</span>
        <b>{L(['Detrás de cámaras', 'Behind the scenes'])}</b>
        <Logo dark={ink1 === '#FFFFFF'} />
      </div>
    ) },
    { key: 'research', label: L(['Investigación', 'Research']), note: L(['Mercado y competencia', 'Market and competitors']), art: (
      <div className="bp-x bp-x-doc" style={{ fontFamily: ff }}>
        <span className="bp-x-doc-top" style={{ background: kit.c1 }}><Logo dark={ink1 === '#FFFFFF'} /></span>
        <b>{L(['Mapa de mercado', 'Market map'])}</b>
        <span className="bp-x-bars">{[70, 45, 85, 30].map((w, i) => <i key={i} style={{ width: `${w}%`, background: i % 2 ? kit.c3 : kit.c1 }} />)}</span>
      </div>
    ) },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {pieces.map((p) => (
        <figure key={p.key} className="bp-ex card">
          <div className="bp-ex-art">{p.art}</div>
          <figcaption className="col"><span className="w7">{p.label}</span><span className="t-xs t-mute">{p.note}</span></figcaption>
        </figure>
      ))}
    </div>
  );
}
