import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AccountBody } from '../pages/Account';

/** Your photo opens the account menu over everything (portaled: the glass top bar would trap a fixed child); while it is open the photo turns into an X that closes it. */
export function AccountMenu() {
  const { profile, user } = useAuth();
  const { t } = useI18n();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const name = profile?.name ?? user?.email ?? '';
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('bd:account', on);
    return () => window.removeEventListener('bd:account', on);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname, search]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [open]);
  function close() { setOpen(false); btn.current?.focus(); }

  const x = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
  return (
    <>
      <button ref={btn} type="button" onClick={() => setOpen(true)} aria-label={t('acct.account')} aria-expanded={open} aria-haspopup="dialog"
        className="row g12" style={{ background: 'none', border: 0, padding: 2, borderRadius: '62.4375rem', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}>
        {user?.photoURL ? <img className="avatar" src={user.photoURL} alt="" /> : <span className="avatar-txt">{initials}</span>}
        <span className="hidden flex-col items-start md:flex" style={{ lineHeight: '16px' }}>
          <span className="w7" style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>{profile?.name?.split(' ')[0] ?? name}</span>
          <span className="t-xs t-mute">{profile?.role === 'admin' ? t('role.admin') : t('role.client')}</span>
        </span>
      </button>
      {open && createPortal(
        <div className="acct-sheet" role="dialog" aria-modal="true" aria-label={t('acct.account')}>
          <div className="acct-sheet-bar">
            <img className="logo" src="/brand/braindy-logo.svg" alt="Braindy" />
            <button ref={closeBtn} type="button" className="acct-x" onClick={close} aria-label={t('lb.close')}>{x}</button>
          </div>
          <div className="acct-sheet-body"><AccountBody onPick={() => setOpen(false)} /></div>
        </div>,
        document.body,
      )}
    </>
  );
}
