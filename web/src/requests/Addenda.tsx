import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import type { RequestComment } from './types';
import { useDraft } from '../lib/useDraft';

/** Details added to a request after it was sent (Karol's wish): comments of kind "addendum", listed under the brief
 *  and beside Approve. The worker reads them with the rest of the comments. */
export function AddendaList({ items }: { items: RequestComment[] }) {
  const { t, lang } = useI18n();
  if (!items.length) return null;
  return (
    <div className="col g8">
      <p className="scan-head" style={{ margin: 0 }}>{t('kw.addenda')}</p>
      <ul className="col g8" style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {items.map((c) => (
          <li key={c.id} className="t-sm" style={{ whiteSpace: 'pre-line' }}>
            {c.text} <span className="t-xs t-mute">· {c.createdAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AddendumForm({ brandId, requestId }: { brandId: string; requestId: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [text, setText] = useDraft(`addendum:${brandId}:${requestId}`);
  const [busy, setBusy] = useState(false);
  async function add() {
    const v = text.trim();
    if (!v || !user) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'brands', brandId, 'requests', requestId, 'comments'), { author: user.uid, text: v.slice(0, 5000), kind: 'addendum', createdAt: serverTimestamp() });
      setText(''); toast({ text: t('kw.added'), tone: 'ok' });
    } finally { setBusy(false); }
  }
  return (
    <div className="col g8">
      <label htmlFor="addendum" className="t-sm w7">{t('kw.addTitle')}</label>
      <textarea id="addendum" className="input" rows={2} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('kw.addPh')} />
      <button type="button" className="btn btn-secondary btn-sm self-start" disabled={busy || !text.trim()} onClick={add}>{t('kw.addBtn')}</button>
    </div>
  );
}
