import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { LinkViewer } from './LinkViewer';
import { LinkCard } from './LinkCard';
import { useSiteChanges } from './SiteChanges';
import { useToast } from '../components/Toaster';
import { addLink, isHttps, removeLink, restoreLink, saveLink, type BrandLink, type LinkInput, type LinkKind, type LinkSection } from './useBrandLinks';

const KINDS: Record<LinkSection, LinkKind[]> = { apps: ['web', 'app', 'dashboard'], research: ['research', 'marketmap'] };

/** Cards for My apps / My research. Everyone in the brand opens them; NickMark adds, edits and deletes.
 *  A site or app card shows its adjustments; opening it puts the page beside its triage. */
export function LinkGrid({ brandId, section, links, adding, onAdding }: {
  brandId: string; section: LinkSection; links: BrandLink[];
  /** When the page head holds «Add link»: open the form from there. */
  adding?: boolean; onAdding?: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [editing, setEditing] = useState<BrandLink | 'new' | null>(null);
  const [viewing, setViewing] = useState<BrandLink | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);
  const changes = useSiteChanges(brandId);
  useEffect(() => { if (adding) setEditing('new'); }, [adding]);
  const close = () => { setEditing(null); onAdding?.(false); };
  // Delete at once, with Undo in the toast (the link comes back with the same id).
  const toast = useToast();
  const remove = async (l: BrandLink) => {
    await removeLink(brandId, l.id);
    toast({ text: t('links.deleted', { title: l.title }), undo: () => restoreLink(brandId, l) });
  };

  return (
    <div className="col g16">
      {isAdmin && !editing && !onAdding && <div><button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>+ {t('links.add')}</button></div>}
      {editing && <LinkForm brandId={brandId} section={section} link={editing === 'new' ? undefined : editing} onClose={close} />}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <LinkCard key={l.id} link={l} links={links} section={section} changes={changes} isAdmin={isAdmin}
            onOpen={() => setViewing(l)} onEdit={() => setEditing(l)} onDelete={() => remove(l)} />
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
