import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { AREAS, embedUrl, useLessons, type Area } from '../criterio/useCriterio';
import { LessonTile } from '../criterio/LessonCards';
import { Prose } from '../criterio/Prose';

/** Learn: "El Criterio de NicoMarca" / "NickMark Taste", every lesson by area. */
export function Learn() {
  const { t } = useI18n();
  const { list, loading } = useLessons();
  const [area, setArea] = useState<Area | ''>('');
  const present = AREAS.filter((a) => list.some((l) => l.area === a));
  const shown = list.filter((l) => !area || l.area === area);
  return (
    <div className="col g24">
      <div className="col g8">
        <p className="label">{t('cr.name')}</p>
        <h1 className="h1"><span className="w9">{t('cr.nav')}.</span> {t('cr.sub')}</h1>
      </div>
      {present.length > 1 && (
        <div className="row g8 wrap" role="group" aria-label={t('cra.f.area')}>
          <button className={`btn btn-sm ${area === '' ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={area === ''} onClick={() => setArea('')}>{t('cr.all')}</button>
          {present.map((a) => <button key={a} className={`btn btn-sm ${area === a ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={area === a} onClick={() => setArea(a)}>{t(`cr.area.${a}`)}</button>)}
        </div>
      )}
      {loading ? <div className="skel" style={{ height: 200 }} />
        : shown.length === 0 ? <div className="card t-mute">{t('cr.empty')}</div>
        : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((l) => <LessonTile key={l.id} l={l} />)}</div>}
    </div>
  );
}

/** One lesson: video (or "coming soon"), the written lesson, the presentation, and NickMark's signature. */
export function LearnLesson() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { list, loading } = useLessons();
  const l = list.find((x) => x.id === id);
  if (loading) return <div className="skel" style={{ height: 320 }} />;
  if (!l) return <div className="card col g12"><p className="t-mute">{t('cr.empty')}</p><Link to="/learn" className="t-sm w7">{t('cr.back')}</Link></div>;
  const embed = embedUrl(l.videoUrl);
  const related = list.filter((x) => x.area === l.area && x.id !== l.id).slice(0, 3);
  return (
    <div className="col g24">
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/learn">{t('cr.nav')}</Link><Icon name="chevronRight" size={14} /><span className="cur">{t(`cr.area.${l.area}`)}</span></nav>
      <div className="col g8" style={{ maxWidth: 820 }}>
        <div className="row g8">{l.status === 'draft' && <span className="chip c-draft">{t('cr.draft')}</span>}<span className="chip chip-plain">{t('cr.minutes', { n: l.minutes })}</span></div>
        <h1 className="h1"><span className="w9">{l.title[lang]}</span></h1>
        <p className="t-lg t-mute">{l.summary[lang]}</p>
      </div>
      {embed ? (
        <div className="overflow-hidden rounded-[20px]" style={{ aspectRatio: '16 / 9', maxWidth: 960, background: '#05070D' }}>
          <iframe src={embed} title={l.title[lang]} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ border: 0 }} />
        </div>
      ) : l.videoUrl ? <a className="btn btn-primary self-start" href={l.videoUrl} target="_blank" rel="noreferrer">▶ {t('cr.watch')}</a>
        : <p className="t-sm t-mute">{t('cr.videoSoon')}</p>}
      <div className="row g12 wrap" style={{ alignItems: 'center' }}>
        <img src="/brand/proposal/nicolas.jpg" alt="" className="h-9 w-9 rounded-full object-cover" />
        <span className="t-sm w7">{t('sig.card')}</span>
        {l.deckUrl && <a className="btn btn-secondary btn-sm" href={l.deckUrl} target="_blank" rel="noreferrer">{t('cr.deck')}</a>}
      </div>
      <article className="card" style={{ padding: 'clamp(20px, 4vw, 40px)' }}><Prose text={l.body[lang]} /></article>
      {related.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((x) => <LessonTile key={x.id} l={x} />)}</div>}
    </div>
  );
}
