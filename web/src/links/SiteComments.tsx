import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteField, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { samePage, type SiteFrame } from './useSpot';

/** A comment pinned on a part of the site (brands/{b}/siteComments). n: its number on the pins, oldest first. */
export interface SiteComment { id: string; n: number; author: string; authorName: string; text: string; url: string; spot?: { selector?: string; text?: string; x?: number; y?: number }; resolved: boolean; createdAt?: Timestamp }
type Reply = { id: string; author: string; authorName: string; text: string; createdAt?: Timestamp };

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
 * Figma-style comments on the site shown beside: «Comment on the page» turns comment mode on, the next click on the site
 * picks a part, and the comment is pinned there for NickMark, the brand and the Brains (who read them through the connector).
 */
export function SiteComments({ brandId, list, frame }: { brandId: string; list: SiteComment[]; frame?: SiteFrame }) {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const open_ = list.filter((c) => !c.resolved).reverse();
  const done = list.filter((c) => c.resolved).reverse();

  // Pins of the open comments on the page the frame shows.
  const page = frame?.page;
  const setPins = frame?.setPins;
  useEffect(() => {
    if (!setPins || !page) return;
    setPins(list.filter((c) => !c.resolved && samePage(c.url, page)).map((c) => ({ id: c.id, n: c.n, selector: c.spot?.selector, text: c.spot?.text, x: c.spot?.x, y: c.spot?.y })));
  }, [list, page, setPins]);
  // A pin clicked on the site opens its comment here.
  const pinned = frame?.pinned;
  useEffect(() => { if (pinned) { setOpen(pinned); frame?.clearPinned(); } }, [pinned, frame]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim(), p = frame?.picked;
    if (!v || !p || !user) return;
    setBusy(true); setError(false);
    try {
      await addDoc(collection(db, 'brands', brandId, 'siteComments'), {
        author: user.uid, authorName: (profile?.name ?? '').slice(0, 120), text: v.slice(0, 2000), url: p.url.slice(0, 1000),
        spot: { selector: p.selector.slice(0, 500), text: p.text.slice(0, 120), x: p.x, y: p.y }, resolved: false, createdAt: serverTimestamp(),
      });
      setText(''); frame?.clearPicked();
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <div className="col g8">
      {!frame ? <p className="t-xs t-mute" style={{ margin: 0 }}>{t('sc.noFrame')}</p>
        : frame.picking ? (
          <div className="sc-picking row between g8"><span className="t-sm">{t('sc.picking')}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => frame.setPicking(false)}>{t('sc.cancel')}</button></div>
        ) : !frame.picked && <button type="button" className="btn btn-primary btn-sm self-start" onClick={() => frame.setPicking(true)}>＋ {t('sc.comment')}</button>}

      {frame?.picked && (
        <form className="spanel-ask col g8" onSubmit={send}>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t('sc.about')} {frame.picked.text ? `«${frame.picked.text}»` : pathOf(frame.picked.url)}</p>
          <textarea className="input" rows={3} autoFocus value={text} maxLength={2000} placeholder={t('sc.ph')} aria-label={t('sc.ph')} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(e); }} />
          <div className="row g8 between">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { frame.clearPicked(); setText(''); }}>{t('sc.cancel')}</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>{t('sc.send')}</button>
          </div>
          {error && <p className="help err" role="alert" style={{ margin: 0 }}>{t('sc.error')}</p>}
        </form>
      )}

      {list.length === 0 && <p className="t-sm t-mute" style={{ margin: 0 }}>{t('sc.empty')}</p>}
      {open_.map((c) => <Item key={c.id} brandId={brandId} c={c} frame={frame} open={open === c.id} onOpen={setOpen} />)}
      {done.length > 0 && (
        <details className="spanel-done">
          <summary className="label">{t('sc.resolvedN', { n: done.length })}</summary>
          <div className="col g8">{done.map((c) => <Item key={c.id} brandId={brandId} c={c} frame={frame} open={open === c.id} onOpen={setOpen} />)}</div>
        </details>
      )}
    </div>
  );
}

/** One comment: folded to its number, author and text; opening it takes the site to its pin and shows the replies. */
function Item({ brandId, c, frame, open, onOpen }: { brandId: string; c: SiteComment; frame?: SiteFrame; open: boolean; onOpen: (id: string | null) => void }) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const ref = useRef<HTMLDetailsElement>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [text, setText] = useState('');
  const canResolve = profile?.role === 'admin' || c.author === user?.uid;
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
        <span className="spanel-ptitle"><b>{c.authorName || t('sc.someone')}</b> {c.text}</span>
      </summary>
      <p className="t-xs t-mute">{pathOf(c.url)} · {when(c.createdAt)}{c.spot?.text ? ` · «${c.spot.text}»` : ''}</p>
      {replies.map((r) => <p key={r.id} className="t-xs sc-reply"><b>{r.authorName || t('sc.someone')}</b> {r.text} <span className="t-mute">· {when(r.createdAt)}</span></p>)}
      <form className="row g8" onSubmit={reply}>
        <input className="input" value={text} maxLength={2000} placeholder={t('sc.replyPh')} aria-label={t('sc.replyPh')} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn-secondary btn-sm" disabled={!text.trim()}>{t('sc.reply')}</button>
      </form>
      {canResolve && <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => resolve(!c.resolved)}>{c.resolved ? t('sc.reopen') : `✓ ${t('sc.resolve')}`}</button>}
    </details>
  );
}
