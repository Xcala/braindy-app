import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Scan } from '../components/Scan';
import { KIND_COLOR, type Resource } from './useResources';
import { KindBadge, ResourceActions } from './ResourceItem';

/** A resource up close: what it is for, how to use it, the text to copy and the actions. */
export function ResourceDetail({ r, onClose }: { r: Resource; onClose: () => void }) {
  const { t, lang } = useI18n();
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  const how = r.howTo?.[lang] || r.howTo?.es;
  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-[680px] res-detail" role="dialog" aria-modal="true" aria-labelledby="res-d-title">
        <div className="row g12" style={{ alignItems: 'flex-start' }}>
          <KindBadge kind={r.kind} big />
          <span className="col g4 grow" style={{ minWidth: 0 }}>
            <span className="t-xs w7" style={{ color: KIND_COLOR[r.kind] }}>{t(`res.kind.${r.kind}`)}</span>
            <h2 className="h2" id="res-d-title">{r.title[lang] || r.title.es}</h2>
          </span>
          <button type="button" className="help-x" aria-label={t('res.close')} onClick={onClose}>×</button>
        </div>
        <p className="t-md">{r.summary[lang] || r.summary.es}</p>
        {how && <div className="col g8"><p className="label">{t('res.howTo')}</p><Scan text={how} points tone="ink" /></div>}
        {r.body && <pre className="res-body">{r.body}</pre>}
        {r.tags.length > 0 && <span className="row g6 wrap">{r.tags.map((x) => <span key={x} className="res-tag">{x}</span>)}</span>}
        <ResourceActions r={r} primary />
      </div>
    </div>
  );
}
