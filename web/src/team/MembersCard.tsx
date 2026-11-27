import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cancelInvite, inviteByPhone, inviteMember, listInvites, removeMember, updateMember } from './membersApi';
import { SentNote, deliverLink } from './MemberWhatsApp';
import { profilePatch } from './MemberAccess';
import { MemberRow, hasName, type Member } from './MemberRow';
import { BrandSections } from './BrandSections';
import { profileOf } from './sections';
import { sendAccessLink } from '../auth/emailLink';
import { useBrands } from '../brands/BrandProvider';
import { Scan } from '../components/Scan';


/** Members of one brand: role, approval rights, remove, invite by email (design 11 + 20 · team and approvers). */
export function MembersCard({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isGroup = useBrands().brands.find((b) => b.id === brandId)?.kind === 'group';
  const [invProfile, setInvProfile] = useState<'all' | 'team' | 'view'>('team');
  const [saveError, setSaveError] = useState(false);
  const save = (uid: string, patch: Parameters<typeof updateMember>[2]) => { setSaveError(false); updateMember(brandId, uid, patch).catch(() => setSaveError(true)); };
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Array<{ id: string; email: string; role: string; sections?: string[] | null }>>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'client_owner' | 'client_member'>('client_member');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [waSent, setWaSent] = useState<Awaited<ReturnType<typeof deliverLink>> | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);

  useEffect(() => onSnapshot(collection(db, 'brands', brandId, 'members'),
    (s) => setMembers(s.docs.map((d) => ({ uid: d.id, ...d.data() }) as Member).sort((a, b) => (a.role === b.role ? (hasName(b) ? 1 : 0) - (hasName(a) ? 1 : 0) || String(a.name ?? a.email).localeCompare(String(b.name ?? b.email)) : a.role === 'client_owner' ? -1 : 1))),
    () => setMembers([])), [brandId]);
  const loadInvites = useCallback(() => { listInvites(brandId).then(setInvites).catch(() => setInvites([])); }, [brandId]);
  useEffect(loadInvites, [loadInvites]);

  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  // A mobile number instead of an email: the person is created now and gets their sign-in link by WhatsApp.
  const isPhone = !isEmail && email.replace(/\D/g, '').length >= 10 && /^[+\d\s().-]+$/.test(email.trim());
  const valid = isEmail || isPhone;

  async function invite() {
    setMsg(null); setWaSent(null);
    try {
      const pp = isAdmin ? profilePatch(invProfile) : { role, sections: null };
      if (isPhone) {
        const r = await inviteByPhone(brandId, email.trim(), '', '', pp.role as typeof role, true, pp.sections);
        setWaSent(await deliverLink(brandId, r.uid, '', lang));
        setEmail(''); return;
      }
      const r = await inviteMember(brandId, email.trim(), pp.role as typeof role, true, pp.sections);
      // Firebase emails them a one-time link to come in (any inbox, no password).
      const sent = await sendAccessLink(email.trim(), lang, false).then(() => true, () => false);
      setMsg({ ok: true, text: `${r.status === 'added' ? t('team.added', { email }) : t('team.invited', { email })}${sent ? ` ${t('team.linkSent', { email })}` : ''}` });
      setEmail(''); loadInvites();
    } catch { setMsg({ ok: false, text: t('team.inviteError') }); }
  }

  // Invite on top, then the people (name first, one line each), then the invitations not used yet (audit C5).
  return (
    <div className="card col g16">
      <div className="row between g8 wrap"><h3 className="h3">{t('team.membersOf', { name: brandName })}</h3>
        <span className="t-sm t-mute">{members.length}{invites.length ? ` + ${t('ct.t.invited', { n: String(invites.length) })}` : ''}</span></div>
      <form className="row g8 wrap" onSubmit={(e) => { e.preventDefault(); if (valid) invite(); }}>
        <input className="input grow" style={{ minWidth: '12.5rem' }} type="text" inputMode="email" autoComplete="off" placeholder={t('wax.invitePh')} aria-label={t('wax.invitePh')} value={email} onChange={(e) => setEmail(e.target.value)} />
        {isAdmin ? (
          <select className="input" style={{ width: 'auto' }} value={invProfile} onChange={(e) => setInvProfile(e.target.value as typeof invProfile)} aria-label={t('perm.profile')}>
            <option value="all">{t('perm.all')}</option>
            <option value="team">{t('perm.team')}</option>
            <option value="view">{t('perm.view')}</option>
          </select>
        ) : (
        <select className="input" style={{ width: 'auto' }} value={role} onChange={(e) => setRole(e.target.value as typeof role)} aria-label={t('team.role')}>
          <option value="client_member">{t('team.member')}</option>
          <option value="client_owner">{t('team.owner')}</option>
        </select>)}
        <button type="submit" className="btn btn-primary" disabled={!valid}>{t('team.invite')}</button>
      </form>
      {waSent && <SentNote r={waSent} />}
      {msg && <p className="t-sm" role="status" style={{ color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
      {saveError && <p className="t-sm" role="status" style={{ color: 'var(--danger)' }}>{t('perm.error')}</p>}
      {members.length === 0 && <p className="t-sm t-mute">{t('team.noMembers')}</p>}
      <div className="col g12">
        {members.map((m) => <MemberRow key={m.uid} brandId={brandId} m={m} self={m.uid === user?.uid} isAdmin={isAdmin} onSave={(patch) => save(m.uid, patch)} onRemove={() => setRemoving(m)} />)}
        {invites.map((i) => (
          <div key={i.id} className="row g12 wrap" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--line)', alignItems: 'flex-start' }}>
            <span className="avatar-txt" style={{ opacity: 0.6 }}>{i.email.slice(0, 2).toUpperCase()}</span>
            <div className="col grow" style={{ minWidth: '10rem' }}>
              <span className="w7" style={{ overflowWrap: 'anywhere' }}>{i.email}</span>
              <span className="t-xs t-mute">{t('ct.t.notIn')} · {t(`perm.${profileOf(i)}` as 'perm.all')}</span>
            </div>
            <span className="row g4">
              <button className="btn btn-secondary btn-sm" onClick={() => sendAccessLink(i.email, lang, false).then(() => setMsg({ ok: true, text: t('team.linkSent', { email: i.email }) }), () => setMsg({ ok: false, text: t('team.inviteError') }))}>{t('team.resend')}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => cancelInvite(brandId, i.id).then(loadInvites)}>{t('common.cancel')}</button>
            </span>
          </div>
        ))}
      </div>
      <Scan text={t('team.inviteHint')} className="t-xs" />
      {isAdmin && <p className="t-sm t-mute">{t(isGroup ? 'perm.groupHint' : 'perm.hint')}</p>}
      {isAdmin && !isGroup && <BrandSections brandId={brandId} />}
      {removing && (
        <ConfirmDialog title={t('team.removeTitle', { email: removing.email ?? '' })} confirmLabel={t('team.remove')} danger
          onConfirm={async () => { await removeMember(brandId, removing.uid); setRemoving(null); }} onCancel={() => setRemoving(null)}>
          {t('team.removeBody', { name: brandName })}
        </ConfirmDialog>
      )}
    </div>
  );
}
