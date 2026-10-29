import { useRef, useState, type ReactNode } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nProvider';

/** An image in the editor: one already saved (url) or one just picked (base64), with a preview. */
export type Img = { url?: string; base64?: string; name?: string; preview: string };
export const fromUrl = (url?: string | null): Img | null => (url ? { url, preview: url } : null);
export const toSrc = (i: Img) => (i.base64 ? { base64: i.base64, name: i.name } : { url: i.url });

const MAX = 15 * 1024 ** 2;
export function readImage(file: File): Promise<Img> {
  return new Promise((res, rej) => {
    if (!file.type.startsWith('image/')) return rej(new Error(`${file.name}: no es una imagen`));
    if (file.size > MAX) return rej(new Error(`${file.name}: pasa de 15 MB`));
    const r = new FileReader();
    r.onload = () => res({ base64: String(r.result).split(',')[1], name: file.name, preview: URL.createObjectURL(file) });
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

/** Saves one section through the same backend logic the Braindy connector uses. */
export function useSave(brandId: string) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const save = async (body: Record<string, unknown>) => {
    setState('busy'); setError('');
    try { await api(`/v1/admin/brands/${brandId}/identity`, { method: 'POST', body: JSON.stringify(body) }); setState('done'); }
    catch (e) { setError((e as Error).message); setState('error'); }
  };
  return { state, error, save };
}

export function SaveBar({ state, error, onSave }: { state: string; error: string; onSave: () => void }) {
  const { t } = useI18n();
  return (
    <div className="row between g12 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
      <span className="t-sm" role="status" style={{ color: state === 'error' ? 'var(--danger)' : 'var(--success)' }}>
        {state === 'done' ? t('be.saved') : state === 'error' ? t('be.error', { e: error }) : ''}
      </span>
      <button type="button" className="btn btn-primary" disabled={state === 'busy'} onClick={onSave}>{state === 'busy' ? t('be.saving') : t('be.save')}</button>
    </div>
  );
}

/** A file button that hands back images (one or several). */
export function PickImages({ multiple, onPick, children, onError }: { multiple?: boolean; onPick: (imgs: Img[]) => void; children: ReactNode; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => ref.current?.click()}>{children}</button>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} className="sr" tabIndex={-1}
        onChange={async (e) => {
          try { onPick(await Promise.all([...(e.target.files ?? [])].map(readImage))); } catch (err) { onError((err as Error).message); }
          e.target.value = '';
        }} />
    </>
  );
}

export function Thumb({ img, onRemove, children }: { img: Img; onRemove: () => void; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="col g8" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 10, background: '#fff' }}>
      <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-conic-gradient(#EEF0F4 0% 25%, #fff 0% 50%) 50% / 16px 16px', borderRadius: 10 }}>
        <img src={img.preview} alt="" style={{ maxWidth: '90%', maxHeight: 96, objectFit: 'contain' }} />
      </div>
      {children}
      <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>{t('be.remove')}</button>
    </div>
  );
}

export const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
export const commas = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
