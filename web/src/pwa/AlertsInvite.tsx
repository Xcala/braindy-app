import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { enablePush, pushState, type PushState } from './push';
import { usePwa } from './pwa';

const DISMISS = 'bd-alerts-later';
const later = () => { try { return Number(localStorage.getItem(DISMISS)) > Date.now(); } catch { return false; } };

/** On opening Braindy: a pop-up inviting the person to turn alerts on, once the new-version notice is out of the way. */
export function AlertsInvite() {
  const { t, lang } = useI18n();
  const { update } = usePwa();
  const { pathname } = useLocation();
  const [can, setCan] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!later()) pushState().then((s) => setCan(s === 'off')).catch(() => undefined); }, []);
  // A new version reloads the page first; then, after a breath, the invitation.
  useEffect(() => {
    if (!can || update || open || pathname.startsWith('/alerts')) return;
    const id = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(id);
  }, [can, update, open, pathname]);
  useEffect(() => {
    if (!open) return;
    box.current?.querySelector<HTMLElement>('.btn-primary')?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  if (!open) return null;
  function hide() {
    try { localStorage.setItem(DISMISS, String(Date.now() + 30 * 864e5)); } catch { /* private mode */ }
    setOpen(false); setCan(false);
  }
  async function turnOn() {
    setBusy(true);
    const s = await enablePush(lang).catch(() => 'off' as PushState);
    setBusy(false);
    if (s === 'on' || s === 'blocked') { setOpen(false); setCan(false); }
  }

  return (
    <div className="scrim fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && hide()}>
      <div ref={box} className="modal col g16 w-full max-w-[26rem]" role="dialog" aria-modal="true" aria-labelledby="al-pop-t" style={{ textAlign: 'center' }}>
        <span aria-hidden="true" style={{ fontSize: '2.5rem', lineHeight: 1 }}>🔔</span>
        <h2 className="h2" id="al-pop-t" style={{ margin: 0 }}>{t('al.popTitle')}</h2>
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t('al.popBody')}</p>
        <div className="col g8">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={turnOn}>{t('al.enableShort')}</button>
          <button type="button" className="btn btn-ghost" onClick={hide}>{t('al.later')}</button>
        </div>
      </div>
    </div>
  );
}
