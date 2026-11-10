import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { SEATS } from './geometry';
import { closeNote, sign, writeTo } from './useStudio';
export const SEAT_NAME = { nico: 'NicoMarca', researcher: 'Researcher', marketer: 'Marketer', creator: 'Creator', builder: 'Builder' };
const BRAINS = ['researcher', 'marketer', 'creator', 'builder'];
/** The card next to a zoomed-in seat: what they are doing, their queue, and the two actions: sign and write. */
/** away: NicoMarca is out of the office (when he is back, and the US holiday if there is one).
 *  idle: internal work (Braindy, Revista Level) shown when there is no client work, so nobody reads as idle. */
export function FocusCard({ id, view, open, allItems, readOnly = false, stateLabel, away, idle = [] }) {
    const { t } = useI18n();
    const ctx = useBrandsMaybe();
    const brands = ctx?.brands ?? [];
    const select = (id) => ctx?.select(id);
    // On a client's home every item is their own brand, so the brand name is left out.
    const brand = (bid) => (readOnly ? '' : brands.find((b) => b.id === bid)?.name ?? '');
    const withBrand = (title, bid) => (readOnly ? title : `${title} · ${brand(bid)}`);
    const [tab, setTab] = useState('work');
    const isNico = id === 'nico';
    const openLink = (i) => (_jsx(Link, { to: `/requests/${i.id}`, onClick: () => select(i.brandId), className: "sd-btn ghost", style: { textDecoration: 'none' }, children: t('st.open') }));
    return (_jsxs("aside", { className: "sd-focus", "aria-hidden": !open, "aria-live": "polite", children: [_jsx("div", { className: "row", style: { borderBottom: 0, padding: 0 }, children: _jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("i", { style: { width: 12, height: 12, borderRadius: '50%', background: SEATS[id].c } }), _jsxs("div", { className: "flex flex-col", children: [_jsx("h3", { children: SEAT_NAME[id] }), _jsx("span", { className: "lbl", children: t(`st.role.${id}`) })] })] }) }), !readOnly && _jsxs("div", { className: "sd-seg", role: "group", children: [_jsx("button", { type: "button", className: tab === 'work' ? 'on' : '', onClick: () => setTab('work'), children: isNico ? t('st.sign') : t('st.queue') }), _jsx("button", { type: "button", className: tab === 'write' ? 'on' : '', onClick: () => setTab('write'), children: t('st.write') })] }), tab === 'work' && _jsxs(_Fragment, { children: [away && _jsxs(_Fragment, { children: [_jsxs("div", { className: "now", children: [_jsx("span", { className: "lbl", children: t('st.state.away') }), _jsx("div", { children: away.back })] }), away.holiday && _jsx("span", { className: "lbl", children: t('st.holiday', { name: away.holiday }) }), _jsx("p", { className: "note", children: t('st.awayNote') })] }), !away && _jsxs("div", { className: "now", children: [_jsx("span", { className: "lbl", children: stateLabel ?? t(`st.state.${view.state}`) }), _jsx("div", { children: view.now ? withBrand(view.now.title, view.now.brandId) : idle[0] })] }), (view.queue.length > 0 || !isNico) && _jsx("span", { className: "lbl", children: isNico ? t(readOnly ? 'st.reviewQueue' : 'st.signQueue') : t('st.queue') }), view.queue.length === 0 && !isNico && idle.slice(view.now ? 0 : 1, 3).map((x) => _jsx("div", { className: "row", children: _jsx("span", { className: "min-w-0", children: x }) }, x)), view.queue.slice(0, 6).map((i) => (_jsxs("div", { className: "row", children: [_jsxs("span", { className: "min-w-0", children: [withBrand(i.title, i.brandId), _jsx("br", {}), _jsx("small", { children: isNico ? (i.stage === 'plan' ? t('st.plan') : t('st.version', { n: i.versionCount ?? 1 })) : i.dueDate ?? '' })] }), isNico && !readOnly ? _jsx(SignButton, { i: i, fallback: openLink(i) }) : openLink(i)] }, i.brandId + i.id))), !isNico && !readOnly && view.notes.length > 0 && _jsxs(_Fragment, { children: [_jsx("span", { className: "lbl", children: t('st.notes') }), view.notes.map((n) => (_jsxs("div", { className: "row", children: [_jsxs("span", { className: "min-w-0", children: [n.text, _jsx("br", {}), _jsx("small", { children: brand(n.brandId) })] }), _jsx("button", { type: "button", className: "sd-btn ghost", onClick: () => closeNote(n.id), children: t('st.done') })] }, n.id)))] })] }), tab === 'write' && !readOnly && _jsx(WriteBox, { to: isNico ? null : id, items: isNico ? allItems : view.queue, brandOf: brand })] }));
}
function SignButton({ i, fallback }) {
    const { t } = useI18n();
    const [state, setState] = useState('idle');
    if (i.stage === 'plan' && !(i.plan?.scope?.length))
        return _jsx("span", { title: t('st.noPlan'), children: fallback });
    if (state === 'done')
        return _jsx("span", { className: "sd-btn ok", children: t('st.signed') });
    return (_jsx("button", { type: "button", className: "sd-btn", disabled: state === 'busy', title: state === 'error' ? t('st.signErr', { e: '' }) : undefined, onClick: async () => { setState('busy'); try {
            await sign(i);
            setState('done');
        }
        catch {
            setState('error');
        } }, children: state === 'error' ? '!' : t('st.sign') }));
}
function WriteBox({ to, items, brandOf }) {
    const { t } = useI18n();
    const { user } = useAuth();
    const [brain, setBrain] = useState(to ?? 'creator');
    const [req, setReq] = useState('');
    const [text, setText] = useState('');
    const [sent, setSent] = useState('');
    const target = to ?? brain;
    const picked = items.find((i) => i.brandId + '/' + i.id === req);
    async function send() {
        if (!user || !text.trim())
            return;
        await writeTo(target, picked?.brandId ?? '', text, user.uid, picked?.id);
        setText('');
        setSent(t('st.sent', { name: SEAT_NAME[target] }));
    }
    return (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("span", { className: "lbl", children: t('st.writeTo', { name: SEAT_NAME[target] }) }), !to && (_jsx("select", { "aria-label": t('st.brain'), value: brain, onChange: (e) => setBrain(e.target.value), children: BRAINS.map((b) => _jsx("option", { value: b, children: SEAT_NAME[b] }, b)) })), _jsxs("select", { "aria-label": t('st.request'), value: req, onChange: (e) => setReq(e.target.value), children: [_jsx("option", { value: "", children: t('st.general') }), items.map((i) => _jsxs("option", { value: i.brandId + '/' + i.id, children: [i.title, " \u00B7 ", brandOf(i.brandId)] }, i.brandId + i.id))] }), _jsx("textarea", { value: text, onChange: (e) => { setText(e.target.value); setSent(''); }, placeholder: t('st.writePh'), maxLength: 2000 }), _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { style: { color: '#7FD3A8' }, children: sent }), _jsx("button", { type: "button", className: "sd-btn", disabled: !text.trim(), onClick: send, children: t('st.send') })] })] }));
}
