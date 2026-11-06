import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { AREAS, embedUrl, isVideoFile, useLessons, type Area } from '../criterio/useCriterio';
import { LessonTile } from '../criterio/LessonCards';
import { Prose } from '../criterio/Prose';
import { AREA_ART, LearnStage, LessonCover, LessonStage, sectionsOf } from '../criterio/LessonArt';
import { Explainer } from '../plan/Explainer';
import { TutorialShelf, isTutorial, videoOf } from '../learn/tutorials';

/** Learn: first "How to use Braindy" (the app videos), then "El Criterio de NicoMarca" / "NickMark Taste", every lesson by area. */
export function Learn() {
  const { t } = useI18n();
  const { list: all, loading } = useLessons();
  const list = all.filter((l) => !isTutorial(l));
  const [area, setArea] = useState<Area | ''>('');
  const present = AREAS.filter((a) => list.some((l) => l.area === a));
  const shown = list.filter((l) => !area || l.area === area);
  return (
    <div className="col g24">
      <h1 className="h1"><span className="w9">{t('cr.nav')}.</span></h1>
      <TutorialShelf list={all} />
      <div className="col g8">
        <h2 className="h2"><span className="w9">{t('cr.taste')}</span></h2>
        <p className="t-sm t-mute">{t('cr.sub')}</p>
      </div>
      <Explainer label={t('cr.howLabel')} title={t('cr.howTitle')} strong={t('cr.howStrong')} lead={t('cr.howLead')}
        stage={<LearnStage label={{ topic: t('cr.anTopic'), tip: t('cr.anTip'), ok: t('cr.anOk') }} />}
        steps={([1, 2, 3, 4, 5] as const).map((n) => [t(`cr.s${n}`), t(`cr.s${n}b`)] as [string, string])} />
      {present.length > 1 && (
        <nav className="seg seg-scroll" aria-label={t('cra.f.area')}>
          <button className={area === '' ? 'is-on' : ''} aria-pressed={area === ''} onClick={() => setArea('')}>{t('cr.all')} · {list.length}</button>
          {present.map((a) => <button key={a} className={area === a ? 'is-on' : ''} aria-pressed={area === a} onClick={() => setArea(a)}>
            <span style={{ color: AREA_ART[a].color }}>{AREA_ART[a].icon}</span> {t(`cr.area.${a}`)}</button>)}
        </nav>
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
  const video = videoOf(l, lang);
  const related = list.filter((x) => (l.kind ? x.kind === l.kind : x.area === l.area && !x.kind) && x.id !== l.id).slice(0, 3);
  const sections = sectionsOf(l.body[lang]);
  const accent = AREA_ART[l.area].color;
  return (
    <div className="col g24">
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/learn">{t('cr.nav')}</Link><Icon name="chevronRight" size={14} /><span className="cur">{l.kind ? t('tut.title') : t(`cr.area.${l.area}`)}</span></nav>
      <LessonCover l={l} big label={`${l.kind ? t(`tut.kind.${l.kind}`) : t(`cr.area.${l.area}`)} · ${t('cr.minutes', { n: l.minutes })}`} />
      <div className="col g8" style={{ maxWidth: 820 }}>
        {l.status === 'draft' && <span className="chip c-draft self-start">{t('cr.draft')}</span>}
        <h1 className="h1"><span className="w9">{l.title[lang]}</span></h1>
        <p className="t-lg t-mute">{l.summary[lang]}</p>
      </div>
      {sections.length >= 2 && (
        <Explainer label={t('cr.inThis')} title="" strong={t('cr.keyIdeas', { n: Math.min(5, sections.length) })}
          stage={<LessonStage l={l} steps={sections} />}
          steps={sections.slice(0, 5).map((s, i) => [s, t('cr.part', { n: i + 1 })] as [string, string])} />
      )}
      {video && isVideoFile(video.wide) ? (
        <video key={video.wide} controls playsInline preload="metadata" title={l.title[lang]} className="w-full rounded-[20px]" style={{ maxWidth: 960, background: '#05070D' }}>
          {video.tall && <source src={video.tall} type="video/mp4" media="(max-width: 640px)" />}
          <source src={video.wide} type="video/mp4" />
        </video>
      ) : embed ? (
        <div className="overflow-hidden rounded-[20px]" style={{ aspectRatio: '16 / 9', maxWidth: 960, background: '#05070D' }}>
          <iframe src={embed} title={l.title[lang]} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ border: 0 }} />
        </div>
      ) : l.videoUrl ? <a className="btn btn-primary self-start" href={l.videoUrl} target="_blank" rel="noreferrer">▶ {t('cr.watch')}</a>
        : <p className="t-sm t-mute">{t('cr.videoSoon')}</p>}
      <div className="row g12 wrap" style={{ alignItems: 'center' }}>
        <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-9 w-9 rounded-full object-cover" />
        <span className="t-sm w7">{t('sig.card')}</span>
        {l.deckUrl && <a className="btn btn-secondary btn-sm" href={l.deckUrl} target="_blank" rel="noreferrer">{t('cr.deck')}</a>}
      </div>
      {sections.length >= 2 && (
        <nav className="lx-toc" aria-label={t('cr.inThis')}>
          {sections.map((s, i) => <a key={s} href={`#sec-${i + 1}`}><b style={{ background: accent }}>{i + 1}</b>{s}</a>)}
        </nav>
      )}
      <article className="card" style={{ padding: 'clamp(20px, 4vw, 40px)' }}><Prose text={l.body[lang]} accent={accent} /></article>
      {related.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((x) => <LessonTile key={x.id} l={x} />)}</div>}
    </div>
  );
}
