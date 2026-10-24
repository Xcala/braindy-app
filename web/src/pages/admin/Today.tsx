import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBrands } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import { useOpenWork, type WorkItem } from '../../team/useWork';
import { dayLabel, daysFrom } from '../../lib/dates';

type Pay = { brandId: string; kind: 'transfer' | 'past_due' };
const daysSince = (ms?: number) => (ms ? Math.floor((Date.now() - ms) / 864e5) : 0);

/** Admin · Today: what needs NickMark across every brand, most urgent first. Replaces "where do I start?". */
export function AdminToday() {
  const { t, lang } = useI18n();
  const { brands, select } = useBrands();
  const { items, loading } = useOpenWork();
  const [pays, setPays] = useState<Pay[]>([]);
  useEffect(() => {
    Promise.all([
      getDocs(query(collectionGroup(db, 'transfers'), where('status', '==', 'review'))),
      getDocs(collectionGroup(db, 'billing')),
    ]).then(([tr, bi]) => setPays([
      ...tr.docs.map((d) => ({ brandId: d.ref.parent.parent!.id, kind: 'transfer' as const })),
      ...bi.docs.filter((d) => d.id === 'plan' && d.get('status') === 'past_due').map((d) => ({ brandId: d.ref.parent.parent!.id, kind: 'past_due' as const })),
    ])).catch(() => setPays([]));
  }, []);
  const byId = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const prod = items.filter((i) => i.status === 'in_production');
  const late = prod.filter((i) => i.dueDate && (daysFrom(i.dueDate) ?? 0) < 0);
  const soon = prod.filter((i) => i.dueDate && (daysFrom(i.dueDate) ?? 99) >= 0 && (daysFrom(i.dueDate) ?? 99) <= 3);
  const review = items.filter((i) => i.stage === 'plan' || (i.approvalLevel === 'nicolas' && i.stage === 'work' && (i.versionCount ?? 0) > 0));
  const waiting = items.filter((i) => i.status === 'to_approve' && daysSince(i.updatedAt?.toMillis()) >= 3);
  const byDue = (a: WorkItem, b: WorkItem) => String(a.dueDate).localeCompare(String(b.dueDate));

  const row = (i: WorkItem, note: string, tone?: 'danger') => (
    <Link key={`${i.brandId}/${i.id}`} to={`/requests/${i.id}`} onClick={() => select(i.brandId)} className="trow" style={{ gridTemplateColumns: '32px minmax(0,1fr) auto', textDecoration: 'none', color: 'var(--ink)' }}>
      {byId.get(i.brandId) ? <BrandMark brand={byId.get(i.brandId)!} /> : <span />}
      <span className="col" style={{ minWidth: 0 }}><span className="w7 truncate">{i.title}</span><span className="t-xs t-mute truncate">{byId.get(i.brandId)?.name ?? i.brandId}</span></span>
      <span className="t-xs whitespace-nowrap" style={{ color: tone === 'danger' ? '#C0362C' : 'var(--graphite)', fontWeight: tone ? 700 : 400 }}>{note}</span>
    </Link>
  );

  const blocks: Array<{ key: StringKey; n: number; body: React.ReactNode; tone?: string }> = [
    { key: 'today.late', n: late.length, tone: '#FDECEA', body: late.sort(byDue).map((i) => row(i, t('home.late', { day: dayLabel(i.dueDate, lang) }), 'danger')) },
    { key: 'today.toReview', n: review.length, tone: '#FFF7E3', body: review.map((i) => row(i, i.stage === 'plan' ? t('req.plan') : t('req.review'))) },
    { key: 'today.dueSoon', n: soon.length, body: soon.sort(byDue).map((i) => row(i, t('home.dueDay', { day: dayLabel(i.dueDate, lang) }))) },
    { key: 'today.waitingClient', n: waiting.length, body: waiting.map((i) => row(i, t('today.daysWaiting', { n: daysSince(i.updatedAt?.toMillis()) }))) },
    { key: 'today.billing', n: pays.length, body: pays.map((p) => (
      <Link key={`${p.brandId}-${p.kind}`} to="/admin/billing" className="trow" style={{ gridTemplateColumns: '32px minmax(0,1fr) auto', textDecoration: 'none', color: 'var(--ink)' }}>
        {byId.get(p.brandId) ? <BrandMark brand={byId.get(p.brandId)!} /> : <span />}
        <span className="w7 truncate">{byId.get(p.brandId)?.name ?? p.brandId}</span>
        <span className="t-xs t-mute">{p.kind === 'transfer' ? t('bill.a.toConfirm') : t('bill.a.overdue')}</span>
      </Link>
    )) },
  ];

  return (
    <div className="col g24">
      <div className="col g8"><p className="label">{new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="h1"><span className="w9">{t('today.title')}.</span> {t('today.sub')}</h1></div>
      {loading ? <div className="skel" style={{ height: 240 }} /> : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {blocks.map((b) => (
            <section key={b.key} className="card col g8" style={b.n && b.tone ? { background: b.tone, border: 0 } : undefined} aria-label={t(b.key)}>
              <div className="row between"><h2 className="h3">{t(b.key)}</h2><span className="h3">{b.n}</span></div>
              {b.n === 0 ? <p className="t-sm t-mute">{t('today.clear')}</p> : <div className="col">{b.body}</div>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
