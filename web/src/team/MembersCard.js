import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cancelInvite, inviteMember, listInvites, removeMember, updateMember } from './membersApi';
import { MemberAccess, profilePatch } from './MemberAccess';
import { BrandSections } from './BrandSections';
import { profileOf } from './sections';
import { sendAccessLink } from '../auth/emailLink';
import { useBrands } from '../brands/BrandProvider';
import { Scan } from '../components/Scan';
/** Members of one brand: role, approval rights, remove, invite by email (design 11 + 20 · team and approvers). */
export function MembersCard({ brandId, brandName }) {
    const { t, lang } = useI18n();
    const { user, profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const isGroup = useBrands().brands.find((b) => b.id === brandId)?.kind === 'group';
    const [invProfile, setInvProfile] = useState('team');
    const [saveError, setSaveError] = useState(false);
    const save = (uid, patch) => { setSaveError(false); updateMember(brandId, uid, patch).catch(() => setSaveError(true)); };
    const [members, setMembers] = useState([]);
    const [invites, setInvites] = useState([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('client_member');
    const [msg, setMsg] = useState(null);
    const [removing, setRemoving] = useState(null);
    useEffect(() => onSnapshot(collection(db, 'brands', brandId, 'members'), (s) => setMembers(s.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (a.role === b.role ? String(a.email).localeCompare(String(b.email)) : a.role === 'client_owner' ? -1 : 1))), () => setMembers([])), [brandId]);
    const loadInvites = useCallback(() => { listInvites(brandId).then(setInvites).catch(() => setInvites([])); }, [brandId]);
    useEffect(loadInvites, [loadInvites]);
    const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
    async function invite() {
        setMsg(null);
        try {
            const pp = isAdmin ? profilePatch(invProfile) : { role, sections: null };
            const r = await inviteMember(brandId, email.trim(), pp.role, pp.role === 'client_owner', pp.sections);
            // Firebase emails them a one-time link to come in (any inbox, no password).
            const sent = await sendAccessLink(email.trim(), lang, false).then(() => true, () => false);
            setMsg({ ok: true, text: `${r.status === 'added' ? t('team.added', { email }) : t('team.invited', { email })}${sent ? ` ${t('team.linkSent', { email })}` : ''}` });
            setEmail('');
            loadInvites();
        }
        catch {
            setMsg({ ok: false, text: t('team.inviteError') });
        }
    }
    return (_jsxs("div", { className: "card col g16", children: [_jsxs("div", { className: "row between", children: [_jsx("h3", { className: "h3", children: t('team.membersOf', { name: brandName }) }), _jsx("span", { className: "t-sm t-mute", children: members.length })] }), isAdmin && !isGroup && _jsx(BrandSections, { brandId: brandId }), isAdmin && _jsx("p", { className: "t-sm t-mute", children: t(isGroup ? 'perm.groupHint' : 'perm.hint') }), saveError && _jsx("p", { className: "t-sm", role: "status", style: { color: 'var(--danger)' }, children: t('perm.error') }), members.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('team.noMembers') }), members.map((m) => {
                const self = m.uid === user?.uid;
                const initials = (m.email ?? '?').slice(0, 2).toUpperCase();
                return (_jsxs("div", { className: "col g8", style: { paddingBottom: 12, borderBottom: '1px solid var(--line)' }, children: [_jsxs("div", { className: 'row g12', children: [_jsx("span", { className: 'avatar-txt', children: initials }), _jsxs("div", { className: 'col grow', style: { minWidth: 0 }, children: [_jsx("span", { className: 'w7 truncate', children: m.name && m.name !== m.email ? m.name : m.email ?? m.uid }), m.name && m.name !== m.email && _jsx("span", { className: 't-xs t-mute truncate', children: m.email })] }), !self && _jsx("button", { className: 'btn btn-ghost btn-sm', onClick: () => setRemoving(m), children: t('team.remove') })] }), _jsxs("div", { className: 'row g16 wrap', style: { paddingLeft: 52 }, children: [isAdmin ? _jsx(MemberAccess, { member: m, disabled: self, onChange: (patch) => save(m.uid, patch) }) : (_jsxs("select", { className: 'input', style: { height: 36, width: 'auto' }, value: m.role, disabled: self, "aria-label": t('team.role'), onChange: (e) => save(m.uid, { role: e.target.value }), children: [_jsx("option", { value: 'client_owner', children: t('team.owner') }), _jsx("option", { value: 'client_member', children: t('team.member') })] })), _jsxs("span", { className: 'row g8 t-sm', children: [_jsx("button", { className: `switch ${m.canApprove || m.role === 'client_owner' ? 'is-on' : ''}`, role: 'switch', "aria-checked": !!(m.canApprove || m.role === 'client_owner'), "aria-label": `${t('team.canApprove')} · ${m.email}`, disabled: self || m.role === 'client_owner', onClick: () => save(m.uid, { canApprove: !m.canApprove }) }), t('team.approves')] })] })] }, m.uid));
            }), invites.map((i) => (_jsxs("div", { className: "row g12", children: [_jsx("span", { className: "avatar-txt", children: "?" }), _jsxs("div", { className: "col grow", children: [_jsx("span", { className: "w7 truncate", children: i.email }), _jsxs("span", { className: "t-xs t-mute", children: [t('team.invitePending'), " \u00B7 ", t(`perm.${profileOf(i)}`)] })] }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => sendAccessLink(i.email, lang, false).then(() => setMsg({ ok: true, text: t('team.linkSent', { email: i.email }) }), () => setMsg({ ok: false, text: t('team.inviteError') })), children: t('team.resend') }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => cancelInvite(brandId, i.id).then(loadInvites), children: t('common.cancel') })] }, i.id))), _jsxs("form", { className: "row g8 wrap", onSubmit: (e) => { e.preventDefault(); if (valid)
                    invite(); }, children: [_jsx("input", { className: "input grow", style: { minWidth: 200 }, type: "email", placeholder: t('team.invitePh'), "aria-label": t('team.invitePh'), value: email, onChange: (e) => setEmail(e.target.value) }), isAdmin ? (_jsxs("select", { className: "input", style: { width: 'auto' }, value: invProfile, onChange: (e) => setInvProfile(e.target.value), "aria-label": t('perm.profile'), children: [_jsx("option", { value: "all", children: t('perm.all') }), _jsx("option", { value: "team", children: t('perm.team') }), _jsx("option", { value: "view", children: t('perm.view') })] })) : (_jsxs("select", { className: "input", style: { width: 'auto' }, value: role, onChange: (e) => setRole(e.target.value), "aria-label": t('team.role'), children: [_jsx("option", { value: "client_member", children: t('team.member') }), _jsx("option", { value: "client_owner", children: t('team.owner') })] })), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: !valid, children: t('team.invite') })] }), msg && _jsx("p", { className: "t-sm", role: "status", style: { color: msg.ok ? 'var(--success)' : 'var(--danger)' }, children: msg.text }), _jsx(Scan, { text: t('team.inviteHint'), className: "t-xs" }), removing && (_jsx(ConfirmDialog, { title: t('team.removeTitle', { email: removing.email ?? '' }), confirmLabel: t('team.remove'), danger: true, onConfirm: async () => { await removeMember(brandId, removing.uid); setRemoving(null); }, onCancel: () => setRemoving(null), children: t('team.removeBody', { name: brandName }) }))] }));
}
