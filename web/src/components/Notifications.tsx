import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsRequests, type ScopedRequest } from '../requests/useBrandsRequests';
import { Icon } from './Icon';

const DAYS = 14;
const ms = (r: ScopedRequest) => ((r as { approvedAt?: { toMillis(): number } }).approvedAt ?? r.updatedAt)?.toMillis() ?? 0;

/** Bell in the top bar: what was delivered and waits for approval, and what got approved in the last two weeks. */
export function Notifications() {
  const { user } = useAuth();
  const { current, brands, select } = useBrands();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const seenKey = `bd-notif-seen:${user?.uid ?? ''}`;
  const [seen, setSeen] = useState(() => { try { return Number(localStorage.getItem(seenKey)) || 0; } catch { return 0; } });
  // A group shows the requests of every brand below it.
  const ids = current ? [current.id, ...brands.filter((b) => b.groupId === current.id).map((b) => b.id)] : [];
  const reqs = useBrandsRequests(ids);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const since = Date.now() - DAYS * 864e5;
  const toApprove = reqs.filter((r) => r.status === 'to_approve').sort((a, b) => ms(b) - ms(a));
  const approved = reqs.filter((r) => (r.status === 'approved' || r.status === 'published') && ms(r) > since).sort((a, b) => ms(b) - ms(a)).slice(0, 8);
  const unread = toApprove.filter((r) => ms(r) > seen).length + approved.filter((r) => ms(r) > seen).length;
  const multi = ids.length > 1;
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? '';
  const when = (r: ScopedRequest) => new Date(ms(r)).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });

  function toggle() {
    if (!open) { const now = Date.now(); try { localStorage.setItem(seenKey, String(now)); } catch { /* private mode */ } setTimeout(() => setSeen(now), 1500); }
    setOpen((o) => !o);
  }
  const item = (r: ScopedRequest, kind: 'toApprove' | 'approved') => (
    <Link key={`${r.brandId}/${r.id}`} to={`/requests/${r.id}`} onClick={() => { setOpen(false); if (r.brandId !== current?.id) select(r.brandId); }} className={`notif-item ${ms(r) > seen ? 'is-new' : ''}`}>
      <span className={`notif-dot ${kind === 'toApprove' ? 'is-wait' : 'is-ok'}`} aria-hidden="true" />
      <span className="col grow" style={{ minWidth: 0 }}>
        <span className="t-sm w7 truncate">{r.title}</span>
        <span className="t-xs t-mute">{t(kind === 'toApprove' ? 'notif.delivered' : 'notif.approved')} · {when(r)}{multi ? ` · ${name(r.brandId)}` : ''}</span>
      </span>
    </Link>
  );

  return (
    <div ref={box} className="relative">
      <button type="button" className="btn btn-ghost btn-icon notif-bell" onClick={toggle} aria-haspopup="dialog" aria-expanded={open}
        aria-label={unread ? t('notif.openN', { n: String(unread) }) : t('notif.open')}>
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="menu notif-panel" role="dialog" aria-label={t('notif.title')}>
          <p className="w7" style={{ padding: '8px 12px 4px' }}>{t('notif.title')}</p>
          {toApprove.length === 0 && approved.length === 0 && <p className="t-sm t-mute" style={{ padding: '8px 12px 12px' }}>{t('notif.empty')}</p>}
          {toApprove.length > 0 && <p className="label" style={{ padding: '8px 12px 2px' }}>{t('notif.toApprove')} · {toApprove.length}</p>}
          {toApprove.map((r) => item(r, 'toApprove'))}
          {approved.length > 0 && <p className="label" style={{ padding: '12px 12px 2px' }}>{t('notif.recent')}</p>}
          {approved.map((r) => item(r, 'approved'))}
          <Link to="/requests" onClick={() => setOpen(false)} className="t-sm w7 row g4" style={{ padding: '10px 12px 6px' }}>{t('notif.all')} <Icon name="chevronRight" size={14} /></Link>
        </div>
      )}
    </div>
  );
}
