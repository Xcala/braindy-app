import { useMemo } from 'react';
import { Link } from 'react-router';
import { useBrands } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { brainName } from '../../components/BrainStack';
import { useOpenWork, type WorkItem } from '../../team/useWork';
import { MembersCard } from '../../team/MembersCard';
import type { BrainId } from '../../requests/taxonomy';
import { useBrainTasks } from '../../brains/useBrains';
import { GranolaInbox } from '../../team/GranolaInbox';

/** Active brands Nicolas takes on at once. */
const CAP = 50;
const BRAINS: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];
const ago = (d?: Date) => {
  if (!d) return '';
  const h = (Date.now() - d.getTime()) / 3_600_000;
  return h < 24 ? `${Math.max(1, Math.round(h))} h` : `${Math.round(h / 24)} d`;
};

/** Admin Team: approval queue across brands, Brain load, capacity, members of the current brand. */
export function AdminTeam() {
  const { t } = useI18n();
  const { brands, current, select } = useBrands();
  const { items, loading } = useOpenWork();
  const active = brands.filter((b) => b.status === 'active' && b.kind === 'brand').length;
  const byId = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  // Waiting on Nicolas: plans to approve, and work that needs his review before the client sees it.
  const queue = items.filter((i) => i.stage === 'plan' || (i.approvalLevel === 'nicolas' && i.stage === 'work' && (i.versionCount ?? 0) > 0))
    .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
  const tasks = useBrainTasks(true);
  const load = (b: BrainId) => ({
    prod: items.filter((i) => i.leadBrain === b && i.status === 'in_production').length,
    approve: items.filter((i) => i.leadBrain === b && i.status === 'to_approve').length,
  });

  const open = (i: WorkItem) => select(i.brandId);
  return (
    <div className="col g24">
      <div className="col g8"><p className="label">{t('team.kicker')}</p><h1 className="h1"><span className="w9">{t('nav.team')}.</span> {t('team.tagline')}</h1></div>

      <div className="card row g24 wrap">
        <div className="col grow" style={{ gap: 6, minWidth: 260 }}>
          <div className="row between"><span className="w7 t-sm">{t('team.capacity')}</span><span className="t-xs t-mute">{t('team.ceiling', { n: CAP })}</span></div>
          <div className="bar"><i style={{ width: `${Math.min(100, (active / CAP) * 100)}%`, background: active > CAP * 0.8 ? 'var(--warning)' : 'var(--azul)' }} /></div>
          <span className="t-xs t-mute">{t('team.activeBrands', { n: active })}</span>
        </div>
        <div className="row g24"><Stat n={items.filter((i) => i.status === 'in_production').length} label={t('req.status.in_production')} /><Stat n={items.filter((i) => i.status === 'to_approve').length} label={t('req.status.to_approve')} /><Stat n={queue.length} label={t('team.waitingYou')} /></div>
      </div>

      <section className="col g12" aria-labelledby="q">
        <div className="row between"><h2 className="h3" id="q">{t('team.queue', { n: queue.length })}</h2><span className="t-sm t-mute">{t('team.oldestFirst')}</span></div>
        {loading && <div className="skel" style={{ height: 80 }} />}
        {!loading && queue.length === 0 && <div className="card t-mute">{t('team.queueEmpty')}</div>}
        {queue.map((i) => {
          const b = byId.get(i.brandId);
          return (
            <div key={`${i.brandId}/${i.id}`} className="card row g20 wrap">
              <div className="col g4 grow" style={{ minWidth: 220 }}>
                <span className="row g8">{b && <span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none' }}><BrandMark brand={b} /></span>}<span className="t-sm t-mute">{b?.name}</span></span>
                <span className="w7">{i.title} · {i.stage === 'plan' ? t('team.planToApprove') : t('team.workToReview')}</span>
              </div>
              {i.approvalLevel === 'nicolas' && <span className="chip c-sent">{t('ask.withNicolas')}</span>}
              <span className="t-sm t-mute">{t('team.waiting', { time: ago(i.createdAt?.toDate()) })}</span>
              <Link className="btn btn-primary btn-sm" to={`/requests/${i.id}`} onClick={() => open(i)}>{t('common.open')}</Link>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="col g12" aria-labelledby="b">
          <h2 className="h3" id="b">{t('team.brains')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {BRAINS.map((b) => {
              const l = load(b);
              const state = l.approve ? 'approval' : l.prod ? 'working' : 'idle';
              return (
                <div key={b} className="card col g12">
                  <div className="row g12"><span className={`brain b-${b} brain-${state}`}><img src={`/brand/brains/${b}.png`} alt="" /></span>
                    <div className="col"><span className="w7">{brainName(b)}</span><span className="t-xs" style={{ color: state === 'approval' ? 'var(--warning)' : state === 'working' ? `var(--${b}-ink)` : 'var(--graphite)' }}>{t(`team.state.${state}`)}</span></div></div>
                  <div className="col t-sm" style={{ gap: 6 }}>
                    <div className="row between"><span>{t('req.status.in_production')}</span><strong>{l.prod}</strong></div>
                    <div className="row between"><span>{t('req.status.to_approve')}</span><strong>{l.approve}</strong></div>
                  </div>
                  {(() => {
                    const running = tasks.find((x) => x.brain === b && x.status === 'running');
                    const last = tasks.find((x) => x.brain === b && x.status === 'done');
                    const task = running ?? last;
                    if (!task) return null;
                    const brandName = brands.find((x) => x.id === task.brandId)?.name ?? task.brandId;
                    return <span className="t-xs t-mute truncate">{t(running ? 'brains.now' : 'brains.lastDone', { title: `${task.title} · ${brandName}` })}</span>;
                  })()}
                </div>
              );
            })}
          </div>
        </section>
        <section className="col g12" aria-labelledby="m">
          <h2 className="h3" id="m">{t('team.members')}</h2>
          {current ? <MembersCard key={current.id} brandId={current.id} brandName={current.name} /> : <p className="t-mute">{t('brand.none')}</p>}
          <p className="t-xs t-mute">{t('team.membersHint')}</p>
          <GranolaInbox />
        </section>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return <div className="col"><span className="h2">{n}</span><span className="t-xs t-mute">{label}</span></div>;
}
