import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { STATUSES, type SiteChange } from './SiteChanges';
import type { Spot } from './useSpot';

/** One triage point, folded to its title and state; opens to what was asked and what was done. NickMark changes the state here. */
export function Point({ brandId, x, onShow, on }: { brandId: string; x: SiteChange; onShow?: (s: Spot) => void; on?: boolean }) {
  const { t } = useI18n();
  const isAdmin = useAuth().profile?.role === 'admin';
  return (
    // Opening a point takes the site beside it to where the point lives.
    <details className={`spanel-pt is-${x.status}${on ? ' is-on' : ''}`}
      onToggle={(e) => { if (e.currentTarget.open && onShow && (x.link || x.spot)) onShow({ url: x.link, spot: x.spot, label: x.key, auto: true }); }}>
      <summary>
        <span className="sx-key">{x.key}</span>
        <span className="spanel-ptitle">{x.title}</span>
        <span className={`sx-status is-${x.status}`}>{t(`site.status.${x.status}` as StringKey)}</span>
      </summary>
      {isAdmin && (
        <select className={`sx-status spanel-set is-${x.status}`} aria-label={`${t('site.state')} ${x.key}`} value={x.status}
          onChange={(e) => updateDoc(doc(db, 'brands', brandId, 'siteChanges', x.id), { status: e.target.value, updatedAt: serverTimestamp() })}>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`site.status.${s}` as StringKey)}</option>)}
        </select>
      )}
      {x.request && <p className="t-xs"><span className="sx-lbl">{t('site.asked')}</span> {x.request}</p>}
      {x.delivered && <p className="t-xs"><span className="sx-lbl">{t('site.done')}</span> {x.delivered}</p>}
      {onShow && (x.link || x.spot)
        ? <button type="button" className="sx-link t-xs" onClick={() => onShow({ url: x.link, spot: x.spot, label: x.key })}>{t('sp.showOnPage')}</button>
        : x.link && <a className="sx-link t-xs" href={x.link} target="_blank" rel="noreferrer">{t('site.seeChange')} ↗</a>}
    </details>
  );
}
