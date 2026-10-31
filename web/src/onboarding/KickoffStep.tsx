import { Link } from 'react-router';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { Gantt } from '../contracts/Gantt';
import { Checklist } from '../contracts/Checklist';
import { ContractDownload } from '../contracts/ContractDownload';
import { contractsApi } from '../contracts/api';
import type { ChecklistItem, Contract, Schedule } from '../contracts/types';
import type { Brand } from '../brands/BrandProvider';
import { SessionPicker } from './SessionPicker';

/** Step 2 · Kickoff: the schedule by week, the kickoff meeting and the checklist of materials and accesses. */
export function KickoffStep({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const schedule = useBrandDoc(brand.id, 'context/schedule').data as Schedule | null;
  const kickoff = useBrandDoc(brand.id, 'context/kickoff').data as { start: string; items: ChecklistItem[] } | null;
  const contractId = brand.onboarding?.contractId;
  const contract = useBrandDoc(brand.id, `contracts/${contractId ?? '-'}`).data;
  const items = kickoff?.items ?? [];
  const done = items.filter((x) => x.done).length;

  return (
    <section className="col g20 min-w-0">
      <div className="stage col g12 rounded-[20px] p-6 sm:p-9">
        <p className="label">{t('ctr.step2')}</p>
        <h1 className="d-lg" style={{ color: '#fff', fontSize: 40, lineHeight: '44px' }}><span className="w9">{t('ctr.kick1')}</span> {t('ctr.kick2')}</h1>
        <p className="t-lg muted">{t('ctr.kickSub')}</p>
      </div>
      <SessionPicker brandId={brand.id} brandName={brand.name} bookedAt={brand.onboarding?.kickoffAt} kind="kickoff" />
      {kickoff && (
        <div className="card col g12" style={{ padding: 22 }}>
          <div className="row between g8 wrap"><h2 className="h3">{t('ctr.checklist')}</h2><span className="chip">{t('ctr.doneOf', { done, total: items.length })}</span></div>
          <p className="t-sm t-mute">{t('ctr.checklistTick')}</p>
          <Checklist items={items} start={kickoff.start} onToggle={(id, v) => { contractsApi.tick(brand.id, id, v).catch(() => undefined); }} />
        </div>
      )}
      {schedule && (
        <div className="card col g12" style={{ padding: 22 }}>
          <div className="row between g8 wrap"><h2 className="h3">{t('ctr.schedule')}</h2><Link to="/plan" className="btn btn-secondary btn-sm">{t('plan.seeOnboarding')}</Link></div>
          <Gantt schedule={schedule} />
        </div>
      )}
      {contract && contractId && <ContractDownload brandId={brand.id} contract={{ id: contractId, ...contract } as Contract} />}
    </section>
  );
}
