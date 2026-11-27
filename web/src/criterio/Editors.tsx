import { useState } from 'react';
import { Link } from 'react-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { TAXONOMY } from '../requests/taxonomy';
import { AREAS, type L2, type Lesson, type Objection, type Stage } from './useCriterio';
import { Bi, EditorSheet, Fold } from './EditorSheet';

const STAGES: Stage[] = ['onboarding', 'ask', 'review', 'report'];
const empty: L2 = { es: '', en: '' };
/** Firestore rejects undefined values: drop them (and the id, which is the document name). */
const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([k, v]) => v !== undefined && k !== 'id' && k !== 'updatedAt'));
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/** Save with a busy flag and a real error message instead of a silent failure. */
function useSave(onClose: () => void) {
  const { t } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run(write: () => Promise<void>) {
    setBusy(true);
    try { await write(); toast({ text: t('cra.saved') }); onClose(); }
    catch (e) { toast({ text: t('cra.saveError', { msg: e instanceof Error ? e.message : String(e) }) }); }
    finally { setBusy(false); }
  }
  return [busy, run] as const;
}

/**
 * The buttons fixed at the bottom (UX CR4): one primary by state. Draft or new → «Publish» (+ save as draft, «only you see it»);
 * published → «Save» (+ back to draft).
 */
function Foot({ published, busy, save }: { published: boolean; busy: boolean; save: (s: 'draft' | 'published') => void }) {
  const { t } = useI18n();
  return published ? (
    <>
      <button className="btn btn-primary" disabled={busy} onClick={() => save('published')}>{t('cra.save')}</button>
      <button className="btn btn-ghost" disabled={busy} onClick={() => save('draft')}>{t('cra.unpublish')}</button>
    </>
  ) : (
    <>
      <button className="btn btn-primary" disabled={busy} onClick={() => save('published')}>{t('cra.publish')}</button>
      <button className="btn btn-secondary" disabled={busy} onClick={() => save('draft')}>{t('cra.saveDraft')}</button>
      <span className="t-xs t-mute">{t('cra.onlyYou')}</span>
    </>
  );
}

export function LessonEditor({ l, onClose }: { l?: Lesson; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [busy, run] = useSave(onClose);
  const [f, setF] = useState<Omit<Lesson, 'id'>>(l ?? { area: 'logos', order: 99, status: 'draft', minutes: 3, title: empty, summary: empty, body: empty, script: empty, categories: [], stages: ['review'] });
  const set = (p: Partial<Lesson>) => setF((x) => ({ ...x, ...p }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const save = (status: 'draft' | 'published') => {
    const id = l?.id ?? slug(f.title.en || f.title.es);
    if (!id) return;
    void run(() => setDoc(doc(db, 'lessons', id), { ...clean({ ...f, status }), updatedAt: serverTimestamp() }));
  };
  const published = l?.status === 'published';
  const where = f.kind ? t(`tut.kind.${f.kind}`) : t(`cr.area.${f.area}`);
  return (
    <EditorSheet
      title={l?.title[lang] || l?.title.es || t('cra.newLesson')}
      meta={l ? `${published ? t('cra.published') : t('cr.draft')} · ${where}` : undefined}
      aside={l ? <Link to={`/learn/${l.id}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm" aria-label={t('cra.viewAsClient')}>{t('cra.view')} ›</Link> : null}
      foot={<Foot published={published} busy={busy} save={save} />}
      onClose={onClose}
    >
      <Bi label={t('cra.f.title')} value={f.title} onChange={(v) => set({ title: v })} />
      <div className="field"><label htmlFor="vu">{t('cra.f.video')}</label><input id="vu" className="input" value={f.videoUrl ?? ''} onChange={(e) => set({ videoUrl: e.target.value.trim() })} /></div>
      <Bi label={t('cra.f.summary')} value={f.summary} onChange={(v) => set({ summary: v })} rows={2} />
      <Fold label={t('cra.more')}>
        <Bi label={t('cra.f.body')} value={f.body} onChange={(v) => set({ body: v })} rows={12} />
        <Bi label={t('cra.f.script')} value={f.script ?? empty} onChange={(v) => set({ script: v })} rows={6} />
        <div className="field"><label htmlFor="du">{t('cra.f.deck')}</label><input id="du" className="input" value={f.deckUrl ?? ''} onChange={(e) => set({ deckUrl: e.target.value.trim() })} /></div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="field"><label htmlFor="ar">{t('cra.f.area')}</label>
            <select id="ar" className="input" value={f.area} onChange={(e) => set({ area: e.target.value as Lesson['area'] })}>{AREAS.map((a) => <option key={a} value={a}>{t(`cr.area.${a}`)}</option>)}</select></div>
          <div className="field"><label htmlFor="mi">{t('cra.f.minutes')}</label><input id="mi" type="number" min={1} className="input" value={f.minutes} onChange={(e) => set({ minutes: Number(e.target.value) || 1 })} /></div>
          <div className="field"><label htmlFor="or">#</label><input id="or" type="number" className="input" value={f.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} /></div>
        </div>
        <div className="col g8"><span className="t-sm w7">{t('cra.f.categories')}</span>
          <div className="row g8 wrap">{TAXONOMY.map((c) => <button key={c.id} className={`btn btn-sm btn-secondary${f.categories.includes(c.id) ? ' is-picked' : ''}`} aria-pressed={f.categories.includes(c.id)} onClick={() => set({ categories: toggle(f.categories, c.id) })}>{c.label.es}</button>)}</div></div>
        <div className="col g8"><span className="t-sm w7">{t('cra.f.stages')}</span>
          <div className="row g8 wrap">{STAGES.map((s) => <button key={s} className={`btn btn-sm btn-secondary${f.stages.includes(s) ? ' is-picked' : ''}`} aria-pressed={f.stages.includes(s)} onClick={() => set({ stages: toggle(f.stages, s) })}>{t(`cra.stage.${s}`)}</button>)}</div></div>
      </Fold>
    </EditorSheet>
  );
}

export function ObjectionEditor({ o, lessons, onClose }: { o?: Objection; lessons: Lesson[]; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [busy, run] = useSave(onClose);
  const [f, setF] = useState<Omit<Objection, 'id'>>(o ?? { area: 'logos', order: 99, status: 'draft', phrase: empty, answer: empty, triggers: [] });
  const [triggers, setTriggers] = useState((o?.triggers ?? []).join(', '));
  const set = (p: Partial<Objection>) => setF((x) => ({ ...x, ...p }));
  const save = (status: 'draft' | 'published') => {
    const id = o?.id ?? slug(f.phrase.en || f.phrase.es);
    if (!id) return;
    const data = { ...f, status, triggers: triggers.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) };
    void run(() => setDoc(doc(db, 'objections', id), { ...clean(data), updatedAt: serverTimestamp() }));
  };
  const published = o?.status === 'published';
  return (
    <EditorSheet
      title={o ? `«${o.phrase[lang] || o.phrase.es}»` : t('cra.newObjection')}
      meta={o ? `${published ? t('cra.published') : t('cr.draft')} · ${t(`cr.area.${f.area}`)}` : undefined}
      foot={<Foot published={published} busy={busy} save={save} />}
      onClose={onClose}
    >
      <Bi label={t('cra.f.phrase')} value={f.phrase} onChange={(v) => set({ phrase: v })} />
      <Bi label={t('cra.f.answer')} value={f.answer} onChange={(v) => set({ answer: v })} rows={4} />
      <div className="field"><label htmlFor="tr">{t('cra.f.triggers')}</label><input id="tr" className="input" value={triggers} onChange={(e) => setTriggers(e.target.value)} /></div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="field"><label htmlFor="ol">{t('cra.f.lesson')}</label>
          <select id="ol" className="input" value={f.lessonId ?? ''} onChange={(e) => set({ lessonId: e.target.value || undefined })}>
            <option value="">—</option>{lessons.map((l) => <option key={l.id} value={l.id}>{l.title[lang]}</option>)}
          </select></div>
        <div className="field"><label htmlFor="oa">{t('cra.f.area')}</label>
          <select id="oa" className="input" value={f.area} onChange={(e) => set({ area: e.target.value as Objection['area'] })}>{AREAS.map((a) => <option key={a} value={a}>{t(`cr.area.${a}`)}</option>)}</select></div>
      </div>
    </EditorSheet>
  );
}
