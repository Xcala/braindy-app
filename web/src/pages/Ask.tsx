import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { BrainStack, brainName } from '../components/BrainStack';
import { TAXONOMY, findCategory, findSub } from '../requests/taxonomy';
import { AskCard, type CardKey } from '../requests/AskCards';
import { createRequest } from '../requests/api';
import type { Card } from '../requests/types';

export function Ask() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [cat, setCat] = useState('social');
  const [sub, setSub] = useState('');
  const [type, setType] = useState('');
  const [cards, setCards] = useState<Record<CardKey, Card>>({ product: {}, application: {}, scene: {} });
  const [dueDate, setDueDate] = useState('');
  const [format, setFormat] = useState('');
  const [language, setLanguage] = useState(lang === 'es' ? 'Español' : 'English');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  const category = findCategory(cat)!;
  const subcat = findSub(cat, sub);
  const withNicolas = !!category.withNicolas || !!subcat?.withNicolas;
  const ready = !!sub && !!type && (cards.product.text ?? '').trim().length > 2;

  async function submit() {
    setBusy(true); setError(false);
    try {
      const { requestId } = await createRequest(current!.id, {
        category: cat, subcategory: sub, formatType: type, title: type, cards, dueDate, format, language,
      });
      navigate(`/requests/${requestId}`);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="col g32">
        <div className="col g8"><p className="label">{current.name}</p><h1 className="h1"><span className="w9">{t('ask.title')}</span></h1></div>

        <section className="col g12" aria-labelledby="s1">
          <div className="row g12"><span className="sec-num">01</span><h2 className="h3" id="s1">{t('ask.s1')}</h2></div>
          <div className="card grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
            <div className="col" role="listbox" aria-label={t('ask.s1')}>
              {TAXONOMY.map((c) => (
                <button key={c.id} role="option" aria-selected={c.id === cat} onClick={() => { setCat(c.id); setSub(''); setType(''); }}
                  className={`menu-item w-full text-left ${c.id === cat ? 'is-on' : ''}`} style={{ border: 0, background: undefined, cursor: 'pointer' }}>
                  <span className="grow">{c.label[lang]}</span>
                  {c.withNicolas && <span className="chip chip-plain c-type">{t('ask.withNicolas')}</span>}
                  {c.id === cat && <Icon name="chevronRight" size={16} />}
                </button>
              ))}
            </div>
            <div className="col">
              {category.subs.map((s) => (
                <button key={s.id} onClick={() => { setSub(s.id); setType(''); }}
                  className={`menu-item w-full text-left ${s.id === sub ? 'is-on' : ''}`} style={{ border: 0, background: undefined, cursor: 'pointer' }}>
                  <span className="grow">{s.label[lang]}</span>{s.id === sub && <Icon name="chevronRight" size={16} />}
                </button>
              ))}
            </div>
            <div className="row g8 wrap content-start">
              {subcat ? subcat.types.map((ty) => (
                <button key={ty.en} aria-pressed={type === ty[lang]} onClick={() => setType(ty[lang])}
                  className={`btn btn-sm ${type === ty[lang] ? 'btn-primary' : 'btn-secondary'}`}>{ty[lang]}</button>
              )) : <p className="t-sm t-mute">{t('ask.pickSub')}</p>}
            </div>
          </div>
        </section>

        <section className="col g12" aria-labelledby="s2">
          <div className="row g12"><span className="sec-num">02</span><h2 className="h3" id="s2">{t('ask.s2')}</h2></div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(['product', 'application', 'scene'] as CardKey[]).map((k) => (
              <AskCard key={k} k={k} value={cards[k]} onChange={(c) => setCards((all) => ({ ...all, [k]: c }))} />
            ))}
          </div>
        </section>

        <section className="col g12" aria-labelledby="s3">
          <div className="row g12"><span className="sec-num">03</span><h2 className="h3" id="s3">{t('ask.s3')}</h2></div>
          <div className="card grid gap-4 md:grid-cols-3">
            <div className="field"><label htmlFor="d1">{t('ask.due')}</label><input className="input" id="d1" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="field"><label htmlFor="d2">{t('ask.format')}</label><input className="input" id="d2" value={format} placeholder={t('ask.formatPh')} onChange={(e) => setFormat(e.target.value)} /></div>
            <div className="field"><label htmlFor="d3">{t('ask.language')}</label><input className="input" id="d3" value={language} onChange={(e) => setLanguage(e.target.value)} /></div>
          </div>
        </section>
      </div>

      <aside className="card col g16 lg:sticky lg:top-6" aria-label={t('ask.summary')}>
        <p className="label">{t('ask.summary')}</p>
        <div className="col g4"><span className="t-sm t-mute">{category.label[lang]}{subcat ? ` · ${subcat.label[lang]}` : ''}</span><span className="h3">{type || '—'}</span></div>
        <div className="divider" />
        <BrainStack lead={category.lead} state="working" label={t('ask.leadBrain', { brain: brainName(category.lead) })} />
        <p className="t-sm t-mute">{withNicolas ? t('ask.levelNicolas') : t('ask.levelSelf')}</p>
        <div className="divider" />
        {(['product', 'application', 'scene'] as CardKey[]).map((k) => (
          <div key={k} className="row between t-sm"><span>{t(`ask.card.${k}`)}</span>
            <span className={(cards[k].text ?? '').trim() ? 'w7' : 't-mute'} style={{ color: (cards[k].text ?? '').trim() ? 'var(--success)' : undefined }}>
              {(cards[k].text ?? '').trim() ? t('ask.done') : k === 'scene' ? t('ask.optional') : t('ask.needed')}
            </span></div>
        ))}
        {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('ask.error')}</p>}
        <button className="btn btn-primary btn-block" style={{ height: 52 }} disabled={!ready || busy} onClick={submit}>{t('ask.send')}</button>
        <p className="t-xs t-mute">{t('ask.next')}</p>
      </aside>
    </div>
  );
}
