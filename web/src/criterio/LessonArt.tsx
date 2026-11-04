import type { Area, Lesson } from './useCriterio';
import './learn.css';

/** Each area gets the color and the Brain of its craft (Creator for logos and brand books, Marketer for strategy and
 *  social, Builder for web and apps, Researcher for data); "how we work" is NickMark himself. */
export const AREA_ART: Record<Area, { color: string; deep: string; brain: string; icon: string }> = {
  process: { color: '#2F4DE0', deep: '#0B1220', brain: 'nico', icon: '✦' },
  logos: { color: '#06B6D4', deep: '#06303A', brain: 'creator', icon: '◎' },
  strategy: { color: '#8B5CF6', deep: '#22124A', brain: 'marketer', icon: '✧' },
  web: { color: '#2A7FFF', deep: '#0A2250', brain: 'builder', icon: '▭' },
  webtech: { color: '#2A7FFF', deep: '#0A2250', brain: 'builder', icon: '⚙' },
  dashboards: { color: '#F5B301', deep: '#3D2C00', brain: 'researcher', icon: '▥' },
  apps: { color: '#2A7FFF', deep: '#0A2250', brain: 'builder', icon: '▢' },
  brandkit: { color: '#06B6D4', deep: '#06303A', brain: 'creator', icon: '▤' },
  print: { color: '#06B6D4', deep: '#06303A', brain: 'creator', icon: '▦' },
  social: { color: '#8B5CF6', deep: '#22124A', brain: 'marketer', icon: '◍' },
};
export const brainImg = (brain: string) => (brain === 'nico' ? '/brand/proposal/nicolas-face.jpg' : `/brand/brains/${brain}.png`);

/** The lesson's own sections ("## " headings), cleaned of their "1." numbers: the steps of its explainer and its index. */
export const sectionsOf = (body: string) => (body.match(/^## .*/gm) ?? []).map((h) => h.slice(3).replace(/^\d+\.\s*/, '').trim());

/** Illustrated cover for a lesson card or header: area color, a big glyph, the Brain of the craft and the minutes. */
export function LessonCover({ l, big, label }: { l: Lesson; big?: boolean; label: string }) {
  const a = AREA_ART[l.area];
  return (
    <div className={`lc${big ? ' lc-big' : ''}`} style={{ background: `radial-gradient(120% 120% at 100% 0%, ${a.color} 0%, ${a.deep} 72%)` }} aria-hidden="true">
      <span className="lc-glyph">{a.icon}</span>
      <span className="lc-rings"><i style={{ borderColor: a.color }} /><i style={{ borderColor: a.color }} /></span>
      <span className="lc-label">{label}</span>
      {l.videoUrl && <span className="lc-play">▶</span>}
      <img className={`lc-brain${a.brain === 'nico' ? ' is-face' : ''}`} src={brainImg(a.brain)} alt="" />
    </div>
  );
}

/** A lesson told in a loop: each of its first five sections takes a 2 s beat, with the area's Brain watching over. */
export function LessonStage({ l, steps }: { l: Lesson; steps: string[] }) {
  const a = AREA_ART[l.area];
  return (
    <>
      <div className="ls-bg" style={{ background: `radial-gradient(120% 110% at 50% 0%, ${a.color}33, transparent 70%)` }} />
      {steps.slice(0, 5).map((s, i) => (
        <div key={s} className={`ex-layer ex-b${i + 1}`}>
          <div className="ex-card ls-card">
            <span className="ls-num" style={{ background: a.color }}>{i + 1}</span>
            <b>{s}</b>
            <span className="ex-lines"><i style={{ width: '90%' }} /><i style={{ width: '65%' }} /></span>
          </div>
        </div>
      ))}
      <img className={`ls-brain${a.brain === 'nico' ? ' is-face' : ''}`} src={brainImg(a.brain)} alt="" />
      <div className="ls-dots">{steps.slice(0, 5).map((s, i) => <i key={s} className={i ? `ex-f${i + 1}` : ''} style={{ background: a.color }} />)}</div>
    </>
  );
}

/** The Learn page explainer: choose a topic, watch, get the key idea, use it when asking or approving, fewer rounds. */
export function LearnStage({ label }: { label: { topic: string; tip: string; ok: string } }) {
  return (
    <>
      <div className="ex-layer ex-b1"><div className="ln-topics">{(['logos', 'strategy', 'web'] as Area[]).map((k, i) => <span key={k} className={`ln-topic${i === 1 ? ' is-on' : ''}`} style={{ background: AREA_ART[k].color }}>{AREA_ART[k].icon}</span>)}</div></div>
      <div className="ex-layer ex-b2"><div className="ln-video" style={{ background: `linear-gradient(135deg, ${AREA_ART.strategy.deep}, ${AREA_ART.strategy.color})` }}><span className="lc-play" style={{ position: 'static' }}>▶</span><span className="ln-progress"><i /></span></div></div>
      <div className="ex-layer ex-b3"><div className="ex-card ln-idea"><span className="ln-bulb">💡</span><b>{label.topic}</b><span className="ex-lines"><i style={{ width: '85%' }} /><i style={{ width: '60%' }} /></span></div></div>
      <div className="ex-layer ex-b4"><div className="ex-card ln-comment"><span className="ex-lines"><i style={{ width: '80%' }} /></span><span className="ln-tip">✓ {label.tip}</span></div></div>
      <div className="ex-layer ex-b5"><div className="col g8" style={{ alignItems: 'center' }}><div className="ln-piece" style={{ background: AREA_ART.logos.color }}><span className="ln-check">✓</span></div><span className="ex-pill ex-ok">{label.ok}</span></div></div>
      <img className="ls-brain is-face" src={brainImg('nico')} alt="" />
    </>
  );
}
