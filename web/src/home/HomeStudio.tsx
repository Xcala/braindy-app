import { useMemo } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { Scene } from '../studio/Scene';
import { Launches } from '../studio/Launches';
import { buildSeats } from '../studio/useStudio';
import type { WorkItem } from '../team/useWork';
import type { ScopedRequest } from '../requests/useBrandsRequests';

/** The studio on the home (the hero), with the launches beside it: the team working, live, only on this brand's open requests (read-only for clients). */
export function HomeStudio({ requests }: { requests: ScopedRequest[] }) {
  const { current } = useBrands();
  const items = useMemo(() => requests.filter((r) => r.status === 'in_production' || r.status === 'to_approve') as WorkItem[], [requests]);
  const seats = useMemo(() => buildSeats(items, [], []), [items]);
  return (
    <div className="sd-with-launches">
      <Scene seats={seats} items={items} toSignCount={0} brandView city={current?.city} brandName={current?.name} />
      <Launches />
    </div>
  );
}
