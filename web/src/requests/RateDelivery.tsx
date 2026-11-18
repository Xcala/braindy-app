import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { RequestComment } from './types';

/** After approving, the client rates the piece 1–5 and can say a word to the team (Karol's wish): a comment of kind
 *  "rating" on the version, so the admin sees it in the thread and the Brand Brain can read it. */
export function RateDelivery({ brandId, requestId, versionId, comments }: { brandId: string; requestId: string; versionId: string; comments: RequestComment[] }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const mine = comments.find((c) => c.kind === 'rating' && c.versionId === versionId && c.author === user?.uid);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [praise, setPraise] = useState('');
  const [busy, setBusy] = useState(false);
  if (mine) return <p className="t-sm" style={{ margin: 0 }}>{'★'.repeat(mine.rating ?? 0)} {t('kw.rated', { n: mine.rating ?? 0 })}</p>;
  async function send() {
    if (!stars || !user) return;
    setBusy(true);
    try {
      const head = t('kw.ratingText', { n: stars });
      await addDoc(collection(db, 'brands', brandId, 'requests', requestId, 'comments'), {
        author: user.uid, kind: 'rating', rating: stars, versionId, createdAt: serverTimestamp(),
        text: `${'★'.repeat(stars)} ${head}${praise.trim() ? `\n${praise.trim().slice(0, 1000)}` : ''}`,
      });
    } finally { setBusy(false); }
  }
  const shown = hover || stars;
  return (
    <div className="col g8">
      <span className="t-sm w7">{t('kw.rateTitle')}</span>
      <div className="row g4" role="radiogroup" aria-label={t('kw.rateTitle')} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={t('kw.rateStar', { n })}
            onMouseEnter={() => setHover(n)} onClick={() => setStars(n)}
            style={{ background: 'none', border: 0, cursor: 'pointer', padding: '0.125rem', fontSize: '1.5rem', lineHeight: 1, color: n <= shown ? '#F5B301' : 'var(--line)' }}>★</button>
        ))}
      </div>
      {stars > 0 && <>
        <input className="input" value={praise} maxLength={1000} onChange={(e) => setPraise(e.target.value)} placeholder={t('kw.praisePh')} aria-label={t('kw.praisePh')} />
        <button type="button" className="btn btn-primary btn-sm self-start" disabled={busy} onClick={send}>{t('kw.rateBtn')}</button>
      </>}
    </div>
  );
}
