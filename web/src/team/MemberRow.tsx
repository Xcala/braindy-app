import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { MemberWhatsApp } from './MemberWhatsApp';
import { MemberAccess, SECTION_LABEL } from './MemberAccess';
import { profileOf, sectionsOf } from './sections';

export type Member = { uid: string; email?: string; name?: string; role: 'client_owner' | 'client_member'; canApprove?: boolean; sections?: string[] | null };
type Patch = { role?: string; canApprove?: boolean; sections?: string[] | null; name?: string };

/** A real name, not the email or the phone number the person was invited with. */
export const hasName = (m: Member) => !!m.name && m.name !== m.email && !/^\+?[\d\s().-]{7,}$/.test(m.name);

/**
 * One person (audit C5, 2026-11-26): the name first («Ponle nombre» when there is none), how to reach them under it, and
 * one line «profile · Approves». The profile, sections, approval switch, WhatsApp link and remove open on «Editar»;
 * section chips show only there, or in the line when the person has a custom set.
 */
export function MemberRow({ brandId, m, self, isAdmin, onSave, onRemove }: {
  brandId: string; m: Member; self: boolean; isAdmin: boolean; onSave: (patch: Patch) => void; onRemove: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState(hasName(m) ? m.name! : '');
  const named = hasName(m);
  const contact = m.email || (m.name && !named ? m.name : '');
  // Initials from the name or the email; a phone number gives none (a «5» in the circle said nothing).
  const initials = named ? m.name!.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : /@/.test(contact) ? contact.slice(0, 1).toUpperCase() : '';
  const approves = !!(m.canApprove || m.role === 'client_owner');
  const profile = profileOf(m);
  const what = isAdmin ? (profile === 'custom'
    ? `${t('perm.custom')}: ${sectionsOf(m).map((s) => t(SECTION_LABEL[s])).join(', ')}`
    : t(`perm.${profile}` as StringKey)) : t(m.role === 'client_owner' ? 'team.owner' : 'team.member');
  const saveName = () => { if (name.trim()) onSave({ name: name.trim() }); setNaming(false); };

  return (
    <div className="col g8" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--line)' }}>
      <div className="row g12" style={{ alignItems: 'flex-start' }}>
        <span className="avatar-txt">{initials}</span>
        <div className="col grow" style={{ minWidth: 0 }}>
          {naming ? (
            <form className="row g8 wrap" onSubmit={(e) => { e.preventDefault(); saveName(); }}>
              <input className="input grow" style={{ height: '2.25rem', minWidth: '10rem' }} autoFocus value={name} maxLength={80}
                aria-label={t('ct.t.name')} placeholder={t('ct.t.name')} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setNaming(false)} />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!name.trim()}>{t('ct.t.save')}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNaming(false)}>{t('common.cancel')}</button>
            </form>
          ) : named ? (
            <span className="w7" style={{ overflowWrap: 'anywhere' }}>{m.name}</span>
          ) : self ? <span className="w7" style={{ overflowWrap: 'anywhere' }}>{contact || m.uid}</span> : (
            <button type="button" className="btn btn-ghost btn-sm w7 self-start" style={{ color: "var(--azul)", paddingLeft: 0 }} onClick={() => setNaming(true)}>+ {t('ct.t.addName')}</button>
          )}
          {contact && (named || !self) && <span className="t-xs t-mute" style={{ overflowWrap: 'anywhere' }}>{contact}</span>}
          <span className="t-xs t-mute">{what}{approves ? ` · ${t('ct.t.approves')}` : ''}</span>
        </div>
        {!self && <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open} aria-label={`${t('acc.edit')} · ${named ? m.name : contact}`} onClick={() => setOpen((x) => !x)}>{t(open ? 'acc.hide' : 'acc.edit')}</button>}
      </div>
      {open && !self && (
        <div className="col g12">
          {named && !naming && <button type="button" className="btn btn-ghost btn-sm self-start" style={{ marginLeft: "3.25rem" }} onClick={() => setNaming(true)}>✎ {t('ct.t.name')}</button>}
          <div className="row g16 wrap" style={{ paddingLeft: "3.25rem" }}>
            {isAdmin ? <MemberAccess member={m} onChange={onSave} /> : (
              <select className="input" style={{ height: '2.25rem', width: 'auto' }} value={m.role} aria-label={t('team.role')} onChange={(e) => onSave({ role: e.target.value })}>
                <option value="client_owner">{t('team.owner')}</option>
                <option value="client_member">{t('team.member')}</option>
              </select>)}
            <span className="row g8 t-sm">
              <button className={`switch ${approves ? 'is-on' : ''}`} role="switch" aria-checked={approves} aria-label={`${t('team.canApprove')} · ${named ? m.name : contact}`}
                disabled={m.role === 'client_owner'} onClick={() => onSave({ canApprove: !m.canApprove })} />
              {t('team.approves')}
            </span>
          </div>
          <MemberWhatsApp brandId={brandId} uid={m.uid} name={named ? m.name! : contact} />
          <button type="button" className="btn btn-ghost btn-sm self-start" style={{ color: "var(--danger)", marginLeft: "3.25rem" }} onClick={onRemove}>{t('team.remove')}</button>
        </div>
      )}
    </div>
  );
}
