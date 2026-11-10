import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { CONTRACTOR_FIELDS } from '../types';
/** NickMark's legal data as contractor (natural person). Lives only in config/contractor (admin only). */
export function ContractorForm() {
    const { t } = useI18n();
    const [data, setData] = useState(null);
    const [msg, setMsg] = useState(null);
    useEffect(() => { getDoc(doc(db, 'config/contractor')).then((s) => setData(s.data() ?? {})).catch(() => setData({})); }, []);
    if (!data)
        return null;
    const missing = CONTRACTOR_FIELDS.filter((k) => !data[k]?.trim()).length;
    const save = () => setDoc(doc(db, 'config/contractor'), Object.fromEntries(CONTRACTOR_FIELDS.map((k) => [k, (data[k] ?? '').trim()])))
        .then(() => setMsg(t('ob.a.saved'))).catch(() => setMsg(t('ob.a.error')));
    return (_jsxs("details", { className: "card col g8", open: missing > 0, children: [_jsxs("summary", { className: "h3", style: { cursor: 'pointer' }, children: [t('ctr.contractor'), " ", missing > 0 && _jsx("span", { className: "chip c-draft", children: t('ctr.missing', { n: missing }) })] }), _jsx("p", { className: "t-xs t-mute", children: t('ctr.contractorSub') }), CONTRACTOR_FIELDS.map((k) => (_jsxs("label", { className: "col g4 t-sm", children: [_jsx("span", { className: "w7", children: t(`ctr.c.${k}`) }), _jsx("input", { className: "input", value: data[k] ?? '', onChange: (e) => setData({ ...data, [k]: e.target.value }), autoComplete: "off" })] }, k))), _jsxs("div", { className: "row g8", children: [_jsx("button", { className: "btn btn-secondary btn-sm", onClick: save, children: t('ob.a.save') }), msg && _jsx("span", { className: "t-xs", role: "status", children: msg })] })] }));
}
