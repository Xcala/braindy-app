import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { noticesApi } from '../review/api';
const KEYS = ['delivery', 'approved', 'published', 'brandBrain', 'report'];
/** Same rule as the API: an invite link of WhatsApp itself. */
const GROUP = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}$/;
/** Settings · WhatsApp and notices: the number that receives review links and which notices go out. */
export function NoticesCard({ brandId }) {
    const { t } = useI18n();
    const [s, setS] = useState(null);
    const [approvers, setApprovers] = useState([]);
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        setS(null);
        setMsg(null);
        noticesApi.get(brandId).then(setS).catch(() => setS({}));
        getDocs(collection(db, 'brands', brandId, 'members')).then((snap) => setApprovers(snap.docs
            .map((d) => ({ uid: d.id, email: String(d.get('email') ?? d.id), role: String(d.get('role')), can: d.get('canApprove') === true }))
            .filter((m) => m.role === 'client_owner' || m.can))).catch(() => setApprovers([]));
    }, [brandId]);
    if (!s)
        return _jsxs("div", { className: "card t-mute", children: [t('common.loading'), "\u2026"] });
    const on = (k) => s.notices?.[k] !== false;
    const set = (patch) => { setS({ ...s, ...patch }); setMsg(null); };
    async function save(card) {
        if ((s.groups ?? []).some((g) => g.url && !GROUP.test(g.url))) {
            setMsg({ ok: false, text: t('set.badGroup'), card });
            return;
        }
        setBusy(true);
        setMsg(null);
        try {
            await noticesApi.save(brandId, s);
            setMsg({ ok: true, text: t('set.saved'), card });
        }
        catch (e) {
            setMsg({ ok: false, text: String(e).includes('403') ? t('set.ownersOnly') : String(e).includes('400') ? t('set.badPhone') : t('set.saveError'), card });
        }
        finally {
            setBusy(false);
        }
    }
    // Save sits on top of each card, small, so it is always in view next to what was just changed.
    const blocked = !!s.whatsapp && !s.approverUid;
    const saveBtn = (card) => (_jsx("button", { type: "button", className: "btn btn-primary btn-sm", disabled: busy || blocked, onClick: () => save(card), children: msg?.ok && msg.card === card ? `✓ ${t('set.saved').replace(/\.$/, '')}` : t('set.save') }));
    const note = (card) => (blocked && card === 'wa' ? _jsx("span", { className: "t-sm t-mute", children: t('set.needApprover') })
        : msg && !msg.ok && msg.card === card ? _jsx("span", { className: "t-sm", role: "status", style: { color: 'var(--danger)' }, children: msg.text }) : null);
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "card col g16", children: [_jsxs("div", { className: "row between g8", children: [_jsxs("span", { className: "row g8 wrap min-w-0", children: [_jsx("h2", { className: "h3", children: "WhatsApp" }), _jsx("span", { className: `chip ${s.whatsapp ? 'c-active' : 'c-draft'}`, children: s.whatsapp ? t('set.connected') : t('set.notConnected') })] }), saveBtn('wa')] }), note('wa'), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "wa-num", children: t('set.number') }), _jsx("input", { id: "wa-num", className: "input", inputMode: "tel", placeholder: "+57 300 000 0000", value: s.whatsapp ?? '', onChange: (e) => set({ whatsapp: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "wa-who", children: t('set.whoApproves') }), _jsxs("select", { id: "wa-who", className: "input", value: s.approverUid ?? '', onChange: (e) => set({ approverUid: e.target.value }), children: [_jsx("option", { value: "", children: t('set.pickApprover') }), approvers.map((a) => _jsx("option", { value: a.uid, children: a.email }, a.uid))] })] })] }), _jsxs("div", { className: "col g8", children: [_jsx("span", { className: "w7 t-sm", children: t('set.groups') }), (s.groups ?? []).map((g, i) => {
                                const put = (patch) => set({ groups: (s.groups ?? []).map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                                return (_jsxs("div", { className: "grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]", children: [_jsx("input", { className: "input", "aria-label": t('set.groupName'), placeholder: t('set.groupNamePh'), value: g.name ?? '', onChange: (e) => put({ name: e.target.value }) }), _jsx("input", { className: "input", inputMode: "url", "aria-label": t('set.group'), placeholder: "https://chat.whatsapp.com/\u2026", value: g.url ?? '', onChange: (e) => put({ url: e.target.value.trim() }) }), _jsxs("span", { className: "row g8", children: [g.url && GROUP.test(g.url) && _jsx("a", { className: "btn btn-secondary btn-sm", href: g.url, target: "_blank", rel: "noreferrer", children: t('set.groupOpen') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => set({ groups: (s.groups ?? []).filter((_, j) => j !== i) }), children: t('set.groupRemove') })] })] }, i));
                            }), (s.groups ?? []).length < 10 && _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", style: { alignSelf: 'flex-start' }, onClick: () => set({ groups: [...(s.groups ?? []), { name: '', url: '' }] }), children: ["+ ", t('set.groupAdd')] }), _jsx("p", { className: "help", children: t('set.groupHelp') })] }), _jsx("p", { className: "help", children: t('set.waHelp') }), !s.whatsappApi && _jsx("p", { className: "help", children: t('set.apiPending') })] }), _jsxs("div", { className: "card col g12", children: [_jsxs("div", { className: "row between g8", children: [_jsx("h2", { className: "h3", children: t('set.notices') }), saveBtn('notices')] }), note('notices'), KEYS.map((k) => (_jsxs("div", { className: "row between g12", style: { padding: '6px 0' }, children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7 t-sm", children: t(`set.n.${k}`) }), _jsx("span", { className: "t-xs t-mute", children: t(`set.n.${k}Sub`) })] }), _jsx("button", { className: `switch ${on(k) ? 'is-on' : ''}`, role: "switch", "aria-checked": on(k), "aria-label": t(`set.n.${k}`), onClick: () => set({ notices: { ...s.notices, [k]: !on(k) } }) })] }, k))), _jsxs("div", { className: "field", style: { maxWidth: 240 }, children: [_jsx("label", { htmlFor: "wa-lang", children: t('set.noticeLang') }), _jsxs("select", { id: "wa-lang", className: "input", value: s.lang ?? 'es', onChange: (e) => set({ lang: e.target.value }), children: [_jsx("option", { value: "es", children: "Espa\u00F1ol" }), _jsx("option", { value: "en", children: "English" })] })] })] })] }));
}
