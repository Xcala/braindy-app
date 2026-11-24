import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { Icon } from '../components/Icon';
import { LinkAdjust } from './LinkAdjust';
import { MoreMenu, type Item } from '../assets/FileMenu';
import type { SiteChange } from './SiteChanges';
import type { BrandLink, LinkSection } from './useBrandLinks';
import './linkCard.css';

const host = (url: string) => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; } };

/**
 * One card in My apps / My research (UX #12): a lower cover (the site's own image, or a short strip with its domain),
 * title + status + adjustments together, the long description only as a tooltip, and ONE strong action.
 * Everything else (new tab, edit, delete) lives in ⋯.
 */
export function LinkCard({ link, links, section, changes, isAdmin, onOpen, onEdit, onDelete }: {
  link: BrandLink; links: BrandLink[]; section: LinkSection; changes: SiteChange[]; isAdmin: boolean;
  onOpen: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const { t } = useI18n();
  const [shotOk, setShotOk] = useState(true);
  const shot = link.ogImage && shotOk;
  const menu: Item[] = [['external', t('lv.newTab'), () => window.open(link.url, '_blank', 'noopener,noreferrer')]];
  if (isAdmin) menu.push(['pencil', t('links.edit'), onEdit], ['trash', t('links.delete'), onDelete, true]);
  return (
    <div className="deck lcard" title={link.description || undefined}>
      <button type="button" onClick={onOpen} aria-label={`${t('links.open')} ${link.title}`} className={`cover ${shot ? 'lc-shot' : 'lc-strip'}`}>
        {shot ? <img className="bg" src={link.ogImage!} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setShotOk(false)} />
          : <span className="row g8 t-sm w7"><Icon name="link" size={14} />{host(link.url)}</span>}
      </button>
      <div className="body">
        <div className="row between g8" style={{ alignItems: 'flex-start' }}>
          <span className="col" style={{ minWidth: 0 }}>
            <span className="h3">{link.title}</span>
            <span className="t-xs t-mute">{t(`links.kind.${link.kind}` as StringKey)}</span>
          </span>
          <span className={`chip ${link.status === 'building' ? 'c-draft' : 'c-approved'}`}>{t(link.status === 'building' ? 'links.status.building' : 'links.status.live')}</span>
        </div>
        {section === 'apps' && <LinkAdjust link={link} links={links} all={changes} onOpen={onOpen} />}
        <div className="row g8 lc-actions">
          <button type="button" className="btn btn-primary btn-sm grow" onClick={onOpen}>{t(section === 'apps' ? 'lcard.openAndAsk' : 'links.open')}</button>
          <MoreMenu label={link.title} items={menu} />
        </div>
      </div>
    </div>
  );
}
