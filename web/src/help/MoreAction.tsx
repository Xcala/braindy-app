import { useState } from 'react';
import { Link } from 'react-router';
import { addWish } from '../wishes/useWishes';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { inviteMember } from '../team/membersApi';
import { shareLink, signedUrl } from '../assets/fileApi';
import { BookMeeting } from '../home/BookMeeting';

/** The other actions the assistant can propose (server/src/help/actionsMore.ts). Nothing happens until the button. */
export type MoreCard =
  | { kind: 'act'; act: 'invite'; ref: string; email: string; name: string; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'meeting'; ref: string; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'share'; ref: string; assetId: string; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'remember'; ref: string; topic: 'voice' | 'avoid'; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'reminder'; ref: string; at: string; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'cancel'; ref: string; requestId: string; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'wish'; ref: string; wish: 'improve' | 'fix'; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'eye'; ref: string; brandId: string; brand: string; requestId: string; versionId: string; title: string; text: string; done?: string };
export const MORE = new Set(['invite', 'meeting', 'share', 'remember', 'reminder', 'cancel', 'wish', 'eye']);

export function MoreAction({ brandId, card, onDone }: { brandId: string; card: MoreCard; onDone: (done: string, text: string) => void }) {
  const { t, lang } = useI18n();
  const { profile, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [book, setBook] = useState(false);
  const [link, setLink] = useState('');
  const loc = lang === 'es' ? 'es-CO' : 'en-US';

  async function go() {
    setBusy(true); setError(false);
    try {
      if (card.act === 'invite') { await inviteMember(brandId, card.email, 'client_member', true); onDone('1', card.email); }
      else if (card.act === 'meeting') { setBook(true); }
      else if (card.act === 'share') {
        const url = profile?.role === 'admin' ? (await shareLink(brandId, card.assetId)).url : await signedUrl(brandId, card.assetId);
        setLink(url);
        try { await navigator.clipboard.writeText(url); } catch { /* the link stays visible to copy by hand */ }
        onDone('1', '');
      } else if (card.act === 'remember') {
        await api(`/v1/brands/${brandId}/brain/teach`, { method: 'POST', body: JSON.stringify({ topic: card.topic, text: card.text }) });
        onDone('1', card.text);
      } else if (card.act === 'reminder') {
        await api('/v1/help/reminders', { method: 'POST', body: JSON.stringify({ brandId, at: card.at, text: card.text }) });
        onDone('1', card.text);
      } else if (card.act === 'wish') {
        if (!user) throw new Error('auth');
        await addWish(brandId, card.text.slice(0, 2000), card.wish, user.uid, profile?.name || user.displayName || '');
        onDone('1', card.text);
      } else if (card.act === 'eye') {
        // Same call as «Approve and send» on the request (EyeBanner); the brand is the card's, not the one open.
        await api(`/v1/admin/brands/${card.brandId}/requests/${card.requestId}/versions/${card.versionId}/publish`, { method: 'POST', body: '{}' });
        onDone('1', '');
      } else if (card.act === 'cancel') {
        // Same call as «Cancel request» on the request; «Undo» puts it back.
        await api(`/v1/brands/${brandId}/requests/${card.requestId}/cancel`, { method: 'POST', body: JSON.stringify({ undo: !!card.done }) });
        onDone(card.done ? '' : '1', '');
      }
    } catch { setError(true); } finally { setBusy(false); }
  }

  const when = card.act === 'reminder' ? new Date(card.at).toLocaleString(loc, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
  const tag = t(`ma.${card.act}` as 'ma.invite');
  const body = card.act === 'invite' ? (card.name ? `${card.name} · ${card.email}` : card.email)
    : card.act === 'eye' ? `${card.brand} · ${card.title} · ${card.versionId}${card.text ? `\n${card.text}` : ''}`
    : card.act === 'reminder' ? `${when} · ${card.text}` : card.act === 'share' ? card.title : card.text || card.title;
  const done = !!card.done && card.act !== 'meeting';
  const undo = done && card.act === 'cancel';
  return (
    <div className={`help-draft${done ? ' is-sent' : ''}`} aria-label={tag}>
      <span className="help-draft-tag">{done ? `✓ ${t(`ma.${card.act}Done` as 'ma.inviteDone')}` : tag}</span>
      <p className="t-sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: 0 }}>{body}</p>
      {card.act === 'share' && link && <input className="input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label={t('ma.shareLink')} />}
      {!done && (
        <div className="row g8 wrap">
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void go()}>{busy ? '…' : t(`ma.${card.act}Go` as 'ma.inviteGo')}</button>
          {card.act === 'eye' && <Link className="btn btn-ghost btn-sm" to={`/requests/${card.requestId}?brand=${encodeURIComponent(card.brandId)}`}>{t('ma.eyeSee')}</Link>}
        </div>
      )}
      {undo && <button type="button" className="btn btn-ghost btn-sm self-start" disabled={busy} onClick={() => void go()}>{t('ma.cancelUndo')}</button>}
      {error && <p className="t-xs" role="alert" style={{ color: 'var(--rojo, #C62828)', margin: 0 }}>{t('help.actError')}</p>}
      {book && <BookMeeting brandId={brandId} onClose={() => setBook(false)} />}
    </div>
  );
}
