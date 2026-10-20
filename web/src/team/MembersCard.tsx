import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cancelInvite, inviteMember, listInvites, removeMember, updateMember } from './membersApi';

type Member = { uid: string; email?: string; name?: string; role: 'client_owner' | 'client_member'; canApprove?: boolean };

/** Members of one brand: role, approval rights, remove, invite by email (design 11 + 20 · team and approvers). */
export function MembersCard({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Array<{ id: string; email: string; role: string }>>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'client_owner' | 'client_member'>('client_member');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);

  useEffect(() => onSnapshot(collection(db, 'brands', brandId, 'members'),
    (s) => setMembers(s.docs.map((d) => ({ uid: d.id, ...d.data() }) as Member).sort((a, b) => (a.role === b.role ? String(a.email).localeCompare(String(b.email)) : a.role === 'client_owner' ? -1 : 1))),
    () => setMembers([])), [brandId]);
  const loadInvites = useCallback(() => { listInvites(brandId).then(setInvites).catch(() => setInvites([])); }, [brandId]);
  useEffect(loadInvites, [loadInvites]);

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function invite() {
    setMsg(null);
    try {
      const r = await inviteMember(brandId, email.trim(), role, role === 'client_owner');
      setMsg({ ok: true, text: r.status === 'added' ? t('team.added', { email }) : t('team.invited', { email }) });
      setEmail(''); loadInvites();
    } catch { setMsg({ ok: false, text: t('team.inviteError') }); }
  }

  return (
    <div className="card col g16">
      <div className="row between"><h3 className="h3">{t('team.membersOf', { name: brandName })}</h3><span className="t-sm t-mute">{members.length}</span></div>
      {members.length === 0 && <p className="t-sm t-mute">{t('team.noMembers')}</p>}
      {members.map((m) => {
        const self = m.uid === user?.uid;
        const initials = (m.email ?? '?').slice(0, 2).toUpperCase();
        return (
          <div key={m.uid} className="col g8" style={{ paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
            <div className='row g12'>
              <span className='avatar-txt'>{initials}</span>
              <div className='col grow' style={{ minWidth: 0 }}><span className='w7 truncate'>{m.name && m.name !== m.email ? m.name : m.email ?? m.uid}</span>{m.name && m.name !== m.email && <span className='t-xs t-mute truncate'>{m.email}</span>}</div>
              {!self && <button className='btn btn-ghost btn-sm' onClick={() => setRemoving(m)}>{t('team.remove')}</button>}
            </div>
            <div className='row g16 wrap' style={{ paddingLeft: 52 }}>
              <select className='input' style={{ height: 36, width: 'auto' }} value={m.role} disabled={self} aria-label={t('team.role')}
                onChange={(e) => updateMember(brandId, m.uid, { role: e.target.value })}>
                <option value='client_owner'>{t('team.owner')}</option>
                <option value='client_member'>{t('team.member')}</option>
              </select>
              <span className='row g8 t-sm'>
                <button className={`switch ${m.canApprove || m.role === 'client_owner' ? 'is-on' : ''}`} role='switch' aria-checked={!!(m.canApprove || m.role === 'client_owner')}
                  aria-label={`${t('team.canApprove')} · ${m.email}`} disabled={self || m.role === 'client_owner'}
                  onClick={() => updateMember(brandId, m.uid, { canApprove: !m.canApprove })} />
                {t('team.approves')}
              </span>
            </div>
          </div>
        );
      })}
      {invites.map((i) => (
        <div key={i.id} className="row g12">
          <span className="avatar-txt">?</span>
          <div className="col grow"><span className="w7 truncate">{i.email}</span><span className="t-xs t-mute">{t('team.invitePending')} · {i.role === 'client_owner' ? t('team.owner') : t('team.member')}</span></div>
          <button className="btn btn-ghost btn-sm" onClick={() => cancelInvite(brandId, i.id).then(loadInvites)}>{t('common.cancel')}</button>
        </div>
      ))}
      <form className="row g8 wrap" onSubmit={(e) => { e.preventDefault(); if (valid) invite(); }}>
        <input className="input grow" style={{ minWidth: 200 }} type="email" placeholder={t('team.invitePh')} aria-label={t('team.invitePh')} value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="input" style={{ width: 'auto' }} value={role} onChange={(e) => setRole(e.target.value as typeof role)} aria-label={t('team.role')}>
          <option value="client_member">{t('team.member')}</option>
          <option value="client_owner">{t('team.owner')}</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={!valid}>{t('team.invite')}</button>
      </form>
      {msg && <p className="t-sm" role="status" style={{ color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
      <p className="t-xs t-mute">{t('team.inviteHint')}</p>
      {removing && (
        <ConfirmDialog title={t('team.removeTitle', { email: removing.email ?? '' })} confirmLabel={t('team.remove')} danger
          onConfirm={async () => { await removeMember(brandId, removing.uid); setRemoving(null); }} onCancel={() => setRemoving(null)}>
          {t('team.removeBody', { name: brandName })}
        </ConfirmDialog>
      )}
    </div>
  );
}
