import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { createRequest } from './api';
import type { BrandRequest, Version } from './types';

const FORMATS = ['story', 'feed', 'square', 'landscape', 'linkedin', 'banner', 'print', 'whatsapp'] as const;

/**
 * «Adapt to every format» on an approved piece: the client ticks the places it should run, and a new request goes
 * to Creator (social › content adaptation) pointing at the approved version, whose files the team starts from.
 */
export function AdaptDialog({ brandId, r, v, onClose }: { brandId: string; r: BrandRequest; v: Version; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [picked, setPicked] = useState<Set<string>>(new Set(['story', 'feed', 'square']));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [onClose]);
  const toggle = (f: string) => setPicked((s) => { const n = new Set(s); if (n.has(f)) n.delete(f); else n.add(f); return n; });

  async function send() {
    setBusy(true); setError(false);
    const list = FORMATS.filter((f) => picked.has(f)).map((f) => `- ${t(`ad.f.${f}`)}`).join('\n');
    const text = `${t('ad.title', { title: r.title })} (v${v.n}).\n\n${t('ad.pick')}:\n${list}${note.trim() ? `\n\n${note.trim()}` : ''}`;
    try {
      const res = await createRequest(brandId, {
        title: t('ad.reqTitle', { title: r.title }).slice(0, 160), category: 'social', subcategory: 'organic', formatType: lang === 'es' ? 'Adaptación de contenido' : 'Content adaptation',
        cards: { product: { text, links: [`${location.origin}/requests/${r.id}?brand=${brandId}`] } },
        dueDate: null, from: { requestId: r.id, versionId: v.id },
      });
      setDone(res.requestId);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal w-full max-w-[32.5rem]" role="dialog" aria-modal="true" aria-labelledby="adapt-title">
        <h2 className="h3" id="adapt-title">{t('ad.title', { title: r.title })}</h2>
        {done ? (
          <>
            <p className="row g8"><Icon name="check" />{t('ad.sent')}</p>
            <div className="row g12" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose}>{t('lb.close')}</button>
              <Link className="btn btn-primary" to={`/requests/${done}`} onClick={onClose}>{t('ad.see')}</Link>
            </div>
          </>
        ) : (
          <>
            <p className="t-sm t-mute">{t('ad.lead')}</p>
            <fieldset className="col g8" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="label" style={{ marginBottom: '0.5rem' }}>{t('ad.pick')}</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FORMATS.map((f) => (
                  <label key={f} className={`ad-opt${picked.has(f) ? ' is-on' : ''}`}>
                    <input type="checkbox" checked={picked.has(f)} onChange={() => toggle(f)} />
                    <span>{t(`ad.f.${f}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="col g4"><span className="t-sm w7">{t('ad.note')}</span>
              <textarea className="input" rows={3} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} style={{ height: 'auto', paddingTop: '0.625rem' }} />
            </label>
            {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('ad.error')}</p>}
            <div className="row g12" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={busy || !picked.size} onClick={send}>{t('ad.send', { n: picked.size })}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
