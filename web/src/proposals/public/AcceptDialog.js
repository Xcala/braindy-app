import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { publicApi } from '../api';
import { fill } from './copy';
/** "Accept and sign" from the design: typed signature, scope consent, then payment (next step). */
export function AcceptDialog({ c, token, prospectName, validLabel, option, onClose }) {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [agree, setAgree] = useState(false);
    const [state, setState] = useState('form');
    const box = useRef(null);
    useEffect(() => {
        box.current?.querySelector('input')?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);
    async function sign() {
        setState('busy');
        try {
            const r = await publicApi.accept(token, { name, role, email: email.trim(), accepted: true, option });
            if (r.payUrl) {
                window.location.href = r.payUrl;
                return;
            }
            setState('done');
        }
        catch {
            setState('error');
        }
    }
    return (_jsx("div", { className: "scrim fixed inset-0 z-50 flex items-center justify-center p-4", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: _jsxs("section", { ref: box, className: "modal w-full max-w-[600px]", role: "dialog", "aria-modal": "true", "aria-labelledby": "acc-t", children: [_jsxs("div", { className: "row between", style: { alignItems: 'flex-start' }, children: [_jsxs("div", { className: "col g8", children: [_jsxs("span", { className: "t-sm t-mute", children: [fill(c.acceptFor, { name: prospectName }), validLabel ? ` · ${fill(c.acceptValid, { date: validLabel })}` : ''] }), _jsx("h2", { className: "h2", id: "acc-t", children: state === 'done' ? c.done1 : c.accept })] }), _jsx("button", { className: "btn btn-icon btn-ghost", "aria-label": c.close, onClick: onClose, children: _jsx(Icon, { name: "x" }) })] }), state === 'done' ? (_jsxs("div", { className: "col g12", children: [_jsx("p", { className: "h3", children: fill(c.done2, { name: name.split(' ')[0] }) }), _jsx("p", { className: "t-mute", children: c.doneBody }), _jsx("button", { className: "btn btn-primary self-start", onClick: onClose, children: c.close })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "row g8 wrap", children: c.steps.map((s, i) => _jsx("span", { className: `chip ${i === 0 ? 'c-prod' : 'chip-plain'}`, children: s }, s)) }), _jsxs("p", { className: "t-sm", children: [_jsxs("span", { className: "t-mute", children: [c.option, ":"] }), " ", _jsx("b", { children: c.options[option].name })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "sn", children: c.fullName }), _jsx("input", { className: "input", id: "sn", value: name, onChange: (e) => setName(e.target.value), autoComplete: "name" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "sr", children: c.roleCompany }), _jsx("input", { className: "input", id: "sr", value: role, onChange: (e) => setRole(e.target.value), autoComplete: "organization-title" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "se", children: c.email }), _jsx("input", { className: "input", id: "se", type: "email", value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email" }), _jsx("span", { className: "t-xs t-mute", children: c.emailHint })] }), _jsxs("div", { className: "col g8", children: [_jsx("span", { className: "t-sm w7", children: c.signature }), _jsx("div", { "aria-live": "polite", style: { height: 96, border: '1.5px dashed var(--line-strong)', borderRadius: 16, display: 'flex', alignItems: 'center', padding: '0 24px', font: "500 34px/1 'Red Hat Display', sans-serif", color: 'var(--ink)' }, children: name }), _jsx("span", { className: "t-xs t-mute", children: c.signatureHint })] }), _jsxs("label", { className: "row g12", style: { alignItems: 'flex-start' }, children: [_jsx("input", { type: "checkbox", checked: agree, onChange: (e) => setAgree(e.target.checked), style: { width: 20, height: 20, accentColor: 'var(--azul)', marginTop: 2 } }), _jsx("span", { className: "t-sm", children: c.agree })] }), state === 'error' && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: c.error }), _jsx("button", { className: "btn btn-primary btn-block", style: { height: 52 }, disabled: !agree || name.trim().length < 3 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) || state === 'busy', onClick: sign, children: c.signContinue }), _jsx("span", { className: "t-xs t-mute", children: c.paymentNext })] }))] }) }));
}
