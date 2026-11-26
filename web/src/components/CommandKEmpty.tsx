import { useI18n } from '../i18n/I18nProvider';
import { Icon } from './Icon';

/**
 * Search with no results (UX #13): say what was searched, offer the close term, and two ways out
 * (ask for it, or browse every file) instead of a dead end.
 */
export function CommandKEmpty({ query, suggestion, onSuggest, onAsk, onFiles }: {
  query: string; suggestion: string | null; onSuggest: (s: string) => void; onAsk?: () => void; onFiles?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="col g8" style={{ padding: '0.75rem' }}>
      <p className="t-sm">
        {t('search.none', { q: query.trim() })}
        {suggestion && <> {t('search.didYouMean')} <button type="button" className="w7" onClick={() => onSuggest(suggestion)}
          style={{ background: 'none', border: 0, padding: 0, color: 'var(--azul)', cursor: 'pointer', font: 'inherit', fontWeight: 700 }}>{suggestion}</button>?</>}
      </p>
      {(onAsk || onFiles) && <p className="label" style={{ marginTop: '0.25rem' }}>{t('search.alsoCan')}</p>}
      {onAsk && <button type="button" className="menu-item w-full text-left" style={{ border: 0, cursor: 'pointer' }} onClick={onAsk}>
        <Icon name="plus" size={16} /><span className="grow">{t('search.askInstead')}</span>
      </button>}
      {onFiles && <button type="button" className="menu-item w-full text-left" style={{ border: 0, cursor: 'pointer' }} onClick={onFiles}>
        <Icon name="folder" size={16} /><span className="grow">{t('search.allFiles')}</span>
      </button>}
    </div>
  );
}
