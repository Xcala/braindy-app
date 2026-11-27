import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { AREAS, useLessons, useObjections, type Lesson, type Objection } from '../../criterio/useCriterio';
import { LessonEditor, ObjectionEditor } from '../../criterio/Editors';
import { CriterioHits } from './CriterioHits';
import '../../criterio/criterioAdmin.css';

type Filter = 'all' | 'drafts' | 'tutorials';
type Group = { key: string; title: string; items: Lesson[] };
const KINDS = ['general', 'section', 'feature'] as const;
const isTut = (l: Lesson) => !!l.kind;
const hasVideo = (l: Lesson) => !!(l.videoUrl || l.videos?.es?.wide || l.videos?.en?.wide);

/** Admin · NickMark Taste: lessons (by area, app tutorials apart) and objection answers, each opening its editor page. */
export function AdminCriterio() {
  const { t, lang } = useI18n();
  const L = useLessons();
  const O = useObjections();
  const [tab, setTab] = useState<'lessons' | 'objections'>('lessons');
  const [editL, setEditL] = useState<Lesson | 'new' | null>(null);
  const [editO, setEditO] = useState<Objection | 'new' | null>(null);
  const loading = tab === 'lessons' ? L.loading : O.loading;
  const count = (n: number, busy: boolean) => (busy ? '…' : n);

  return (
    <div className="col g16">
      {/* UX CR2: short title, the tabs right below; the drafts note moved into the editor. */}
      <h1 className="h1"><span className="w9">{t('cra.nav')}</span></h1>
      <div className="row between g12 wrap">
        <div className="seg" role="group">
          <button className={tab === 'lessons' ? 'is-on' : ''} aria-pressed={tab === 'lessons'} onClick={() => setTab('lessons')}>{t('cra.lessons')} · {count(L.list.length, L.loading)}</button>
          <button className={tab === 'objections' ? 'is-on' : ''} aria-pressed={tab === 'objections'} onClick={() => setTab('objections')}>{t('cra.objections')} · {count(O.list.length, O.loading)}</button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => (tab === 'lessons' ? setEditL('new') : setEditO('new'))}>
          + {tab === 'lessons' ? t('cra.newLesson') : t('cra.newObjection')}
        </button>
      </div>

      {loading ? <Skeleton /> : tab === 'lessons' ? <Lessons lessons={L.list} onEdit={setEditL} /> : (
        <>
          <CriterioHits objections={O.list} />
          {O.list.length ? (
            <div className="cra-list">
              {O.list.map((o) => (
                <Row key={o.id} title={`«${o.phrase[lang] || o.phrase.es}»`} sub={o.answer[lang]} published={o.status === 'published'} onOpen={() => setEditO(o)} />
              ))}
            </div>
          ) : <p className="t-sm t-mute">{t('cra.noObjections')}</p>}
        </>
      )}

      {editL && <LessonEditor l={editL === 'new' ? undefined : editL} onClose={() => setEditL(null)} />}
      {editO && <ObjectionEditor o={editO === 'new' ? undefined : editO} lessons={L.list} onClose={() => setEditO(null)} />}
    </div>
  );
}

/** UX CR3: a title per area with its count; app tutorials apart (also a «Tutorials» filter); «Drafts» shows what is left to publish. */
function Lessons({ lessons, onEdit }: { lessons: Lesson[]; onEdit: (l: Lesson) => void }) {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<Filter>('all');
  const drafts = lessons.filter((l) => l.status !== 'published');
  const tuts = lessons.filter(isTut);
  const list = filter === 'drafts' ? drafts : filter === 'tutorials' ? tuts : lessons;
  const groups: Group[] = filter === 'tutorials'
    ? KINDS.map((k) => ({ key: k, title: t(`tut.kind.${k}`), items: list.filter((l) => l.kind === k) }))
    : [
      ...AREAS.map((a) => ({ key: a, title: t(`cr.area.${a}`), items: list.filter((l) => !isTut(l) && l.area === a) })),
      { key: 'tut', title: t('cra.tutorials'), items: list.filter(isTut) },
    ];
  const sub = (l: Lesson, withKind: boolean) => [
    withKind && l.kind ? t(`tut.kind.${l.kind}`) : null,
    t('cr.minutes', { n: l.minutes }),
    hasVideo(l) ? `▶ ${t('cra.video')}` : null,
  ].filter(Boolean).join(' · ');
  const chips: Array<[Filter, string, number]> = [['all', t('cra.f.all'), lessons.length], ['drafts', t('cra.f.drafts'), drafts.length], ['tutorials', t('cra.f.tutorials'), tuts.length]];
  return (
    <div className="col g8">
      <div className="seg seg-scroll" role="group" aria-label={t('cra.lessons')}>
        {chips.map(([k, label, n]) => (
          <button key={k} className={filter === k ? 'is-on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label} · {n}</button>
        ))}
      </div>
      {!list.length && <p className="t-sm t-mute">{t('cra.noLessons')}</p>}
      {groups.filter((g) => g.items.length).map((g) => (
        <section key={g.key} aria-label={g.title}>
          <h2 className="cra-group">{g.title} · {g.items.length}</h2>
          <div className="cra-list">
            {g.items.map((l) => (
              <Row key={l.id} title={l.title[lang] || l.title.es} sub={sub(l, filter !== 'tutorials')} published={l.status === 'published'} onOpen={() => onEdit(l)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** UX CR1: two lines (bold title, grey details), a short state chip, and the whole row opens the editor. */
function Row({ title, sub, published, onOpen }: { title: string; sub?: string; published: boolean; onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" className="cra-row" onClick={onOpen}>
      <span className="cra-row-text">
        <span className="cra-row-title">{title}</span>
        {sub ? <span className="cra-row-sub">{sub}</span> : null}
      </span>
      {published
        ? <span className="chip c-approved" aria-label={t('cra.published')}><span className="hidden sm:inline">{t('cra.published')}</span></span>
        : <span className="chip c-draft">{t('cr.draft')}</span>}
      <Icon name="chevronRight" size={16} />
    </button>
  );
}

function Skeleton() {
  return (
    <div className="cra-list" aria-busy="true">
      {[0, 1, 2, 3].map((i) => <div key={i} className="skel cra-skel" />)}
    </div>
  );
}
