import type { BrainId } from './taxonomy';
import { WORDS, type Variant, type Word } from './teamLog';
import { at, type Say } from './sceneKit';
import { CreatorScene } from './CreatorScenes';
import './teamScenes.css';

/** Researcher: a search, the results coming in, the lens going over them and tagging, then the findings written down. */
function Research({ query, say }: { query: string; say: Say }) {
  const tags: Array<[number, Word]> = [[0, 'ref'], [2, 'rival'], [4, 'good']];
  return (
    <>
      <div className="sc-browser">
        <div className="sc-bar"><i /><i /><i /><span className="sc-search"><span className="sc-typed" style={{ ['--n' as string]: Math.min(query.length, 34) }}>{query.slice(0, 34)}</span></span></div>
        <div className="sc-grid">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <span key={k} className="sc-thumb" style={at(1.2 + k * 0.18, { ['--h' as string]: `${(k * 57 + 20) % 360}` })}>
              <i /><b /><b />
              {tags.map(([n, w]) => n === k && <em key={w} className={`sc-tag is-${w}`} style={at(2.8 + k * 0.45)}>{say(w)}</em>)}
            </span>
          ))}
        </div>
      </div>
      <b className="sc-lens" />
      <div className="sc-notes" style={at(5.6)}>
        <b>{say('findings')}</b>
        {[0, 1, 2].map((k) => <span key={k} style={at(6.2 + k * 0.6)}><i>✓</i><s style={{ width: `${82 - k * 14}%` }} /></span>)}
      </div>
    </>
  );
}

/** Marketer: competitors placed on a positioning map, the brand moving into the free space, then the goal as a funnel. */
function Market({ say }: { say: Say }) {
  const rivals = [[22, 26], [30, 38], [64, 30], [24, 70], [36, 62]];
  return (
    <>
      <div className="sc-map">
        <i className="sc-ax x" /><i className="sc-ax y" />
        <small className="t">{say('premium')}</small><small className="b">{say('budget')}</small><small className="l">{say('classic')}</small><small className="r">{say('bold')}</small>
        {rivals.map(([x, y], k) => <span key={k} className="sc-dot" style={at(0.8 + k * 0.3, { left: `${x}%`, top: `${y}%` })} />)}
        <span className="sc-you" style={at(2.8)}><em>{say('you')}</em></span>
        <span className="sc-zone" style={at(3.6)} />
      </div>
      <div className="sc-goal" style={at(4.8)}>
        <b>{say('goal')}</b>
        {(['aware', 'consider', 'act'] as Word[]).map((w, k) => (
          <span key={w} className="sc-funnel" style={at(5.4 + k * 0.5, { width: `${100 - k * 24}%` })}>{say(w)}</span>
        ))}
      </div>
    </>
  );
}

const CODE = (brand: string) => [
  ['<section class="hero">', 0], [`<h1>${brand.slice(0, 22)}</h1>`, 1], ['<p>{copy.promise}</p>', 1], ['<a class="cta" href="#contact">', 1],
  ['</section>', 0], ['<Cards items={services} />', 0], ['<Footer brand={brand} />', 0],
] as const;

/** Builder, for a site: the code typed in, the build passing, the deploy bar, then the site live. */
function BuildWeb({ brand, say }: { brand: string; say: Say }) {
  return (
    <>
      <div className="sc-editor">
        {CODE(brand).map(([line, indent], k) => (
          <span key={k} className="sc-line" style={at(0.3 + k * 0.45, { paddingLeft: `${1 + indent * 2}ch` })}>
            <i>{k + 1}</i><code style={{ ['--n' as string]: line.length }}>{line}</code>
          </span>
        ))}
      </div>
      <div className="sc-term" style={at(3.9)}>
        <span style={at(4.1)}>$ npm run build</span>
        <span className="ok" style={at(4.8)}>✓ built · 0 errors</span>
        <span className="sc-deploy" style={at(5.3)}><i /></span>
      </div>
      <div className="sc-site" style={at(7)}>
        <div className="sc-bar"><i /><i /><i /><span className="sc-search">{brand.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16) || 'brand'}.com</span></div>
        <b className="sc-live">● {say('live')}</b>
      </div>
    </>
  );
}

const FILES: Record<Exclude<Variant, 'web'>, string[]> = {
  logo: ['logo.svg', 'logo-color.png', 'logo-white.png', 'brand-kit.pdf'],
  video: ['video-9x16.mp4', 'video-1x1.mp4', 'video-16x9.mp4', 'subtitles.srt'],
  doc: ['print.pdf', 'digital.pdf', 'editable.fig', 'images.zip'],
};

/** Builder, for a logo, a video or a document: every file exported and checked, then the kit ready. */
function BuildFiles({ variant, say }: { variant: Exclude<Variant, 'web'>; say: Say }) {
  return (
    <>
      <div className="sc-files">
        {FILES[variant].map((f, k) => (
          <span key={f} className="sc-file" style={at(0.4 + k * 1.1)}>
            <i>{f.split('.').pop()}</i><b>{f}</b><s style={at(0.6 + k * 1.1)} /><em style={at(1.4 + k * 1.1)}>✓</em>
          </span>
        ))}
      </div>
      <b className="sc-live" style={at(6.2)}>✓ {say('ready')}</b>
    </>
  );
}

/** The scene for the Brain at work. Remounted on every turn so it plays from the start. */
export function Scene({ brain, variant, title, brand, say }: { brain: BrainId; variant: Variant; title: string; brand: string; say: Say }) {
  return (
    <div className={`sc is-${brain} v-${variant}`} aria-hidden="true">
      {brain === 'researcher' && <Research query={title} say={say} />}
      {brain === 'marketer' && <Market say={say} />}
      {brain === 'creator' && <CreatorScene variant={variant} brand={brand} say={say} />}
      {brain === 'builder' && (variant === 'web' ? <BuildWeb brand={brand} say={say} /> : <BuildFiles variant={variant} say={say} />)}
    </div>
  );
}

export const sayIn = (lang: 'en' | 'es'): Say => (w) => WORDS[w][lang];
