import { useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { TAXONOMY } from '../requests/taxonomy';
import { AREAS, type L2, type Lesson, type Objection, type Stage } from './useCriterio';

const STAGES: Stage[] = ['onboarding', 'ask', 'review', 'report'];

/** Spanish and English side by side for one text field. */
function Bi({ label, value, onChange, rows = 1 }: { label: string; value: L2; onChange: (v: L2) => void; rows?: number }) {
  return (
    <div className="col g8">
      <span className="t-sm w7">{label}</span>
      <div className="grid gap-3 md:grid-cols-2">
        {(['es', 'en'] as const).map((k) => (
          rows > 1
            ? <textarea key={k} className="input" style={{ height: rows * 24 + 24, padding: '10px 14px', resize: 'vertical' }} aria-label={`${label} ${k}`} placeholder={k.toUpperCase()} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
            : <input key={k} className="input" aria-label={`${label} ${k}`} placeholder={k.toUpperCase()} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
        ))}
      </div>
    </div>
  );
}

const empty: L2 = { es: '', en: '' };
/** Firestore rejects undefined values: drop them (and the id, which is the document name). */
const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([k, v]) => v !== undefined && k !== 'id' && k !== 'updatedAt'));

export function LessonEditor({ l, onClose }: { l?: Lesson; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [f, setF] = useState<Omit<Lesson, 'id'>>(l ?? { area: 'logos', order: 99, status: 'draft', minutes: 3, title: empty, summary: empty, body: empty, script: empty, categories: [], stages: ['review'] });
  const set = (p: Partial<Lesson>) => setF((x) => ({ ...x, ...p }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  async function save(status = f.status) {
    const id = l?.id ?? (f.title.en || f.title.es).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    if (!id) return;
    await setDoc(doc(db, 'lessons', id), { ...clean({ ...f, status }), updatedAt: serverTimestamp() });
    toast({ text: t('cra.saved') }); onClose();
  }
  return (
    <div className="card col g16">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="field"><label htmlFor="ar">{t('cra.f.area')}</label>
          <select id="ar" className="input" value={f.area} onChange={(e) => set({ area: e.target.value as Lesson['area'] })}>{AREAS.map((a) => <option key={a} value={a}>{t(`cr.area.${a}`)}</option>)}</select></div>
        <div className="field"><label htmlFor="mi">{t('cra.f.minutes')}</label><input id="mi" type="number" min={1} className="input" value={f.minutes} onChange={(e) => set({ minutes: Number(e.target.value) || 1 })} /></div>
        <div className="field"><label htmlFor="or">#</label><input id="or" type="number" className="input" value={f.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} /></div>
      </div>
      <Bi label={t('cra.f.title')} value={f.title} onChange={(v) => set({ title: v })} />
      <Bi label={t('cra.f.summary')} value={f.summary} onChange={(v) => set({ summary: v })} rows={2} />
      <Bi label={t('cra.f.body')} value={f.body} onChange={(v) => set({ body: v })} rows={12} />
      <Bi label={t('cra.f.script')} value={f.script ?? empty} onChange={(v) => set({ script: v })} rows={6} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="field"><label htmlFor="vu">{t('cra.f.video')}</label><input id="vu" className="input" value={f.videoUrl ?? ''} onChange={(e) => set({ videoUrl: e.target.value.trim() })} /></div>
        <div className="field"><label htmlFor="du">{t('cra.f.deck')}</label><input id="du" className="input" value={f.deckUrl ?? ''} onChange={(e) => set({ deckUrl: e.target.value.trim() })} /></div>
      </div>
      <div className="col g8"><span className="t-sm w7">{t('cra.f.categories')}</span>
        <div className="row g8 wrap">{TAXONOMY.map((c) => <button key={c.id} className={`btn btn-sm ${f.categories.includes(c.id) ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={f.categories.includes(c.id)} onClick={() => set({ categories: toggle(f.categories, c.id) })}>{c.label.es}</button>)}</div></div>
      <div className="col g8"><span className="t-sm w7">{t('cra.f.stages')}</span>
        <div className="row g8 wrap">{STAGES.map((s) => <button key={s} className={`btn btn-sm ${f.stages.includes(s) ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={f.stages.includes(s)} onClick={() => set({ stages: toggle(f.stages, s) })}>{t(`cra.stage.${s}`)}</button>)}</div></div>
      <div className="row g8 wrap">
        <button className="btn btn-primary" onClick={() => save('published')}>{t('cra.publish')}</button>
        <button className="btn btn-secondary" onClick={() => save(l?.status === 'published' ? 'published' : 'draft')}>{t('cra.save')}</button>
        {l?.status === 'published' && <button className="btn btn-ghost" onClick={() => save('draft')}>{t('cra.unpublish')}</button>}
        <button className="btn btn-ghost" onClick={onClose}>{t('cra.cancel')}</button>
      </div>
    </div>
  );
}

export function ObjectionEditor({ o, lessons, onClose }: { o?: Objection; lessons: Lesson[]; onClose: () => void }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [f, setF] = useState<Omit<Objection, 'id'>>(o ?? { area: 'logos', order: 99, status: 'draft', phrase: empty, answer: empty, triggers: [] });
  const [triggers, setTriggers] = useState((o?.triggers ?? []).join(', '));
  const set = (p: Partial<Objection>) => setF((x) => ({ ...x, ...p }));
  async function save(status = f.status) {
    const id = o?.id ?? (f.phrase.en || f.phrase.es).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    if (!id) return;
    const data = { ...f, status, triggers: triggers.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) };
    await setDoc(doc(db, 'objections', id), { ...clean(data), updatedAt: serverTimestamp() });
    toast({ text: t('cra.saved') }); onClose();
  }
  return (
    <div className="card col g16">
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
      <div className="row g8 wrap">
        <button className="btn btn-primary" onClick={() => save('published')}>{t('cra.publish')}</button>
        <button className="btn btn-secondary" onClick={() => save(o?.status === 'published' ? 'published' : 'draft')}>{t('cra.save')}</button>
        {o?.status === 'published' && <button className="btn btn-ghost" onClick={() => save('draft')}>{t('cra.unpublish')}</button>}
        <button className="btn btn-ghost" onClick={onClose}>{t('cra.cancel')}</button>
      </div>
    </div>
  );
}
