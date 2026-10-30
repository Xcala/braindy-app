import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { onboardingApi } from './api';
/** Day 2 · Session with Nicolas (design 17): pick a slot, confirm, add to calendar. */
export function SessionPicker({ brandId, brandName, bookedAt }) {
    const { t, lang } = useI18n();
    const [slots, setSlots] = useState([]);
    const [pick, setPick] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const fmt = (iso) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });
    useEffect(() => { onboardingApi.slots(brandId).then((r) => setSlots(r.slots)).catch(() => setSlots([])); }, [brandId]);
    async function confirm() {
        if (!pick)
            return;
        setBusy(true);
        setError(null);
        try {
            await onboardingApi.book(brandId, pick);
        }
        catch (e) {
            setError(String(e).includes('409') ? t('ob.slotTaken') : t('ob.bookError'));
            onboardingApi.slots(brandId).then((r) => setSlots(r.slots)).catch(() => undefined);
        }
        finally {
            setBusy(false);
        }
    }
    const calUrl = (d) => {
        const s = d.toISOString().replace(/[-:]|\.\d{3}/g, '');
        const e = new Date(d.getTime() + 90 * 60000).toISOString().replace(/[-:]|\.\d{3}/g, '');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Braindy · ${brandName} · Nicolas`)}&dates=${s}/${e}`;
    };
    return (_jsxs("div", { className: "card col g12", style: { padding: 22 }, children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsx("h2", { className: "h3", children: bookedAt ? t('ob.sessionBooked') : t('ob.pickSlot') }), _jsx("span", { className: "t-xs t-mute", children: t('ob.timezone') })] }), bookedAt ? (_jsxs("div", { className: "row g12 wrap", children: [_jsx("span", { className: "w7", children: fmt(bookedAt) }), _jsx("a", { className: "btn btn-secondary btn-sm", href: calUrl(bookedAt), target: "_blank", rel: "noreferrer", children: t('ob.addCalendar') })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3", children: slots.map((s) => (_jsx("button", { className: `btn btn-sm ${pick === s ? 'btn-primary' : 'btn-secondary'}`, style: { justifyContent: 'center' }, "aria-pressed": pick === s, onClick: () => setPick(s), children: fmt(s) }, s))) }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-primary", disabled: !pick || busy, onClick: confirm, children: pick ? t('ob.confirmSlot', { slot: fmt(pick) }) : t('ob.pickFirst') }), _jsx("span", { className: "t-xs t-mute", children: t('ob.videoCall') })] })] })), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: error })] }));
}
