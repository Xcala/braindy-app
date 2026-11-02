import type { Variant } from './teamLog';
import type { ReactNode } from 'react';
import { at, type Say } from './sceneKit';

/** The cursor that does the drawing: it travels the artboard while the pieces appear under it. */
const Cursor = () => <svg className="sc-cursor" viewBox="0 0 16 20"><path d="M1 1l13 10-6 1 3 6-2 1-3-6-5 4z" /></svg>;
const Palette = () => <span className="sc-palette" style={at(3.2)}>{[0, 1, 2, 3].map((k) => <i key={k} style={at(3.3 + k * 0.15)} />)}</span>;
const Stage = ({ say }: { say: Say }) => (
  <span className="sc-stage"><em className="w">{say('wire')}</em><em className="m" style={at(5.8)}>{say('mockup')}</em></span>
);

/** A site: the wireframe boxes drawn one by one, the palette picked, then each box filled in until it is the mockup. */
function Web({ brand, say }: { brand: string; say: Say }) {
  const box = (cls: string, d: number, f: number, children?: ReactNode) => (
    <span className={`sc-w ${cls}`} style={at(d, { ['--f' as string]: `${f}s` })}>{children}</span>
  );
  return (
    <>
      <div className="sc-board">
        {box('nav', 0.2, 4.2, <><b className="logo">{brand.slice(0, 14)}</b><s /><s /><s /></>)}
        {box('hero-t', 0.7, 4.5, <><b /><b /><s /><u /></>)}
        {box('hero-i', 1.2, 4.9)}
        {box('card c1', 1.7, 5.3)}{box('card c2', 2, 5.5)}{box('card c3', 2.3, 5.7)}
        {box('foot', 2.7, 6)}
      </div>
      <Palette /><Stage say={say} /><Cursor />
    </>
  );
}

/** A logo: the construction circles and grid, the mark traced in vector, then color and the wordmark. */
function Logo({ brand }: { brand: string }) {
  return (
    <>
      <svg className="sc-logo" viewBox="0 0 200 140">
        <g className="grid">{[40, 70, 100, 130, 160].map((x, k) => <line key={x} x1={x} y1="10" x2={x} y2="130" style={at(k * 0.12)} />)}
          {[30, 70, 110].map((y, k) => <line key={y} x1="20" y1={y} x2="180" y2={y} style={at(0.5 + k * 0.12)} />)}</g>
        <circle className="guide" cx="86" cy="70" r="40" style={at(0.9)} />
        <circle className="guide" cx="114" cy="70" r="40" style={at(1.4)} />
        <path className="mark" pathLength={1} style={at(2.2)} d="M100 37 C 82 50 82 90 100 103 C 118 90 118 50 100 37 Z" />
        <path className="mark two" pathLength={1} style={at(2.9)} d="M60 70 C 70 46 92 38 100 37 M140 70 C 130 94 108 102 100 103" />
      </svg>
      <span className="sc-word" style={at(5.4)}>{brand.slice(0, 18)}</span>
      <Palette /><Cursor />
    </>
  );
}

/** A video: the storyboard frames sketched, the clips laid on the timeline, then the playhead running. */
function Video() {
  return (
    <>
      <div className="sc-story">{[0, 1, 2, 3].map((k) => <span key={k} className="sc-frame" style={at(0.2 + k * 0.5)}><i style={at(0.6 + k * 0.5)} /><b style={at(0.8 + k * 0.5)} /></span>)}</div>
      <div className="sc-timeline">
        {[0, 1, 2].map((tr) => (
          <span key={tr} className={`sc-track t${tr}`}>
            {[0, 1, 2].map((k) => <i key={k} style={at(3 + tr * 0.4 + k * 0.3, { left: `${k * 33 + tr * 4}%`, width: `${26 - tr * 4}%` })} />)}
          </span>
        ))}
        <b className="sc-head" style={at(5.2)} />
      </div>
      <Cursor />
    </>
  );
}

/** A document: the page grid, the images and text placed, then the spread finished. */
function Doc() {
  return (
    <>
      <div className="sc-spread">
        {[0, 1].map((p) => (
          <span key={p} className="sc-page">
            {[0, 1, 2].map((c) => <i key={c} className="col" style={at(0.2 + p * 0.3 + c * 0.1)} />)}
            <span className={`sc-img p${p}`} style={at(2 + p * 0.6)} />
            {[0, 1, 2, 3].map((k) => <s key={k} style={at(3.2 + p * 0.5 + k * 0.25, { width: `${90 - k * 12}%` })} />)}
            <b style={at(2.6 + p * 0.6)} />
          </span>
        ))}
      </div>
      <Palette /><Cursor />
    </>
  );
}

export function CreatorScene({ variant, brand, say }: { variant: Variant; brand: string; say: Say }) {
  if (variant === 'web') return <Web brand={brand} say={say} />;
  if (variant === 'logo') return <Logo brand={brand} />;
  if (variant === 'video') return <Video />;
  return <Doc />;
}
