import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { collection, onSnapshot, query, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useMySections } from '../team/sections';
import { APPROVED } from './folderRules';
import { extLabel, kindOf, thumbClass } from './fileKinds';
import { useThumbs } from './useThumbs';
import { FileExplorer } from './FileExplorer';

type Piece = { id: string; title: string; contentType: string; requestId?: string; at: number };
type Delivery = { path: string; name: string; files: Piece[]; at: number; requestId?: string };

/**
 * Deliveries: one card per approved request (2026-11-12, design audit), newest first, with its first image, name, approval day
 * and file count. A card opens its files right here; «See the request» goes to the request when this person may open requests.
 * Each folder is read on its own (folder == path), the same query the file explorer uses, so the rules can prove it.
 */
export function DeliveriesGallery({ brandId, brandName, startPath }: { brandId: string; brandName: string; startPath?: string }) {
  const { t, lang } = useI18n();
  const { can } = useMySections();
  const index = useBrandDoc(brandId, 'context/fileIndex');
  const paths = useMemo(() => ((index.data?.folders as Array<{ path: string }> | undefined) ?? [])
    .map((f) => f.path).filter((p) => p.startsWith(`${APPROVED}/`) && !p.slice(APPROVED.length + 1).includes('/')), [index.data]);
  const [byPath, setByPath] = useState<Record<string, Piece[]>>({});
  const [open, setOpen] = useState<string | null>(startPath && startPath !== APPROVED ? startPath : null);
  const [q, setQ] = useState('');

  const key = paths.join('|');
  useEffect(() => {
    setByPath({});
    const offs = paths.map((p) => onSnapshot(query(collection(db, 'brands', brandId, 'assets'), where('folder', '==', p)), (s) => {
      const files = s.docs.filter((d) => d.get('status') !== 'uploading').map((d) => {
        const at = (d.get('uploadedAt') as Timestamp | undefined)?.toMillis() ?? 0;
        return { id: d.id, title: String(d.get('title') ?? ''), contentType: String(d.get('contentType') ?? ''), requestId: d.get('requestId') as string | undefined, at };
      });
      setByPath((m) => ({ ...m, [p]: files }));
    }, () => setByPath((m) => ({ ...m, [p]: [] }))));
    return () => offs.forEach((off) => off());
  }, [brandId, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const list: Delivery[] = useMemo(() => paths.map((p) => {
    const files = byPath[p] ?? [];
    return { path: p, name: p.slice(APPROVED.length + 1), files, at: Math.max(0, ...files.map((f) => f.at)), requestId: files.find((f) => f.requestId)?.requestId };
  }).filter((d) => d.files.length).sort((a, b) => b.at - a.at), [paths, byPath]);
  const cover = (d: Delivery) => d.files.find((f) => kindOf(f) === 'image');
  const thumbs = useThumbs(brandId, list.map(cover).filter(Boolean).map((f) => f!.id));
  const day = (ms: number) => (ms ? new Date(ms).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '');
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = list.filter((d) => words.every((w) => d.name.toLowerCase().includes(w)));

  if (open) {
    const d = list.find((x) => x.path === open);
    return (
      <div className="col g16">
        <div className="row g8 wrap" style={{ alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(null)}>← {t('dg.back')}</button>
          {d?.requestId && can('requests') && <Link to={`/requests/${d.requestId}`} className="btn btn-ghost btn-sm">{t('dg.request')}</Link>}
        </div>
        <FileExplorer brandId={brandId} brandName={brandName} startPath={open} hideApproved={false} />
      </div>
    );
  }
  if (index.loading || (paths.length > 0 && Object.keys(byPath).length < paths.length && !list.length)) return <div className="skel" style={{ height: '15rem' }} />;
  if (!list.length) return <div className="card t-mute">{t('dg.empty')}</div>;
  return (
    <div className="col g16">
      {list.length > 6 && (
        <label className="apps-search" style={{ maxWidth: '22rem' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('dg.search')} aria-label={t('dg.search')} />
        </label>
      )}
      <ul className="dg-grid">
        {shown.map((d) => {
          const c = cover(d), url = c && thumbs[c.id], first = d.files[0]!;
          return (
            <li key={d.path}>
              <button type="button" className="dg-card" onClick={() => setOpen(d.path)}>
                <span className={`dg-cover ${url ? '' : thumbClass[kindOf(first)]}`}>
                  {url ? <img src={url} alt="" loading="lazy" /> : <b>{extLabel(first)}</b>}
                </span>
                <span className="dg-body">
                  <span className="dg-title">{d.name}</span>
                  <span className="t-xs t-mute">{t('dg.approved', { date: day(d.at) })} · {d.files.length === 1 ? t('dg.file') : t('dg.files', { n: d.files.length })}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
