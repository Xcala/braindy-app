import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { createRequest } from '../requests/api';
import type { AttachedFile } from '../requests/types';

export type Draft = { title: string; text: string; due: string | null; links?: string[]; category?: string };

const dayLabel = (iso: string, lang: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * A request the assistant drafted. Nothing is sent until the person taps «Send request»; «Edit» lets them fix the
 * title, the text and the date first. Once sent it links to the request.
 */
export function DraftCard({ brandId, draft, files, sentId, onSent, onClose }: { brandId: string; draft: Draft; files?: AttachedFile[]; sentId?: string; onSent: (id: string, d: Draft) => void; onClose?: () => void }) {
  const { t, lang } = useI18n();
  const [d, setD] = useState(draft);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function send() {
    if (!d.title.trim() || !d.text.trim()) return;
    setBusy(true); setError(false);
    try {
      const { requestId } = await createRequest(brandId, { title: d.title.trim(), ...(d.category ? { category: d.category } : {}), cards: { product: { text: d.text.trim(), links: d.links ?? [], files: files ?? [] } }, dueDate: d.due ?? '', source: 'assistant' }) as { requestId: string };
      onSent(requestId, d);
    } catch { setError(true); } finally { setBusy(false); }
  }

  if (sentId) {
    return (
      <div className="help-draft is-sent" role="status">
        <span className="help-draft-tag">✓ {t('help.draftSent')}</span>
        <b>{d.title}</b>
        <Link className="btn btn-secondary btn-sm" to={`/requests/${sentId}`} onClick={onClose}>{t('help.draftOpen')}</Link>
      </div>
    );
  }

  return (
    <div className="help-draft" aria-label={t('help.draftTag')}>
      <span className="help-draft-tag">{t('help.draftTag')}</span>
      {edit ? (
        <>
          <label className="col g4"><span className="t-xs w7">{t('help.draftTitle')}</span>
            <input className="input" value={d.title} maxLength={120} onChange={(e) => setD({ ...d, title: e.target.value })} /></label>
          <label className="col g4"><span className="t-xs w7">{t('help.draftWhat')}</span>
            <textarea className="input" rows={4} value={d.text} maxLength={3000} onChange={(e) => setD({ ...d, text: e.target.value })} /></label>
          <label className="col g4"><span className="t-xs w7">{t('help.draftDue')}</span>
            <input className="input" type="date" value={d.due ?? ''} onChange={(e) => setD({ ...d, due: e.target.value || null })} /></label>
        </>
      ) : (
        <>
          <b>{d.title}</b>
          <p>{d.text}</p>
          <span className="t-xs t-mute">{d.due ? `${t('help.draftDue')}: ${dayLabel(d.due, lang)}` : t('help.draftNoDue')}</span>
          {!!d.links?.length && <span className="t-xs t-mute" style={{ overflowWrap: 'anywhere' }}>🔗 {d.links.join(' · ')}</span>}
          {!!files?.length && <span className="t-xs t-mute">📎 {files.map((x) => x.name).join(', ')}</span>}
        </>
      )}
      {error && <p className="t-xs" style={{ color: 'var(--rojo, #C62828)' }}>{t('help.draftError')}</p>}
      <div className="row g8">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !d.title.trim() || !d.text.trim()} onClick={() => void send()}>{busy ? t('help.draftSending') : t('help.draftSend')}</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEdit((e) => !e)} aria-pressed={edit}>{edit ? t('help.draftDone') : t('help.draftEdit')}</button>
      </div>
    </div>
  );
}
