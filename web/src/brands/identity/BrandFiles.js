import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { formatBytes } from '../../assets/fileApi';
import { extLabel, kindOf, thumbClass } from '../../assets/fileKinds';
const ref = (brandId) => doc(db, 'brands', brandId, 'context', 'identity');
const entry = (f) => ({ id: f.id, title: f.title, contentType: f.contentType, size: f.size, ...(f.ext ? { ext: f.ext } : {}) });
export const pinBrandFile = (brandId, f) => setDoc(ref(brandId), { documents: arrayUnion(entry(f)) }, { merge: true });
export const unpinBrandFile = (brandId, f) => updateDoc(ref(brandId), { documents: arrayRemove(entry(f)) });
export function BrandFiles({ brandId, files, isAdmin }) {
    const { t } = useI18n();
    return (_jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: files.map((f) => (_jsxs("div", { className: "tile", style: { padding: 0, position: 'relative' }, children: [_jsxs("a", { href: `/open/${brandId}/${f.id}`, target: "_blank", rel: "noopener", className: "text-left", style: { display: 'block', color: 'inherit', textDecoration: 'none' }, children: [_jsxs("div", { className: `thumb ${thumbClass[kindOf(f)]}`, style: { height: 140, width: '100%' }, children: [_jsx(Icon, { name: "file", size: 36, className: "ico" }), _jsx("span", { className: "chip chip-plain c-type badge", style: { background: '#fff', zIndex: 1 }, children: extLabel(f) })] }), _jsxs("div", { className: "tile-meta w-full", children: [_jsx("span", { className: "tile-name", children: f.title }), _jsxs("span", { className: "t-sm t-mute", children: [formatBytes(f.size), " \u00B7 ", t('common.open'), " \u2197"] })] })] }), isAdmin && (_jsx("button", { type: "button", className: "btn btn-ghost btn-sm", style: { position: 'absolute', top: 8, right: 8, background: '#fff' }, "aria-label": `${t('bf.unpin')}: ${f.title}`, title: t('bf.unpin'), onClick: () => window.confirm(t('bf.unpinConfirm')) && unpinBrandFile(brandId, f), children: _jsx(Icon, { name: "x", size: 14 }) }))] }, f.id))) }));
}
