import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { brainName } from '../components/BrainStack';
import type { BrainId } from './taxonomy';

/** A question a Brain left for the client while working (work.ask). The answer is added to the request, like any added detail. */
export function TeamAsk({ brandId, requestId, brain, text }: { brandId: string; requestId: string; brain: BrainId; text: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  async function send() {
    const v = answer.trim();
    if (!v || !user) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'brands', brandId, 'requests', requestId, 'comments'), { author: user.uid, text: `${text}\n→ ${v}`.slice(0, 5000), kind: 'addendum', createdAt: serverTimestamp() });
      setAnswer(''); toast({ text: t('tw.answered'), tone: 'ok' });
    } catch { toast({ text: t('tw.answerError'), tone: 'bad' }); } finally { setBusy(false); }
  }
  return (
    <div className={`tw-ask b-${brain}`}>
      <p className="t-sm m-0"><b>{t('tw.asks', { brain: brainName(brain) })}</b> {text}</p>
      <div className="row g8">
        <input className="input grow" value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={2000} placeholder={t('tw.answerPh')} aria-label={t('tw.answerPh')}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !answer.trim()} onClick={send}>{t('tw.answer')}</button>
      </div>
    </div>
  );
}
