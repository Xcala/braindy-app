import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Scene } from '../studio/Scene';
import { buildSeats } from '../studio/useStudio';
import type { WorkItem } from '../team/useWork';
import type { ScopedRequest } from '../requests/useBrandsRequests';

/** The studio on the home: the team working, live, only on this brand's open requests (read-only for clients). */
export function HomeStudio({ requests }: { requests: ScopedRequest[] }) {
  const { t } = useI18n();
  const items = useMemo(() => requests.filter((r) => r.status === 'in_production' || r.status === 'to_approve') as WorkItem[], [requests]);
  const seats = useMemo(() => buildSeats(items, [], []), [items]);
  return (
    <section className="col g12" aria-labelledby="h-studio">
      <div className="col g4">
        <h2 className="h3" id="h-studio">{t('st.homeTitle')}</h2>
        <p className="t-sm t-mute">{t('st.homeSub')}</p>
      </div>
      <Scene seats={seats} items={items} toSignCount={0} brandView />
    </section>
  );
}
