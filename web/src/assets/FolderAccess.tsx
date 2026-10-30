import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import type { Brand } from '../brands/BrandProvider';
import { formatBytes } from './fileApi';

type Folder = { path: string; files: number; bytes: number };

/** NickMark only: which top-level folders the client sees in My files. Enforced by the rules and the file server. */
export function FolderAccess({ brand, folders, onClose }: { brand: Brand; folders: Folder[]; onClose: () => void }) {
  const { t } = useI18n();
  const tops = folders.filter((f) => f.path && !f.path.includes('/'));
  const hasRoot = folders.some((f) => f.path === '' && f.files > 0);
  const [mode, setMode] = useState<'all' | 'selected'>(brand.fileAccess?.mode ?? 'all');
  const [picked, setPicked] = useState<Set<string>>(new Set(brand.fileAccess?.folders ?? []));
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const toggle = (p: string) => setPicked((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });

  async function save() {
    setState('busy');
    try {
      await updateDoc(doc(db, 'brands', brand.id), { fileAccess: { mode, folders: mode === 'selected' ? [...picked] : [] } });
      setState('done');
    } catch { setState('error'); }
  }
  const row = (key: string, label: string, sub: string) => (
    <label key={key || '__root'} className="row g12" style={{ padding: '10px 4px', borderTop: '1px solid var(--line)', cursor: 'pointer', opacity: mode === 'all' ? 0.5 : 1 }}>
      <input type="checkbox" disabled={mode === 'all' || key === 'Uploads'} checked={mode === 'all' || key === 'Uploads' || picked.has(key)} onChange={() => toggle(key)} style={{ width: 18, height: 18 }} />
      <span className="col grow" style={{ minWidth: 0 }}><span className="w7 truncate">{label}</span><span className="t-xs t-mute">{sub}</span></span>
    </label>
  );

  return (
    <div className="card col g12" style={{ borderColor: 'var(--azul)' }} role="region" aria-labelledby="h-access">
      <div className="row between g8 wrap">
        <h2 className="h3" id="h-access">{t('fa.title')}</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>{t('be.close')}</button>
      </div>
      <p className="t-sm t-mute">{t('fa.sub', { name: brand.name })}</p>
      <div className="seg self-start" role="radiogroup">
        <button type="button" role="radio" aria-checked={mode === 'all'} className={mode === 'all' ? 'is-on' : ''} onClick={() => setMode('all')}>{t('fa.all')}</button>
        <button type="button" role="radio" aria-checked={mode === 'selected'} className={mode === 'selected' ? 'is-on' : ''} onClick={() => setMode('selected')}>{t('fa.selected')}</button>
      </div>
      <div className="col">
        {row('Uploads', 'Uploads', t('fa.uploadsAlways'))}
        {tops.map((f) => row(f.path, f.path, `${formatBytes(f.bytes)}`))}
        {hasRoot && row('', t('fa.root'), t('fa.rootSub'))}
      </div>
      <div className="row between g12 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
        <span className="t-sm" role="status" style={{ color: state === 'error' ? 'var(--danger)' : 'var(--success)' }}>
          {state === 'done' ? t('fa.saved', { n: String(mode === 'all' ? tops.length : picked.size) }) : state === 'error' ? t('fa.error') : mode === 'selected' && picked.size === 0 ? t('fa.none') : ''}
        </span>
        <button type="button" className="btn btn-primary btn-sm" disabled={state === 'busy'} onClick={save}>{t('be.save')}</button>
      </div>
    </div>
  );
}
