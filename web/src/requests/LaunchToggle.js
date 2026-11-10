import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { setLaunch } from '../studio/Launches';
import { SuggestInput } from '../components/SuggestInput';
/** NickMark's switch: show this approved work to every client as a launch beside the studio. Off until he turns it on. */
export function LaunchToggle({ brandId, r }) {
    const { t } = useI18n();
    const brand = useBrandsMaybe()?.brands.find((b) => b.id === brandId)?.name ?? '';
    const [title, setTitle] = useState(r.launch?.title ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const on = !!r.launch;
    async function toggle() {
        if (!r.latestVersion)
            return;
        setBusy(true);
        setError(false);
        try {
            await setLaunch(brandId, r.id, r.launch?.versionId ?? r.latestVersion, !on, title || t('st.launchTitlePh', { brand }));
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "col g8", children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "lt", children: t('st.launchTitle') }), _jsx(SuggestInput, { id: "lt", value: title, disabled: on, onChange: setTitle, suggestion: t('st.launchTitlePh', { brand }), maxLength: 120 })] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-secondary", disabled: busy || !r.latestVersion, onClick: toggle, children: on ? t('st.launchUnmark') : t('st.launchMark') }), on && _jsx("span", { className: "t-sm t-mute", children: t('st.launchOn') })] }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('st.launchErr') })] }));
}
