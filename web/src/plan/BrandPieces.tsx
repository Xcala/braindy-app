import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { Brand } from '../brands/BrandProvider';
import { inkOn } from '../brands/identity/useCopy';
import type { Cur } from './hostingData';
import { Featured, useL } from './HostingParts';
import { Explainer, ExampleRow, useBrandKit, type Kit } from './Explainer';
import { OnceIntro } from './OnceIntro';
import './hosting.css';

const BRAINS = ['researcher', 'marketer', 'creator', 'builder'] as const;

/**
 * Mi plan · Brand tab: on-brand piece design with the Brains, told visually. An animated loop of how one piece is made
 * (you ask, your brand loads, the Brains create, NickMark reviews, you receive it), examples drawn with this brand's own
 * logo, colors and type, and the price card (Braindy credits).
 */
export function BrandPieces({ brand }: { brand: Brand }) {
  const { lang } = useI18n();
  const L = useL();
  const [cur, setCur] = useState<Cur>(lang === 'es' ? 'cop' : 'usd');
  const kit = useBrandKit(brand);

  const steps: Array<[string, string]> = [
    [L(['Pides', 'You ask']), L(['En una frase, desde Pedidos.', 'In one sentence, from Requests.'])],
    [L(['Tu marca se carga', 'Your brand loads']), L(['Logo, colores, tipografía y tono.', 'Logo, colors, type and tone.'])],
    [L(['Los Brains crean', 'The Brains create']), L(['Investigan, escriben y diseñan.', 'They research, write and design.'])],
    [L(['NicoMarca revisa', 'NickMark reviews']), L(['Nada sale sin su visto bueno.', 'Nothing ships without his OK.'])],
    [L(['Lo recibes', 'You receive it']), L(['Listo para publicar.', 'Ready to publish.'])],
  ];

  return (
    <div className="col g32">
      <OnceIntro id="brand">
      <Explainer label={L(['Diseño de piezas on-brand', 'On-brand piece design'])} title={L(['Pides una pieza. ', 'Ask for a piece. '])} strong={L(['Sale con tu marca.', 'It comes out on-brand.'])}
        lead={L(['Carruseles, posts, historias, videos e investigaciones hechos por los Brains con tu identidad ya cargada, y revisados por NicoMarca antes de llegar a ti.', 'Carousels, posts, stories, videos and research made by the Brains with your identity already loaded, and reviewed by NickMark before they reach you.'])}
        stage={<Stage kit={kit} head={L(['Gran lanzamiento', 'Big launch'])} ask={L(['Un carrusel para el lanzamiento', 'A carousel for the launch'])} done={L(['Entregado', 'Delivered'])} />} steps={steps}>
        {/* Same compact strip as the other tabs: the examples live inside the explainer card. */}
        <ExampleRow title={L(['Así se vería con tu marca', 'How it looks with your brand'])} items={examples(kit, L)} />
      </Explainer>
      </OnceIntro>

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

/** One piece being made, in a 10 s loop (CSS only; with reduced motion it rests on the finished piece). */
function Stage({ kit, head, ask, done }: { kit: Kit; head: string; ask: string; done: string }) {
  return (
    <>
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
    </>
  );
}

/** A tall piece centered and shrunk inside the strip's small frame (the frame's own scale would leave it cut off). */
const tall = (k: number) => ({ position: 'absolute' as const, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${k})` });

/** Pieces drawn with this brand's logo, colors and type, sized for the explainer's example strip. */
function examples(kit: Kit, L: (x: readonly [string, string]) => string) {
  const ink1 = inkOn(kit.c1), ink2 = inkOn(kit.c2);
  const ff = kit.font ? `'${kit.font}', var(--f-text)` : undefined;
  const Logo = ({ dark }: { dark?: boolean }) => kit.logo
    ? <img src={kit.logo} alt="" className="bp-x-logo" style={dark ? { filter: 'brightness(0) invert(1)' } : undefined} />
    : <b className="t-xs">{kit.name}</b>;
  const pieces = [
    { key: 'carousel', label: L(['Carrusel', 'Carousel']), note: L(['Instagram y LinkedIn', 'Instagram and LinkedIn']), art: (
      <div className="bp-x bp-x-car" style={tall(.5)}>
        {[kit.c2, kit.c3, kit.c1].map((bg, i) => (
          <div key={i} className="bp-x-slide" style={{ background: bg, color: inkOn(bg), fontFamily: ff, transform: `translate(${i * 14}px, ${i * -10}px)` }}>
            {i === 2 && <><Logo dark={ink1 === '#FFFFFF'} /><b>{L(['5 claves de tu sector', '5 keys of your industry'])}</b><small>1 / 5</small></>}
          </div>
        ))}
      </div>
    ) },
    { key: 'post', label: L(['Post', 'Post']), note: L(['Una imagen con mensaje', 'One image with a message']), art: (
      <div className="bp-x bp-x-post" style={{ background: kit.c2, color: ink2, fontFamily: ff, ...tall(.48) }}>
        <span className="bp-x-blob" style={{ background: kit.c1 }} />
        <b>{L(['Lo que tu cliente necesita oír', 'What your client needs to hear'])}</b>
        <Logo dark={ink2 === '#FFFFFF'} />
      </div>
    ) },
    { key: 'story', label: L(['Historia o video', 'Story or video']), note: L(['Vertical, 9:16', 'Vertical, 9:16']), art: (
      <div className="bp-x bp-x-story" style={{ background: `linear-gradient(160deg, ${kit.c1}, ${kit.c2})`, color: ink1, fontFamily: ff, ...tall(.42) }}>
        <span className="bp-x-play">▶</span>
        <b>{L(['Detrás de cámaras', 'Behind the scenes'])}</b>
        <Logo dark={ink1 === '#FFFFFF'} />
      </div>
    ) },
    { key: 'research', label: L(['Investigación', 'Research']), note: L(['Mercado y competencia', 'Market and competitors']), art: (
      <div className="bp-x bp-x-doc" style={{ fontFamily: ff, ...tall(.45) }}>
        <span className="bp-x-doc-top" style={{ background: kit.c1 }}><Logo dark={ink1 === '#FFFFFF'} /></span>
        <b>{L(['Mapa de mercado', 'Market map'])}</b>
        <span className="bp-x-bars">{[70, 45, 85, 30].map((w, i) => <i key={i} style={{ width: `${w}%`, background: i % 2 ? kit.c3 : kit.c1 }} />)}</span>
      </div>
    ) },
  ];
  return pieces;
}
