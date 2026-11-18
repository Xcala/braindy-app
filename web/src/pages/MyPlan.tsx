import { useSearchParams } from 'react-router';
import { PaymentsTab } from '../plan/PaymentsTab';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { contractsApi } from '../contracts/api';
import type { StackItem } from '../plan/types';
import type { ChecklistItem, Contract, RowStatus, Schedule } from '../contracts/types';
import { PlanView, type PlanTab } from '../plan/PlanView';
import { ContractCard } from '../plan/ContractCard';
import { ProposalCard } from '../plan/ProposalCard';
import { AdminPlan } from '../plan/AdminPlan';
import { Subscription } from '../plan/Subscription';
import { BrandPieces } from '../plan/BrandPieces';
import { PaymentsIntro, SiteIntro, SummaryIntro } from '../plan/PlanIntros';
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
  const contractId = current?.onboarding?.contractId ?? null;
  const contractDoc = useBrandDoc(current?.id, `contracts/${contractId ?? '-'}`);
  const live = useBrandDoc(current?.id, 'context/schedule').data as Schedule | null;
  const kickoff = useBrandDoc(current?.id, 'context/kickoff').data as { start: string; items: ChecklistItem[] } | null;
  const stack = (useBrandDoc(current?.id, 'billing/stack').data as { items?: StackItem[] } | null)?.items ?? null;
  const admin = profile?.role === 'admin';
  const [params] = useSearchParams();
  const { can } = useMySections();
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
  const tabs: PlanTab[] = ['summary', 'brand', 'site', 'apps', 'payments'];
  // Third-party apps got their own tab (2026-11-18); old ?tab=site&open=apps links land there.
  const asked = (params.get('open') === 'apps' ? 'apps' : params.get('tab')) as PlanTab | null;
  const tab: PlanTab = asked && tabs.includes(asked) ? asked : 'summary';
  const openFold = asked === 'schedule' ? 'schedule' : params.get('open') ?? undefined;

  return (
    <div className="col g32">
      <PlanView tab={tab} tabs={null} site={<Subscription current={current} part="hosting" />} brand={<BrandPieces brand={current} />}
        intros={{ summary: <SummaryIntro brand={current} />, site: <SiteIntro brand={current} />, payments: <PaymentsIntro brand={current} /> }}
        payments={<PaymentsTab brand={current} />} openFold={openFold}
        apps={can('accesses') ? <Accesses embedded /> : undefined}
        brandName={current.name} plan={plan} stack={stack ?? undefined} schedule={schedule} kickoff={kickoff}
        contract={<><ProposalCard brandId={id} admin={admin} /><ContractCard brandId={id} contract={contract} noPlan={!plan} /></>}
        onPackStatus={admin ? (i, st) => { void planApi.packStatus(id, i, st); } : undefined}
        onRowStatus={admin && editable ? setRow : undefined}
        onTick={(itemId, done) => { contractsApi.tick(id, itemId, done).catch(() => undefined); }} />
      {admin && tab === 'summary' && <AdminPlan key={id} brandId={id} plan={plan} stack={stack} />}
    </div>
  );
}
