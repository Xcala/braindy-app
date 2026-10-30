import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTour } from '../tour/useTour';
import { reviewSteps } from '../tour/steps';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useComments, useRequest, useVersions } from '../requests/useRequests';
import { useCanApprove } from '../requests/useCanApprove';
import { findCategory, findSub } from '../requests/taxonomy';
import { Progress } from '../requests/Progress';
import { PlanCard } from '../requests/PlanCard';
import { VersionViewer } from '../requests/VersionViewer';
import { ReviewPanel } from '../requests/ReviewPanel';
import { CompareView } from '../requests/CompareView';
import { AdminVersionPanel } from '../requests/AdminVersionPanel';
import { STATUS_CHIP } from '../requests/types';
import { dayLabel } from '../lib/dates';
import { SafeBoundary } from '../components/SafeBoundary';
import { LessonForRequest } from '../criterio/LessonCards';
import { AttachedFiles } from '../requests/AttachedFiles';
export function RequestDetail() {
    const { id = '' } = useParams();
    const { current } = useBrands();
    const { profile } = useAuth();
    const { t, lang } = useI18n();
    const r = useRequest(current?.id, id);
    const all = useVersions(current?.id, id);
    const comments = useComments(current?.id, id);
    const canApprove = useCanApprove(current?.id);
    const isAdmin = profile?.role === 'admin';
    const versions = isAdmin ? all : all.filter((v) => v.published);
    const [versionId, setVersionId] = useState();
    const [mark, setMark] = useState(null);
    const [comparing, setComparing] = useState(false);
    useEffect(() => { setVersionId(r?.latestVersion ?? versions[versions.length - 1]?.id); }, [r?.latestVersion, versions.length]); // eslint-disable-line react-hooks/exhaustive-deps
    useTour('review', () => reviewSteps(lang), versions.length > 0, false);
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    if (r === undefined)
        return _jsx("div", { className: "skel", style: { height: 400 } });
    if (r === null)
        return _jsx("p", { className: "t-mute", children: t('req.notFound') });
    const v = versions.find((x) => x.id === versionId) ?? versions[versions.length - 1];
    const type = [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang], r.formatType].filter(Boolean).join(' · ');
    return (_jsxs("div", { className: "col g20", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-6", children: [_jsxs("div", { className: "col g8", children: [_jsxs("nav", { className: "crumbs", "aria-label": "Breadcrumb", children: [_jsx(Link, { to: "/requests", children: t('nav.requests') }), _jsx(Icon, { name: "chevronRight", size: 14 }), _jsx("span", { className: "cur", children: r.title })] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("h1", { className: "h2", children: r.title }), _jsx("span", { className: `chip ${STATUS_CHIP[r.status]}`, children: t(`req.status.${r.status}`) }), r.approvalLevel === 'nicolas' && _jsx("span", { className: "chip c-sent", children: t('ask.withNicolas') })] }), _jsxs("span", { className: "t-sm t-mute", children: [type, r.dueDate ? ` · ${t('home.dueDay', { day: dayLabel(r.dueDate, lang) })}` : ''] })] }), _jsx(Progress, { r: r })] }), versions.length > 0 && (_jsx(SafeBoundary, { children: _jsxs("div", { className: "card grid grid-cols-1 overflow-hidden p-0 lg:grid-cols-[minmax(0,1fr)_400px]", style: { padding: 0 }, "data-tour": "review-viewer", children: [_jsx(VersionViewer, { brandId: current.id, requestId: r.id, versions: versions, current: v, onPick: setVersionId, comments: comments, onMark: setMark, onCompare: () => setComparing(true) }), _jsx(ReviewPanel, { brandId: current.id, r: r, v: v, comments: comments.filter((c) => !c.versionId || c.versionId === v?.id), canApprove: canApprove, pendingMark: mark, clearMark: () => setMark(null) })] }) })), _jsxs("div", { className: "grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]", "data-tour": "review-brief", children: [_jsxs("div", { className: "col g12", children: [_jsx("p", { className: "label", children: t('req.brief') }), ['product', 'application', 'scene'].filter((k) => k === 'product' || r.cards?.[k]?.text || r.cards?.[k]?.links?.length).map((k) => (_jsxs("div", { className: "card card-tight col g8", children: [_jsx("span", { className: `kind ${k === 'scene' ? '' : 'kind-logodeck'}`, children: t(`ask.card.${k}`) }), _jsx("p", { className: `t-sm ${r.cards?.[k]?.text ? '' : 't-mute'}`, style: { whiteSpace: 'pre-line' }, children: r.cards?.[k]?.text || t(`req.emptyCard.${k}`) }), (r.cards?.[k]?.links ?? []).map((l) => _jsx("a", { href: l, target: "_blank", rel: "noreferrer", className: "t-sm truncate", children: l }, l)), k === 'product' && _jsx(AttachedFiles, { brandId: current.id, files: r.cards?.product?.files })] }, k))), (r.format || r.language) && _jsx("p", { className: "t-sm t-mute", children: [r.format, r.language].filter(Boolean).join(' · ') })] }), _jsxs("div", { className: "col g12", children: [_jsx("p", { className: "label", children: t('req.plan') }), _jsx(SafeBoundary, { children: _jsx(PlanCard, { brandId: current.id, r: r, isAdmin: isAdmin }) }), _jsx(LessonForRequest, { category: r.category })] })] }), isAdmin && _jsx(AdminVersionPanel, { brandId: current.id, r: r }), comparing && _jsx(CompareView, { brandId: current.id, requestId: r.id, versions: versions, onClose: () => setComparing(false) })] }));
}
