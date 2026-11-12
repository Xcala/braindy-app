import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toaster';
import { WishAudio } from './WishAudio';
import { deleteWish, editWishText, setWishAdmin, shareWish, STATUS_COLOR, toggleVote, WISH_STATUSES, type Wish, type WishStatus } from './useWishes';

/** One wish: kind, status, text, who (you / your team / a client), NickMark's answer and «Me too». The admin sets status and answer. */
export function WishItem({ w }: { w: Wish }) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const admin = profile?.role === 'admin';
  const brands = useBrands().brands;
  const toast = useToast();
  const uid = user?.uid ?? '';
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

  return (
    <li className="card wl-item">
      <div className="row g8 wrap" style={{ alignItems: 'center' }}>
        <span className="chip" style={{ color: STATUS_COLOR[w.status], background: `${STATUS_COLOR[w.status]}1A` }}>{t(`wl.st.${w.status}`)}</span>
        <span className="chip chip-plain wl-kind">{t(`wl.kind.${w.kind}`)}</span>
        <span className="t-xs t-mute grow">{who} · {w.status === 'done' && w.doneAt ? t('wl.done', { date: day(w.doneAt.toMillis()) }) : day(w.createdAt?.toMillis())}</span>
      </div>
      {editing ? (
        <div className="col g8">
          <textarea className="input" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('wl.edit')} />
          <div className="row g8">
            <button type="button" className="btn btn-primary btn-sm" disabled={text.trim().length < 3 && !w.audio}
              onClick={() => editWishText(w, text.trim()).then(() => setEditing(false), fail)}>{t('wl.adm.save')}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setText(w.text); setEditing(false); }}>{t('lb.close')}</button>
          </div>
        </div>
      ) : w.text ? <p className="t-md wl-text">{w.text}</p> : null}
      {w.audio && w.brandId && <WishAudio brandId={w.brandId} audio={w.audio} />}
      {w.reply && !admin && <p className="t-sm wl-reply"><b>{t('wl.reply')}:</b> {w.reply}</p>}
      <div className="row g8 wrap" style={{ alignItems: 'center' }}>
        <button type="button" className={`btn btn-sm ${voted ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={voted}
          disabled={!uid || admin} onClick={() => toggleVote(w, uid).catch(fail)}>
          ＋ {t(voted ? 'wl.metooOn' : 'wl.metoo')}{w.votes.length ? <span className="apps-n">{w.votes.length}</span> : null}
        </button>
        <span className="grow" />
        {canEdit && !editing && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>{t('wl.edit')}</button>}
        {admin && !w.public && w.text.trim().length >= 3 && <button type="button" className="btn btn-ghost btn-sm" title={t('wl.shareHint')} onClick={() => shareWish(w).catch(fail)}>{t('wl.share')}</button>}
        {(admin || mineToEdit) && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsking(true)}>{t('wl.delete')}</button>}
      </div>
      {admin && (
        <div className="col g8 wl-admin">
          <div className="row g8 wrap" role="radiogroup" aria-label={t('wl.adm.status')}>
            {WISH_STATUSES.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={status === s} onClick={() => setStatus(s)}
                className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}>{t(`wl.st.${s}`)}</button>
            ))}
          </div>
          <textarea className="input" rows={2} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('wl.adm.reply')} aria-label={t('wl.adm.reply')} />
          {dirty && <div><button type="button" className="btn btn-primary btn-sm" onClick={() => setWishAdmin(w, status, reply.trim()).catch(fail)}>{t('wl.adm.save')}</button></div>}
        </div>
      )}
      {asking && <ConfirmDialog title={t('wl.deleteAsk')} confirmLabel={t('wl.delete')} danger
        onCancel={() => setAsking(false)} onConfirm={() => { setAsking(false); deleteWish(w).catch(fail); }} />}
    </li>
  );
}
