import { useState } from 'react';
import { Link } from 'react-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { createRequest, decide } from '../requests/api';
import type { AttachedFile } from '../requests/types';

/** An action the assistant proposed (server/src/help/actions.ts). `done` is set once the person confirmed it. */
export type ActCard =
  | { kind: 'act'; act: 'site'; ref: string; siteUrl: string; siteTitle: string; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'approve' | 'changes'; ref: string; requestId: string; versionId: string; n: number; title: string; text: string; done?: string }
  | { kind: 'act'; act: 'add'; ref: string; requestId: string; title: string; text: string; done?: string };

/**
 * The confirm card: nothing happens until the person taps the button. Site adjustments become a web request with the
 * site attached (same as «Ask for an adjustment» in the viewer); approve and changes call the same decision as the
 * review screen; «add to the request» leaves an addendum comment. The text can be edited first.
 */
export function ActionCard({ brandId, card, files, onDone, onOpen }: { brandId: string; card: ActCard; files?: AttachedFile[]; onDone: (done: string, text: string) => void; onOpen?: () => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [text, setText] = useState(card.text);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const needsText = card.act !== 'approve';
  const reqId = card.act === 'site' ? card.done : card.requestId;

  async function go() {
    const v = text.trim();
    if (needsText && !v) return;
    setBusy(true); setError(false);
    try {
      if (card.act === 'site') {
        const r = await createRequest(brandId, { category: 'web', title: `${t('sp.reqTitle')}: ${card.title}`.slice(0, 120), cards: { product: { text: v, links: [card.siteUrl], files: files ?? [] } }, source: 'assistant' }) as { requestId: string };
        onDone(r.requestId, v);
      } else if (card.act === 'add') {
        if (!user) throw new Error('auth');
        await addDoc(collection(db, 'brands', brandId, 'requests', card.requestId, 'comments'), { author: user.uid, text: v.slice(0, 5000), kind: 'addendum', createdAt: serverTimestamp() });
        onDone('ok', v);
      } else {
        await decide(brandId, card.requestId, card.versionId, card.act === 'approve' ? 'approved' : 'changes_requested', v);
        onDone('ok', v);
      }
    } catch { setError(true); } finally { setBusy(false); }
  }

  const tag = card.act === 'site' ? t('help.actSite', { site: card.siteTitle }) : card.act === 'approve' ? t('help.actApprove', { n: card.n })
    : card.act === 'changes' ? t('help.actChanges', { n: card.n }) : t('help.actAdd');
  const button = card.act === 'site' ? t('help.actSiteGo') : card.act === 'approve' ? t('help.actApproveGo') : card.act === 'changes' ? t('help.actChangesGo') : t('help.actAddGo');

  if (card.done) {
    return (
      <div className="help-draft is-sent" role="status">
        <span className="help-draft-tag">✓ {t(card.act === 'site' ? 'help.actSiteDone' : card.act === 'approve' ? 'help.actApproveDone' : card.act === 'changes' ? 'help.actChangesDone' : 'help.actAddDone')}</span>
        <b>{card.title}</b>
        {reqId && <Link className="btn btn-secondary btn-sm self-start" to={`/requests/${reqId}`} onClick={onOpen}>{t('help.draftOpen')}</Link>}
      </div>
    );
  }

  return (
    <div className="help-draft" aria-label={tag}>
      <span className="help-draft-tag">{tag}</span>
      <b>{card.title}</b>
      {needsText && (edit
        ? <textarea className="input" rows={4} value={text} maxLength={3000} aria-label={tag} onChange={(e) => setText(e.target.value)} />
        : <p>{text}</p>)}
      {card.act === 'site' && !!files?.length && <span className="t-xs t-mute">📎 {files.map((x) => x.name).join(', ')}</span>}
      {error && <p className="t-xs" role="alert" style={{ color: 'var(--rojo, #C62828)', margin: 0 }}>{t('help.actError')}</p>}
      <div className="row g8 wrap">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || (needsText && !text.trim())} onClick={() => void go()}>{busy ? t('help.draftSending') : button}</button>
        {needsText && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEdit((e) => !e)} aria-pressed={edit}>{edit ? t('help.draftDone') : t('help.draftEdit')}</button>}
        {card.act !== 'site' && <Link className="btn btn-ghost btn-sm" to={`/requests/${card.requestId}`} onClick={onOpen}>{t('help.actSee')}</Link>}
      </div>
    </div>
  );
}
