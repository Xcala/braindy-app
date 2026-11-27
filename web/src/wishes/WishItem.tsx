import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toaster';
import { WishAudio } from './WishAudio';
import { deleteWish, editWishText, setWishAdmin, shareWish, STATUS_COLOR, toggleVote, WISH_STATUSES, type Wish, type WishStatus } from './useWishes';

/** «17 nov», with the year only when it is not this year. */
const shortDay = (ms: number | undefined, lang: string) => {
  if (!ms) return '';
  const d = new Date(ms);
  const year = d.getFullYear() !== new Date().getFullYear();
  return d.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) }).replace(/\./g, '');
};
/** A person's name, never an email address. */
const nameOnly = (s?: string) => (s && !s.includes('@') ? s.trim() : '');

/**
 * One wish as a full-width row: the text (two lines at most), and under it one line: status · kind · who · date, with
 * «▲ Me too» at its end (the number only when there are votes). Done wishes are quieter: ✓, the date on the right, no vote.
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
  const closed = w.status === 'done' || w.status === 'declined';
  const brandName = (id?: string | null) => (id ? brands.find((b) => b.id === id)?.name ?? id : '');
  // Who asked, once: the admin sees «Karol · Revista Level»; clients see «Asked by Karol» or «From a client».
  const who = w.public
    ? (admin && w.credit ? [nameOnly(w.credit.name) || w.askedBy, brandName(w.credit.brandId)].filter(Boolean).join(' · ') : w.askedBy ? t('wl.askedBy', { name: w.askedBy }) : t('wl.public'))
    : admin ? [nameOnly(w.authorName), brandName(w.brandId)].filter(Boolean).join(' · ')
    : w.author === uid ? t('wl.you') : (nameOnly(w.authorName) || t('wl.yourTeam'));
  const fail = () => toast({ text: t('wl.error'), tone: 'bad' });
  const dirty = status !== w.status || reply !== (w.reply ?? '');
  const date = shortDay((w.status === 'done' && w.doneAt ? w.doneAt : w.createdAt)?.toMillis(), lang);
  const color = STATUS_COLOR[w.status];
  const n = w.votes.length;

  return (
    <li className={`wl-row${closed ? ' is-closed' : ''}`}>
      {editing ? (
        <div className="col g8">
          <textarea className="input" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('wl.edit')} />
          <div className="row g8">
            <button type="button" className="btn btn-primary btn-sm" disabled={text.trim().length < 3 && !w.audio}
              onClick={() => editWishText(w, text.trim()).then(() => setEditing(false), fail)}>{t('wl.adm.save')}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setText(w.text); setEditing(false); }}>{t('lb.close')}</button>
          </div>
        </div>
      ) : w.text ? (
        <button type="button" className={`wl-text${open ? '' : ' wl-clamp'}`} onClick={() => setOpen(!open)} aria-expanded={open}>
          {w.status === 'done' && <span className="wl-check" aria-hidden="true">✓ </span>}{w.text}
        </button>
      ) : null}
      <div className="wl-meta">
        {w.status !== 'done' && <span className="wl-st" style={{ color, background: `${color}1A` }}>{t(`wl.st.${w.status}`)}</span>}
        <span className="wl-who t-xs t-mute">
          {w.status === 'done' && <span className="sr-only">{t('wl.st.done')} · </span>}
          {t(`wl.kind.${w.kind}`)}{who ? ` · ${who}` : ''}{closed ? '' : ` · ${date}`}
        </span>
        <span className="grow" />
        {closed && <span className="t-xs t-mute wl-date">{date}</span>}
        {!closed && !admin && uid && (
          <button type="button" className={`wl-vote${voted ? ' is-on' : ''}`} aria-pressed={voted} onClick={() => toggleVote(w, uid).catch(fail)}
            aria-label={`${t(voted ? 'wl.metooOn' : 'wl.metoo')}${n ? ` (${n})` : ''}`}>
            <span aria-hidden="true">▲</span> {t(voted ? 'wl.metooOn' : 'wl.metoo')}{n ? <b> {n}</b> : null}
          </button>
        )}
        {admin && n > 0 && <span className="t-xs t-mute wl-votes" title={t('wl.metoo')}>▲ {n}</span>}
        {canEdit && <button type="button" className="wl-more" aria-expanded={open} aria-label={t(admin ? 'wl.manage' : 'wl.edit')} onClick={() => setOpen(!open)}>⋯</button>}
      </div>
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
                className={`btn btn-sm btn-secondary${status === st ? ' is-picked' : ''}`}>{t(`wl.st.${st}`)}</button>
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
