import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTour } from '../tour/useTour';
import { askSteps } from '../tour/steps';
import { useI18n } from '../i18n/I18nProvider';
import { TAXONOMY, findCategory } from './taxonomy';
import { AskDetails, type AskDetailValue } from './AskDetails';
import { AskAttachments } from './AskAttachments';
import { ASK_EXAMPLES, exampleFor, type AskExample } from './askExamples';
import { createRequest } from './api';
import type { AttachedFile, Card } from './types';
import { LessonForCategory } from '../criterio/LessonCards';

/**
 * "Do you need something?": the ask box in My requests. One message like WhatsApp, files by drag and drop,
 * examples of a complete ask; links, date, type of piece and details open only if wanted.
 */
export function AskBox({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [cat, setCat] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [example, setExample] = useState<AskExample | null>(null);
  const [detail, setDetail] = useState<AskDetailValue>({ sub: '', type: '', application: {}, scene: {}, format: '', language: lang === 'es' ? 'Español' : 'English' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useTour('ask', () => askSteps(lang), true, false);
  const category = findCategory(cat);
  const withNicolas = !!category?.withNicolas || !!category?.subs.find((s) => s.id === detail.sub)?.withNicolas;
  const ready = text.trim().length > 5 && !uploading;

  const addLink = () => {
    const v = link.trim();
    if (!/^https?:\/\//i.test(v)) return;
    setLinks((l) => [...l, v].slice(0, 10)); setLink('');
  };
  const useExample = (e: AskExample) => { setText(e.text[lang]); setCat(e.category); setExample(null); };

  async function submit() {
    setBusy(true); setError(false);
    const product: Card = { text, links, files };
    const firstLine = text.trim().split('\n')[0].slice(0, 80);
    try {
      const { requestId } = await createRequest(brandId, {
        category: cat, subcategory: detail.sub, formatType: detail.type, title: detail.type || firstLine,
        cards: { product, application: detail.application, scene: detail.scene }, dueDate, format: detail.format, language: detail.language,
      });
      navigate(`/requests/${requestId}`);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <section id="ask" className="card col g16" aria-labelledby="h-ask" data-tour="ask-what">
      <div className="row g12">
        <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
        <span className="col"><h2 className="h3" id="h-ask">{t('ask.need')}</h2><span className="t-xs t-mute">{withNicolas ? t('ask.levelNicolas') : t('ask.levelSelf')}</span></span>
      </div>
      <textarea className="input" aria-label={t('ask.need')} style={{ minHeight: 130, padding: '14px 16px', resize: 'vertical', fontSize: 16, lineHeight: 1.5 }}
        placeholder={exampleFor(cat)?.text[lang] ?? t('ask.simplePh')} value={text} onChange={(e) => setText(e.target.value)} />

      <div className="row g8 wrap" role="group" aria-label={t('ask.examples')}>
        <span className="t-xs t-mute">{t('ask.examples')}</span>
        {ASK_EXAMPLES.map((e) => (
          <button key={e.id} type="button" className={`btn btn-sm ${example?.id === e.id ? 'btn-primary' : 'btn-secondary'}`} style={{ height: 30 }}
            aria-pressed={example?.id === e.id} onClick={() => setExample(example?.id === e.id ? null : e)}>{e.label[lang]}</button>
        ))}
      </div>
      {example && (
        <div className="col g8" style={{ background: '#F4F7FF', border: '1px solid #DCE4FF', borderRadius: 12, padding: '12px 14px' }}>
          <span className="label">{t('ask.exampleOf', { piece: example.label[lang] })}</span>
          <p className="t-sm" style={{ whiteSpace: 'pre-line' }}>{example.text[lang]}</p>
          <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => useExample(example)}>{t('ask.useExample')}</button>
        </div>
      )}

      <AskAttachments brandId={brandId} files={files} onChange={setFiles} onBusy={setUploading} />

      {links.map((l) => (
        <div key={l} className="row g8 t-sm">
          <a href={l} target="_blank" rel="noreferrer" className="grow truncate">{l}</a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLinks((all) => all.filter((x) => x !== l))} aria-label={t('ask.removeLink')}>✕</button>
        </div>
      ))}
      {more && (
        <div className="col g12" data-tour="ask-cards">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input className="input" style={{ height: 44 }} type="url" placeholder={t('ask.linkPh')} aria-label={t('ask.addLink')}
              value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} />
            <button type="button" className="btn btn-secondary btn-sm" style={{ height: 44 }} onClick={addLink}>{t('ask.addLink')}</button>
          </div>
          <label className="col g4"><span className="t-sm w7">{t('ask.due')}</span>
            <input className="input" style={{ height: 44, maxWidth: 220 }} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
          <p className="t-sm w7">{t('ask.typeOptional')}</p>
          <div className="row g8 wrap">
            {TAXONOMY.map((c) => (
              <button type="button" key={c.id} aria-pressed={c.id === cat} onClick={() => { setCat(c.id === cat ? '' : c.id); setDetail((d) => ({ ...d, sub: '', type: '' })); }}
                className={`btn btn-sm ${c.id === cat ? 'btn-primary' : 'btn-secondary'}`}>{c.label[lang]}</button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm self-start" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? t('ask.hideDetail') : t('ask.addDetail')}</button>
          {open && <AskDetails cat={cat} value={detail} onChange={setDetail} />}
          <LessonForCategory category={cat || undefined} />
        </div>
      )}
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('ask.error')}</p>}
      <div className="row between g12 wrap" data-tour="ask-summary">
        <button type="button" className="btn btn-ghost btn-sm" aria-expanded={more} onClick={() => setMore((m) => !m)}>{more ? t('ask.lessOptions') : t('ask.moreOptions')}</button>
        <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={submit}>{uploading ? t('ask.uploading') : t('ask.sendSimple')}</button>
      </div>
    </section>
  );
}
