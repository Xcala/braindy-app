import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBrands } from '../../brands/BrandProvider';
import { useBrandDoc } from '../../brands/useBrandDoc';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { BrainCards } from '../../onboarding/BrainCards';
import { NoticesList } from '../../onboarding/NoticesList';
import { brainsApi } from '../../brains/useBrains';
import { onboardingApi } from '../../onboarding/api';
/** Admin · onboarding queue and "review and sign the Brand Brain" (design 18). */
export function AdminOnboarding() {
    const { brands } = useBrands();
    const { t, lang } = useI18n();
    const inFlight = brands.filter((b) => b.onboarding && b.onboarding.step !== 'live');
    const [sel, setSel] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [startId, setStartId] = useState('');
    useEffect(() => {
        getDocs(query(collection(db, 'sessions'), where('at', '>=', new Date()), orderBy('at'))).then((s) => setSessions(s.docs.map((d) => ({ id: d.id, brandId: d.get('brandId'), at: d.get('at').toDate() })))).catch(() => setSessions([]));
    }, []);
    const selected = inFlight.find((b) => b.id === sel) ?? inFlight[0] ?? null;
    const fmt = (d) => d.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });
    return (_jsxs("div", { className: "grid grid-cols-1 items-start gap-7 lg:grid-cols-[320px_minmax(0,1fr)]", children: [_jsxs("aside", { className: "col g16", children: [_jsxs("div", { className: "card col g8", children: [_jsx("h2", { className: "h3", children: t('ob.a.queue') }), inFlight.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('ob.a.queueEmpty') }), inFlight.map((b) => (_jsxs("button", { onClick: () => setSel(b.id), className: `menu-item text-left ${selected?.id === b.id ? 'is-on' : ''}`, style: { border: 0, cursor: 'pointer', background: selected?.id === b.id ? 'var(--niebla)' : 'none', height: 'auto', padding: '8px 10px' }, children: [_jsx("span", { className: "sel", style: { border: 0, padding: 0, height: 'auto', background: 'none' }, children: _jsx(BrandMark, { brand: b }) }), _jsxs("span", { className: "col", children: [_jsx("span", { className: "w7 t-sm", children: b.name }), _jsx("span", { className: "t-xs t-mute", children: t(`ob.a.step.${b.onboarding.step}`) })] })] }, b.id)))] }), _jsxs("div", { className: "card col g8", children: [_jsx("h2", { className: "h3", children: t('ob.a.sessions') }), sessions.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('ob.a.noSessions') }), sessions.map((s) => _jsxs("div", { className: "row between t-sm", children: [_jsx("span", { children: fmt(s.at) }), _jsx("span", { className: "w7 truncate", children: brands.find((b) => b.id === s.brandId)?.name })] }, s.id))] }), _jsxs("div", { className: "card col g8", children: [_jsx("h2", { className: "h3", children: t('ob.a.start') }), _jsxs("select", { className: "input", value: startId, onChange: (e) => setStartId(e.target.value), "aria-label": t('ob.a.start'), children: [_jsx("option", { value: "", children: t('ob.a.pickBrand') }), brands.filter((b) => !b.onboarding && b.status === 'active').map((b) => _jsx("option", { value: b.id, children: b.name }, b.id))] }), _jsx("button", { className: "btn btn-secondary btn-sm", disabled: !startId, onClick: () => onboardingApi.start(startId).then(() => { setSel(startId); setStartId(''); }), children: t('ob.a.startBtn') })] })] }), selected ? _jsx(SignPanel, { brand: selected }, selected.id) : _jsx("div", { className: "card t-mute", children: t('ob.a.queueEmpty') })] }));
}
function SignPanel({ brand }) {
    const { t } = useI18n();
    const doc = useBrandDoc(brand.id, 'context/brain');
    const [draft, setDraft] = useState(null);
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => { if (doc.data && !draft)
        setDraft(doc.data); }, [doc.data, draft]);
    const step = brand.onboarding.step;
    const run = async (fn, ok) => {
        setBusy(true);
        setMsg(null);
        try {
            await fn();
            setMsg(ok);
        }
        catch {
            setMsg(t('ob.a.error'));
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("section", { className: "col g20", children: [_jsxs("div", { className: "col g8", children: [_jsxs("p", { className: "t-sm t-mute w7", children: [brand.name, " \u00B7 ", t(`ob.a.step.${step}`)] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("h1", { className: "h1", children: t('ob.a.title') }), _jsx("span", { className: "chip c-draft", children: t('ob.namePending') })] })] }), _jsx(NoticesList, { brandId: brand.id }), !draft ? _jsx("div", { className: "card t-mute", children: step === 'brief' ? t('ob.a.briefInProgress') : t('common.loading') }) : (_jsxs(_Fragment, { children: [_jsx(BrainCards, { brain: draft, onChange: setDraft }), _jsxs("div", { className: "card row between g16 wrap", style: { padding: 22 }, children: [_jsxs("div", { className: "row g12", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-12 w-12 rounded-full object-cover" }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "w7", children: t('sig.card') }), _jsx("span", { className: "t-xs t-mute", children: t('ob.a.signNote') })] })] }), _jsxs("div", { className: "row g8 wrap", children: [_jsx("button", { className: "btn btn-secondary", disabled: busy, onClick: () => run(() => onboardingApi.saveBrain(brand.id, draft), t('ob.a.saved')), children: t('ob.a.save') }), (draft.competitors ?? []).some((c) => c.url) && _jsx("button", { className: "btn btn-ghost", disabled: busy, onClick: async () => { setBusy(true); setMsg(t('brains.watching')); try {
                                            await onboardingApi.saveBrain(brand.id, draft);
                                            const r = await brainsApi.watch(brand.id);
                                            const n = (s) => String(r.results.filter((x) => x.status === s).length);
                                            setMsg(t('brains.watchDone', { changed: n('changed'), same: n('unchanged'), first: n('baseline') }));
                                        }
                                        catch {
                                            setMsg(t('brains.error'));
                                        }
                                        finally {
                                            setBusy(false);
                                        } }, children: t('brains.watchNow') }), draft.status !== 'signed'
                                        ? _jsx("button", { className: "btn btn-primary", disabled: busy, onClick: () => run(async () => { await onboardingApi.saveBrain(brand.id, draft); await onboardingApi.sign(brand.id); setDraft({ ...draft, status: 'signed' }); }, t('ob.a.signed')), children: t('ob.a.sign') })
                                        : _jsx("button", { className: "btn btn-primary", disabled: busy, onClick: () => run(() => onboardingApi.live(brand.id), t('ob.a.liveDone')), children: t('ob.a.markLive') })] })] }), msg && _jsx("p", { className: "t-sm", role: "status", children: msg })] }))] }));
}
