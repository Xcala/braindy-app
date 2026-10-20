import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { Notice } from './api';

/** What happened with the review link after a delivery: sent, or a WhatsApp link for Nicolas to send. */
export function NoticeResult({ notice }: { notice: Notice }) {
  const { t } = useI18n();
  if (notice.status === 'sent') return <p className="t-sm" role="status" style={{ color: 'var(--success)' }}>{t('rev.sent')}</p>;
  if (notice.status === 'manual' && notice.waUrl) return (
    <div className="row g12 wrap" role="status">
      <span className="t-sm">{t('rev.manual')}</span>
      <a className="btn btn-secondary btn-sm" href={notice.waUrl} target="_blank" rel="noreferrer">{t('rev.openWhatsapp')}</a>
    </div>
  );
  if (notice.status === 'no_number') return <p className="t-sm t-mute" role="status">{t('rev.noNumber')} <Link to="/settings" className="w7">{t('nav.settings')}</Link></p>;
  if (notice.status === 'off') return <p className="t-sm t-mute" role="status">{t('rev.off')}</p>;
  return <p className="t-sm" role="status" style={{ color: 'var(--danger)' }}>{t('rev.error')}</p>;
}
