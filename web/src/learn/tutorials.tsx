// "How to use Braindy": the app's own tutorial videos, apart from NickMark Taste. One overview, one short video per
// section and one per new feature, so an improvement re-records a small piece instead of the whole tour.
import { Link, useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LessonTile } from '../criterio/LessonCards';
import { useLessons, type Lesson } from '../criterio/useCriterio';

export type Kind = 'general' | 'section' | 'feature';
const KINDS: Kind[] = ['general', 'section', 'feature'];

/** The video of a lesson in this language (falls back to Spanish, then to the single videoUrl). */
export function videoOf(l: Lesson, lang: 'es' | 'en') {
  const v = l.videos?.[lang] ?? l.videos?.es;
  return v ?? (l.videoUrl ? { wide: l.videoUrl, tall: l.videoVertical } : null);
}

export const isTutorial = (l: Lesson) => !!l.kind;

/** Learn, on top: the overview, then the sections, then what's new. */
export function TutorialShelf({ list }: { list: Lesson[] }) {
  const { t } = useI18n();
  const tuts = list.filter(isTutorial);
  if (!tuts.length) return null;
  return (
    <section className="col g16" aria-labelledby="how-braindy">
      <div className="col g4">
        <h2 id="how-braindy" className="h2"><span className="w9">{t('tut.title')}</span></h2>
        <p className="t-sm t-mute">{t('tut.sub')}</p>
      </div>
      {KINDS.map((k) => {
        const items = tuts.filter((l) => l.kind === k);
        if (!items.length) return null;
        return (
          <div key={k} className="col g8">
            <p className="label">{t(`tut.kind.${k}`)}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((l) => <LessonTile key={l.id} l={l} kicker={t(`tut.kind.${k}`)} />)}</div>
          </div>
        );
      })}
    </section>
  );
}

/** On each client page: "▶ How it works", when that section has its video. Pages with a PageHeader show it there instead. */
export function HowItWorks() {
  const { pathname } = useLocation();
  if (HEADER_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  // A request on a phone keeps it under its «⋯» menu, so the piece comes up sooner.
  if (/^\/requests\/[^/]+/.test(pathname)) return <div className="hidden sm:block"><HowLink row /></div>;
  return <HowLink row />;
}
/** Pages that carry their own header (PageHeader), with this link inside it. */
export const HEADER_PAGES = ['/brand', '/deliveries', '/assets', '/apps', '/research'];

/** The «▶ How it works · 1 min» link for the current page, or nothing when it has no video. */
export function HowLink({ row = false }: { row?: boolean }) {
  const { pathname } = useLocation();
  const { t, lang } = useI18n();
  const { list } = useLessons();
  // The most specific page wins ("/brand/brain" over "/brand"); "/requests/*" means only the pages under it.
  const score = (p: string) => (p.endsWith('/*') ? (pathname.startsWith(p.slice(0, -1)) ? p.length : 0)
    : pathname === p || pathname.startsWith(`${p}/`) ? p.length : 0);
  const best = (x: Lesson) => Math.max(0, ...(x.paths ?? []).map(score));
  const l = list.filter((x) => x.kind === 'section' && x.status === 'published' && best(x) > 0).sort((a, b) => best(b) - best(a))[0];
  if (!l || pathname.startsWith('/learn')) return null;
  const link = <Link to={`/learn/${l.id}`} className="chip chip-plain t-sm" title={l.title[lang]}>▶ {t('tut.how')} · {t('cr.minutes', { n: l.minutes })}</Link>;
  return row ? <div className="row" style={{ justifyContent: 'flex-end', marginBottom: '0.5rem' }}>{link}</div> : link;
}
