import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { Icon } from '../components/Icon';
import { LinkViewer } from './LinkViewer';
import { LinkAdjust } from './LinkAdjust';
import { useSiteChanges } from './SiteChanges';
import { addLink, isHttps, removeLink, saveLink, type BrandLink, type LinkInput, type LinkKind, type LinkSection } from './useBrandLinks';

const COVERS: Record<LinkKind, string> = {
  web: 'radial-gradient(120% 90% at 85% 0%, rgba(42,127,255,.9), transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(6,182,212,.6), transparent 60%), #1F3596',
  app: 'radial-gradient(110% 90% at 100% 0%, rgba(139,92,246,.75), transparent 55%), #14123A',
  dashboard: 'radial-gradient(110% 90% at 0% 0%, rgba(6,182,212,.6), transparent 55%), #0B1730',
  research: 'radial-gradient(100% 90% at 100% 0%, rgba(245,179,1,.35), transparent 55%), #060D1E',
  marketmap: 'radial-gradient(100% 90% at 100% 0%, rgba(245,179,1,.35), transparent 55%), #060D1E',
};
const KINDS: Record<LinkSection, LinkKind[]> = { apps: ['web', 'app', 'dashboard'], research: ['research', 'marketmap'] };
const host = (url: string) => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; } };

/** Cards for My apps / My research. Everyone in the brand opens them; NickMark adds, edits and deletes.
 *  A site or app card shows its adjustments; opening it puts the page beside its triage. */
export function LinkGrid({ brandId, section, links }: { brandId: string; section: LinkSection; links: BrandLink[] }) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [editing, setEditing] = useState<BrandLink | 'new' | null>(null);
  const [viewing, setViewing] = useState<BrandLink | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);
  const changes = useSiteChanges(brandId);

  return (
    <div className="col g16">
      {isAdmin && !editing && <div><button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>+ {t('links.add')}</button></div>}
      {editing && <LinkForm brandId={brandId} section={section} link={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <div key={l.id} className="deck">
            <button type="button" onClick={() => setViewing(l)} aria-label={`${t('links.open')} ${l.title}`} className="cover" style={{ background: COVERS[l.kind] ?? COVERS.web, color: '#fff', textDecoration: 'none', border: 0, width: '100%', cursor: 'pointer', padding: 0 }}>
              {l.ogImage ? <img className="bg" src={l.ogImage} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : (
                <div className="col g8" style={{ alignItems: 'center' }}>
                  <Icon name="file" size={30} />
                  <span className="t-sm w7" style={{ opacity: 0.85 }}>{host(l.url)}</span>
                </div>
              )}
            </button>
            <div className="body">
              <div className="row between g8">
                <span className="kind kind-logodeck">{t(`links.kind.${l.kind}` as StringKey)}</span>
                <span className={`chip ${l.status === 'building' ? 'c-draft' : 'c-approved'}`}>{t(l.status === 'building' ? 'links.status.building' : 'links.status.live')}</span>
              </div>
              <span className="h3">{l.title}</span>
              {l.description && <p className="t-sm t-mute line-clamp-2">{l.description}</p>}
              {section === 'apps' && <LinkAdjust link={l} links={links} all={changes} onOpen={() => setViewing(l)} />}
              <div className="row between g8 wrap">
                <span className="row g12">
                  <button type="button" className="t-sm w7" style={{ color: 'var(--azul)', background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setViewing(l)}>{t('links.open')}</button>
                  <a href={l.url} target="_blank" rel="noreferrer" className="t-sm" style={{ color: 'var(--graphite)' }} title={t('lv.newTab')} aria-label={`${t('lv.newTab')}: ${l.title}`}>↗</a>
                </span>
                {isAdmin && (
                  <span className="row g8">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(l)}>{t('links.edit')}</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLink(brandId, l.id)}>{t('links.delete')}</button>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {viewing && <LinkViewer brandId={brandId} link={viewing} links={links} onClose={closeViewer} />}
    </div>
  );
}

function LinkForm({ brandId, section, link, onClose }: { brandId: string; section: LinkSection; link?: BrandLink; onClose: () => void }) {
  const { t } = useI18n();
  const [v, setV] = useState<LinkInput>({ kind: link?.kind ?? KINDS[section][0], title: link?.title ?? '', url: link?.url ?? '', description: link?.description ?? '', status: link?.status ?? 'live' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof LinkInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  const badUrl = v.url.trim() !== '' && !isHttps(v.url);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim() || !isHttps(v.url)) return;
    setBusy(true);
    try { await (link ? saveLink(brandId, link.id, section, v) : addLink(brandId, section, v)); onClose(); } finally { setBusy(false); }
  }
  return (
    <form className="card grid gap-3 sm:grid-cols-2" onSubmit={submit}>
      <label className="col g4"><span className="label">{t('links.title')}</span><input className="input" value={v.title} onChange={set('title')} maxLength={120} required /></label>
      <label className="col g4"><span className="label">{t('links.url')}</span><input className="input" value={v.url} onChange={set('url')} type="url" placeholder="https://" required />
        {badUrl && <span className="t-xs" style={{ color: 'var(--danger, #C0362C)' }}>{t('links.badUrl')}</span>}</label>
      <label className="col g4"><span className="label">{t('links.kind')}</span>
        <select className="input" value={v.kind} onChange={set('kind')}>{KINDS[section].map((k) => <option key={k} value={k}>{t(`links.kind.${k}` as StringKey)}</option>)}</select></label>
      <label className="col g4"><span className="label">{t('links.status')}</span>
        <select className="input" value={v.status} onChange={set('status')}><option value="live">{t('links.status.live')}</option><option value="building">{t('links.status.building')}</option></select></label>
      <label className="col g4 sm:col-span-2"><span className="label">{t('links.description')}</span><input className="input" value={v.description} onChange={set('description')} maxLength={300} /></label>
      <div className="row g8 sm:col-span-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !v.title.trim() || !isHttps(v.url)}>{t('links.save')}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>{t('links.cancel')}</button>
      </div>
    </form>
  );
}
