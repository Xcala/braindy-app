import { useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AccessRow } from '../accesses/AccessRow';
import { AccessForm } from '../accesses/AccessForm';
import { useAccessLog, useAccesses, type Access } from '../accesses/useAccesses';

/** Accesses (design 07): encrypted credentials, reveal on demand, read-only access log. */
export function Accesses() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const { list, loading, denied } = useAccesses(current?.id);
  const log = useAccessLog(denied ? undefined : current?.id);
  const [editing, setEditing] = useState<Access | null | 'new'>(null);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const when = (d?: Date) => {
    if (!d) return '';
    const today = new Date().toDateString() === d.toDateString();
    return today ? d.toLocaleTimeString(lang === 'es' ? 'es-CO' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="col g32">
      <div className="row between g16 wrap">
        <div className="col g8">
          <p className="label">{current.name}</p>
          <h1 className="h1">{t('nav.accesses')}</h1>
          <p className="t-mute">{t('acc.tagline')}</p>
        </div>
        {!denied && <button className="btn btn-primary" onClick={() => setEditing('new')}>{t('acc.addAccess')}</button>}
      </div>

      {denied ? <div className="card t-mute">{t('acc.ownersOnly')}</div> : (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="table overflow-x-auto">
            <div className="trow head label min-w-[640px]" style={{ gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr) minmax(0,1.3fr)' }}>
              <span>{t('acc.platform')}</span><span>{t('acc.user')}</span><span>{t('acc.password')}</span>
            </div>
            {loading && <p className="t-sm t-mute" style={{ padding: 16 }}>{t('common.loading')}…</p>}
            {!loading && list.length === 0 && <p className="t-sm t-mute" style={{ padding: 16 }}>{t('acc.empty')}</p>}
            {list.map((a) => <AccessRow key={a.id} brandId={current.id} a={a} onEdit={() => setEditing(a)} />)}
          </div>
          <aside className="col g16">
            <div className="card col g12">
              <h2 className="h3">{t('acc.log')}</h2>
              {log.length === 0 && <p className="t-sm t-mute">{t('acc.logEmpty')}</p>}
              {log.map((e) => (
                <div key={e.id} className="row between g8 t-sm">
                  <span className="truncate"><span className="w7">{e.byName}</span> {t(`acc.action.${e.action}`)} {e.platform}</span>
                  <span className="t-xs t-mute whitespace-nowrap">{when(e.at?.toDate())}</span>
                </div>
              ))}
              <p className="t-xs t-mute">{t('acc.logNote')}</p>
            </div>
            <div className="card col g8">
              <h2 className="h3">{t('acc.howTitle')}</h2>
              <p className="t-sm t-mute">{t('acc.howBody')}</p>
            </div>
          </aside>
        </div>
      )}
      {editing && <AccessForm brandId={current.id} editing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
