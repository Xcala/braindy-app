import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { PROFILES, SECTIONS, profileOf, sectionsOf } from './sections';
export const SECTION_LABEL = {
    brand: 'nav.brand', requests: 'nav.requests', files: 'nav.assets', apps: 'nav.apps', research: 'nav.research',
    results: 'nav.report', learn: 'cr.nav', accesses: 'nav.accesses', billing: 'perm.billing',
};
/** What a profile means for the member doc: "all" is an owner, "team" a member with the default, "view" a picked list. */
export function profilePatch(p) {
    return p === 'all' ? { role: 'client_owner', sections: null }
        : p === 'team' ? { role: 'client_member', sections: null }
            : { role: 'client_member', sections: [...PROFILES.view] };
}
/** NickMark only: a profile in one tap, or section by section. Everything saves at once. */
export function MemberAccess({ member, onChange, disabled }) {
    const { t } = useI18n();
    const mine = sectionsOf(member);
    const profile = profileOf(member);
    const toggle = (s) => {
        const next = mine.includes(s) ? mine.filter((x) => x !== s) : [...mine, s];
        onChange({ sections: SECTIONS.filter((x) => next.includes(x)) });
    };
    return (_jsxs("div", { className: "col g8", children: [_jsxs("div", { className: "seg self-start", role: "radiogroup", "aria-label": t('perm.profile'), style: { flexWrap: 'wrap' }, children: [['all', 'team', 'view'].map((p) => (_jsx("button", { type: "button", role: "radio", "aria-checked": profile === p, className: profile === p ? 'is-on' : '', disabled: disabled, title: t(`perm.${p}Hint`), onClick: () => onChange(profilePatch(p)), children: t(`perm.${p}`) }, p))), profile === 'custom' && _jsx("button", { type: "button", role: "radio", "aria-checked": true, className: "is-on", disabled: true, children: t('perm.custom') })] }), _jsx("div", { className: "row g6 wrap", role: "group", "aria-label": t('perm.sections'), children: SECTIONS.map((s) => {
                    const on = mine.includes(s);
                    return (_jsxs("button", { type: "button", "aria-pressed": on, disabled: disabled, onClick: () => toggle(s), className: "t-xs w7", style: { borderRadius: 999, padding: '5px 10px', cursor: 'pointer', border: `1px solid ${on ? 'var(--azul)' : 'var(--line)'}`,
                            background: on ? '#EAF0FF' : '#fff', color: on ? 'var(--azul)' : 'var(--graphite, #6B7280)', textDecoration: on ? 'none' : 'line-through' }, children: [on ? '✓ ' : '', t(SECTION_LABEL[s])] }, s));
                }) })] }));
}
