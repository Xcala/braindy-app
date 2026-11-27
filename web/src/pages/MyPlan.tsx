import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PaymentsTab } from '../plan/PaymentsTab';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { contractsApi } from '../contracts/api';
import type { ChecklistItem, Contract, RowStatus, Schedule } from '../contracts/types';
import { PlanView, type PlanTab } from '../plan/PlanView';
import { ContractCard } from '../plan/ContractCard';
import { ProposalCard } from '../plan/ProposalCard';
import { PlanEditor } from '../plan/PlanEditor';
import { Button } from '../components/Button';
import { UpgradeTab } from '../plan/UpgradeTab';
import { ProjectHead, useLiveProject } from '../plan/ProjectHead';
import { PaymentsIntro, SummaryIntro } from '../plan/PlanIntros';
import { planApi, usePlan } from '../plan/usePlan';
import { Accesses } from './Accesses';
import { useMySections } from '../team/sections';

/** Mi plan: everything the client contracted in one place. What they bought, the contract (sign it here, download it
 *  signed), the schedule by week with its deliveries, the kickoff checklist, the website's hosting and maintenance, the apps the brand runs on,
 *  and below, the design plan being billed and the site hosting tiers. */
export function MyPlan() {
  const { current } = useBrands();
  const { profile } = useAuth();
  const { t } = useI18n();
  const plan = usePlan(current?.id);
  // No plan loaded: Mi plan's header comes from the project billed in cuentas, if there is one (audit C1).
  const billed = useLiveProject(plan === null ? current?.id : undefined);
  const contractId = current?.onboarding?.contractId ?? null;
  const contractDoc = useBrandDoc(current?.id, `contracts/${contractId ?? '-'}`);
  const live = useBrandDoc(current?.id, 'context/schedule').data as Schedule | null;
  const kickoff = useBrandDoc(current?.id, 'context/kickoff').data as { start: string; items: ChecklistItem[] } | null;
  const admin = profile?.role === 'admin';
  const [params] = useSearchParams();
  const { can } = useMySections();
  const [editing, setEditing] = useState(false);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (plan === undefined || (contractId && contractDoc.loading)) return <p className="t-mute">{t('common.loading')}…</p>;

  const id = current.id;
  const contract = contractId && contractDoc.data ? ({ id: contractId, ...contractDoc.data } as Contract) : null;
  // After signing, the live schedule (statuses move); before, the contract's Anexo 2 as sent or drafted.
  const schedule = live ?? contract?.schedule ?? null;
  const editable = live ? 'live' : contract?.status === 'draft' ? 'draft' : null;

  function setRow(gi: number, ri: number, status: RowStatus) {
    if (!schedule || !editable) return;
    const next: Schedule = { ...schedule, groups: schedule.groups.map((g, i) => (i !== gi ? g : { ...g, rows: g.rows.map((r, j) => (j === ri ? { ...r, status } : r)) })) };
    void (editable === 'live' ? contractsApi.saveSchedule(id, next) : contractsApi.save(id, contract!.id, { schedule: next }));
  }

  // Tabs instead of one long page (they sit in the section's top row, see app/planTabs); the schedule tab only when there is a schedule or a kickoff checklist.
  // The schedule folds inside the summary (2026-11-17); old ?tab=schedule links land there with it open.
  // «Mejorar mi plan» (site) holds hosting and the studio since 2026-11-26; old ?tab=brand links land there.
  const tabs: PlanTab[] = ['summary', 'site', 'apps', 'payments'];
  // Third-party apps got their own tab (2026-11-18); old ?tab=site&open=apps links land there.
  const raw = params.get('open') === 'apps' ? 'apps' : params.get('tab');
  const asked = (raw === 'brand' ? 'site' : raw) as PlanTab | null;
  const tab: PlanTab = asked && tabs.includes(asked) ? asked : 'summary';
  const openFold = asked === 'schedule' ? 'schedule' : params.get('open') ?? undefined;

  return (
    <div className="col g32">
      <PlanView tab={tab} tabs={null} site={<UpgradeTab brand={current} />}
        project={billed ? <ProjectHead live={billed} brandName={current.name} action={admin ? <Button size="sm" onClick={() => setEditing(true)}>✎ {t('pe.open')}</Button> : undefined} /> : undefined}
        intros={{ summary: <SummaryIntro brand={current} />, payments: <PaymentsIntro brand={current} /> }}
        payments={<PaymentsTab brand={current} />} openFold={openFold}
        apps={can('accesses') ? <Accesses embedded /> : undefined}
        brandName={current.name} plan={plan} schedule={schedule} kickoff={kickoff}
        action={admin && tab === 'summary' ? <Button size="sm" onClick={() => setEditing(true)}>✎ {t('pe.open')}</Button> : undefined}
        contract={<><ProposalCard brandId={id} brandName={current.name} /><ContractCard brandId={id} contract={contract} noPlan={!plan} /></>}
        onPackStatus={admin ? (i, st) => { void planApi.packStatus(id, i, st); } : undefined}
        onRowStatus={admin && editable ? setRow : undefined}
        onTick={(itemId, done) => { contractsApi.tick(id, itemId, done).catch(() => undefined); }} />
      {admin && editing && <PlanEditor key={id} brandId={id} brandName={current.name} plan={plan} onClose={() => setEditing(false)} />}
    </div>
  );
}
