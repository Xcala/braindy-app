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

/**
 * «Ideas»: a small button above the Ask Braindy one, on every page (2026-11-12). It opens a side panel (a sheet from the bottom
 * on phones) that invites feedback (the same box as the Wishlist page) and shows the most asked open wishes, with «See the whole list».
 * Not on the Wishlist itself, the Ask page, or a request being reviewed (it would cover «Approve»).
 */
export function IdeasPanel() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  if (pathname.startsWith('/wishlist') || pathname.startsWith('/ask') || /^\/requests\/[^/]+/.test(pathname)) return null;
  return open ? <IdeasSheet onClose={() => setOpen(false)} /> : (
    <button type="button" className="ideas-fab" onClick={() => setOpen(true)} aria-haspopup="dialog">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>
      {t('ideas.btn')}
    </button>
  );
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
