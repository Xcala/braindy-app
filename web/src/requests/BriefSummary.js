import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { findCategory, findSub } from './taxonomy';
import { dayLabel } from '../lib/dates';
import { VersionNotes } from './VersionNotes';
import { AttachedFiles } from './AttachedFiles';
import '../components/scan.css';
/** The brief made to scan, like the delivery notes: the facts first (type, format, language, date), then each card. */
export function BriefSummary({ brandId, r }) {
    const { t, lang } = useI18n();
    const type = [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang], r.formatType].filter(Boolean).join(' · ');
    const facts = [
        [t('brief.type'), type], [t('ask.format'), r.format], [t('ask.language'), r.language],
        [t('brief.due'), r.dueDate ? dayLabel(r.dueDate, lang) : undefined],
    ];
    const cards = ['product', 'application', 'scene'].filter((k) => k === 'product' || r.cards?.[k]?.text || r.cards?.[k]?.links?.length);
    return (_jsxs("div", { className: "card card-tight col g16", children: [_jsxs("div", { className: "scan scan-mute t-sm", children: [_jsx("p", { className: "scan-head", children: t('brief.glance') }), _jsx("ul", { className: "scan-list", children: facts.filter(([, v]) => v).map(([k, v]) => _jsxs("li", { children: [_jsxs("strong", { children: [k, ":"] }), " ", v] }, k)) })] }), cards.map((k) => (_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "scan-head", style: { margin: 0 }, children: k === 'product' ? t('brief.ask') : t(`ask.card.${k}`) }), r.cards?.[k]?.text ? _jsx(VersionNotes, { text: r.cards[k].text }) : _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t(`req.emptyCard.${k}`) }), (r.cards?.[k]?.links ?? []).map((l) => _jsx("a", { href: l, target: "_blank", rel: "noreferrer", className: "t-sm truncate", children: l }, l)), k === 'product' && _jsx(AttachedFiles, { brandId: brandId, files: r.cards?.product?.files })] }, k)))] }));
}
