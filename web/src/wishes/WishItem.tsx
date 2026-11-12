import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toaster';
import { WishAudio } from './WishAudio';
import { deleteWish, editWishText, setWishAdmin, shareWish, STATUS_COLOR, toggleVote, WISH_STATUSES, type Wish, type WishStatus } from './useWishes';

/**
 * One wish as a compact row: status · text (two lines at most) with kind, who and when under it · «Me too» count.
 * Clicking the text opens the rest (full text, NickMark's answer); «⋯» opens editing and, for the admin, status and answer.
 */
export function WishItem({ w }: { w: Wish }) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const admin = profile?.role === 'admin';
  const brands = useBrands().brands;
  const toast = useToast();
  const uid = user?.uid ?? '';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(w.text);
  const [asking, setAsking] = useState(false);
  const [status, setStatus] = useState<WishStatus>(w.status);
  const [reply, setReply] = useState(w.reply ?? '');
  const voted = w.votes.includes(uid);
  const mineToEdit = !admin && w.author === uid && w.status === 'new';
  const canEdit = mineToEdit || admin;
  const day = (ms?: number) => (ms ? new Date(ms).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '');
  const credit = w.credit ? `${brands.find((b) => b.id === w.credit!.brandId)?.name ?? w.credit.brandId} · ${w.credit.name}` : null;
  const pub = w.askedBy ? t('wl.askedBy', { name: w.askedBy }) : t('wl.public');
  const who = w.public ? (admin && credit ? `${pub} (${credit})` : pub)
    : admin ? `${brands.find((b) => b.id === w.brandId)?.name ?? w.brandId} · ${w.authorName ?? ''}`
    : w.author === uid ? t('wl.you') : (w.authorName || t('wl.yourTeam'));
  const fail = () => toast({ text: t('wl.error'), tone: 'bad' });
  const dirty = status !== w.status || reply !== (w.reply ?? '');
  const date = w.status === 'done' && w.doneAt ? t('wl.done', { date: day(w.doneAt.toMillis()) }) : day(w.createdAt?.toMillis());
  const color = STATUS_COLOR[w.status];

  return (
    <li className="wl-row">
      <span className="chip wl-st" style={{ color, background: `${color}1A` }}>{t(`wl.st.${w.status}`)}</span>
      <div className="wl-main">
        {editing ? (
          <div className="col g8">
            <textarea className="input" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('wl.edit')} />
            <div className="row g8">
              <button type="button" className="btn btn-primary btn-sm" disabled={text.trim().length < 3 && !w.audio}
                onClick={() => editWishText(w, text.trim()).then(() => setEditing(false), fail)}>{t('wl.adm.save')}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setText(w.text); setEditing(false); }}>{t('lb.close')}</button>
            </div>
          </div>
        ) : w.text ? <button type="button" className={`wl-text${open ? '' : ' wl-clamp'}`} onClick={() => setOpen(!open)} aria-expanded={open}>{w.text}</button> : null}
        <span className="t-xs t-mute">{t(`wl.kind.${w.kind}`)} · {who} · {date}</span>
        {w.audio && w.brandId && <WishAudio brandId={w.brandId} audio={w.audio} />}
        {w.reply && !admin && (open
          ? <p className="t-sm wl-reply"><b>{t('wl.reply')}:</b> {w.reply}</p>
          : <button type="button" className="t-xs wl-reply-peek" onClick={() => setOpen(true)}><b>{t('wl.reply')}:</b> {w.reply}</button>)}
        {open && canEdit && !editing && (
          <div className="row g8 wrap">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>{t('wl.edit')}</button>
            {admin && !w.public && w.text.trim().length >= 3 && <button type="button" className="btn btn-ghost btn-sm" title={t('wl.shareHint')} onClick={() => shareWish(w).catch(fail)}>{t('wl.share')}</button>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsking(true)}>{t('wl.delete')}</button>
          </div>
        )}
        {open && admin && (
          <div className="col g8 wl-admin">
            <div className="row g8 wrap" role="radiogroup" aria-label={t('wl.adm.status')}>
              {WISH_STATUSES.map((st) => (
                <button key={st} type="button" role="radio" aria-checked={status === st} onClick={() => setStatus(st)}
                  className={`btn btn-sm ${status === st ? 'btn-primary' : 'btn-secondary'}`}>{t(`wl.st.${st}`)}</button>
              ))}
            </div>
            <textarea className="input" rows={2} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('wl.adm.reply')} aria-label={t('wl.adm.reply')} />
            {dirty && <div><button type="button" className="btn btn-primary btn-sm" onClick={() => setWishAdmin(w, status, reply.trim()).catch(fail)}>{t('wl.adm.save')}</button></div>}
          </div>
        )}
      </div>
      <div className="wl-side">
        <button type="button" className={`wl-vote${voted ? ' is-on' : ''}`} aria-pressed={voted} disabled={!uid || admin}
          title={t(voted ? 'wl.metooOn' : 'wl.metoo')} aria-label={`${t(voted ? 'wl.metooOn' : 'wl.metoo')} (${w.votes.length})`}
          onClick={() => toggleVote(w, uid).catch(fail)}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
          <span>{w.votes.length}</span>
        </button>
        {canEdit && <button type="button" className="wl-more" aria-expanded={open} aria-label={t(admin ? 'wl.manage' : 'wl.edit')} onClick={() => setOpen(!open)}>⋯</button>}
      </div>
      {asking && <ConfirmDialog title={t('wl.deleteAsk')} confirmLabel={t('wl.delete')} danger
        onCancel={() => setAsking(false)} onConfirm={() => { setAsking(false); deleteWish(w).catch(fail); }} />}
    </li>
  );
}
