import { useTour } from '../tour/useTour';
import { askSteps } from '../tour/steps';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { TAXONOMY, findCategory } from '../requests/taxonomy';
import { AskDetails, type AskDetailValue } from '../requests/AskDetails';
import { createRequest } from '../requests/api';
import type { Card } from '../requests/types';
import { LessonForCategory } from '../criterio/LessonCards';

/** "Ask for something": one box, like a WhatsApp message. Type of piece and details are optional. */
export function Ask() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [cat, setCat] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AskDetailValue>({ sub: '', type: '', application: {}, scene: {}, format: '', language: lang === 'es' ? 'Español' : 'English' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useTour('ask', () => askSteps(lang), !!current, false);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
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
      const { requestId } = await createRequest(current!.id, {
        category: cat, subcategory: detail.sub, formatType: detail.type, title: detail.type || firstLine,
        cards: { product, application: detail.application, scene: detail.scene }, dueDate, format: detail.format, language: detail.language,
      });
      navigate(`/requests/${requestId}`);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="col g24">
        <div className="col g8"><p className="label">{current.name}</p><h1 className="h1"><span className="w9">{t('ask.simpleTitle')}</span></h1></div>

        <section className="card col g16" data-tour="ask-what">
          <textarea className="input" aria-label={t('ask.simpleTitle')} style={{ minHeight: 170, padding: '16px 18px', resize: 'vertical', fontSize: 17, lineHeight: 1.5 }}
            placeholder={t('ask.simplePh')} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          {links.map((l) => (
            <div key={l} className="row g8 t-sm">
              <a href={l} target="_blank" rel="noreferrer" className="grow truncate">{l}</a>
              <button className="btn btn-ghost btn-sm" onClick={() => setLinks((all) => all.filter((x) => x !== l))} aria-label={t('ask.removeLink')}>✕</button>
            </div>
          ))}
          <div className="grid gap-3 md:grid-cols-[1fr_auto_200px]">
            <input className="input" style={{ height: 44 }} type="url" placeholder={t('ask.linkPh')} aria-label={t('ask.addLink')}
              value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} />
            <button className="btn btn-secondary btn-sm" style={{ height: 44 }} onClick={addLink}>{t('ask.addLink')}</button>
            <input className="input" style={{ height: 44 }} type="date" aria-label={t('ask.due')} title={t('ask.due')} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </section>

        <section className="col g12" data-tour="ask-cards">
          <p className="t-sm w7">{t('ask.typeOptional')}</p>
          <div className="row g8 wrap">
            {TAXONOMY.map((c) => (
              <button key={c.id} aria-pressed={c.id === cat} onClick={() => { setCat(c.id === cat ? '' : c.id); setDetail((d) => ({ ...d, sub: '', type: '' })); }}
                className={`btn btn-sm ${c.id === cat ? 'btn-primary' : 'btn-secondary'}`}>{c.label[lang]}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm self-start" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? t('ask.hideDetail') : t('ask.addDetail')}</button>
          {open && <AskDetails cat={cat} value={detail} onChange={setDetail} />}
        </section>
      </div>

      <aside className="col g16 lg:sticky lg:top-6" data-tour="ask-summary">
        <div className="card col g12">
          <div className="row g12">
            <img src="/brand/proposal/nicolas.jpg" alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
            <span className="col"><span className="t-sm w7">{t('sig.card')}</span><span className="t-xs t-mute">{t('home.withBrains')}</span></span>
          </div>
          <p className="t-sm t-mute">{withNicolas ? t('ask.levelNicolas') : t('ask.levelSelf')}</p>
          {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('ask.error')}</p>}
          <button className="btn btn-primary btn-block" style={{ height: 52 }} disabled={!ready || busy} onClick={submit}>{t('ask.sendSimple')}</button>
          <p className="t-xs t-mute">{t('ask.next')}</p>
        </div>
        <LessonForCategory category={cat || undefined} />
      </aside>
    </div>
  );
}
