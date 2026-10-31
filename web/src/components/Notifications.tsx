import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useNotifications, type Notice } from '../notifications/useNotifications';
import { Icon } from './Icon';

const MAX_RECENT = 12;

/** Bell in the top bar: deliveries waiting for approval first, then what happened lately on the brand. */
export function Notifications() {
  const { user } = useAuth();
  const { current, brands, select } = useBrands();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const seenKey = `bd-notif-seen:${user?.uid ?? ''}`;
  const [seen, setSeen] = useState(() => { try { return Number(localStorage.getItem(seenKey)) || 0; } catch { return 0; } });
  // A group shows what happens in every brand below it.
  const ids = current ? [current.id, ...brands.filter((b) => b.groupId === current.id).map((b) => b.id)] : [];
  const all = useNotifications(ids);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toApprove = all.filter((n) => n.kind === 'toApprove');
  const recent = all.filter((n) => n.kind !== 'toApprove').slice(0, MAX_RECENT);
  const unread = [...toApprove, ...recent].filter((n) => n.at > seen).length;
  const multi = ids.length > 1;
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? '';
  const when = (n: Notice) => new Date(n.at).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });

  function toggle() {
    if (!open) { const now = Date.now(); try { localStorage.setItem(seenKey, String(now)); } catch { /* private mode */ } setTimeout(() => setSeen(now), 1500); }
    setOpen((o) => !o);
  }
  const item = (n: Notice) => (
    <Link key={n.key} to={n.to} onClick={() => { setOpen(false); if (n.brandId !== current?.id) select(n.brandId); }} className={`notif-item ${n.at > seen ? 'is-new' : ''}`}>
      <span className={`notif-dot is-${n.kind}`} aria-hidden="true" />
      <span className="col grow" style={{ minWidth: 0 }}>
        <span className="t-sm w7 truncate">{n.title}</span>
        {n.text && <span className="t-xs truncate">“{n.text}”</span>}
        <span className="t-xs t-mute">{t(`notif.k.${n.kind}`)} · {when(n)}{multi ? ` · ${name(n.brandId)}` : ''}</span>
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
          {all.length === 0 && <p className="t-sm t-mute" style={{ padding: '8px 12px 12px' }}>{t('notif.empty')}</p>}
          {toApprove.length > 0 && <p className="label" style={{ padding: '8px 12px 2px' }}>{t('notif.toApprove')} · {toApprove.length}</p>}
          {toApprove.map(item)}
          {recent.length > 0 && <p className="label" style={{ padding: '12px 12px 2px' }}>{t('notif.recent')}</p>}
          {recent.map(item)}
          <Link to="/requests" onClick={() => setOpen(false)} className="t-sm w7 row g4" style={{ padding: '10px 12px 6px' }}>{t('notif.all')} <Icon name="chevronRight" size={14} /></Link>
        </div>
      )}
    </div>
  );
}
