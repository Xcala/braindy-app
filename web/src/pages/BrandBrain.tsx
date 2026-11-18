import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { BrainCanvas, brainColor } from '../brain/BrainCanvas';
import { ago, eventText } from '../brain/BrainFeed';
import { BrainSide } from '../brain/BrainSide';
import { BrainKnown } from '../brain/BrainKnown';
import { BrainGaps, TeachDialog, AREA_TOPICS, type Topic } from '../brain/BrainTeach';
import { gaps, type Area } from '../brain/knowledge';
import { buildItems, degree, matches } from '../brain/items';
import { useBrainEvents, type BrainEvent } from '../brain/useBrainEvents';
import '../brain/brain.css';
import { PageHeader } from '../components/PageHeader';

/**
 * My brand › Brain: what NickMark and his Brains know about the brand, in words and as a map. Every dot is one thing
 * it knows (tap it: where it came from, whether it goes into each piece, «Esto ya no aplica»), every line a real link;
 * areas zoom, gaps ask to be taught, the search and «what goes into each piece» light the map, the slider rewinds it.
 */
export function BrandBrain() {
  const { current } = useBrands();
  const { profile } = useAuth();
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const brandId = current?.kind === 'brand' ? current.id : undefined;
  const identity = useBrandDoc(brandId, 'context/identity').data;
  const voice = useBrandDoc(brandId, 'context/voice').data;
  const brain = useBrandDoc(brandId, 'context/brain').data;
  const primal = useBrandDoc(brandId, 'context/primal').data;
  const learnings = useBrandDoc(brandId, 'context/learnings').data;
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<Area | null>(null);
  const [q, setQ] = useState('');
  const [inUse, setInUse] = useState(params.get('uso') === '1');
  const [month, setMonth] = useState<number | null>(null);
  const [teach, setTeach] = useState<Topic[] | null>(null);
  const toastTimer = useRef(0);
  const mapRef = useRef<HTMLDivElement>(null);

  const onNew = useCallback((e: BrainEvent) => {
    setFresh((s) => new Set(s).add(e.id));
    setToast(t('bb.toast', { text: eventText(e, t) }));
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, [t]);
  const { events, talks } = useBrainEvents(brandId, onNew);

  const items = useMemo(() => buildItems({ identity, voice, brain, primal, learnings, events }), [identity, voice, brain, primal, learnings, events]);
  const deg = useMemo(() => degree(items), [items]);
  const lit = useMemo(() => (q.trim() ? new Set(items.filter((x) => matches(x, q)).map((x) => x.id)) : inUse ? new Set(items.filter((x) => x.used).map((x) => x.id)) : null), [items, q, inUse]);
  // The slider: one stop per month since the first dated thing it learned; the last stop is today.
  const months = useMemo(() => {
    const first = items.reduce<Date | null>((m, x) => (x.at && (!m || x.at < m) ? x.at : m), null);
    if (!first) return [] as Date[];
    const out: Date[] = []; const d = new Date(first.getFullYear(), first.getMonth() + 1, 1);
    while (d < new Date()) { out.push(new Date(d)); d.setMonth(d.getMonth() + 1); }
    return out;
  }, [items]);
  const cutoff = month !== null && month < months.length ? months[month]! : null;
  const color = brainColor(((identity?.colors as Array<{ hex?: string }> | undefined) ?? [])[0]?.hex);
  const pick = (id: string | null, scroll = false) => {
    setSelected(id);
    // From the cards: zoom to where it lives on the map.
    if (scroll) { setFocus(items.find((x) => x.id === id)?.area ?? null); mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
  const area = (a: Area | null, scroll = false) => { setFocus(a); setSelected(null); if (scroll) mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (!brandId) return <div className="card t-mute">{t('bb.groupNone')}</div>;
  const used = items.filter((x) => x.used).length;
  const fmt = (d: Date) => d.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', year: 'numeric' });
  return (
    <div className="col g32">
      <PageHeader title={t('bb.titleOf', { name: current.name })} sub={t('bb.lede')}
        actions={<div className="bb-stat"><span className="t-xs t-mute">{t('bb.last')}</span><b className="mono">{ago(events[0]?.at ?? null, t)}</b></div>} />

      <BrainKnown items={items} onPick={(id) => pick(id, true)} onArea={(a) => area(a, true)} />

      <section className="col g12" ref={mapRef} aria-labelledby="h-bb-brain" style={{ scrollMarginTop: '5rem' }}>
        <div className="col g4"><h2 className="h2" id="h-bb-brain">{t('bb.mapTitle')}</h2><p className="t-sm t-mute">{t('bb.mapSub')}</p></div>
        <div className="bb-grid">
          <div className="bb-brain col">
            <div className="bb-tools">
              <input className="bb-search" type="search" value={q} onChange={(e) => { setQ(e.target.value); setFocus(null); }} placeholder={t('bb.search')} aria-label={t('bb.search')} />
              <button type="button" className={`bb-tog${inUse ? ' is-on' : ''}`} aria-pressed={inUse} onClick={() => { setInUse(!inUse); setFocus(null); }}>{t('bb.inEach', { n: used })}</button>
            </div>
            {lit && <p className="bb-litline t-xs">{q.trim() ? t('bb.found', { n: lit.size }) : t('bb.inEachD', { n: used })}</p>}
            <BrainCanvas items={items} degree={deg} color={color} selected={selected} focus={focus} lit={lit} cutoff={cutoff}
              onPick={(id) => pick(id)} onArea={(a) => area(a)} onTeach={(a) => setTeach(AREA_TOPICS[a])} />
            {months.length > 0 && (
              <label className="bb-time">
                <span className="t-xs">{cutoff ? fmt(new Date(+cutoff - 1)) : t('bb.today')}</span>
                <input type="range" min={0} max={months.length} value={month ?? months.length} onChange={(e) => setMonth(Number(e.target.value))} aria-label={t('bb.timeline')} />
                <span className="t-xs bb-muted">{t('bb.timeline')}</span>
              </label>
            )}
            <div className={`bb-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">{toast}</div>
          </div>
          <BrainSide brandId={brandId} items={items} selected={selected} focus={focus} onClear={() => setQ('')}
            found={q.trim() ? items.filter((x) => !x.retired && matches(x, q)) : null} events={events} fresh={fresh}
            onPick={pick} onArea={area} canEditRules={profile?.role === 'admin'} />
        </div>
      </section>

      <BrainGaps gaps={gaps({ identity, voice, brain, learnings, talks })} onTeach={setTeach} />
      <p className="t-xs t-mute">{t('bb.ctxNever')}</p>
      {teach && <TeachDialog brandId={brandId} topics={teach} onClose={() => setTeach(null)} />}
    </div>
  );
}
