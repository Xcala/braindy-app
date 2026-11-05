import { useI18n } from '../i18n/I18nProvider';
import { findCategory, findSub } from './taxonomy';
import { dayLabel } from '../lib/dates';
import { VersionNotes } from './VersionNotes';
import { AttachedFiles } from './AttachedFiles';
import type { BrandRequest } from './types';
import './viewer.css';

/** The brief made to scan, like the delivery notes: the facts first (type, format, language, date), then each card. */
export function BriefSummary({ brandId, r }: { brandId: string; r: BrandRequest }) {
  const { t, lang } = useI18n();
  const type = [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang], r.formatType].filter(Boolean).join(' · ');
  const facts: Array<[string, string | undefined]> = [
    [t('brief.type'), type], [t('ask.format'), r.format], [t('ask.language'), r.language],
    [t('brief.due'), r.dueDate ? dayLabel(r.dueDate, lang) : undefined],
  ];
  const cards = (['product', 'application', 'scene'] as const).filter((k) => k === 'product' || r.cards?.[k]?.text || r.cards?.[k]?.links?.length);
  return (
    <div className="card card-tight col g16">
      <div className="vn t-sm">
        <p className="vn-head">{t('brief.glance')}</p>
        <ul className="vn-list">
          {facts.filter(([, v]) => v).map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}
        </ul>
      </div>
      {cards.map((k) => (
        <div key={k} className="col g8">
          <p className="vn-head" style={{ margin: 0 }}>{k === 'product' ? t('brief.ask') : t(`ask.card.${k}`)}</p>
          {r.cards?.[k]?.text ? <VersionNotes text={r.cards[k]!.text!} /> : <p className="t-sm t-mute" style={{ margin: 0 }}>{t(`req.emptyCard.${k}`)}</p>}
          {(r.cards?.[k]?.links ?? []).map((l) => <a key={l} href={l} target="_blank" rel="noreferrer" className="t-sm truncate">{l}</a>)}
          {k === 'product' && <AttachedFiles brandId={brandId} files={r.cards?.product?.files} />}
        </div>
      ))}
    </div>
  );
}
