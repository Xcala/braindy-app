import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useAiHealth } from './useAiHealth';

/** Admin Today: a red line when AI calls failed in the last hour, with a way to the AI health page. Silent otherwise. */
export function AiAlert() {
  const { t } = useI18n();
  const { data } = useAiHealth(1);
  const n = data?.totals.failedLastHour ?? 0;
  if (!n) return null;
  return (
    <div className="card row between g12 wrap" role="alert" style={{ background: '#FDECEA', border: 0 }}>
      <span className="w7">⚠ {t('aih.alert', { n })}</span>
      <Link to="/admin/ai" className="btn btn-secondary btn-sm">{t('aih.alertLink')}</Link>
    </div>
  );
}
