import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { useProposals } from '../../proposals/useProposals';
import { ActivityLine } from '../../proposals/ActivityLine';
import { STATUS_CHIP, type ProposalStatus } from '../../proposals/types';

const STATUSES: ProposalStatus[] = ['draft', 'sent', 'won', 'lost'];
const COLS = 'minmax(0,1fr) 200px 120px 280px 130px';

export function AdminProposals() {
  const { t, lang } = useI18n();
  const { list, loading } = useProposals();
  const [filter, setFilter] = useState<ProposalStatus | null>(null);
  const navigate = useNavigate();

  async function create() {
    const ref = await addDoc(collection(db, 'proposals'), {
      title: t('proposals.newTitle'), status: 'draft', lang, prospect: {}, recommended: 'transform',
      createdAt: serverTimestamp(), lastActivity: { type: 'created', at: serverTimestamp() },
    });
    navigate(`/admin/proposals/${ref.id}`);
  }

  const shown = filter ? list.filter((p) => p.status === filter) : list;
  return (
    <section className="col g24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8"><p className="label">{t('proposals.kicker')}</p><h1 className="h1"><span className="w9">{t('proposals.title')}.</span></h1></div>
        <button className="btn btn-primary" onClick={create}>+ {t('proposals.new')}</button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter((f) => (f === s ? null : s))} className="card card-tight col text-left"
            style={{ gap: 6, cursor: 'pointer', ...(filter === s ? { borderColor: 'var(--azul)', boxShadow: '0 0 0 1px var(--azul)' } : {}) }}
            aria-pressed={filter === s}>
            <span className={`chip ${STATUS_CHIP[s]}`} style={{ alignSelf: 'flex-start' }}>{t(`proposals.status.${s}`)}</span>
            <span className="d-lg w9" style={{ fontSize: 40 }}>{list.filter((p) => p.status === s).length}</span>
            <span className="t-sm t-mute">{t(`proposals.statusHint.${s}`)}</span>
          </button>
        ))}
      </div>
      <div className="table overflow-x-auto">
        <div className="trow head label min-w-[820px]" style={{ gridTemplateColumns: COLS }}>
          <span>{t('proposals.col.proposal')}</span><span>{t('proposals.col.prospect')}</span><span>{t('proposals.col.status')}</span><span>{t('proposals.col.activity')}</span><span />
        </div>
        {loading && <div className="trow"><span className="t-mute">{t('common.loading')}…</span></div>}
        {!loading && !shown.length && <div className="trow"><span className="t-mute">{t('proposals.empty')}</span></div>}
        {shown.map((p) => (
          <div key={p.id} className="trow min-w-[820px]" style={{ gridTemplateColumns: COLS, color: p.status === 'lost' ? 'var(--graphite)' : undefined }}>
            <Link to={`/admin/proposals/${p.id}`} className="w7 truncate" style={{ color: 'inherit', textDecoration: 'none' }}>{p.title}</Link>
            <span className="truncate">{p.prospect?.company || p.prospect?.name || <span className="t-mute">—</span>}</span>
            <span><span className={`chip ${STATUS_CHIP[p.status]}`}>{t(`proposals.status.${p.status}`)}</span></span>
            <ActivityLine activity={p.lastActivity} />
            {p.status === 'won' && !p.convertedBrandId
              ? <Link className="btn btn-primary btn-sm" to={`/admin/proposals/${p.id}`}>{t('proposals.createClient')}</Link>
              : <Link className="btn btn-secondary btn-sm" to={`/admin/proposals/${p.id}`}>{t('common.open')}</Link>}
          </div>
        ))}
      </div>
    </section>
  );
}
