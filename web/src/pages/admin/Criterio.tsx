import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { useLessons, useObjections, type Lesson, type Objection } from '../../criterio/useCriterio';
import { LessonEditor, ObjectionEditor } from '../../criterio/Editors';

type Hits = Record<string, { shown: number; opened: number; sent: number; brands: Set<string> }>;

/** Admin · NickMark Taste: lessons, objection answers, and which objections clients raise most. */
export function AdminCriterio() {
  const { t, lang } = useI18n();
  const lessons = useLessons().list;
  const objections = useObjections().list;
  const [tab, setTab] = useState<'lessons' | 'objections'>('lessons');
  const [editL, setEditL] = useState<Lesson | 'new' | null>(null);
  const [editO, setEditO] = useState<Objection | 'new' | null>(null);
  const hits = useHits();
  const ranked = objections.filter((o) => hits[o.id]).sort((a, b) => hits[b.id].shown - hits[a.id].shown);

  return (
    <div className="col g24">
      <div className="col g8"><p className="label">{t('cra.nav')}</p><h1 className="h1"><span className="w9">{t('cra.title')}.</span></h1><p className="t-mute">{t('cra.sub')}</p></div>

      <section className="card col g12" aria-labelledby="h-hits">
        <div className="col g4"><h2 className="h3" id="h-hits">{t('cra.hits')}</h2><span className="t-sm t-mute">{t('cra.hitsSub')}</span></div>
        {ranked.length === 0 ? <p className="t-sm t-mute">{t('cra.noHits')}</p> : ranked.map((o) => (
          <div key={o.id} className="row between g12 wrap t-sm">
            <span className="w7">«{o.phrase[lang]}»</span>
            <span className="t-mute">{hits[o.id].shown} {t('cra.shown')} · {hits[o.id].opened} {t('cra.opened')} · {hits[o.id].sent} {t('cra.sent')} · {t('cra.brandsN', { n: hits[o.id].brands.size })}</span>
          </div>
        ))}
      </section>

      <div className="row between g12 wrap">
        <div className="seg" role="group">
          <button className={tab === 'lessons' ? 'is-on' : ''} onClick={() => setTab('lessons')}>{t('cra.lessons')} · {lessons.length}</button>
          <button className={tab === 'objections' ? 'is-on' : ''} onClick={() => setTab('objections')}>{t('cra.objections')} · {objections.length}</button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => (tab === 'lessons' ? setEditL('new') : setEditO('new'))}>+ {t('cra.new')}</button>
      </div>

      {tab === 'lessons' && (editL ? <LessonEditor l={editL === 'new' ? undefined : editL} onClose={() => setEditL(null)} /> : (
        <div className="table">
          {lessons.map((l) => (
            <div key={l.id} className="trow" style={{ gridTemplateColumns: 'minmax(0,1fr) 180px 110px 90px' }}>
              <Link to={`/learn/${l.id}`} className="w7 truncate" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{l.title[lang]}</Link>
              <span className="t-sm t-mute truncate">{t(`cr.area.${l.area}`)}</span>
              <span><span className={`chip ${l.status === 'published' ? 'c-approved' : 'c-draft'}`}>{l.status === 'published' ? t('cra.published') : t('cr.draft')}</span>{l.videoUrl ? ' ▶' : ''}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditL(l)}>{t('cra.edit')}</button>
            </div>
          ))}
        </div>
      ))}
      {tab === 'objections' && (editO ? <ObjectionEditor o={editO === 'new' ? undefined : editO} lessons={lessons} onClose={() => setEditO(null)} /> : (
        <div className="table">
          {objections.map((o) => (
            <div key={o.id} className="trow" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr) 110px 90px' }}>
              <span className="w7 truncate">«{o.phrase[lang]}»</span>
              <span className="t-sm t-mute truncate">{o.answer[lang]}</span>
              <span><span className={`chip ${o.status === 'published' ? 'c-approved' : 'c-draft'}`}>{o.status === 'published' ? t('cra.published') : t('cr.draft')}</span></span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditO(o)}>{t('cra.edit')}</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function useHits() {
  const [hits, setHits] = useState<Hits>({});
  useEffect(() => {
    const since = Timestamp.fromMillis(Date.now() - 90 * 864e5);
    getDocs(query(collection(db, 'criterioHits'), where('at', '>=', since))).then((s) => {
      const h: Hits = {};
      for (const d of s.docs) {
        const id = String(d.get('objectionId'));
        h[id] ??= { shown: 0, opened: 0, sent: 0, brands: new Set() };
        const out = d.get('outcome') as 'shown' | 'opened' | 'sent';
        if (out in h[id]) h[id][out]++;
        h[id].brands.add(String(d.get('brandId')));
      }
      setHits(h);
    }).catch(() => setHits({}));
  }, []);
  return hits;
}
