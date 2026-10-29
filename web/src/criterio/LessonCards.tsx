import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { lessonOfWeek, logObjection, matchObjection, pick, useLessons, useObjections, type Lesson, type Objection } from './useCriterio';

/** A lesson as a compact card: area, title, summary, minutes. */
export function LessonTile({ l, kicker }: { l: Lesson; kicker?: string }) {
  const { t, lang } = useI18n();
  return (
    <Link to={`/learn/${l.id}`} className="card col g8" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
      <div className="row between g8">
        <span className="label">{kicker ?? t(`cr.area.${l.area}`)}</span>
        <span className="row g8">
          {l.status === 'draft' && <span className="chip c-draft">{t('cr.draft')}</span>}
          <span className="chip chip-plain">{l.videoUrl ? '▶ ' : ''}{t('cr.minutes', { n: l.minutes })}</span>
        </span>
      </div>
      <span className="h3">{l.title[lang]}</span>
      <span className="t-sm t-mute">{l.summary[lang]}</span>
    </Link>
  );
}

/** Home: one lesson per week. */
export function LessonOfTheWeek() {
  const { t } = useI18n();
  const l = lessonOfWeek(useLessons().list);
  if (!l) return null;
  return <div data-tour="home-lesson"><LessonTile l={l} kicker={`${t('cr.name')} · ${t('cr.weekly')}`} /></div>;
}

/** Ask: how to ask well for this type of piece (or the general "how to ask" lesson). */
export function LessonForCategory({ category }: { category?: string }) {
  const { t } = useI18n();
  const { list } = useLessons();
  const l = (category && pick(list, { category, stage: 'ask' })[0]) || pick(list, { stage: 'ask' }).find((x) => x.categories.length === 0);
  return l ? <LessonTile l={l} kicker={`${t('cr.name')} · ${t('cr.forAsk')}`} /> : null;
}

/** Review screen: how this kind of piece is made, next to "why it works". */
export function LessonForRequest({ category }: { category?: string }) {
  const { t } = useI18n();
  const { list } = useLessons();
  const l = category ? pick(list, { category, stage: 'review' })[0] : undefined;
  return l ? <LessonTile l={l} kicker={`${t('cr.name')} · ${t('cr.forThis')}`} /> : null;
}

/** The typical objection a comment sounds like (published ones), or null. */
export function useObjectionMatch(text: string) {
  return matchObjection(text, useObjections().list);
}

/** Under the comment box: if the comment sounds like a typical objection, NickMark's short answer. Never blocks. */
export function ObjectionHint({ brandId, o }: { brandId: string; o: Objection | null }) {
  const { t, lang } = useI18n();
  const logged = useRef<string | null>(null);
  useEffect(() => {
    if (o && logged.current !== o.id) { logged.current = o.id; logObjection(brandId, o.id, 'shown'); }
  }, [o, brandId]);
  if (!o) return null;
  return (
    <div className="col g8" role="note" style={{ background: '#FFF8E6', borderRadius: 14, padding: 14 }}>
      <span className="row g8"><img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-6 w-6 rounded-full object-cover" /><span className="t-xs w7">{t('cr.hintTitle')}</span></span>
      <span className="t-sm w7">«{o.phrase[lang]}»</span>
      <span className="t-sm">{o.answer[lang]}</span>
      {o.lessonId && <Link to={`/learn/${o.lessonId}`} className="t-sm w7" onClick={() => logObjection(brandId, o.id, 'opened')}>{t('cr.hintSee')}</Link>}
      <span className="t-xs t-mute">{t('cr.hintSend')}</span>
    </div>
  );
}

/** Onboarding: the few lessons that put us on the same page before the first piece. */
export function OnboardingLessons() {
  const { t } = useI18n();
  const list = pick(useLessons().list, { stage: 'onboarding' }).slice(0, 5);
  if (!list.length) return null;
  return (
    <section className="col g12" aria-labelledby="h-ob-lessons">
      <div className="col g4"><p className="label">{t('cr.name')}</p><h2 className="h3" id="h-ob-lessons">{t('cr.onboardingTitle')}</h2><span className="t-sm t-mute">{t('cr.onboardingSub')}</span></div>
      <div className="grid gap-4 md:grid-cols-2">{list.map((l) => <LessonTile key={l.id} l={l} />)}</div>
    </section>
  );
}
