import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { Card } from './types';

export type CardKey = 'product' | 'application' | 'scene';

/** One of the three brief cards from the design (Product, Application, Scene). */
export function AskCard({ k, value, onChange }: { k: CardKey; value: Card; onChange: (c: Card) => void }) {
  const { t } = useI18n();
  const [link, setLink] = useState('');
  const done = (value.text ?? '').trim().length > 0;
  const addLink = () => {
    const v = link.trim();
    if (!/^https?:\/\//i.test(v)) return;
    onChange({ ...value, links: [...(value.links ?? []), v].slice(0, 10) });
    setLink('');
  };
  return (
    <div className="card col g12">
      <div className="row between">
        <span className={`kind ${k === 'scene' ? '' : 'kind-logodeck'}`}>{t(`ask.card.${k}`)}</span>
        <span className={`chip ${done ? 'c-approved' : k === 'scene' ? 'c-draft' : 'c-prod'}`}>{done ? t('ask.done') : k === 'scene' ? t('ask.optional') : t('ask.needed')}</span>
      </div>
      <label className="h3" htmlFor={`card-${k}`}>{t(`ask.q.${k}`)}</label>
      <textarea id={`card-${k}`} className="input" style={{ height: 110, padding: '12px 16px', resize: 'vertical' }}
        placeholder={t(`ask.ph.${k}`)} value={value.text ?? ''} onChange={(e) => onChange({ ...value, text: e.target.value })} />
      {(value.links ?? []).map((l) => (
        <div key={l} className="row g8 t-sm">
          <a href={l} target="_blank" rel="noreferrer" className="grow truncate">{l}</a>
          <button className="btn btn-ghost btn-sm" onClick={() => onChange({ ...value, links: (value.links ?? []).filter((x) => x !== l) })} aria-label={t('ask.removeLink')}>✕</button>
        </div>
      ))}
      <div className="row g8">
        <input className="input" style={{ height: 40 }} type="url" placeholder={t('ask.linkPh')} aria-label={t('ask.addLink')}
          value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} />
        <button className="btn btn-secondary btn-sm" onClick={addLink}>{t('ask.addLink')}</button>
      </div>
    </div>
  );
}
