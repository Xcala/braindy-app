import { useI18n } from '../i18n/I18nProvider';
import { pct, pointsFor, type SiteChange } from './SiteChanges';
import type { BrandLink } from './useBrandLinks';

/** On a site or app card: its adjustments at a glance, and the way in (opening it shows the page beside its triage). */
export function LinkAdjust({ link, links, all, onOpen }: { link: BrandLink; links: BrandLink[]; all: SiteChange[]; onOpen: () => void }) {
  const { t } = useI18n();
  const list = pointsFor(all, link, links);
  const open = list.filter((x) => x.status !== 'delivered' && x.status !== 'discarded').length;
  return (
    <button type="button" className="ladj" onClick={onOpen}>
      <span className="row between g8">
        <span className="t-sm w7">{t('site.title')}</span>
        {list.length > 0 && <span className="ladj-pct"><b>{pct(list)}</b>% {t('site.pct')}</span>}
      </span>
      {list.length > 0 && <span className="ladj-bar" aria-hidden="true"><span style={{ width: `${pct(list)}%` }} /></span>}
      <span className="t-xs t-mute">{list.length ? t('ladj.some', { n: open }) : t('ladj.none')}</span>
    </button>
  );
}
