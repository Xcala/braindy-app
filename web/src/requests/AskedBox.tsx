import { useI18n } from '../i18n/I18nProvider';
import { VersionNotes } from './VersionNotes';
import { AddendaList } from './Addenda';
import type { BrandRequest, RequestComment } from './types';

/** What the client asked for, right above Approve, so the piece is checked against the request (Karol's wish). */
export function AskedBox({ r, addenda }: { r: BrandRequest; addenda: RequestComment[] }) {
  const { t } = useI18n();
  const text = r.cards?.product?.text;
  if (!text && !addenda.length) return null;
  return (
    <details className="col g8" open style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', border: '1px solid var(--line)' }}>
      <summary className="t-sm w7" style={{ cursor: 'pointer' }}>{t('kw.asked')} <span className="t-xs t-mute w4">· {t('kw.askedSub')}</span></summary>
      <div className="col g12" style={{ marginTop: '0.5rem', maxHeight: '14rem', overflowY: 'auto' }}>
        {text && <VersionNotes text={text} />}
        <AddendaList items={addenda} />
      </div>
    </details>
  );
}
