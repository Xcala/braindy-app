import { useI18n } from '../i18n/I18nProvider';
import type { BrandRequest } from './types';

/** Admin: the brand check the team ran on its own work before delivering (server/brains/quality.ts). */
export function QualityCard({ q }: { q: NonNullable<BrandRequest['quality']> }) {
  const { t } = useI18n();
  const failed = q.checks.filter((c) => !c.ok);
  return (
    <details className="card col g8" open={!q.passed}>
      <summary className="row between g8 wrap" style={{ cursor: 'pointer', listStyle: 'none' }}>
        <span className="w7">{t('qc.title')}</span>
        <span className="row g8">
          <span className={`chip ${q.passed ? 'c-approved' : 'c-approve'}`}>{q.passed ? t('qc.passed') : t('qc.failed')}</span>
          <span className="w7">{q.score}/100</span>
        </span>
      </summary>
      <p className="t-xs t-mute">{t('qc.sub', { n: q.round })}</p>
      <ul className="col g4" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
        {[...failed, ...q.checks.filter((c) => c.ok)].map((c) => (
          <li key={c.id} className="row g8 t-sm" style={{ alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={{ color: c.ok ? 'var(--success)' : 'var(--danger)', fontWeight: 900 }}>{c.ok ? '✓' : '✕'}</span>
            <span className="col min-w-0"><span>{c.text}{c.critical && !c.ok ? <b> · {t('qc.critical')}</b> : null}</span>{c.note ? <span className="t-xs t-mute">{c.note}</span> : null}</span>
            <span className="sr-only">{c.ok ? t('qc.passed') : t('qc.failed')}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
