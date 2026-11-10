import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
/** Turns what was typed into an address: «/contacto» stays on this site, «site.co/x» gets https://. */
export function toAddress(typed, base) {
    const v = typed.trim();
    if (!v)
        return null;
    try {
        if (v.startsWith('/'))
            return new URL(v, base).href;
        return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).href;
    }
    catch {
        return null;
    }
}
/** The address box of the site viewer: shows the page the frame is on and takes it to another one (Enter). */
export function AddressBar({ spot, home }) {
    const { t } = useI18n();
    const shown = spot.page.replace(/^https?:\/\//, '');
    const [value, setValue] = useState(shown);
    useEffect(() => setValue(shown), [shown]);
    function submit(e) {
        e.preventDefault();
        const url = toAddress(value, spot.page || home);
        if (url)
            spot.go({ url, label: '' });
    }
    return (_jsxs("form", { className: "lview-url", onSubmit: submit, role: "search", "aria-label": t('lv.address'), children: [_jsx("input", { className: "input", value: value, onChange: (e) => setValue(e.target.value), onFocus: (e) => e.currentTarget.select(), "aria-label": t('lv.address'), spellCheck: false, autoCapitalize: "off", autoCorrect: "off", inputMode: "url", enterKeyHint: "go" }), _jsx("button", { type: "button", className: "lview-url-home", onClick: () => spot.go({ url: home, label: '' }), "aria-label": t('lv.home'), title: t('lv.home'), children: "\u2302" })] }));
}
