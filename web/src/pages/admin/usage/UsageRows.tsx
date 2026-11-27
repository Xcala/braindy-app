import { useI18n } from '../../../i18n/I18nProvider';
import type { Row, View } from './useUsage';

const pct = (a: number, b: number) => `${b ? Math.round((a / b) * 100) : 0} %`;
const COLS = 'minmax(170px,1.6fr) 80px 90px 100px 90px';
const ALL_COLS = 'minmax(170px,1.6fr) 70px 110px 130px 110px 130px';

/** One count per row: on a phone a short three-line item (name + total, phone/computer bar, the two numbers); on a computer the table with Costos' fix (name fixed, the rest slides). */
export function UsageRows({ rows, view, label }: { rows: Row[]; view: View; label: (key: string) => string }) {
  const { t } = useI18n();
  const all = view === 'all';
  return (
    <>
      <div className="ast-list md:hidden">
        {rows.map((r) => (
          <div key={r.key} className="ast-item">
            <div className="ast-top"><span>{label(r.key)}</span><span>{r.total}</span></div>
            <span className="ast-split" aria-hidden="true"><i style={{ width: `${r.total ? (r.phone / r.total) * 100 : 0}%` }} /><b style={{ flex: 1 }} /></span>
            <span className="ast-sub">{t('pv.split', { p: r.phone, d: r.desk })}{all ? ` · ${t('pv.splitAll', { c: r.c, a: r.a })}` : ''}</span>
          </div>
        ))}
      </div>
      <div className="table cost-table hidden md:block">
        <div className="trow head label min-w-[40rem]" style={{ gridTemplateColumns: all ? ALL_COLS : COLS }}>
          <span className="cost-name">{t('pv.c.what')}</span><span>{t('pv.c.total')}</span>
          {all ? <><span>{t('pv.c.cp')}</span><span>{t('pv.c.cd')}</span><span>{t('pv.c.ap')}</span><span>{t('pv.c.ad')}</span></>
            : <><span>{t('pv.c.phone')}</span><span>{t('pv.c.desk')}</span><span>{t('pv.c.pct')}</span></>}
        </div>
        {rows.map((r) => (
          <div key={r.key} className="trow min-w-[40rem] t-sm" style={{ gridTemplateColumns: all ? ALL_COLS : COLS }}>
            <span className="w7 cost-name" title={r.key}><b>{label(r.key)}</b></span><span className="w7">{r.total}</span>
            {all ? <><span>{r.cp}</span><span>{r.cd}</span><span className="t-mute">{r.ap}</span><span className="t-mute">{r.ad}</span></>
              : <><span>{r.phone}</span><span>{r.desk}</span><span className="t-mute">{pct(r.phone, r.total)}</span></>}
          </div>
        ))}
      </div>
    </>
  );
}

export function SplitLegend() {
  const { t } = useI18n();
  return (
    <span className="md:hidden" aria-hidden="true"><span className="ast-legend">
      <span><i style={{ background: 'var(--azul,#2F4DE0)' }} />{t('pv.legPhone')}</span>
      <span><i style={{ background: '#AEB6C6' }} />{t('pv.legDesk')}</span>
    </span></span>
  );
}
