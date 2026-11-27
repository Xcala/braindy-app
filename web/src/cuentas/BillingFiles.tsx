import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { cuentasApi, openUrl, readAsDataUrl, type BillingFile } from './api';
import './cuentas.css';

const MAX = 8 * 1024 * 1024;
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** NickMark's documents for the client's accounting (RUT, bank certificate, annexes…). The admin uploads several at
 *  once and removes them; billing people of the brand download them. Hidden for the client when there are none. */
export function BillingFiles({ brandId, admin, bare, onCount }: { brandId: string; admin?: boolean; bare?: boolean; onCount?: (n: number) => void }) {
  const { t } = useI18n();
  const [files, setFiles] = useState<BillingFile[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [removing, setRemoving] = useState<BillingFile | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const load = useCallback(() => (admin ? cuentasApi.adminFiles(brandId) : cuentasApi.files(brandId)).then((r) => { setFiles(r.files); onCount?.(r.files.length); }).catch(() => setFiles([])), [brandId, admin, onCount]);
  useEffect(() => { void load(); }, [load]);

  async function upload(list: FileList | null) {
    const all = [...(list ?? [])];
    if (!all.length) return;
    setMsg(null);
    const skipped = all.filter((f) => f.size > MAX || !/^(application\/pdf|image\/(png|jpeg))$/.test(f.type));
    const ok = all.filter((f) => !skipped.includes(f));
    let done = 0;
    for (const f of ok) {
      setBusy(t('cc.f.uploading', { i: String(done + 1), n: String(ok.length) }));
      try { await cuentasApi.addFile(brandId, await readAsDataUrl(f), f.name); done++; } catch { skipped.push(f); }
    }
    setBusy(null);
    if (input.current) input.current.value = '';
    setMsg(skipped.length ? t('cc.f.skipped', { list: skipped.map((f) => f.name).join(', ') }) : t('cc.f.added', { n: String(done) }));
    void load();
  }

  if (files === null || (!admin && !files.length)) return null;
  return (
    <section className={`${bare ? '' : 'card '}col g12`} aria-label={t('cc.f.title')}>
      <div className="row between g12 wrap">
        <div className="col g2">{!bare && <h3 className="w7" style={{ margin: 0 }}>{t('cc.f.title')}</h3>}<p className="t-sm t-mute" style={{ margin: 0 }}>{t(admin ? 'cc.f.leadAdmin' : 'cc.f.lead')}</p></div>
        {admin && (
          <label className={`btn btn-secondary btn-sm ${busy ? 'is-disabled' : ''}`}>
            {busy ?? t('cc.f.add')}
            <input ref={input} type="file" multiple accept="application/pdf,image/png,image/jpeg" className="sr-only" disabled={!!busy} onChange={(e) => void upload(e.target.files)} />
          </label>
        )}
      </div>
      {msg && <p className="t-sm" role="status">{msg}</p>}
      {files.length === 0 ? <p className="t-sm t-mute" style={{ margin: 0 }}>{t('cc.f.empty')}</p> : (
        <ul className="col" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {files.map((f) => (
            <li key={f.id} className="cc-to" style={{ gridTemplateColumns: '1.75rem minmax(0,1fr) auto' }}>
              <span className="cc-to-ico" aria-hidden="true">{f.type === 'application/pdf' ? 'PDF' : 'IMG'}</span>
              <span className="col" style={{ minWidth: 0 }}><span className="t-sm w7" style={{ overflowWrap: 'anywhere' }}>{f.name}</span><span className="t-xs t-mute">{kb(f.size)}</span></span>
              <span className="row g8">
                <button className="btn btn-ghost btn-sm" onClick={() => openUrl(admin ? cuentasApi.adminFile(brandId, f.id) : cuentasApi.file(brandId, f.id))}>{t('cc.f.download')}</button>
                {admin && <button className="btn btn-ghost btn-sm" aria-label={t('cc.f.removeOne', { name: f.name })} onClick={() => setRemoving(f)}>{t('cc.f.remove')}</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {removing && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setRemoving(null)}>
          <div className="modal w-full max-w-[26rem] col g12" role="dialog" aria-modal="true" aria-labelledby="cc-rm-h">
            <h2 className="h2" id="cc-rm-h">{t('cc.f.removeQ')}</h2>
            <p className="t-sm">{t('cc.f.removeLead', { name: removing.name })}</p>
            <div className="row g12" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setRemoving(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={() => { const f = removing; setRemoving(null); void cuentasApi.removeFile(brandId, f.id).then(load); }}>{t('cc.f.remove')}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
