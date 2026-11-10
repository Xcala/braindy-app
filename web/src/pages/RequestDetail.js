import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTour } from '../tour/useTour';
import { reviewSteps } from '../tour/steps';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useComments, useRequest, useVersions } from '../requests/useRequests';
import { useCanApprove } from '../requests/useCanApprove';
import { findCategory, findSub } from '../requests/taxonomy';
import { Progress } from '../requests/Progress';
import { TeamAtWork } from '../requests/TeamAtWork';
import { QualityCard } from '../requests/QualityCard';
import { PlanCard } from '../requests/PlanCard';
import { VersionViewer } from '../requests/VersionViewer';
import { ReviewPanel } from '../requests/ReviewPanel';
import { CompareView } from '../requests/CompareView';
import { AdminVersionPanel } from '../requests/AdminVersionPanel';
import { STATUS_CHIP } from '../requests/types';
import { dayLabel } from '../lib/dates';
import { SafeBoundary } from '../components/SafeBoundary';
import { LessonForRequest } from '../criterio/LessonCards';
import { BriefSummary } from '../requests/BriefSummary';
export function RequestDetail() {
    const { id = '' } = useParams();
    const { current, brands, select } = useBrands();
    // A shared link can carry its brand (?brand=quimiolab), so it opens whatever brand is selected now.
    const linked = useSearchParams()[0].get('brand');
    useEffect(() => { if (linked && linked !== current?.id && brands.some((b) => b.id === linked))
        select(linked); }, [linked, brands.length]);
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
    const [fileIndex, setFileIndex] = useState(0);
    const [seek, setSeek] = useState(null);
    useEffect(() => { setVersionId(r?.latestVersion ?? versions[versions.length - 1]?.id); setFileIndex(0); }, [r?.latestVersion, versions.length]); // eslint-disable-line react-hooks/exhaustive-deps
    useTour('review', () => reviewSteps(lang), versions.length > 0, false);
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    if (r === undefined)
        return _jsx("div", { className: "skel", style: { height: 400 } });
    if (r === null)
        return _jsx("p", { className: "t-mute", children: t('req.notFound') });
    const v = versions.find((x) => x.id === versionId) ?? versions[versions.length - 1];
    const type = [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang], r.formatType].filter(Boolean).join(' · ');
    return (_jsxs("div", { className: "col g20", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-6", children: [_jsxs("div", { className: "col g8 min-w-0", style: { maxWidth: '100%' }, children: [_jsxs("nav", { className: "crumbs", "aria-label": "Breadcrumb", children: [_jsx(Link, { to: "/requests", children: t('nav.requests') }), _jsx(Icon, { name: "chevronRight", size: 14 }), _jsx("span", { className: "cur", children: r.title })] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("h1", { className: "h2", style: { overflowWrap: 'anywhere', minWidth: 0 }, children: r.title }), _jsx("span", { className: `chip ${STATUS_CHIP[r.status]}`, children: t(`req.status.${r.status}`) }), r.approvalLevel === 'nicolas' && _jsx("span", { className: "chip c-sent", children: t('ask.withNicolas') })] }), _jsxs("span", { className: "t-sm t-mute", children: [type, r.dueDate ? ` · ${t('home.dueDay', { day: dayLabel(r.dueDate, lang) })}` : ''] })] }), _jsx(Progress, { r: r })] }), r.status === 'in_production' && _jsx(TeamAtWork, { r: r }), isAdmin && r.quality?.checks?.length ? _jsx(QualityCard, { q: r.quality }) : null, versions.length > 0 && (_jsx(SafeBoundary, { children: _jsxs("div", { className: "card grid grid-cols-1 overflow-hidden p-0 lg:grid-cols-[minmax(0,1fr)_400px]", style: { padding: 0 }, "data-tour": "review-viewer", children: [_jsx(VersionViewer, { brandId: current.id, requestId: r.id, versions: versions, current: v, onPick: setVersionId, fileIndex: fileIndex, onFile: (i) => { setFileIndex(i); setMark(null); }, comments: comments, onMark: setMark, onCompare: () => setComparing(true), seek: seek }), _jsx(ReviewPanel, { brandId: current.id, r: r, v: v, comments: comments.filter((c) => !c.versionId || c.versionId === v?.id), canApprove: canApprove, pendingMark: mark, clearMark: () => setMark(null), onShowFile: setFileIndex, onSeek: (i, t) => { setFileIndex(i); setSeek((s) => ({ t, n: (s?.n ?? 0) + 1 })); } })] }) })), _jsxs("div", { className: "grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]", "data-tour": "review-brief", children: [_jsxs("div", { className: "col g12", children: [_jsx("p", { className: "label", children: t('req.brief') }), _jsx(BriefSummary, { brandId: current.id, r: r })] }), _jsxs("div", { className: "col g12", children: [_jsx("p", { className: "label", children: t('req.plan') }), _jsx(SafeBoundary, { children: _jsx(PlanCard, { brandId: current.id, r: r, isAdmin: isAdmin }) }), _jsx(LessonForRequest, { category: r.category })] })] }), isAdmin && _jsx(AdminVersionPanel, { brandId: current.id, r: r }), comparing && _jsx(CompareView, { brandId: current.id, requestId: r.id, versions: versions, fileIndex: fileIndex, onClose: () => setComparing(false) })] }));
}
