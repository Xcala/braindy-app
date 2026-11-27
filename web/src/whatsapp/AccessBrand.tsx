import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { fmtPhone } from './format';
import { LoadFail } from './LoadFail';

type Person = { uid: string; name: string; email: string; role: string; allowed: boolean; phone: string; optIn: boolean };
export type Summary = { on: number; total: number; agent: boolean };

/** One brand opened: its agent switch and its people in two lines (name; number with ✎ and the switch on the right). */
export function AccessBrand({ brandId, onSummary }: { brandId: string; onSummary: (s: Summary) => void }) {
  const { t } = useI18n();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [agent, setAgent] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const report = useRef(onSummary);
  useEffect(() => { report.current = onSummary; });

  const load = useCallback(() => {
    setFailed(false);
    api<{ people: Person[]; agent?: boolean }>(`/v1/admin/whatsapp/brands/${brandId}/people`).then((r) => {
      setPeople(r.people); setAgent(r.agent === true);
      report.current({ on: r.people.filter((p) => p.allowed && p.phone).length, total: r.people.length, agent: r.agent === true });
    }, () => setFailed(true));
  }, [brandId]);
  useEffect(load, [load]);

  async function saveAgent(on: boolean) {
    setMsg(null);
    try { await api(`/v1/admin/whatsapp/brands/${brandId}/agent`, { method: 'PUT', body: JSON.stringify({ on }) }); setAgent(on); load(); }
    catch { setMsg({ ok: false, text: t('mywa.error') }); }
  }
  async function save(p: Person, patch: { allowed?: boolean; phone?: string }) {
    setMsg(null);
    try {
      await api(`/v1/admin/whatsapp/brands/${brandId}/people/${p.uid}`, { method: 'PUT', body: JSON.stringify(patch) });
      setMsg({ ok: true, text: t('waa.saved') }); setEditing(null); load();
    } catch (e) {
      const status = (e as { status?: number })?.status;
      setMsg({ ok: false, text: t(status === 409 ? 'mywa.taken' : status === 400 ? 'mywa.bad' : 'mywa.error') });
    }
  }

  if (failed) return <div className="wa-brand-body"><LoadFail onRetry={load} /></div>;
  if (!people) return <div className="wa-brand-body"><div className="skel" style={{ height: '4rem' }} /></div>;
  return (
    <div className="wa-brand-body col g8">
      <div className="row g12" style={{ alignItems: 'center' }}>
        <button className={`switch ${agent ? 'is-on' : ''}`} role="switch" aria-checked={agent} aria-label={t('waa.agent')} onClick={() => saveAgent(!agent)} />
        <span className="w7 t-sm">{t('waa.agent')}</span>
      </div>
      {msg && <p className="t-sm" role="status" style={{ margin: 0, color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
      {people.length === 0 && <p className="t-sm t-mute" style={{ margin: 0 }}>{t('team.noMembers')}</p>}
      <ul className="wa-people">
        {people.map((p) => {
          const label = p.name && p.name !== p.email ? p.name : p.email || p.uid;
          const state = p.phone ? (p.optIn ? '' : ` · ${t('waa.stopped')}`) : '';
          return (
            <li key={p.uid} className="wa-person">
              <div className="col" style={{ minWidth: 0 }}>
                <span className="w7 truncate">{label}</span>
                {editing === p.uid ? (
                  <form className="row g8 wrap" onSubmit={(e) => { e.preventDefault(); save(p, { phone }); }}>
                    <input className="input wa-phone" type="tel" inputMode="tel" placeholder="+57 300 000 0000" autoFocus
                      aria-label={`${t('mywa.number')} · ${label}`} value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <button type="submit" className="btn btn-secondary btn-sm">{t('mywa.save')}</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>{t('wa.cancel')}</button>
                  </form>
                ) : (
                  <span className="t-xs t-mute truncate">
                    {p.phone ? fmtPhone(p.phone) : t('waa.noNumber')}{state}{' '}
                    <button type="button" className="wa-link" aria-label={`${t('waa.editNumber')} · ${label}`}
                      onClick={() => { setEditing(p.uid); setPhone(p.phone ? `+${p.phone}` : ''); }}>✎</button>
                  </span>
                )}
              </div>
              <button className={`switch ${p.allowed ? 'is-on' : ''}`} role="switch" aria-checked={p.allowed} aria-label={`${t('waa.allowed')} · ${label}`}
                onClick={() => save(p, { allowed: !p.allowed })} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
