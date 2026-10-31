import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { contractsApi } from '../contracts/api';
import type { StackItem } from '../plan/types';
import type { ChecklistItem, Contract, RowStatus, Schedule } from '../contracts/types';
import { PlanView } from '../plan/PlanView';
import { ContractCard } from '../plan/ContractCard';
import { AdminPlan } from '../plan/AdminPlan';
import { planApi, usePlan } from '../plan/usePlan';

/** Mi plan: everything the client contracted in one place. What they bought, the contract (sign it here, download it
 *  signed), the schedule by week with its deliveries, the kickoff checklist, the website's hosting and maintenance, and the apps the brand runs on. */
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

  return (
    <div className="col g32">
      <PlanView brandName={current.name} plan={plan} stack={stack ?? undefined} schedule={schedule} kickoff={kickoff}
        contract={<ContractCard brandId={id} contract={contract} />}
        onPackStatus={admin ? (i, st) => { void planApi.packStatus(id, i, st); } : undefined}
        onRowStatus={admin && editable ? setRow : undefined}
        onTick={(itemId, done) => { contractsApi.tick(id, itemId, done).catch(() => undefined); }} />
      {!plan && !schedule && !stack?.length && <div className="card t-mute">{t('plan.empty')}</div>}
      <p className="t-sm t-mute" style={{ margin: 0 }}>{t('plan.payments')} <Link to="/settings?tab=billing" className="w7">{t('set.tab.billing')}</Link></p>
      {admin && <AdminPlan key={id} brandId={id} plan={plan} stack={stack} />}
    </div>
  );
}
