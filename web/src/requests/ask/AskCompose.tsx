import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { dayLabel, daysFrom } from '../../lib/dates';
import { useToast } from '../../components/Toaster';
import { useTour } from '../../tour/useTour';
import { askSteps } from '../../tour/steps';
import { TAXONOMY, findCategory } from '../taxonomy';
import { AskDetails, type AskDetailValue } from '../AskDetails';
import { AskAttachments } from '../AskAttachments';
import { createRequest } from '../api';
import type { AttachedFile } from '../types';
import { LessonForCategory } from '../../criterio/LessonCards';
import { VoiceNote } from './VoiceNote';
import { checklist, intentById, quickDates, type Answers, type Check, type QKey } from './intents';
import type { Seed } from './AskStart';

type When = '' | 'today' | 'thisWeek' | 'nextWeek' | 'noRush' | 'pick';

/**
 * Second step of "New request": the words, the taps and the files. A live checklist shows the four things that make
 * a request clear; what is missing is asked as a short tap, never as a wall. "This is how NickMark read it" sums it
 * up before sending, and it can always go as it is: NickMark asks for the rest.
 */
export function AskCompose({ brandId, seed, onBack }: { brandId: string; seed: Seed; onBack: () => void }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const intent = intentById(seed.intent);
  const [text, setText] = useState(seed.text);
  const [customTitle, setCustomTitle] = useState('');
  const [answers, setAnswers] = useState<Answers>(seed.answers);
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [links, setLinks] = useState<string[]>(seed.links ?? []);
  const [link, setLink] = useState('');
  const [busyFiles, setBusyFiles] = useState(0);
  const [when, setWhen] = useState<When>('');
  const [picked, setPicked] = useState('');
  const [noMaterial, setNoMaterial] = useState(false);
  const [more, setMore] = useState(false);
  const [cat, setCat] = useState(seed.category ?? intent?.category ?? '');
  const [detail, setDetail] = useState<AskDetailValue>({ sub: seed.sub ?? '', type: seed.formatType ?? '', application: {}, scene: {}, format: '', language: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useTour('ask', () => askSteps(lang), true, false);

  const q = quickDates();
  const dueDate = when === 'today' ? q.today : when === 'thisWeek' ? q.thisWeek : when === 'nextWeek' ? q.nextWeek : when === 'pick' ? picked : '';
  const check: Check = checklist({ intent, answers, text, dueDate, noRush: when === 'noRush', files: files.length, links: links.length, noMaterial });
  const missing = (Object.keys(check) as Array<keyof Check>).filter((k) => !check[k]);
  const answered = Object.values(answers).filter((v) => v?.length).length;
  const ready = (text.trim().length > 5 || answered >= 2 || files.some((f) => f.contentType.startsWith('audio/'))) && !busyFiles;
  const withNicolas = !!findCategory(cat)?.withNicolas;

  const toggle = (k: QKey, v: string, multi?: boolean) => setAnswers((a) => {
    const cur = a[k] ?? [];
    return { ...a, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : multi ? [...cur, v] : [v] };
  });
  const addLink = () => { const v = link.trim(); if (/^https?:\/\//i.test(v)) { setLinks((l) => [...l, v].slice(0, 10)); setLink(''); } };
  const format = answers.format?.[0] ?? detail.type ?? '';
  const firstLine = text.trim().split('\n')[0].slice(0, 80);
  const summary = [
    format || intent?.label[lang] || t('as.aRequest'),
    answers.where?.length ? t('as.sumWhere', { where: answers.where.join(', ') }) : '',
    answers.goal?.length ? t('as.sumGoal', { goal: answers.goal[0].toLowerCase() }) : '',
    dueDate ? t('as.sumDue', { day: dayLabel(dueDate, lang) }) : when === 'noRush' ? t('as.sumNoRush') : '',
  ].filter(Boolean).join(', ');

  const autoTitle = (format && !firstLine.toLowerCase().includes(format.toLowerCase()) ? `${format} · ${firstLine || answers.goal?.[0] || ''}` : firstLine || format || summary).replace(/ · $/, '').slice(0, 90);

  async function submit() {
    setBusy(true); setError(false);
    const lines = [
      ...(intent?.questions ?? []).filter((x) => answers[x.key]?.length).map((x) => `${x.label[lang]} ${answers[x.key]!.join(', ')}`),
      when === 'noRush' ? t('as.sumNoRush') : '', noMaterial ? t('as.noMaterial') : '', detail.application.text ?? '',
    ].filter(Boolean);
    // The person's own title wins; the automatic one is only the fallback.
    const title = customTitle.replace(/\s+/g, ' ').trim().slice(0, 160) || autoTitle;
    try {
      const { requestId } = await createRequest(brandId, {
        category: cat, subcategory: detail.sub, formatType: format, title,
        cards: { product: { text: text.trim() || summary, links, files }, application: { ...detail.application, text: lines.join('\n') }, scene: detail.scene },
        dueDate, format: detail.format, language: detail.language,
      });
      const n = dueDate ? daysFrom(dueDate) : null;
      const day = n === 0 || n === 1 ? dayLabel(dueDate, lang) : t('as.on', { day: dayLabel(dueDate, lang) });
      toast({ text: dueDate ? t('as.sentDue', { day }) : t('as.sentPlan'), ms: 8000 });
      navigate(`/requests/${requestId}`);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <div className="col g20">
      <div className="row between g8">
        <span className="chip chip-plain" style={{ background: 'var(--hielo)', color: 'var(--azul)' }}>{intent ? intent.label[lang] : t('as.direct')}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="arrowLeft" size={16} />{t('as.change')}</button>
      </div>

      <label className="col g8">
        <span className="t-sm w7">{t('as.titleLabel')} <span className="t-xs t-mute">· {t('as.optional')}</span></span>
        <input className="input" style={{ height: '2.75rem' }} maxLength={160} value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
          placeholder={autoTitle && text.trim() ? autoTitle : t('as.titlePh')} />
      </label>

      <textarea className="input" autoFocus aria-label={t('ask.need')} data-tour="ask-what" style={{ minHeight: '7.5rem', padding: '0.875rem 1rem', resize: 'vertical', fontSize: '1rem', lineHeight: 1.5 }}
        placeholder={intent?.ph[lang] ?? t('ask.simplePh')} value={text} onChange={(e) => setText(e.target.value)} />

      {intent?.questions.map((x) => (
        <div key={x.key} className="col g8" role="group" aria-label={x.label[lang]}>
          <span className="t-sm w7">{x.label[lang]}{x.multi && <span className="t-xs t-mute"> · {t('as.several')}</span>}</span>
          <div className="row g8 wrap">
            {x.options.map((o) => { const on = !!answers[x.key]?.includes(o[lang]); return (
              <button key={o.es} type="button" className={`fx-chip${on ? ' is-on' : ''}`} style={{ height: '2.25rem' }} aria-pressed={on} onClick={() => toggle(x.key, o[lang], x.multi)}>{on && <Icon name="check" size={14} />}{o[lang]}</button>
            ); })}
          </div>
        </div>
      ))}

      <div className="col g8" role="group" aria-label={t('as.when')} data-tour="ask-when">
        <span className="t-sm w7">{t('as.when')}</span>
        <div className="row g8 wrap">
          {(['today', 'thisWeek', 'nextWeek', 'noRush', 'pick'] as When[]).map((w) => (
            <button key={w} type="button" className={`fx-chip${when === w ? ' is-on' : ''}`} style={{ height: '2.25rem' }} aria-pressed={when === w} onClick={() => setWhen(when === w ? '' : w)}>
              {t(`as.w.${w}` as 'as.w.pick', { day: dayLabel(w === 'thisWeek' ? q.thisWeek : q.nextWeek, lang) })}
            </button>
          ))}
          {when === 'pick' && <input type="date" className="input" style={{ height: '2.25rem', width: '10rem' }} value={picked} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setPicked(e.target.value)} aria-label={t('ask.due')} />}
        </div>
      </div>

      <div className="col g8">
        <span className="t-sm w7">{t('as.material')}</span>
        <AskAttachments brandId={brandId} files={files} onChange={setFiles} onBusy={(b) => setBusyFiles((n) => n + (b ? 1 : -1))} />
        <div className="row g8 wrap">
          <VoiceNote brandId={brandId} onAdd={(f) => setFiles((all) => [...all, f])} onBusy={(b) => setBusyFiles((n) => n + (b ? 1 : -1))} />
          <button type="button" className={`fx-chip${noMaterial ? ' is-on' : ''}`} style={{ height: '2.25rem' }} aria-pressed={noMaterial} onClick={() => setNoMaterial((v) => !v)}>{noMaterial && <Icon name="check" size={14} />}{t('as.noMaterial')}</button>
        </div>
        {links.map((l) => (
          <div key={l} className="row g8 t-sm"><Icon name="link" size={14} /><a href={l} target="_blank" rel="noreferrer" className="grow truncate">{l}</a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLinks((all) => all.filter((x) => x !== l))} aria-label={t('ask.removeLink')}>✕</button></div>
        ))}
        <div className="row g8">
          <input className="input grow" style={{ height: '2.5rem' }} type="url" placeholder={t('ask.linkPh')} aria-label={t('ask.addLink')} value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} />
          <button type="button" className="btn btn-secondary btn-sm" style={{ height: '2.5rem' }} disabled={!/^https?:\/\//i.test(link.trim())} onClick={addLink}>{t('ask.addLink')}</button>
        </div>
      </div>

      <div className="col g8" data-tour="ask-cards">
        <button type="button" className="btn btn-ghost btn-sm self-start" aria-expanded={more} onClick={() => setMore((m) => !m)}>{t(more ? 'ask.hideDetail' : 'as.exactType')}</button>
        {more && (
          <div className="col g12">
            <div className="row g8 wrap">
              {TAXONOMY.map((c) => (
                <button type="button" key={c.id} aria-pressed={c.id === cat} onClick={() => { setCat(c.id); setDetail((d) => ({ ...d, sub: '', type: '' })); }} className={`btn btn-sm ${c.id === cat ? 'btn-primary' : 'btn-secondary'}`}>{c.label[lang]}</button>
              ))}
            </div>
            <AskDetails cat={cat} value={detail} onChange={setDetail} />
            <LessonForCategory category={cat || undefined} />
          </div>
        )}
      </div>

      <div className="ask-summary col g12" data-tour="ask-summary">
        <ul className="ask-check" aria-label={t('as.checkLabel')}>
          {(Object.keys(check) as Array<keyof Check>).map((k) => <li key={k} className={check[k] ? 'is-ok' : ''}><Icon name={check[k] ? 'check' : 'plus'} size={14} />{t(`as.c.${k}`)}</li>)}
        </ul>
        {(answered > 0 || dueDate || text.trim()) && (
          <div className="col g4">
            <span className="label">{t('as.understood')}</span>
            <p className="t-sm" style={{ margin: 0 }}><strong>{summary}.</strong>{firstLine && <span className="t-mute"> «{firstLine}»</span>}</p>
          </div>
        )}
        <span className="t-xs t-mute">{withNicolas ? t('ask.levelNicolas') : t('ask.levelSelf')}</span>
      </div>

      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)', margin: 0 }}>{t('ask.error')}</p>}
      <div className="row between g12 wrap">
        <span className="t-xs t-mute" style={{ maxWidth: '18.75rem' }}>{missing.length ? t('as.missingNote', { what: missing.map((k) => t(`as.c.${k}`).toLowerCase()).join(', ') }) : t('as.allClear')}</span>
        <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={submit}>{busyFiles ? t('ask.uploading') : t(missing.length ? 'as.sendAnyway' : 'ask.sendSimple')}</button>
      </div>
    </div>
  );
}
