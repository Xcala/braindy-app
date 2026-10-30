import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
/** Admin: the day 0-11 WhatsApp notices of a brand; unsent ones carry a ready link to send by hand. */
export function NoticesList({ brandId }) {
    const { t, lang } = useI18n();
    const [list, setList] = useState([]);
    useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'notices'), orderBy('at', 'desc')), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([])), [brandId]);
    if (!list.length)
        return null;
    return (_jsxs("div", { className: "card col g8", children: [_jsx("h2", { className: "h3", children: t('ob.n.title') }), list.map((n) => (_jsxs("div", { className: "row between g12 wrap t-sm", style: { padding: '6px 0', borderTop: '1px solid var(--line)' }, children: [_jsx("span", { className: "w7", children: t(`ob.n.${n.kind}`) }), _jsx("span", { className: "t-xs t-mute", children: n.at?.toDate().toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) }), n.sent ? _jsx("span", { className: "chip c-approved", children: t('ob.n.sent') })
                        : n.waUrl ? _jsx("a", { className: "btn btn-secondary btn-sm", href: n.waUrl, target: "_blank", rel: "noreferrer", children: t('ob.n.send') })
                            : _jsx("span", { className: "chip c-draft", children: t('ob.n.noNumber') })] }, n.id)))] }));
}
