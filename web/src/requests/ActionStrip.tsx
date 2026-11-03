import { useState } from 'react';
import { Link } from 'react-router';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { daysFrom } from '../lib/dates';
import { isLate } from './requestFilters';
import { missingOf, smartDate, type Missing } from './requestBits';
import type { BrandRequest } from './types';

type Group = { key: 'approve' | 'waiting' | 'late' | 'week' | 'incomplete'; items: BrandRequest[] };

/**
 * "Your turn": only what needs someone, shown only when there is something. The client sees what waits for their
 * approval; NickMark sees what waits for the client, what is late, what is due this week and what arrived incomplete
 * (with a button that asks the client for the missing part as a comment on the request).
 */
export function ActionStrip({ brandId, list, isAdmin }: { brandId: string; list: BrandRequest[]; isAdmin: boolean }) {
  const { t, lang } = useI18n();
  const open = list.filter((r) => !r.archived);
  const week = (r: BrandRequest) => { const n = daysFrom(r.dueDate); return r.status === 'in_production' && n != null && n >= 0 && n <= 7; };
  const groups: Group[] = (isAdmin
    ? [
      { key: 'late', items: open.filter(isLate) },
      { key: 'week', items: open.filter(week) },
      { key: 'incomplete', items: open.filter((r) => missingOf(r).length && !r.askedMissingAt) },
      { key: 'waiting', items: open.filter((r) => r.status === 'to_approve') },
    ] as Group[]
    : [{ key: 'approve', items: open.filter((r) => r.status === 'to_approve') }] as Group[]).filter((g) => g.items.length);
  if (!groups.length) return null;

  return (
    <section className="card col g16" aria-labelledby="h-turn" style={{ borderColor: isAdmin ? undefined : '#F5D98A', background: isAdmin ? undefined : '#FFFCF3' }}>
      <h2 className="h3" id="h-turn" style={{ margin: 0 }}>{t(isAdmin ? 'at.titleAdmin' : 'at.title')}</h2>
      <div className={`grid gap-5 ${groups.length > 1 ? 'md:grid-cols-2 xl:grid-cols-4' : ''}`}>
        {groups.map((g) => (
          <div key={g.key} className="col g8 min-w-0">
            {(isAdmin || groups.length > 1) && <p className="label" style={{ margin: 0, color: g.key === 'late' ? '#C0362C' : undefined }}>{t(`at.${g.key}`, { n: g.items.length })}</p>}
            {g.items.slice(0, 3).map((r) => <Row key={r.id} brandId={brandId} r={r} kind={g.key} sub={g.key === 'incomplete' ? missingOf(r) : null} date={smartDate(r, lang, t).text} />)}
            {g.items.length > 3 && <span className="t-xs t-mute">{t('at.more', { n: g.items.length - 3 })}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Row({ brandId, r, kind, sub, date }: { brandId: string; r: BrandRequest; kind: Group['key']; sub: Missing[] | null; date: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const ask = async () => {
    if (!user || !sub) return;
    setState('busy');
    try {
      await addDoc(collection(db, 'brands', brandId, 'requests', r.id, 'comments'), { author: user.uid, text: [t('at.askIntro'), ...sub.map((k) => `• ${t(`at.ask.${k}`)}`)].join('\n'), kind: 'missing_info', createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'brands', brandId, 'requests', r.id), { askedMissingAt: serverTimestamp() });
      setState('done');
    } catch { setState('error'); }
  };
  return (
    <div className="row g8" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
      <Link to={`/requests/${r.id}`} className="col grow min-w-0" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
        <span className="t-sm w7 truncate">{r.title}</span>
        <span className="t-xs t-mute truncate">{sub ? t('rr.missing', { what: sub.map((k) => t(`rr.miss.${k}`)).join(' · ') }) : date}</span>
      </Link>
      {kind === 'approve' && <Link to={`/requests/${r.id}`} className="btn btn-primary btn-sm flex-none" style={{ height: 32 }}>{t('req.review')}</Link>}
      {kind === 'incomplete' && (
        <button type="button" className="btn btn-secondary btn-sm flex-none" style={{ height: 32 }} disabled={state === 'busy' || state === 'done'} onClick={ask}>
          {t(state === 'done' ? 'at.asked' : state === 'error' ? 'files.actionError' : 'at.askBtn')}
        </button>
      )}
    </div>
  );
}
