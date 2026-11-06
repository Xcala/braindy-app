import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, deleteField, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { CommentEdit } from '../components/CommentEdit';
import { samePage, type SiteFrame } from './useSpot';

/** A comment on the site (brands/{b}/siteComments), pinned on a part of it or general to a page. n: its number on the pins, oldest first. asPoint: key of the adjustment NickMark made from it. */
export interface SiteComment { id: string; n: number; author: string; authorName: string; text: string; url: string; spot?: { selector?: string; text?: string; x?: number; y?: number }; where?: string; resolved: boolean; resolvedAt?: Timestamp; asPoint?: string; createdAt?: Timestamp; editedAt?: Timestamp }
type Reply = { id: string; author: string; authorName: string; text: string; createdAt?: Timestamp; editedAt?: Timestamp };

const hostOf = (url?: string) => { try { return url ? new URL(url).host.replace(/^www\./, '') : ''; } catch { return ''; } };
const pathOf = (url: string) => { try { return decodeURI(new URL(url).pathname); } catch { return url; } };

export function useSiteComments(brandId: string, siteUrl: string) {
  const [list, setList] = useState<SiteComment[]>([]);
  useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'siteComments'), orderBy('createdAt')),
    (s) => setList(s.docs.map((d, i) => ({ id: d.id, n: i + 1, ...d.data() }) as SiteComment)), () => setList([])), [brandId]);
  const host = hostOf(siteUrl);
  return useMemo(() => list.filter((c) => hostOf(c.url) === host), [list, host]);
}

/**
 * "Comment" tab: one line says how (write it, or click the part of the page), the box is always there and the page is already
 * listening for a click. A click pins the comment on that part; without a click it is a general comment on the page shown.
 * Only open comments are listed here: resolved ones live in the Delivered tab.
 */
export function SiteComments({ brandId, siteUrl, list, frame, onToPoint }: { brandId: string; siteUrl: string; list: SiteComment[]; frame?: SiteFrame; onToPoint?: (c: SiteComment) => void }) {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [where, setWhere] = useState('');
  const bridge = !!frame?.hasBridge;
  const open_ = list.filter((c) => !c.resolved).reverse();

  // Pins of the open comments on the page the frame shows (general comments have no place to pin).
  const page = frame?.page;
  const setPins = frame?.setPins;
  useEffect(() => {
    if (!setPins || !page) return;
    setPins(list.filter((c) => !c.resolved && c.spot && samePage(c.url, page)).map((c) => ({ id: c.id, n: c.n, selector: c.spot?.selector, text: c.spot?.text, x: c.spot?.x, y: c.spot?.y })));
  }, [list, page, setPins]);
  // A pin clicked on the site opens its comment here.
  const pinned = frame?.pinned;
  useEffect(() => { if (pinned) { setOpen(pinned); frame?.clearPinned(); } }, [pinned, frame]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim(), p = frame?.picked;
    if (!v || !user) return;
    setBusy(true); setError(false);
    try {
      await addDoc(collection(db, 'brands', brandId, 'siteComments'), {
        author: user.uid, authorName: (profile?.name ?? '').slice(0, 120), text: v.slice(0, 2000), url: (p?.url ?? page ?? siteUrl).slice(0, 1000),
        ...(p ? { spot: { selector: p.selector.slice(0, 500), text: p.text.slice(0, 120), x: p.x, y: p.y } } : {}),
        ...(!bridge && where.trim() ? { where: where.trim().slice(0, 200) } : {}),
        resolved: false, createdAt: serverTimestamp(),
      });
      setText(''); setWhere(''); frame?.clearPicked();
    } catch { setError(true); } finally { setBusy(false); }
  }

  const p = frame?.picked;
  return (
    <div className="col g8">
      <p className="t-sm" style={{ margin: 0 }}>{t(bridge ? 'sc.hint' : 'sc.hintNoBridge')}</p>

      {bridge && frame?.picking && (
        <div className="sc-picking row between g8"><span className="t-sm">{t('sc.pickOn')}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => frame.setPicking(false)}>{t('sc.cancel')}</button></div>
      )}
      {bridge && frame && !frame.picking && !p && (
        <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => frame.setPicking(true)}>⌖ {t('sc.pickAgain')}</button>
      )}

      <form className="spanel-ask col g8" onSubmit={send}>
        {!bridge && <input className="input" value={where} maxLength={200} placeholder={t('sc.where')} aria-label={t('sc.where')} onChange={(e) => setWhere(e.target.value)} />}
        {bridge && <p className="t-xs t-mute" style={{ margin: 0 }}>
          {p ? <>{t('sc.about')} {p.text ? `«${p.text}»` : pathOf(p.url)} · <button type="button" className="spanel-textbtn" onClick={() => frame?.clearPicked()}>{t('sc.dropSpot')}</button></>
            : <>{t('sc.general')} · {pathOf(page ?? siteUrl) || '/'}</>}
        </p>}
        <textarea className="input" rows={3} value={text} maxLength={2000} placeholder={t('sc.ph')} aria-label={t('sc.ph')} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(e); }} />
        <div className="row g8 between">
          <span />
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>{t('sc.send')}</button>
        </div>
        {error && <p className="help err" role="alert" style={{ margin: 0 }}>{t('sc.error')}</p>}
      </form>

      {open_.length === 0 && <p className="t-sm t-mute" style={{ margin: 0 }}>{t('sc.empty')}</p>}
      {open_.map((c) => <CommentItem key={c.id} brandId={brandId} c={c} frame={frame} open={open === c.id} onOpen={setOpen} onToPoint={onToPoint} />)}
    </div>
  );
}

/** One comment: folded to its number, author and text; opening it takes the site to its pin and shows the replies. */
export function CommentItem({ brandId, c, frame, open, onOpen, onToPoint }: { brandId: string; c: SiteComment; frame?: SiteFrame; open: boolean; onOpen: (id: string | null) => void; onToPoint?: (c: SiteComment) => void }) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const ref = useRef<HTMLDetailsElement>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const isAdmin = profile?.role === 'admin';
  const canResolve = isAdmin || c.author === user?.uid;
  const cref = doc(db, 'brands', brandId, 'siteComments', c.id);

  useEffect(() => {
    if (!open) return;
    ref.current?.scrollIntoView({ block: 'nearest' });
    return onSnapshot(query(collection(cref, 'replies'), orderBy('createdAt')), (s) => setReplies(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Reply)), () => setReplies([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, brandId, c.id]);

  const when = (ts?: Timestamp) => ts?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }) ?? '';
  async function reply(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v || !user) return;
    await addDoc(collection(cref, 'replies'), { author: user.uid, authorName: (profile?.name ?? '').slice(0, 120), text: v.slice(0, 2000), createdAt: serverTimestamp() });
    setText('');
  }
  const resolve = (v: boolean) => updateDoc(cref, v ? { resolved: true, resolvedBy: user?.uid ?? '', resolvedAt: serverTimestamp() } : { resolved: false, resolvedBy: deleteField(), resolvedAt: deleteField() });

  return (
    <details ref={ref} className={`spanel-pt sc-item${c.resolved ? ' is-done' : ''}`} open={open}
      onToggle={(e) => {
        const isOpen = e.currentTarget.open;
        if (isOpen === open) return;
        onOpen(isOpen ? c.id : null);
        if (isOpen) frame?.go({ url: c.url, spot: c.spot?.selector || c.spot?.text, label: `#${c.n}`, auto: true });
      }}>
      <summary>
        <span className="sc-n">{c.n}</span>
        <span className="spanel-ptitle"><b>{c.authorName || t('sc.someone')}</b> {c.text}{c.editedAt ? <span className="t-mute"> · {t('ce.edited')}</span> : null}</span>
      </summary>
      <p className="t-xs t-mute">{pathOf(c.url)} · {when(c.createdAt)}{c.spot?.text ? ` · «${c.spot.text}»` : ''}{c.where ? ` · ${t('sc.whereIs')}: ${c.where}` : ''}</p>
      {(c.author === user?.uid || isAdmin) && (
        <div style={{ margin: '0 12px 8px' }}>
          {editing === c.id && <p className="t-xs t-mute">{t('ce.label')}</p>}
          <CommentEdit text={c.text} max={2000} editing={editing === c.id} setEditing={(on) => setEditing(on ? c.id : null)}
            onSave={c.author === user?.uid ? (v) => updateDoc(cref, { text: v, editedAt: serverTimestamp() }) : undefined} onDelete={() => deleteDoc(cref)} />
        </div>
      )}
      {replies.map((r) => {
        const rref = doc(cref, 'replies', r.id);
        return (
          <div key={r.id} className="sc-reply col g4">
            {editing !== r.id && <p className="t-xs"><b>{r.authorName || t('sc.someone')}</b> {r.text} <span className="t-mute">· {when(r.createdAt)}{r.editedAt ? ` · ${t('ce.edited')}` : ''}</span></p>}
            {(r.author === user?.uid || isAdmin) && <CommentEdit text={r.text} max={2000} editing={editing === r.id} setEditing={(on) => setEditing(on ? r.id : null)}
              onSave={r.author === user?.uid ? (v) => updateDoc(rref, { text: v, editedAt: serverTimestamp() }) : undefined} onDelete={() => deleteDoc(rref)} />}
          </div>
        );
      })}
      <form className="row g8" onSubmit={reply}>
        <input className="input" value={text} maxLength={2000} placeholder={t('sc.replyPh')} aria-label={t('sc.replyPh')} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn-secondary btn-sm" disabled={!text.trim()}>{t('sc.reply')}</button>
      </form>
      <div className="row g8 wrap" style={{ margin: '0 12px 10px' }}>
        {canResolve && <button type="button" className="btn btn-ghost btn-sm" onClick={() => resolve(!c.resolved)}>{c.resolved ? t('sc.reopen') : `✓ ${t('sc.resolve')}`}</button>}
        {isAdmin && onToPoint && !c.resolved && (c.asPoint
          ? <span className="t-xs t-mute">{t('sc.asPoint', { key: c.asPoint })}</span>
          : <button type="button" className="btn btn-secondary btn-sm" onClick={() => onToPoint(c)}>{t('sc.toPoint')}</button>)}
      </div>
    </details>
  );
}
