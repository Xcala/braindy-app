import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { contractsApi } from '../api';
const toBase64 = (f) => new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] ?? '');
    r.onerror = () => ko(r.error);
    r.readAsDataURL(f);
});
/** Admin · a contract already signed outside Braindy: the PDF, and it shows as signed in Mi plan and My files. */
export function SignedUpload({ brandId, onDone }) {
    const { t } = useI18n();
    const [file, setFile] = useState(null);
    const [form, setForm] = useState({ title: '', signedOn: '', clientName: '', clientRole: '' });
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const send = async () => {
        if (!file || !form.signedOn)
            return;
        setBusy(true);
        setMsg(null);
        try {
            await contractsApi.uploadSigned(brandId, { ...form, pdf: await toBase64(file), fileName: file.name });
            setMsg(t('ctr.u.done'));
            onDone();
        }
        catch {
            setMsg(t('ob.a.error'));
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("div", { className: "col g8", children: [_jsx("input", { className: "input", type: "file", accept: "application/pdf", "aria-label": t('ctr.u.file'), onChange: (e) => setFile(e.target.files?.[0] ?? null) }), _jsx("input", { className: "input", placeholder: t('ctr.u.name'), "aria-label": t('ctr.u.name'), value: form.title, onChange: set('title') }), _jsxs("label", { className: "col g4 t-sm", children: [_jsx("span", { className: "w7", children: t('ctr.u.date') }), _jsx("input", { className: "input", type: "date", value: form.signedOn, onChange: set('signedOn') })] }), _jsx("input", { className: "input", placeholder: t('ctr.u.signer'), "aria-label": t('ctr.u.signer'), value: form.clientName, onChange: set('clientName') }), _jsx("input", { className: "input", placeholder: t('ctr.u.role'), "aria-label": t('ctr.u.role'), value: form.clientRole, onChange: set('clientRole') }), _jsx("button", { className: "btn btn-secondary btn-sm", disabled: busy || !file || !form.signedOn, onClick: send, children: t('ctr.u.send') }), msg && _jsx("p", { className: "t-sm", role: "status", children: msg })] }));
}
