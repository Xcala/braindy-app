import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { BackToAccount } from '../pages/Account';
import { disablePush, enablePush, pushApi, pushState, type PushState } from './push';

const ADMIN_KINDS = ['requests', 'comments', 'decisions'] as const;
const CLIENT_KINDS = ['deliveries', 'comments', 'done', 'due'] as const;

/** Account › Alerts: turn alerts on for this device, pick which arrive, send a test. */
export function Alerts() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const kinds = profile?.role === 'admin' ? ADMIN_KINDS : CLIENT_KINDS;
  const [state, setState] = useState<PushState | null>(null);
  const [off, setOff] = useState<string[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => pushApi.prefs().then((p) => { setOff(p.off); setDevices(p.devices); }).catch(() => undefined);
  useEffect(() => { pushState().then(setState).catch(() => setState('unsupported')); void load(); }, []);

  async function run(f: () => Promise<PushState>) {
    setBusy(true); setMsg(null);
    try { setState(await f()); await load(); } catch { setMsg({ ok: false, text: t('al.error') }); } finally { setBusy(false); }
  }
  async function test() {
    setBusy(true); setMsg(null);
    const r = await pushApi.test().catch(() => ({ sent: 0 }));
    setMsg(r.sent ? { ok: true, text: t('al.testSent') } : { ok: false, text: t('al.testNone') });
    setBusy(false);
  }
  const toggle = (k: string) => {
    const next = off.includes(k) ? off.filter((x) => x !== k) : [...off, k];
    setOff(next); pushApi.setOff(next).then((r) => setOff(r.off)).catch(() => setOff(off));
  };
  const note = state === 'blocked' ? 'al.blocked' : state === 'needsInstall' ? 'al.needsInstall' : state === 'unsupported' ? 'al.unsupported' : null;

  return (
    <div className="mx-auto col g24 w-full max-w-[35rem]">
      <div className="col g8">
        <BackToAccount />
        <h1 className="h1">{t('al.title')}</h1>
        <p className="t-mute" style={{ margin: 0 }}>{t('al.lead')}</p>
      </div>
      <div className="card col g16">
        {state === null ? <p className="t-mute">{t('common.loading')}…</p> : note ? <p className="t-sm" style={{ margin: 0 }}>{t(note)}</p> : state === 'on' ? (
          <>
            <p className="w7" style={{ margin: 0, color: 'var(--success)' }}>{t('al.thisOn')}</p>
            <div className="row g8 wrap">
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={test}>{t('al.test')}</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(disablePush)}>{t('al.disable')}</button>
            </div>
          </>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run(() => enablePush(lang))}>{t('al.enable')}</button>
        )}
        {devices.length > 0 && <p className="t-xs t-mute" style={{ margin: 0 }}>{t('al.devices', { list: devices.join(', ') })}</p>}
        {msg && <p className="t-sm" role="status" style={{ margin: 0, color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
      </div>
      <div className="card col g12">
        <h2 className="h3">{t('al.which')}</h2>
        {kinds.map((k) => (
          <label key={k} className="row between g12 t-sm">
            <span>{t(`al.k.${k}` as StringKey)}</span>
            <button type="button" className={`switch ${off.includes(k) ? '' : 'is-on'}`} role="switch" aria-checked={!off.includes(k)} aria-label={t(`al.k.${k}` as StringKey)} onClick={() => toggle(k)} />
          </label>
        ))}
      </div>
    </div>
  );
}

const DISMISS = 'bd-alerts-later';
/** A one-line invitation on Home, until the person turns alerts on or says not now. */
export function AlertsPrompt() {
  const { t, lang } = useI18n();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let later = false;
    try { later = Number(localStorage.getItem(DISMISS)) > Date.now(); } catch { /* private mode */ }
    if (!later) pushState().then((s) => setShow(s === 'off')).catch(() => undefined);
  }, []);
  if (!show) return null;
  const hide = () => { try { localStorage.setItem(DISMISS, String(Date.now() + 30 * 864e5)); } catch { /* ignore */ } setShow(false); };
  return (
    <div className="card col g12" role="region" aria-label={t('al.title')}>
      <p className="t-sm" style={{ margin: 0 }}>{t('al.prompt')}</p>
      <div className="row g12 wrap">
        <button type="button" className="btn btn-ghost" style={{ flex: '1 1 8rem' }} onClick={hide}>{t('al.later')}</button>
        <button type="button" className="btn btn-primary" style={{ flex: '1 1 8rem' }} disabled={busy} onClick={async () => {
          setBusy(true);
          const s = await enablePush(lang).catch(() => 'off' as PushState);
          setBusy(false);
          if (s === 'on' || s === 'blocked') setShow(false);
        }}>{t('al.enableShort')}</button>
      </div>
    </div>
  );
}
