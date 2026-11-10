import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { accessesApi, signInOf } from './useAccesses';
import { looksLikeSecret, splitSecretLines } from './secretNotes';
const SIGN_IN = [['password', 'acc.signInPassword'], ['google', 'acc.signInGoogle'], ['microsoft', 'acc.signInMicrosoft']];
const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'X', 'Google', 'Gmail', 'Webflow', 'WordPress', 'Shopify', 'Metricool', 'Meta Business', 'Hosting', 'Domain'];
/** Add or edit an access (design 17). The password is sent once to the backend, encrypted before saving. */
export function AccessForm({ brandId, editing, groups = [], onClose }) {
    const { t } = useI18n();
    const [platform, setPlatform] = useState(editing?.platform ?? '');
    const [username, setUsername] = useState(editing?.username ?? '');
    const [password, setPassword] = useState('');
    const [link, setLink] = useState(editing?.link ?? '');
    const [group, setGroup] = useState(editing?.group ?? '');
    const [notes, setNotes] = useState(editing?.notes ?? '');
    const [shared, setShared] = useState(!!editing?.sharedWithBraindy);
    const [isSub, setIsSub] = useState(!!editing?.subscription);
    const [sub, setSub] = useState(editing?.subscription ?? { plan: '', price: null, currency: 'USD', period: 'month' });
    const [signIn, setSignIn] = useState(editing ? signInOf(editing) : 'password');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const first = useRef(null);
    const secretInNotes = looksLikeSecret(notes);
    // Notes are not encrypted: a key pasted there moves to the password field (added to what is already typed).
    const moveToPassword = () => {
        const { secret, rest } = splitSecretLines(notes);
        const oneLine = secret.replace(/\n+/g, ' ');
        setPassword((p) => (p ? `${p} ${oneLine}` : oneLine));
        setNotes(rest);
    };
    useEffect(() => {
        first.current?.focus();
        const onKey = (e) => e.key === 'Escape' && !deleting && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose, deleting]);
    async function save(e) {
        e.preventDefault();
        setBusy(true);
        setError(false);
        const body = { platform: platform.trim(), username: username.trim(), link: link.trim(), notes: notes.trim(), sharedWithBraindy: shared, group: group.trim(), subscription: isSub ? sub : null, signIn, ...(password && signIn === 'password' ? { password } : {}) };
        try {
            if (editing)
                await accessesApi.update(brandId, editing.id, body);
            else
                await accessesApi.add(brandId, body);
            setPassword('');
            onClose();
        }
        catch (err) {
            setError(String(err).includes('503') ? 'vault' : 'save');
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "scrim fixed inset-0 z-50 flex items-center justify-center p-4", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: [_jsxs("form", { className: "modal w-full max-w-[520px]", role: "dialog", "aria-modal": "true", "aria-labelledby": "acc-form-title", onSubmit: save, autoComplete: "off", children: [_jsxs("div", { className: "row between g12", children: [_jsx("h2", { className: "h2", id: "acc-form-title", children: editing ? t('acc.editTitle') : t('acc.addTitle') }), _jsx("span", { className: "chip c-active", children: t('acc.encryptedBefore') })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-platform", children: t('acc.platform') }), _jsx("input", { ref: first, id: "acc-platform", className: "input", list: "acc-platforms", value: platform, onChange: (e) => setPlatform(e.target.value), required: true, maxLength: 80 }), _jsx("datalist", { id: "acc-platforms", children: PLATFORMS.map((p) => _jsx("option", { value: p }, p)) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-group", children: t('apps.group') }), _jsx("input", { id: "acc-group", className: "input", list: "acc-groups", value: group, onChange: (e) => setGroup(e.target.value), maxLength: 40 }), _jsx("datalist", { id: "acc-groups", children: groups.map((g) => _jsx("option", { value: g }, g)) }), _jsx("span", { className: "help", children: t('apps.groupHelp') })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-user", children: t('acc.userOrEmail') }), _jsx("input", { id: "acc-user", className: "input", value: username, onChange: (e) => setUsername(e.target.value), maxLength: 200, autoComplete: "off" })] }), _jsxs("div", { className: "field", children: [_jsx("span", { id: "acc-signin", className: "label", children: t('acc.signIn') }), _jsx("div", { className: "row g8 wrap", role: "radiogroup", "aria-labelledby": "acc-signin", children: SIGN_IN.map(([v, k]) => (_jsx("button", { type: "button", role: "radio", "aria-checked": signIn === v, className: `btn btn-sm ${signIn === v ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setSignIn(v), children: t(k) }, v))) }), signIn !== 'password' && _jsx("span", { className: "help", children: t('acc.signInHelp') })] }), signIn === 'password' && (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-pass", children: t('acc.password') }), _jsx("input", { id: "acc-pass", className: "input mono", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: editing?.hasSecret ? t('acc.keepPassword') : '', autoComplete: "new-password" }), _jsx("span", { className: "help", children: t('acc.passwordHelp') })] })), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-link", children: t('acc.link') }), _jsx("input", { id: "acc-link", className: "input", value: link, onChange: (e) => setLink(e.target.value), maxLength: 500, placeholder: "https://" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-notes", children: t('acc.notes') }), _jsx("textarea", { id: "acc-notes", className: "input", rows: 2, value: notes, onChange: (e) => setNotes(e.target.value), maxLength: 1000, style: { height: 'auto', paddingTop: 10 } }), secretInNotes ? (_jsxs("div", { className: "row between g8 wrap", role: "alert", children: [_jsx("span", { className: "help err", children: t('acc.secretInNotes') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: moveToPassword, children: t('acc.moveToPassword') })] })) : _jsx("span", { className: "help", children: t('acc.notesHelp') })] }), _jsxs("label", { className: "row g8 t-sm", style: { cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: isSub, onChange: (e) => setIsSub(e.target.checked) }), " ", t('acc.isSub')] }), isSub && (_jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-plan", children: t('acc.plan') }), _jsx("input", { id: "acc-plan", className: "input", value: sub.plan ?? '', onChange: (e) => setSub((s) => ({ ...s, plan: e.target.value })), maxLength: 80, placeholder: "Pro" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-price", children: t('acc.price') }), _jsx("input", { id: "acc-price", className: "input", type: "number", min: 0, step: "0.01", inputMode: "decimal", value: sub.price ?? '', onChange: (e) => setSub((s) => ({ ...s, price: e.target.value === '' ? null : Number(e.target.value) })) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-cur", children: t('acc.currency') }), _jsxs("select", { id: "acc-cur", className: "input", value: sub.currency ?? 'USD', onChange: (e) => setSub((s) => ({ ...s, currency: e.target.value })), children: [_jsx("option", { children: "USD" }), _jsx("option", { children: "COP" }), _jsx("option", { children: "EUR" })] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "acc-per", children: t('acc.period') }), _jsxs("select", { id: "acc-per", className: "input", value: sub.period ?? 'month', onChange: (e) => setSub((s) => ({ ...s, period: e.target.value })), children: [_jsx("option", { value: "month", children: t('acc.monthly') }), _jsx("option", { value: "year", children: t('acc.yearly') })] })] })] })), _jsxs("label", { className: "row g8 t-sm", style: { cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: shared, onChange: (e) => setShared(e.target.checked) }), " ", t('acc.sharedLabel')] }), error && _jsx("p", { className: "help err", role: "alert", children: t(error === 'vault' ? 'acc.vaultOff' : 'acc.saveError') }), _jsxs("div", { className: "row g12 wrap", style: { justifyContent: 'space-between' }, children: [editing ? _jsx("button", { type: "button", className: "btn btn-ghost", onClick: () => setDeleting(true), children: t('acc.delete') }) : _jsx("span", {}), _jsxs("span", { className: "row g12", children: [_jsx("button", { type: "button", className: "btn btn-secondary", onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: busy || !platform.trim() || secretInNotes, children: t('acc.save') })] })] })] }), deleting && editing && (_jsx(ConfirmDialog, { title: t('acc.deleteTitle', { platform: editing.platform }), confirmLabel: t('acc.delete'), danger: true, onConfirm: async () => { await accessesApi.remove(brandId, editing.id); setDeleting(false); onClose(); }, onCancel: () => setDeleting(false), children: t('acc.deleteBody') }))] }));
}
