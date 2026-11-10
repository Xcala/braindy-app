import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { Icon } from '../components/Icon';
import { publicShareApi } from '../share/api';
import '../share/share.css';
const MAX = 500 * 1024 ** 2;
const kb = (n) => (n > 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
/** Upload link (idea from Air): anyone with it sends files to a brand without an account. They land in «Recibidos». */
export function PublicUpload() {
    const { token = '' } = useParams();
    const { t } = useI18n();
    const [brand, setBrand] = useState(null);
    const [gone, setGone] = useState(false);
    const [files, setFiles] = useState([]);
    const [sender, setSender] = useState('');
    const [note, setNote] = useState('');
    const [step, setStep] = useState(null);
    const [done, setDone] = useState(0);
    const [error, setError] = useState('');
    const [over, setOver] = useState(false);
    const input = useRef(null);
    useEffect(() => { publicShareApi.upload(token).then((r) => setBrand(r.brand), () => setGone(true)); }, [token]);
    const add = (list) => {
        const picked = [...(list ?? [])];
        const big = picked.find((f) => f.size > MAX);
        setError(big ? t('ul.tooBig', { name: big.name }) : '');
        setFiles((cur) => [...cur, ...picked.filter((f) => f.size <= MAX)].slice(0, 50));
    };
    async function send() {
        setError('');
        try {
            for (const [i, f] of files.entries()) {
                setStep({ i, p: 0 });
                await publicShareApi.send(token, f, { sender: sender.trim(), note: note.trim() }, (p) => setStep({ i, p }));
            }
            setDone(files.length);
            setFiles([]);
        }
        catch {
            setError(t('ul.error'));
        }
        finally {
            setStep(null);
        }
    }
    const shell = (body) => (_jsxs("div", { className: "pub-page", children: [_jsxs("header", { className: "row between g12 pub-head", children: [_jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", style: { height: 24 } }), _jsx(LangToggle, {})] }), _jsx("main", { className: "pub-main", children: body })] }));
    if (gone)
        return shell(_jsx("div", { className: "card col g8", children: _jsx("p", { className: "h3", children: t('ul.gone') }) }));
    if (!brand)
        return shell(_jsx("div", { className: "skel", style: { height: 320 } }));
    return shell(_jsxs("div", { className: "card col g20", children: [_jsxs("div", { className: "row g12", children: [brand.logoUrl && _jsx("img", { src: brand.logoUrl, alt: "", className: "pub-logo" }), _jsx("h1", { className: "h2", style: { margin: 0 }, children: t('ul.pageTitle', { brand: brand.name }) })] }), done > 0 && !files.length ? (_jsxs("div", { className: "col g12", role: "status", children: [_jsxs("p", { className: "h3 row g8", style: { margin: 0 }, children: [_jsx(Icon, { name: "check" }), t('ul.done')] }), _jsx("p", { className: "t-mute", children: t('ul.doneLead', { n: done }) }), _jsx("button", { className: "btn btn-secondary self-start", onClick: () => setDone(0), children: t('ul.more') })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "t-mute", children: t('ul.pageLead', { brand: brand.name }) }), _jsxs("div", { className: `pub-drop${over ? ' is-over' : ''}`, onDragOver: (e) => { e.preventDefault(); setOver(true); }, onDragLeave: () => setOver(false), onDrop: (e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }, children: [_jsx(Icon, { name: "upload", size: 28 }), _jsx("button", { type: "button", className: "btn btn-primary", onClick: () => input.current?.click(), disabled: !!step, children: t('ul.pick') }), _jsx("span", { className: "t-sm t-mute", children: t('ul.drop') }), _jsx("input", { ref: input, type: "file", multiple: true, hidden: true, onChange: (e) => { add(e.target.files); e.target.value = ''; } })] }), files.length > 0 && (_jsx("ul", { className: "pub-files", children: files.map((f, i) => (_jsxs("li", { className: "row between g8", children: [_jsxs("span", { className: "truncate t-sm", children: [f.name, " ", _jsxs("span", { className: "t-mute", children: ["\u00B7 ", kb(f.size)] })] }), step ? (step.i === i ? _jsxs("span", { className: "t-xs w7", children: [Math.round(step.p * 100), "%"] }) : step.i > i ? _jsx(Icon, { name: "check", size: 16 }) : null)
                                    : _jsx("button", { className: "btn btn-ghost btn-sm", "aria-label": `${t('common.cancel')} ${f.name}`, onClick: () => setFiles((l) => l.filter((_, j) => j !== i)), children: _jsx(Icon, { name: "x", size: 16 }) })] }, `${f.name}-${i}`))) })), _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "col g4", children: [_jsx("span", { className: "t-sm w7", children: t('ul.name') }), _jsx("input", { className: "input", value: sender, maxLength: 60, onChange: (e) => setSender(e.target.value), autoComplete: "name" })] }), _jsxs("label", { className: "col g4", children: [_jsx("span", { className: "t-sm w7", children: t('ul.note') }), _jsx("input", { className: "input", value: note, maxLength: 1000, onChange: (e) => setNote(e.target.value) })] })] }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: error }), _jsx("button", { className: "btn btn-primary self-start", disabled: !files.length || !!step, onClick: send, children: step ? t('ul.sending', { i: step.i + 1, n: files.length }) : files.length ? t('ul.send', { n: files.length }) : t('ul.sendEmpty') })] })), _jsx("p", { className: "t-xs t-mute", children: t('sh.madeBy') })] }));
}
