import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { NoticeResult } from '../review/NoticeResult';
import type { Notice } from '../review/api';
import type { BrandRequest } from './types';

/** «Para tu ojo»: a version the team uploaded that waits for NickMark before the client sees it (server/connector/lanes.ts). */
export function EyeBanner({ brandId, r, onShow }: { brandId: string; r: BrandRequest; onShow: (versionId: string) => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [adjust, setAdjust] = useState(false);
  const [note, setNote] = useState(r.held?.note ?? '');
  const [notice, setNotice] = useState<Notice | null>(null);
  const held = r.held;
  if (!held) return notice ? <NoticeResult notice={notice} /> : null;

  async function send() {
    setBusy(true); setError(false);
    try {
      const out = await api<{ notice?: Notice }>(`/v1/admin/brands/${brandId}/requests/${r.id}/versions/${held!.versionId}/publish`, { method: 'POST', body: '{}' });
      setNotice(out.notice ?? null);
    } catch { setError(true); } finally { setBusy(false); }
  }
  async function save() {
    if (!note.trim()) return;
    setBusy(true); setError(false);
    try { await updateDoc(doc(db, 'brands', brandId, 'requests', r.id), { 'held.note': note.trim().slice(0, 1000) }); setAdjust(false); }
    catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <section className="card card-tight col g12" style={{ borderColor: '#F5B301', background: 'color-mix(in srgb, #F5B301 8%, var(--card, #fff))' }} aria-label={t('eye.title')}>
      <div className="row between g8 wrap">
        <strong>👀 {t('eye.title')} · {held.versionId}</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onShow(held.versionId)}>{t('eye.see')}</button>
      </div>
      <p className="t-sm t-mute" style={{ margin: 0 }}>{t('eye.hint', { why: held.why ?? '' })}</p>
      {held.note && !adjust && <p className="t-sm" style={{ margin: 0 }}><strong>{t('eye.asked')}</strong> {held.note}</p>}
      {adjust && (
        <div className="field">
          <label htmlFor="eye-note">{t('eye.noteLabel')}</label>
          <textarea id="eye-note" className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('eye.notePh')} />
        </div>
      )}
      <div className="row g8 wrap">
        {adjust
          ? <><button type="button" className="btn btn-primary" disabled={busy || !note.trim()} onClick={() => void save()}>{t('eye.saveNote')}</button><button type="button" className="btn btn-ghost" onClick={() => setAdjust(false)}>{t('eye.back')}</button></>
          : <><button type="button" className="btn btn-primary" disabled={busy} onClick={() => void send()}>{busy ? '…' : t('eye.send')}</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setAdjust(true)}>{t('eye.adjust')}</button></>}
      </div>
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)', margin: 0 }}>{t('eye.error')}</p>}
    </section>
  );
}
