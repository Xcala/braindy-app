import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Gantt, deliveries } from '../contracts/Gantt';
import { ScheduleTrack } from '../contracts/ScheduleTrack';
import { Checklist } from '../contracts/Checklist';
import type { ChecklistItem, RowStatus, Schedule } from '../contracts/types';
import { Packs } from './Packs';
import { CareBlock } from './CareBlock';
import { Stack } from './Stack';
import { OnceIntro } from './OnceIntro';
import { Fold } from '../components/Fold';
import type { BrandPlan, PackStatus, StackItem } from './types';

const fmt = (iso: string | undefined, lang: string) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export type PlanTab = 'summary' | 'schedule' | 'brand' | 'site' | 'apps' | 'payments';

export interface PlanViewProps {
  /** Which tab is open; the summary header stays on top of every tab. */
  tab: PlanTab;
  /** The tab switch, rendered right under the header. */
  tabs: ReactNode;
  /** Extra content for the site tab (hosting plans) and the payments tab (design plan). */
  site?: ReactNode;
  /** The Brand tab: on-brand piece design with the Brains. */
  brand?: ReactNode;
  /** The explainer at the top of the summary, site and payments tabs. */
  intros?: Partial<Record<PlanTab, ReactNode>>;
  payments?: ReactNode;
  /** Third-party apps and their access: the Apps tab. */
  apps?: ReactNode;
  /** A fold to open on arrival (?open=schedule|apps). */
  openFold?: string;
  brandName: string;
  plan: BrandPlan | null;
  /** Third-party apps the brand runs on. */
  stack?: StackItem[];
  /** The contract block (status, signing, PDF), rendered right under the summary. */
  contract?: ReactNode;
  schedule: Schedule | null;
  kickoff: { start: string; items: ChecklistItem[] } | null;
  onPackStatus?: (i: number, s: PackStatus) => void;
  onRowStatus?: (group: number, row: number, s: RowStatus) => void;
  onTick?: (id: string, done: boolean) => void;
}

/** Mi plan: the summary header, then one tab at a time. Summary (contract + what was contracted), schedule (weeks + kickoff
 *  checklist), site and apps (maintenance, the apps it runs on, hosting) and payments. */
export function PlanView({ tab, tabs, site, brand, payments, apps, openFold, intros, brandName, plan, stack, contract, schedule, kickoff, onPackStatus, onRowStatus, onTick }: PlanViewProps) {
  const { t, lang } = useI18n();
  const p = schedule ? deliveries(schedule) : { done: 0, total: 0 };
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  const ticked = kickoff?.items.filter((x) => x.done).length ?? 0;
  // Without a plan loaded the dark header would be empty: a plain title instead, the signature lives in the full one.
  const head = !plan && !schedule ? (
    <header className="col g4">
      <p className="label" style={{ margin: 0 }}>{brandName}</p>
      <h1 className="h1">{t('plan.title')}</h1>
    </header>
  ) : null;
  return (
    <div className="col g32">
      {head ?? <header className="card col g16" style={{ background: 'linear-gradient(135deg,#0B1220 0%,#16224A 60%,#2F4DE0 140%)', color: '#fff', borderColor: '#0B1220' }}>
        <p className="label" style={{ color: '#8FA0FF', margin: 0 }}>{brandName}{plan ? ` · ${t(`plan.status.${plan.status}`)}` : ''}</p>
        <h1 className="h1" style={{ color: '#fff' }}><span className="w3">{t('plan.title')}{plan ? ' · ' : ''}</span>{plan && <span className="w9">{plan.title}</span>}</h1>
        {plan?.summary && <p style={{ margin: 0, color: '#C9D0DE', maxWidth: '45rem' }}>{plan.summary}</p>}
        <div className="row g24" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {(plan?.start || plan?.end) && (
            <div className="col"><span className="label" style={{ color: '#8FA0FF' }}>{t('plan.dates')}</span><span className="w7">{fmt(plan.start, lang)}{plan.end ? ` → ${fmt(plan.end, lang)}` : ''}</span></div>
          )}
          {p.total > 0 && (
            <div className="col g4" style={{ minWidth: '13.75rem', flex: '1 1 220px', maxWidth: '22.5rem' }}>
              <span className="label" style={{ color: '#8FA0FF' }}>{t('plan.progress')}</span>
              <span className="w7">{t('plan.delivered').replace('{done}', String(p.done)).replace('{total}', String(p.total))}</span>
              <span role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('plan.progress')} style={{ height: '0.5rem', borderRadius: '6.1875rem', background: 'rgba(255,255,255,.18)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#10B981,#06B6D4)' }} />
              </span>
            </div>
          )}
        </div>
        <p className="t-sm" style={{ margin: 0, color: '#C9D0DE' }}>
          {/* The "ai" inside Brains goes in 900 in signatures. */}
          {t('plan.signature').split('Brains').flatMap((part, i) => (i ? [<span key={i}>Br<b className="w9">ai</b>ns</span>, part] : [part]))}
        </p>
      </header>}
      {tabs}
      {intros?.[tab] && <OnceIntro key={tab} id={tab}>{intros[tab]}</OnceIntro>}
      {tab === 'summary' && contract}
      {tab === 'summary' && plan && <Packs c={plan} onStatus={onPackStatus} />}
      {tab === 'summary' && (schedule || (kickoff && kickoff.items.length > 0)) && (
        <Fold id="schedule" title={t('plan.foldSchedule')} sub={t('plan.foldScheduleSub')} open={openFold === 'schedule'}>
      {schedule && (
        <section className="col g16" aria-labelledby="plan-gantt">
          <div className="col g4">
            <p className="label">{t('plan.b2')}</p>
            <h2 id="plan-gantt" className="h2">{t('plan.ganttTitle')}</h2>
            <p className="t-sm t-mute" style={{ margin: 0 }}>{t('plan.weeksNote', { weeks: schedule.weeks, start: fmt(schedule.start, lang) })}</p>
          </div>
          <ScheduleTrack schedule={schedule} />
          <Gantt schedule={schedule} onStatus={onRowStatus} />
        </section>
      )}
      {kickoff && kickoff.items.length > 0 && (
        <section className="card card-tight col g12" aria-labelledby="plan-kickoff">
          <div className="row g8" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div className="col g4"><p className="label">{t('plan.bKickoff')}</p><h2 id="plan-kickoff" className="h2">{t('ctr.checklist')}</h2></div>
            <span className="chip">{t('ctr.doneOf', { done: ticked, total: kickoff.items.length })}</span>
          </div>
          {onTick && <p className="t-sm t-mute" style={{ margin: 0 }}>{t('ctr.checklistTick')}</p>}
          <Checklist items={kickoff.items} start={kickoff.start} onToggle={onTick} />
        </section>
      )}
        </Fold>
      )}
      {tab === 'brand' && brand}
      {tab === 'site' && site}
      {tab === 'site' && plan && <CareBlock c={plan} />}
      {tab === 'apps' && stack && <Stack items={stack} />}
      {tab === 'apps' && apps}
      {tab === 'payments' && payments}
    </div>
  );
}
