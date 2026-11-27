import { useState } from 'react';
import { PeriodPick } from '../../../components/PeriodPick';
import type { Group } from '../../../costs/useAiHealth';
import { useFmt } from './kit';

const COLS = 'minmax(170px,1.6fr) 90px 90px 90px 80px 90px';

/** SA2: «By kind of work» and «By brand» as two tabs; failures first, the rest folded. Phone: two-line rows; computer: the table with Costos' fix. */
export function GroupTabs({ byKind, byBrand }: { byKind: Group[]; byBrand: Group[] }) {
  const f = useFmt();
  const { t } = f;
  const [tab, setTab] = useState<'kind' | 'brand'>('kind');
  const rows = tab === 'kind' ? byKind : byBrand;
  const label = tab === 'kind' ? f.kind : f.brand;
  const bad = rows.filter((g) => g.failed > 0).sort((a, b) => b.failed - a.failed);
  const good = rows.filter((g) => !g.failed);

  const list = (gs: Group[]) => (
    <>
      <div className="ast-list md:hidden">
        {gs.map((g) => (
          <div key={g.key} className="ast-item">
            <div className="ast-top"><span>{label(g.key)}</span>{g.failed > 0 && <span className="ast-fail">{t(g.failed === 1 ? 'aih.fail1' : 'aih.failN', { n: g.failed })}</span>}</div>
            <span className="ast-sub">{t('aih.rowSub', { calls: g.calls, p50: f.secs(g.p50), usd: f.usd(g.usd) })}</span>
          </div>
        ))}
      </div>
      <div className="table cost-table hidden md:block">
        <div className="trow head label min-w-[40rem]" style={{ gridTemplateColumns: COLS }}>
          <span className="cost-name">{t('aih.c.what')}</span><span>{t('aih.c.calls')}</span><span>{t('aih.c.failed')}</span><span>{t('aih.c.retried')}</span><span>{t('aih.c.time')}</span><span>{t('aih.c.cost')}</span>
        </div>
        {gs.map((g) => (
          <div key={g.key} className="trow min-w-[40rem] t-sm" style={{ gridTemplateColumns: COLS }}>
            <span className="w7 cost-name" title={g.key}><b>{label(g.key)}</b></span><span>{g.calls}</span>
            <span className={g.failed ? 'ast-fail' : undefined}>{g.failed}</span><span>{g.retried}</span><span>{f.secs(g.p50)}</span><span>{f.usd(g.usd)}</span>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <section className="col g12">
      <PeriodPick label={t('aih.show')} value={tab} onChange={setTab} options={[{ value: 'kind', label: t('aih.byKind') }, { value: 'brand', label: t('aih.byBrand') }]} />
      {bad.length > 0 && list(bad)}
      {good.length > 0 && (bad.length === 0 ? list(good) : (
        <details className="ast-fold">
          <summary>{t('aih.restN', { n: good.length })}</summary>
          <div style={{ marginTop: '0.75rem' }}>{list(good)}</div>
        </details>
      ))}
    </section>
  );
}
