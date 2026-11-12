import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { BrainCanvas, brainColor, type BrainCanvasHandle } from '../brain/BrainCanvas';
import { BrainFeed, ago, eventText } from '../brain/BrainFeed';
import { BrainUse } from '../brain/BrainUse';
import { AREAS, countKnowledge, gaps } from '../brain/knowledge';
import { useBrainEvents, type BrainEvent } from '../brain/useBrainEvents';
import { BrainLoopSteps } from '../brain/BrainLoop';
import { BrainBetter } from '../brain/BrainLearned';
import '../brain/brain.css';

/**
 * My brand › Brain: what NickMark and his Brains know about the brand, live. Every request, approval, change asked,
 * Mi marca update, file, session and meeting arrives as an event (brands/{id}/brainEvents) and is animated into the brain.
 */
export function BrandBrain() {
  const { current } = useBrands();
  const { t } = useI18n();
  const brandId = current?.kind === 'brand' ? current.id : undefined;
  const identity = useBrandDoc(brandId, 'context/identity').data;
  const voice = useBrandDoc(brandId, 'context/voice').data;
  const brain = useBrandDoc(brandId, 'context/brain').data;
  const primal = useBrandDoc(brandId, 'context/primal').data;
  const learnings = useBrandDoc(brandId, 'context/learnings').data;
  const canvas = useRef<BrainCanvasHandle>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [replaying, setReplaying] = useState(false);
  const toastTimer = useRef(0);

  const onNew = useCallback((e: BrainEvent) => {
    canvas.current?.learn(e.kind, e.area);
    setFresh((s) => new Set(s).add(e.id));
    setToast(t('bb.toast', { text: eventText(e, t) }));
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, [t]);
  const { events, talks } = useBrainEvents(brandId, onNew);

  const counts = useMemo(() => countKnowledge({ identity, voice, brain, primal, learnings, talks }), [identity, voice, brain, primal, learnings, talks]);
  const total = AREAS.reduce((s, a) => s + counts[a], 0);
  const color = brainColor(((identity?.colors as Array<{ hex?: string }> | undefined) ?? [])[0]?.hex);
  // Quietly draw what it already knows; only new events fly in.
  useEffect(() => { if (!replaying) canvas.current?.sync(counts); }, [counts, replaying]);

  const replay = async () => {
    const c = canvas.current; if (!c || replaying) return;
    setReplaying(true);
    c.reset();
    const story = events.slice(0, 40).reverse();
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const share = Math.max(0, Math.floor((total - story.length) / Math.max(1, story.length)));
    for (const e of story) {
      c.learn(e.kind, e.area, { fast: true });
      // The many small things learned around that moment, spread over the areas it knows.
      for (let i = 0; i < share; i++) { const a = AREAS[Math.floor(Math.random() * AREAS.length)]!; if (counts[a]) c.fill(a, 1); }
      await wait(320);
    }
    await wait(700);
    c.sync(counts);
    setReplaying(false);
  };

  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (!brandId) return <div className="card t-mute">{t('bb.groupNone')}</div>;
  const last = events[0]?.at ?? null;
  return (
    <div className="col g32">
      <div className="row between g24 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="col g8" style={{ maxWidth: '45rem' }}>
          <p className="label">{current.name}</p>
          <h1 className="h1"><span className="w9">{t('bb.title')}</span> {total === 1 ? t('bb.knowsOne') : t('bb.knows', { n: total })}</h1>
          <p className="t-mute"><strong className="w7" style={{ color: 'var(--ink)' }}>{t('bl.line')}</strong> {t('bb.lede')}</p>
        </div>
        <div className="bb-stat"><span className="t-xs t-mute">{t('bb.last')}</span><b className="mono">{ago(last, t)}</b></div>
      </div>
      {/* The loop, lit on its last step each time something new is learned while the page is open. */}
      <BrainLoopSteps key={fresh.size} on={fresh.size ? 'learn' : undefined} />

      <div className="bb-grid">
        <section className="bb-brain col" aria-labelledby="h-bb-brain">
          <div className="row between g12" style={{ padding: '1.25rem 1.5rem 0', alignItems: 'flex-start' }}>
            <div className="col g4"><h2 className="h3" id="h-bb-brain">{t('bb.growing')}</h2><p className="t-sm bb-muted">{t('bb.growingSub')}</p></div>
            <button type="button" className="bb-replay" onClick={replay} disabled={replaying || !events.length}>{replaying ? t('bb.replaying') : t('bb.replay')}</button>
          </div>
          <BrainCanvas ref={canvas} counts={counts} color={color} showNumbers={!replaying} />
          <div className={`bb-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">{toast}</div>
        </section>
        <BrainFeed events={events} fresh={fresh} />
      </div>

      <BrainBetter learnings={learnings} />

      <BrainUse identity={identity} voice={voice} brain={brain} learnings={learnings} talks={talks}
        requests={events.filter((e) => e.kind === 'request').length} gaps={gaps({ identity, voice, brain, learnings, talks })} />
    </div>
  );
}
