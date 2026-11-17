import { useState } from 'react';
import type { Brand } from '../BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import type { BrandVersion } from './useBrandVersions';
import { NewVersionDialog } from './NewVersionDialog';

/**
 * Top of Mi marca on a rebranded brand: the current version and the earlier ones as chips; an earlier one opens
 * read-only. The admin also gets «New brand version» here (for brands never rebranded, only that button shows).
 * In Deliveries (Files, Apps) the same bar shows the work of each version; there it never opens a new one.
 */
export function VersionBar({ brand, versions, viewing, onView, isAdmin = false, work = false }: {
  brand: Brand; versions: BrandVersion[]; viewing: string | null; onView: (id: string | null) => void; isAdmin?: boolean; work?: boolean;
}) {
  const { t, lang } = useI18n();
  const [asking, setAsking] = useState(false);
  const year = (d: Date | null) => (d ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', year: 'numeric' }).format(d) : '');
  const old = versions.find((v) => v.id === viewing);
  if (!versions.length && !isAdmin) return null;
  return (
    <div className="col g12">
      <div className="row g8 wrap" style={{ alignItems: 'center' }}>
        {versions.length > 0 && (
          <div className="seg seg-scroll" role="group" aria-label={t('ver.bar')}>
            <button type="button" className={viewing ? '' : 'is-on'} aria-pressed={!viewing} onClick={() => onView(null)}>
              {brand.name} · {t('ver.current')}
            </button>
            {versions.map((v) => (
              <button key={v.id} type="button" className={viewing === v.id ? 'is-on' : ''} aria-pressed={viewing === v.id} onClick={() => onView(v.id)}>
                {v.name} · {v.from ? t('ver.range', { from: year(v.from), to: year(v.to) }) : t('ver.until', { date: year(v.to) })}
              </button>
            ))}
          </div>
        )}
        {isAdmin && !viewing && <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setAsking(true)}>{t('ver.new')}</button>}
      </div>
      {old && (
        <div className="card row g12 wrap between" role="status" style={{ padding: '0.75rem 1rem' }}>
          <span className="t-sm">{t(work ? 'ver.viewingWork' : 'ver.viewing', { name: old.name })}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onView(null)}>{t('ver.backToCurrent')}</button>
        </div>
      )}
      {asking && <NewVersionDialog brand={brand} onClose={() => setAsking(false)} />}
    </div>
  );
}

/** Admin, in My brand's page head: «New brand version» with its dialog. */
export function NewVersionButton({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setAsking(true)}>{t('ver.new')}</button>
      {asking && <NewVersionDialog brand={brand} onClose={() => setAsking(false)} />}
    </>
  );
}
