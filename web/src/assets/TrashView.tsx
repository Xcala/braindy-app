import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toaster';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes, listTrash, purgeFile, restoreFile, type TrashItem } from './fileApi';

/** NickMark only: files sent to the trash in the last 30 days, to restore or delete for good. */
export function TrashView({ brandId, onBack }: { brandId: string; onBack: () => void }) {
  const { t, lang } = useI18n();
  const [list, setList] = useState<TrashItem[] | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState(false);
  const [purge, setPurge] = useState<TrashItem | null>(null);
  const closePurge = useCallback(() => setPurge(null), []);
  const toast = useToast();
  const load = useCallback(() => listTrash(brandId).then((r) => { setList(r.files); setDays(r.days); }).catch(() => setError(true)), [brandId]);
  useEffect(() => { void load(); }, [load]);
  const act = (p: Promise<unknown>, ok: string) => { setError(false); p.then(() => { toast({ text: ok }); return load(); }).catch(() => setError(true)); };
  const left = (ms: number | null) => (ms ? Math.max(0, days - Math.floor((Date.now() - ms) / 864e5)) : days);

  return (
    <div className="col g16">
      <div className="row between g8 wrap">
        <div className="col g4">
          <p className="label">{t('files.trash')}{list ? ` · ${list.length}` : ''}</p>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t('files.trashSub', { days: String(days) })}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}><Icon name="arrowLeft" size={14} /> {t('files.back')}</button>
      </div>
      {error && <p role="alert" className="t-sm" style={{ color: 'var(--danger)' }}>{t('files.actionError')}</p>}
      {!list ? <div className="skel" style={{ height: 120 }} />
        : !list.length ? <div className="empty"><Icon name="trash" size={32} /><p className="t-mute">{t('files.trashEmpty')}</p></div>
        : (
          <div className="list overflow-x-auto">
            {list.map((f) => (
              <div key={f.id} className="lrow trow min-w-[640px]">
                <span className="col" style={{ minWidth: 0 }}>
                  <span className="w7 truncate">{f.title}</span>
                  <span className="t-xs t-mute truncate">{f.folder || t('files.rootFolder')} · {formatBytes(f.size)}</span>
                </span>
                <span className="t-xs t-mute">{lang === 'es' ? `${left(f.trashedAt)} días` : `${left(f.trashedAt)} days`}</span>
                <span className="row g4" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => act(restoreFile(brandId, f.id), t('files.restoredN', { n: '1' }))}><Icon name="restore" size={14} /> {t('files.restore')}</button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                    onClick={() => setPurge(f)}>{t('files.purge')}</button>
                </span>
              </div>
            ))}
          </div>
        )}
      {purge && (
        <ConfirmDialog danger title={t('files.purge')} confirmLabel={t('files.purge')} onCancel={closePurge}
          onConfirm={() => { const f = purge; setPurge(null); act(purgeFile(brandId, f.id), t('files.purged')); }}>
          {t('files.purgeConfirm', { name: purge.title })}
        </ConfirmDialog>
      )}
    </div>
  );
}
