import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useWishes } from './useWishes';
import { WishItem } from './WishItem';
import { WishCompose } from './WishCompose';
import '../accesses/apps.css';
import './wishes.css';

const TOP = 5;
const EVT = 'bd:ideas';

/** Where the Ideas panel can open: not on the Wishlist itself, the Ask page, or a request being reviewed. */
export const ideasHere = (pathname: string) => !(pathname.startsWith('/wishlist') || pathname.startsWith('/ask') || /^\/requests\/[^/]+/.test(pathname));
/** Opens the panel from anywhere (the corner menu, QuickDial). */
export const openIdeas = () => window.dispatchEvent(new Event(EVT));

/**
 * «Ideas» (2026-11-12): a side panel (a sheet from the bottom on phones) that invites feedback (the same box as the Wishlist
 * page) and shows the most asked open wishes, with «See the whole list». It opens from the corner menu (QuickDial).
 */
export function IdeasPanel() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  if (!ideasHere(pathname) || !open) return null;
  return <IdeasSheet onClose={() => setOpen(false)} />;
}

/** The open panel; it reads the wishes only while it is open. */
function IdeasSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const current = useBrands().current;
  const input = useRef<HTMLTextAreaElement>(null);
  const { list, loading, admin } = useWishes(current?.id);
  const top = list.filter((w) => w.status !== 'done' && w.status !== 'declined').slice(0, TOP);

  useEffect(() => {
    input.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <>
      <div className="ideas-scrim" onClick={onClose} aria-hidden="true" />
      <section className="ideas-panel" role="dialog" aria-modal="true" aria-labelledby="ideas-title">
        <header className="row between g8" style={{ alignItems: 'flex-start' }}>
          <div className="col g4">
            <h2 id="ideas-title" className="ideas-title">{t('ideas.title')}</h2>
            <p className="t-sm t-mute" style={{ margin: 0 }}>{t('ideas.sub')}</p>
          </div>
          <button type="button" className="ideas-x" onClick={onClose} aria-label={t('ideas.close')}>×</button>
        </header>
        <div className="col g12"><WishCompose admin={admin} inputRef={input} /></div>
        <div className="col g8">
          <span className="t-xs t-mute ideas-label">{t('ideas.top')}</span>
          {loading ? <div className="skel" style={{ height: '8rem' }} />
            : top.length ? <ul className="wl-list ideas-list">{top.map((w) => <WishItem key={w.ref.path} w={w} />)}</ul>
            : <p className="t-sm t-mute" style={{ margin: 0 }}>{t('wl.empty')}</p>}
        </div>
        <Link to="/wishlist" className="btn btn-secondary btn-sm self-start">{t('ideas.all')} →</Link>
      </section>
    </>
  );
}
