import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';

type Person = { uid: string; name: string; email: string; role: string; allowed: boolean; phone: string; optIn: boolean };

/** NickMark only: per brand, who may write to Braindy on WhatsApp (and with which number). */
export function WhatsappAccess() {
  const { t } = useI18n();
  const { brands, current } = useBrands();
  const active = brands.filter((b) => b.status === 'active' && b.kind === 'brand').sort((a, b) => a.name.localeCompare(b.name));
  const [brandId, setBrandId] = useState(current?.kind === 'brand' ? current.id : '');
  const [people, setPeople] = useState<Person[] | null>(null);
  const [agent, setAgent] = useState(false);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    if (!brandId) { setPeople([]); return; }
    setPeople(null);
    api<{ people: Person[]; agent?: boolean }>(`/v1/admin/whatsapp/brands/${brandId}/people`)
      .then((r) => { setPeople(r.people); setAgent(r.agent === true); setPhones(Object.fromEntries(r.people.map((p) => [p.uid, p.phone ? `+${p.phone}` : '']))); })
      .catch(() => setPeople([]));
  }, [brandId]);
  useEffect(load, [load]);

  async function saveAgent(on: boolean) {
    setMsg(null);
    try { await api(`/v1/admin/whatsapp/brands/${brandId}/agent`, { method: 'PUT', body: JSON.stringify({ on }) }); setAgent(on); setMsg({ ok: true, text: t('waa.saved') }); }
    catch { setMsg({ ok: false, text: t('mywa.error') }); }
  }
  async function save(p: Person, patch: { allowed?: boolean; phone?: string }) {
    setMsg(null);
    try {
      await api(`/v1/admin/whatsapp/brands/${brandId}/people/${p.uid}`, { method: 'PUT', body: JSON.stringify(patch) });
      setMsg({ ok: true, text: t('waa.saved') }); load();
    } catch (e) {
      const status = (e as { status?: number })?.status;
      setMsg({ ok: false, text: t(status === 409 ? 'mywa.taken' : status === 400 ? 'mywa.bad' : 'mywa.error') });
    }
  }

  return (
    <section className="card col g16" aria-labelledby="h-waa">
      <div className="row between wrap g12">
        <div className="col"><h2 className="h3" id="h-waa">{t('waa.title')}</h2><span className="t-xs t-mute">{t('waa.sub')}</span></div>
        <select className="input" style={{ width: 'auto', minWidth: '12.5rem' }} value={brandId} onChange={(e) => setBrandId(e.target.value)} aria-label={t('wa.brand')}>
          <option value="">{t('wa.brand')}</option>
          {active.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      {msg && <p className="t-sm" role="status" style={{ color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
      {!brandId && <p className="t-sm t-mute">{t('waa.pick')}</p>}
      {brandId && people !== null && (
        <div className="row g12 wrap" style={{ padding: '0.75rem', borderRadius: 12, background: 'var(--surface-2, var(--line))' }}>
          <button className={`switch ${agent ? 'is-on' : ''}`} role="switch" aria-checked={agent} aria-label={t('waa.agent')} onClick={() => saveAgent(!agent)} />
          <div className="col grow" style={{ minWidth: '12rem' }}><span className="w7 t-sm">{t('waa.agent')}</span><span className="t-xs t-mute">{t('waa.agentHint')}</span></div>
        </div>
      )}
      {brandId && people === null && <div className="skel" style={{ height: '5rem' }} />}
      {brandId && people?.length === 0 && <p className="t-sm t-mute">{t('team.noMembers')}</p>}
      {people?.map((p) => {
        const label = p.name && p.name !== p.email ? p.name : p.email || p.uid;
        const dirty = (phones[p.uid] ?? '').replace(/\D/g, '') !== p.phone;
        return (
          <div key={p.uid} className="row g12 wrap" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--line)' }}>
            <span className="avatar-txt">{(p.email || '?').slice(0, 2).toUpperCase()}</span>
            <div className="col grow" style={{ minWidth: '11.25rem' }}>
              <span className="w7 truncate">{label}</span>
              <span className="t-xs t-mute truncate">{p.email}{p.phone ? ` · ${t(p.optIn ? 'waa.linked' : 'waa.stopped')}` : ` · ${t('waa.noNumber')}`}</span>
            </div>
            <form className="row g8" onSubmit={(e) => { e.preventDefault(); save(p, { phone: phones[p.uid] ?? '' }); }}>
              <input className="input" style={{ height: '2.25rem', width: '10.625rem' }} type="tel" inputMode="tel" placeholder="+57 300 000 0000" aria-label={`${t('mywa.number')} · ${label}`}
                value={phones[p.uid] ?? ''} onChange={(e) => setPhones({ ...phones, [p.uid]: e.target.value })} />
              {dirty && <button type="submit" className="btn btn-secondary btn-sm">{t('mywa.save')}</button>}
            </form>
            <span className="row g8 t-sm">
              <button className={`switch ${p.allowed ? 'is-on' : ''}`} role="switch" aria-checked={p.allowed} aria-label={`${t('waa.allowed')} · ${label}`}
                onClick={() => save(p, { allowed: !p.allowed })} />
              {t('waa.allowed')}
            </span>
          </div>
        );
      })}
      <p className="t-xs t-mute">{t('waa.hint')}</p>
    </section>
  );
}
