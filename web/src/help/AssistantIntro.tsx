import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { usePwa } from '../pwa/pwa';
import { afterAlerts } from '../pwa/popupQueue';
import './help.css';

const SEEN = 'bd-assistant-intro';
const seen = () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return true; } };
const BRAINS = ['researcher', 'marketer', 'creator', 'builder'] as const;
const ITEMS = [['💬', 'ai.i1'], ['📝', 'ai.i2'], ['✅', 'ai.i3'], ['🌐', 'ai.i4'], ['📎', 'ai.i5'], ['🕘', 'ai.i6']] as const;

/**
 * Once per person: after the alerts invitation is out of the way, a pop-up presents the assistant and everything it can
 * do, with «Try it now» opening the chat. Waits while a guided tour is on screen, and never over a piece being reviewed.
 */
export function AssistantIntro() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const { current } = useBrands();
  const { update } = usePwa();
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => (seen() ? undefined : afterAlerts(() => setReady(true))), []);
  useEffect(() => {
    if (!ready || open || update || !current || /^\/(ask|alerts|onboarding|requests\/[^/]+)/.test(pathname)) return;
    const id = window.setInterval(() => { if (!document.querySelector('.tg-tour')) { window.clearInterval(id); setOpen(true); } }, 1500);
    return () => window.clearInterval(id);
  }, [ready, open, update, current, pathname]);
  useEffect(() => {
    if (!open) return;
    box.current?.querySelector<HTMLElement>('.btn-primary')?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  function close() {
    // The small corner intro says the same: once this one is seen, that one is too.
    try { localStorage.setItem(SEEN, '1'); localStorage.setItem('bd-help-intro', '1'); } catch { /* private mode */ }
    setOpen(false); setReady(false);
  }
  if (!open) return null;
  const admin = profile?.role === 'admin';

  return (
    <div className="scrim fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={box} className="modal col g16 w-full max-w-[30rem] ai-pop" role="dialog" aria-modal="true" aria-labelledby="ai-pop-t">
        <span className="help-brains" aria-hidden="true">{BRAINS.map((b) => <img key={b} src={`/brand/brains/${b}.png`} alt="" />)}</span>
        <div className="col g4">
          <span className="help-ai ai-tag self-start">{t('ai.tag')}</span>
          <h2 className="h2" id="ai-pop-t" style={{ margin: 0 }}>{t('ai.title')}</h2>
          <p className="t-sm t-mute" style={{ margin: 0 }}>{t('ai.sub')}</p>
        </div>
        <ul className="ai-list">
          {ITEMS.map(([icon, k]) => <li key={k}><span aria-hidden="true">{icon}</span><Line text={t(k)} /></li>)}
          {admin && <li><span aria-hidden="true">🧠</span><Line text={t('ai.iAdmin')} /></li>}
        </ul>
        <p className="t-xs t-mute" style={{ margin: 0 }}>{t('ai.safe')}</p>
        <div className="col g8">
          <button type="button" className="btn btn-primary" onClick={() => { close(); window.dispatchEvent(new Event('bd-help-open')); }}>{t('ai.try')}</button>
          <button type="button" className="btn btn-ghost" onClick={close}>{t('ai.later')}</button>
        </div>
      </div>
    </div>
  );
}

/** «Key: rest» → the key in bold, so the list can be scanned. */
function Line({ text }: { text: string }) {
  const i = text.indexOf(':');
  return i > 0 ? <span><b>{text.slice(0, i + 1)}</b>{text.slice(i + 1)}</span> : <span>{text}</span>;
}
