import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { platformOf } from './platforms';
import type { AdCampaign } from './usePauta';

const DAY = 86_400_000;
const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Campaigns that run on a day (not ended before it, not starting after it). Campaigns without a start are left out. */
export function runsOn(c: AdCampaign, d: Date) {
  if (!c.start || c.state === 'ended' && !c.end) return false;
  const day = startOf(d);
  return startOf(c.start) <= day && (!c.end || startOf(c.end) + DAY > day);
}

/** The paid campaigns beside the organic posts: a legend above the calendar, linking to Pauta. */
export function PautaLegend({ campaigns }: { campaigns: AdCampaign[] }) {
  const { t } = useI18n();
  if (!campaigns.length) return null;
  return (
    <div className="row g12 wrap pa-legend" aria-label={t('pa.inCalendar')}>
      <span className="t-xs w7">{t('pa.title')}</span>
      {campaigns.map((c) => (
        <Link key={c.id} to="/pauta" className="t-xs pa-legend-item"><span style={{ background: c.color }} />{c.name} · {platformOf(c.platform).label}</Link>
      ))}
    </div>
  );
}

/** One day: a thin band per campaign running, in its color (the name shows on the band's first day of each week). */
export function DayBands({ campaigns, day }: { campaigns: AdCampaign[]; day: Date }) {
  const on = campaigns.filter((c) => runsOn(c, day));
  if (!on.length) return null;
  const monday = day.getDay() === 1;
  return (
    <span className="pa-bands">
      {on.slice(0, 3).map((c) => {
        const first = !!c.start && (startOf(c.start) === startOf(day) || monday);
        return <span key={c.id} className="pa-band" style={{ background: c.color }} title={c.name}>{first ? c.name : ''}</span>;
      })}
    </span>
  );
}
