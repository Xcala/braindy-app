import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useTilt } from './useTilt';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { CLOSEUP, SEAT_ORDER, SEATS, pct, zoomTo } from './geometry';
import { FocusCard, SEAT_NAME } from './FocusCard';
import { isSimulated, officeState, outfit, studioNow } from './officeHours';
import { brandWork, internalWork } from './internalWork';
import { light, lit, litCloseup } from './light';
import { cityById } from '../brands/cities';
import './studio.css';
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const locale = (lang) => (lang === 'es' ? 'es-CO' : 'en-US');
const fmtTime = (tz) => new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(studioNow());
const fmtDate = (tz, lang) => new Intl.DateTimeFormat(locale(lang), { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' })
    .format(studioNow()).replace(/\.| de/g, '').replace(',', '');
/** Wall clock times and dates, and whether NicoMarca is in the office, refreshed every 20 s. The second clock reads `tz` (Bogotá, or the client's city). */
function useClock(lang, tz = 'America/Bogota') {
    const read = () => ({
        sf: fmtTime('America/Los_Angeles'), bog: fmtTime(tz),
        sfDate: fmtDate('America/Los_Angeles', lang), bogDate: fmtDate(tz, lang), office: officeState(), light: light(),
    });
    const [now, setNow] = useState(read);
    useEffect(() => { setNow(read()); const id = setInterval(() => setNow(read()), 20000); return () => clearInterval(id); }, [lang, tz]);
    return now;
}
/** The studio photo with its live layer: loop video, glowing screens, bubbles, wall clock and zoom into each seat. */
export function Scene({ seats, items, toSignCount, brandView = false, city, brandName, compact = false }) {
    const { t, lang } = useI18n();
    const brands = useBrandsMaybe()?.brands ?? [];
    const brand = (id) => brands.find((b) => b.id === id)?.name ?? '';
    const sceneRef = useRef(null);
    const closeRef = useRef(null);
    const [focused, setFocused] = useState(null);
    const [transform, setTransform] = useState('');
    const [closeOn, setCloseOn] = useState(false);
    const [loopOn, setLoopOn] = useState(false);
    // A client sees their own city on the second clock (its label painted in the photo is covered); NicoMarca sees Bogotá.
    const place = brandView ? cityById(city) : undefined;
    const clock = useClock(lang, place?.tz);
    const [look] = useState(outfit);
    // The Brains work 24/7; NicoMarca only in office hours, so outside them his seat reads "out of the office".
    const office = clock.office;
    const away = office.open ? undefined : {
        back: t('st.back7', { when: office.days === 0 ? t('st.today') : office.days === 1 ? t('st.tomorrow')
                : t('st.onDay', { day: new Intl.DateTimeFormat(locale(lang), { weekday: 'long', timeZone: 'UTC' }).format(office.back) }) }),
        holiday: office.holiday,
    };
    // Nobody is ever idle: without client work, a seat works on Braindy or Revista Level.
    // Out of the office the studio switches to its empty-chair version (photo, loop and close-up), screen off.
    // ...and its light follows the sun in San Francisco (night files where they exist).
    const media = lit(away ? '-away' : look, clock.light);
    const shown = (id) => (id === 'nico' && away ? 'away' : seats[id].state === 'free' ? 'working' : seats[id].state);
    const idle = (id) => (brandView && brandName ? brandWork(id, lang, brandName, studioNow()) : internalWork(id, lang, studioNow()));
    const loopRef = useRef(null);
    const scrollRef = useRef(null);
    // On phones, tilting pans the studio sideways too; paused while zoomed into a seat.
    useTilt(scrollRef, !focused);
    const [seen, setSeen] = useState(false);
    // The 3 MB loop loads only once the scene scrolls into view, and pauses whenever it leaves it.
    useEffect(() => {
        const el = sceneRef.current;
        if (!el || reduce || typeof IntersectionObserver === 'undefined')
            return;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setSeen(true);
                loopRef.current?.play?.().catch(() => { });
            }
            else
                loopRef.current?.pause();
        }, { rootMargin: '200px 0px' });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    // A client sees their own brand only: NicoMarca reviews (never "waiting for your signature"), idle seats read as ready.
    const stateKey = (st) => `st.state.${brandView ? (st === 'toSign' ? 'reviewing' : st === 'free' ? 'ready' : st) : st}`;
    useEffect(() => {
        if (!focused)
            return;
        const place = () => { const el = sceneRef.current; if (el)
            setTransform(zoomTo(focused, el.clientWidth, el.clientHeight)); };
        place();
        setCloseOn(false);
        const v = closeRef.current;
        let timer = 0;
        if (v && !reduce) {
            v.src = `/studio/${litCloseup(CLOSEUP[focused] + (focused === 'nico' ? (officeState().open ? look : '-away') : ''), lit(officeState().open ? look : '-away', light()))}.mp4`;
            v.play?.().catch(() => { });
            timer = window.setTimeout(() => setCloseOn(true), 800);
        }
        addEventListener('resize', place);
        return () => { clearTimeout(timer); removeEventListener('resize', place); };
    }, [focused]);
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape')
            zoomOut(); };
        addEventListener('keydown', onKey);
        return () => removeEventListener('keydown', onKey);
    }, []);
    function zoomOut() {
        setCloseOn(false);
        setTimeout(() => { setFocused(null); setTransform(''); closeRef.current?.pause(); }, 350);
    }
    return (_jsx("div", { ref: scrollRef, className: `sd-scroll ${compact ? 'sd-compact' : ''}`, children: _jsxs("div", { ref: sceneRef, className: `sd-scene ${focused ? 'zoomed' : ''}`, onClick: (e) => { if (focused && !e.target.closest('.sd-focus'))
                zoomOut(); }, children: [_jsxs("div", { className: "sd-cam", style: { transform }, children: [_jsx("img", { src: `/studio/studio${media}.jpg`, alt: t('st.title'), loading: "lazy" }), !reduce && seen && _jsx("video", { ref: loopRef, className: loopOn ? 'on' : '', src: `/studio/loop${media}.mp4`, autoPlay: true, muted: true, loop: true, playsInline: true, "aria-hidden": "true", onPlaying: () => setLoopOn(true) }), SEAT_ORDER.map((id) => {
                            const s = SEATS[id], st = shown(id);
                            return (_jsxs("div", { children: [_jsx("button", { type: "button", className: "sd-hot", "aria-label": `${SEAT_NAME[id]}: ${t(stateKey(st))}`, onClick: () => setFocused(id), style: { ...pct([s.hot[0], s.hot[1]]), width: `${s.hot[2] / 20}%`, height: `${s.hot[3] / 11.16}%` } }), _jsx("div", { className: "sd-glow", style: { ...pct(s.screen), background: `radial-gradient(ellipse, ${s.c}55 0%, ${s.c}00 65%)`, opacity: st === 'away' ? 0 : st === 'toSign' ? 0.9 : 0.5 } })] }, id));
                        }), _jsxs("div", { className: "sd-clock", "aria-label": t('st.clock'), children: [_jsxs("b", { style: { left: '68.4%', top: '7%', width: '6.4%', height: '4.9%' }, children: [_jsx("span", { children: clock.sf }), _jsx("small", { children: clock.sfDate })] }), _jsxs("b", { style: { left: '76.9%', top: '7%', width: '6.4%', height: '4.9%' }, children: [_jsx("span", { children: clock.bog }), _jsx("small", { children: clock.bogDate })] }), place && place.id !== 'bogota' && _jsx("i", { style: { left: '76.9%', top: '5.5%', width: '6.4%', height: '1.6%' }, children: lang === 'es' ? place.es : place.en })] })] }), _jsx("div", { className: "sd-bubbles", children: SEAT_ORDER.map((id) => {
                        const v = seats[id], st = shown(id);
                        return (_jsxs("div", { className: "sd-bubble", style: pct(SEATS[id].bub), children: [_jsxs("div", { className: "who", children: [_jsx("i", { style: { background: st === 'away' ? '#5A6280' : SEATS[id].c } }), SEAT_NAME[id]] }), _jsx("div", { className: "st", children: t(stateKey(st)) }), _jsx("div", { children: st === 'away' ? away?.back : v.now ? (brandView ? v.now.title : `${v.now.title} · ${brand(v.now.brandId)}`) : idle(id)[0] })] }, id));
                    }) }), !brandView && toSignCount > 0 && _jsx("span", { className: "sd-badge", children: t('st.toSign', { n: toSignCount }) }), _jsx("span", { className: "sd-hint", children: t('st.hint') }), isSimulated && (_jsxs("button", { type: "button", className: "sd-sim", onClick: () => { location.href = location.pathname; }, children: [t('st.simulated', { when: new Intl.DateTimeFormat(locale(lang), { timeZone: 'America/Los_Angeles', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(studioNow()) }), " \u00B7 ", _jsx("u", { children: t('st.realTime') })] })), _jsx("video", { ref: closeRef, className: `sd-closeup ${closeOn ? 'on' : ''}`, muted: true, loop: true, playsInline: true, preload: "none", "aria-hidden": "true" }), focused && _jsx(FocusCard, { id: focused, view: seats[focused], open: true, allItems: items, readOnly: brandView, stateLabel: t(stateKey(shown(focused))), away: focused === 'nico' ? away : undefined, idle: idle(focused) }, focused), _jsxs("button", { type: "button", className: "sd-back", onClick: zoomOut, children: ["\u2190 ", t('st.back')] })] }) }));
}
