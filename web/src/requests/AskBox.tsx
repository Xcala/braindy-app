import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTour } from '../tour/useTour';
import { askSteps } from '../tour/steps';
import { useI18n } from '../i18n/I18nProvider';
import { TAXONOMY, findCategory } from './taxonomy';
import { AskDetails, type AskDetailValue } from './AskDetails';
import { createRequest } from './api';
import type { Card } from './types';
import { LessonForCategory } from '../criterio/LessonCards';

/**
 * "Do you need something?": the ask box at the top of My requests. One message like WhatsApp;
 * links, date, type of piece and details open only if the client wants them.
 */
export function AskBox({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [cat, setCat] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AskDetailValue>({ sub: '', type: '', application: {}, scene: {}, format: '', language: lang === 'es' ? 'Español' : 'English' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useTour('ask', () => askSteps(lang), true, false);
  const category = findCategory(cat);
  const withNicolas = !!category?.withNicolas || !!category?.subs.find((s) => s.id === detail.sub)?.withNicolas;
  const ready = text.trim().length > 5;

  const addLink = () => {
    const v = link.trim();
    if (!/^https?:\/\//i.test(v)) return;
    setLinks((l) => [...l, v].slice(0, 10)); setLink('');
  };

  async function submit() {
    setBusy(true); setError(false);
    const product: Card = { text, links };
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
      <textarea className="input" aria-label={t('ask.need')} style={{ minHeight: 110, padding: '14px 16px', resize: 'vertical', fontSize: 16, lineHeight: 1.5 }}
        placeholder={t('ask.simplePh')} value={text} onChange={(e) => setText(e.target.value)} />
      {links.map((l) => (
        <div key={l} className="row g8 t-sm">
          <a href={l} target="_blank" rel="noreferrer" className="grow truncate">{l}</a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLinks((all) => all.filter((x) => x !== l))} aria-label={t('ask.removeLink')}>✕</button>
        </div>
      ))}
      {more && (
        <div className="col g12" data-tour="ask-cards">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_200px]">
            <input className="input" style={{ height: 44 }} type="url" placeholder={t('ask.linkPh')} aria-label={t('ask.addLink')}
              value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} />
            <button type="button" className="btn btn-secondary btn-sm" style={{ height: 44 }} onClick={addLink}>{t('ask.addLink')}</button>
            <input className="input" style={{ height: 44 }} type="date" aria-label={t('ask.due')} title={t('ask.due')} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
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
        <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={submit}>{t('ask.sendSimple')}</button>
      </div>
    </section>
  );
}
