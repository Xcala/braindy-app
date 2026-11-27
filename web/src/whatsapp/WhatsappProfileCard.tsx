import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { LoadFail } from './LoadFail';

type Profile = { about: string; description: string; address: string; email: string; websites: string[]; vertical: string; photo: string | null };
const VERTICALS = ['OTHER', 'PROF_SERVICES', 'EDU', 'ENTERTAIN', 'EVENT_PLAN', 'RETAIL', 'APPAREL', 'BEAUTY', 'HEALTH', 'FINANCE', 'TRAVEL', 'RESTAURANT', 'HOTEL', 'NONPROFIT', 'AUTO', 'GROCERY'];
const ERRORS: Record<string, StringKey> = { about_required: 'wap.errAbout', invalid_email: 'wap.errEmail', invalid_website: 'wap.errWeb' };
const host = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** NickMark only: the public WhatsApp Business profile, shown the way clients see it; «Edit» opens the fields. */
export function WhatsappProfileCard() {
  const { t } = useI18n();
  const [p, setP] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => { setFailed(false); api<Profile>('/v1/admin/whatsapp/profile').then(setP, () => setFailed(true)); }, []);
  useEffect(load, [load]);
  const set = (k: keyof Profile, v: string) => { if (p) { setP({ ...p, [k]: v }); setMsg(null); } };
  const setWeb = (i: number, v: string) => { if (p) { const w = [p.websites[0] ?? '', p.websites[1] ?? '']; w[i] = v; setP({ ...p, websites: w }); setMsg(null); } };

  async function save() {
    if (!p) return;
    setBusy(true); setMsg(null);
    try {
      const { photo: _photo, ...body } = p;
      await api('/v1/admin/whatsapp/profile', { method: 'PUT', body: JSON.stringify(body) });
      setMsg({ ok: true, text: t('wap.saved') }); setEditing(false);
    } catch (e) {
      const code = Object.keys(ERRORS).find((k) => String(e).includes(k));
      setMsg({ ok: false, text: t(code ? ERRORS[code] : 'wap.error') });
    } finally { setBusy(false); }
  }

  const field = (k: 'about' | 'address' | 'email', max: number, type = 'text') => (
    <div className="field">
      <label htmlFor={`wap-${k}`}>{t(`wap.${k}`)}</label>
      <input id={`wap-${k}`} className="input" type={type} maxLength={max} value={p?.[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  const summary = p ? [p.vertical && p.vertical !== 'UNDEFINED' ? t(`wap.v.${p.vertical}` as StringKey) : '', p.websites[0] ? host(p.websites[0]) : ''].filter(Boolean).join(' · ') : '';
  return (
    <section className="card col g12" aria-labelledby="h-wap">
      <h2 className="sr-only" id="h-wap">{t('wap.title')}</h2>
      {failed && <LoadFail onRetry={load} />}
      {!p && !failed && <div className="skel" style={{ height: '3rem' }} />}
      {p && (
        <div className="row g12" style={{ alignItems: 'center' }}>
          {p.photo && <img src={p.photo} alt="" width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />}
          <div className="col grow" style={{ minWidth: 0 }}>
            <span className="w7">Braindy</span>
            <span className="t-sm">{p.about ? `«${p.about}»` : '—'}</span>
            {summary && <span className="t-xs t-mute">{summary}</span>}
          </div>
          {!editing && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>{t('wap.edit')}</button>}
        </div>
      )}
      {p && editing && (
        <>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t('wap.sub')}</p>
          {field('about', 139)}
          <div className="field">
            <label htmlFor="wap-desc">{t('wap.description')}</label>
            <textarea id="wap-desc" className="input" rows={4} maxLength={512} style={{ padding: '0.625rem 0.75rem', resize: 'vertical', lineHeight: 1.45 }} value={p.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="wap-vertical">{t('wap.vertical')}</label>
            <select id="wap-vertical" className="input" value={p.vertical || 'OTHER'} onChange={(e) => set('vertical', e.target.value)}>
              {VERTICALS.map((v) => <option key={v} value={v}>{t(`wap.v.${v}` as StringKey)}</option>)}
            </select>
          </div>
          {field('address', 256)}
          {field('email', 128, 'email')}
          {[0, 1].map((i) => (
            <div className="field" key={i}>
              <label htmlFor={`wap-web${i}`}>{t('wap.website', { n: i + 1 })}</label>
              <input id={`wap-web${i}`} className="input" type="url" placeholder="https://" maxLength={256} value={p.websites[i] ?? ''} onChange={(e) => setWeb(i, e.target.value)} />
            </div>
          ))}
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t('wap.phoneOnly')}</p>
          <div className="row g8">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{t('wap.save')}</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setEditing(false); setMsg(null); load(); }}>{t('wa.cancel')}</button>
          </div>
        </>
      )}
      {msg && <p className="t-sm" role="status" style={{ margin: 0, color: msg.ok ? undefined : 'var(--danger)' }}>{msg.text}</p>}
    </section>
  );
}
