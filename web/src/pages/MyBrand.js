import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { BrandHero } from '../brands/BrandHero';
import { BrandMark } from '../brands/BrandMark';
import { Logos } from '../brands/identity/Logos';
import { Colors, brandColors } from '../brands/identity/Colors';
import { Typography } from '../brands/identity/Typography';
import { Strategy, hasStrategy } from '../brands/identity/Strategy';
import { Voice } from '../brands/identity/Voice';
import { DeckConcept, deckShots } from '../brands/identity/DeckConcept';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { GroupWork } from '../brands/GroupWork';
import { GroupAnalysis, LearningsSection } from '../brains/BrainPanels';
import { MeetingsCard } from '../brains/TeamNotes';
import { useAuth } from '../auth/AuthProvider';
import { useCanApprove } from '../requests/useCanApprove';
import { ApprovedWork } from '../brands/identity/ApprovedWork';
import { useCopy } from '../brands/identity/useCopy';
import { SectionHead } from '../components/SectionHead';
import { useI18n } from '../i18n/I18nProvider';
import { BrandEditor } from '../brands/edit/BrandEditor';
export function MyBrand() {
    const { current, brands } = useBrands();
    const { t } = useI18n();
    const identity = useBrandDoc(current?.id, 'context/identity');
    const voiceDoc = useBrandDoc(current?.id, 'context/voice');
    const brainDoc = useBrandDoc(current?.id, 'context/brain');
    const legacyShots = deckShots(useLegacyAssets(current?.id));
    const { copied, copy } = useCopy();
    const canAsk = useCanApprove(current?.id);
    const isAdmin = useAuth().profile?.role === 'admin';
    const [editing, setEditing] = useState(false);
    const active = useActiveSection([identity.loading, voiceDoc.loading, brainDoc.loading, current?.id]);
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const id = (identity.data ?? {});
    // Concept images sent by the Braindy connector replace the ones rescued from the old LogoDeck.
    const shots = id.concept?.length ? id.concept : legacyShots;
    const voice = voiceDoc.data;
    const colors = brandColors(id.colors ?? []);
    const children = brands.filter((b) => b.groupId === current.id);
    const loading = identity.loading || voiceDoc.loading;
    const brain = brainDoc.data;
    const sections = [
        { id: 'family', label: 'brand.children', show: children.length > 0 },
        { id: 'overview', label: 'group.overview', show: children.length > 0 },
        { id: 'logos', label: 'brand.logos', show: !!id.logos },
        { id: 'concept', label: 'brand.concept', show: shots.length > 0 },
        { id: 'strategy', label: 'brand.strategy', show: hasStrategy(brain) },
        { id: 'colors', label: 'brand.colors', show: colors.length > 0 },
        { id: 'type', label: 'brand.typography', show: (id.typography ?? []).length > 0 },
        { id: 'voice', label: 'brand.voice', show: !!voice },
        { id: 'work', label: 'brand.work', show: (id.galleryAssets ?? []).length > 0 },
    ];
    const visible = sections.filter((s) => s.show);
    const num = (key) => visible.findIndex((s) => s.id === key) + 1;
    const font = (id.typography ?? [])[0]?.fontFamily ?? (id.typography ?? [])[0]?.name;
    return (_jsxs("div", { className: "col g48", children: [_jsx(BrandHero, { brand: current, logo: id.logos?.primary ?? current.logoUrl ?? undefined, essence: voice?.essence?.title, tags: (voice?.archetype ?? []).slice(0, 3), accent: colors[0]?.hex }), isAdmin && (_jsx("div", { className: "row", style: { justifyContent: 'flex-end', marginTop: -32 }, children: _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setEditing(true), children: t('be.open') }) })), editing && _jsx(BrandEditor, { brandId: current.id, identity: id, voice: voice, brain: brain, onClose: () => setEditing(false) }, current.id), visible.length > 1 && (_jsxs("div", { className: "stickybar row between g16 wrap rounded-[20px]", style: { marginTop: -24, padding: '12px 16px', top: 8 }, children: [_jsx("nav", { className: "anchors", "aria-label": t('brand.onThisPage'), children: visible.map((s) => _jsx("a", { href: `#${s.id}`, className: active === s.id ? 'is-on' : '', "aria-current": active === s.id ? 'location' : undefined, children: t(s.label) }, s.id)) }), colors.length > 0 && (_jsxs("div", { className: "row g8 wrap", children: [_jsx("span", { className: "label", children: t('brand.quickCopy') }), colors.slice(0, 3).map((c) => (_jsxs("button", { className: "qcopy", onClick: () => copy(c.hex.toUpperCase()), children: [_jsx("i", { style: { background: c.hex } }), copied === c.hex.toUpperCase() ? t('common.copied') : c.hex.toUpperCase()] }, c.hex))), font && _jsx("button", { className: "qcopy", onClick: () => copy(font), children: font })] }))] })), loading && _jsxs("p", { className: "t-mute", children: [t('common.loading'), "\u2026"] }), !loading && visible.length === 0 && _jsx("div", { className: "card t-mute", children: t('brand.empty') }), children.length > 0 && (_jsxs("section", { className: "col g24", id: "family", "aria-labelledby": "h-family", children: [_jsx(SectionHead, { id: "family", num: num('family'), title: t('brand.children'), subtitle: t('brand.childrenSub', { n: children.length }) }), _jsx(GroupBrands, { brands: children, all: brands })] })), children.length > 0 && (_jsxs("section", { className: "col g24", id: "overview", "aria-labelledby": "h-overview", children: [_jsx(SectionHead, { id: "overview", num: num('overview'), title: t('group.overview'), subtitle: t('group.overviewHint', { name: current.name }) }), _jsx(GroupWork, { group: current, all: brands }), _jsx(GroupAnalysis, { groupId: current.id, canAsk: canAsk })] })), id.logos && (_jsxs("section", { className: "col g24", id: "logos", "aria-labelledby": "h-logos", children: [_jsx(SectionHead, { id: "logos", num: num('logos'), title: t('brand.logos'), subtitle: t('brand.logosSub') }), _jsx(Logos, { logos: id.logos })] })), shots.length > 0 && (_jsxs("section", { className: "col g24", id: "concept", "aria-labelledby": "h-concept", children: [_jsx(SectionHead, { id: "concept", num: num('concept'), title: t('brand.concept'), subtitle: t('brand.conceptSub') }), _jsx(DeckConcept, { shots: shots })] })), hasStrategy(brain) && (_jsxs("section", { className: "col g24", id: "strategy", "aria-labelledby": "h-strategy", children: [_jsx(SectionHead, { id: "strategy", num: num('strategy'), title: t('brand.strategy'), subtitle: t('brand.strategySub') }), _jsx(Strategy, { brain: brain })] })), colors.length > 0 && (_jsxs("section", { className: "col g24", id: "colors", "aria-labelledby": "h-colors", children: [_jsx(SectionHead, { id: "colors", num: num('colors'), title: t('brand.colors'), subtitle: t('brand.colorsSub', { n: colors.length }) }), _jsx(Colors, { colors: id.colors ?? [] })] })), (id.typography ?? []).length > 0 && (_jsxs("section", { className: "col g24", id: "type", "aria-labelledby": "h-type", children: [_jsx(SectionHead, { id: "type", num: num('type'), title: t('brand.typography') }), _jsx(Typography, { fonts: id.typography ?? [] })] })), voice && (_jsxs("section", { className: "col g24", id: "voice", "aria-labelledby": "h-voice", children: [_jsx(SectionHead, { id: "voice", num: num('voice'), title: t('brand.voice') }), _jsx(Voice, { voice: voice })] })), (id.galleryAssets ?? []).length > 0 && (_jsxs("section", { className: "col g24", id: "work", "aria-labelledby": "h-work", children: [_jsx(SectionHead, { id: "work", num: num('work'), title: t('brand.work'), subtitle: t('brand.workSub') }), _jsx(ApprovedWork, { items: id.galleryAssets ?? [] })] })), _jsx(LearningsSection, { brandId: current.id }), isAdmin && _jsx(MeetingsCard, { brandId: current.id })] }));
}
/** Group view: every brand in the group, with its own sub-brands counted. */
function GroupBrands({ brands, all }) {
    const { select } = useBrands();
    const { t } = useI18n();
    return (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: brands.map((b) => {
            const n = all.filter((x) => x.groupId === b.id).length;
            return (_jsxs("button", { onClick: () => { select(b.id); window.scrollTo({ top: 0 }); }, className: "folder text-left", style: { cursor: 'pointer' }, children: [_jsx("span", { className: "sel", style: { border: 0, padding: 0, height: 'auto', background: 'none' }, children: _jsx(BrandMark, { brand: b }) }), _jsxs("span", { className: "col g4 grow", children: [_jsx("span", { className: "w7 truncate", children: b.name }), _jsxs("span", { className: "row g8", children: [b.kind === 'group' && _jsxs("span", { className: "chip c-group", children: [t('brand.group'), " \u00B7 ", n] }), _jsx("span", { className: `chip ${b.status === 'archived' ? 'c-archived' : 'c-active'}`, children: t(`status.${b.status}`) })] })] })] }, b.id));
        }) }));
}
/** The section currently in view, to highlight its anchor in the sticky bar (design 26). */
function useActiveSection(deps) {
    const [active, setActive] = useState(null);
    useEffect(() => {
        const els = [...document.querySelectorAll('main section[id]')];
        const io = new IntersectionObserver((entries) => {
            const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (top)
                setActive(top.target.id);
        }, { rootMargin: '-80px 0px -60% 0px' });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps
    return active;
}
