import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { useLessons, useObjections } from '../../criterio/useCriterio';
import { LessonEditor, ObjectionEditor } from '../../criterio/Editors';
/** Admin · NickMark Taste: lessons, objection answers, and which objections clients raise most. */
export function AdminCriterio() {
    const { t, lang } = useI18n();
    const lessons = useLessons().list;
    const objections = useObjections().list;
    const [tab, setTab] = useState('lessons');
    const [editL, setEditL] = useState(null);
    const [editO, setEditO] = useState(null);
    const hits = useHits();
    const ranked = objections.filter((o) => hits[o.id]).sort((a, b) => hits[b.id].shown - hits[a.id].shown);
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: t('cra.nav') }), _jsx("h1", { className: "h1", children: _jsxs("span", { className: "w9", children: [t('cra.title'), "."] }) }), _jsx("p", { className: "t-mute", children: t('cra.sub') })] }), _jsxs("section", { className: "card col g12", "aria-labelledby": "h-hits", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h3", id: "h-hits", children: t('cra.hits') }), _jsx("span", { className: "t-sm t-mute", children: t('cra.hitsSub') })] }), ranked.length === 0 ? _jsx("p", { className: "t-sm t-mute", children: t('cra.noHits') }) : ranked.map((o) => (_jsxs("div", { className: "row between g12 wrap t-sm", children: [_jsxs("span", { className: "w7", children: ["\u00AB", o.phrase[lang], "\u00BB"] }), _jsxs("span", { className: "t-mute", children: [hits[o.id].shown, " ", t('cra.shown'), " \u00B7 ", hits[o.id].opened, " ", t('cra.opened'), " \u00B7 ", hits[o.id].sent, " ", t('cra.sent'), " \u00B7 ", t('cra.brandsN', { n: hits[o.id].brands.size })] })] }, o.id)))] }), _jsxs("div", { className: "row between g12 wrap", children: [_jsxs("div", { className: "seg", role: "group", children: [_jsxs("button", { className: tab === 'lessons' ? 'is-on' : '', onClick: () => setTab('lessons'), children: [t('cra.lessons'), " \u00B7 ", lessons.length] }), _jsxs("button", { className: tab === 'objections' ? 'is-on' : '', onClick: () => setTab('objections'), children: [t('cra.objections'), " \u00B7 ", objections.length] })] }), _jsxs("button", { className: "btn btn-primary btn-sm", onClick: () => (tab === 'lessons' ? setEditL('new') : setEditO('new')), children: ["+ ", t('cra.new')] })] }), tab === 'lessons' && (editL ? _jsx(LessonEditor, { l: editL === 'new' ? undefined : editL, onClose: () => setEditL(null) }) : (_jsx("div", { className: "table", children: lessons.map((l) => (_jsxs("div", { className: "trow", style: { gridTemplateColumns: 'minmax(0,1fr) 180px 110px 90px' }, children: [_jsx(Link, { to: `/learn/${l.id}`, className: "w7 truncate", style: { color: 'var(--ink)', textDecoration: 'none' }, children: l.title[lang] }), _jsx("span", { className: "t-sm t-mute truncate", children: t(`cr.area.${l.area}`) }), _jsxs("span", { children: [_jsx("span", { className: `chip ${l.status === 'published' ? 'c-approved' : 'c-draft'}`, children: l.status === 'published' ? t('cra.published') : t('cr.draft') }), l.videoUrl ? ' ▶' : ''] }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => setEditL(l), children: t('cra.edit') })] }, l.id))) }))), tab === 'objections' && (editO ? _jsx(ObjectionEditor, { o: editO === 'new' ? undefined : editO, lessons: lessons, onClose: () => setEditO(null) }) : (_jsx("div", { className: "table", children: objections.map((o) => (_jsxs("div", { className: "trow", style: { gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr) 110px 90px' }, children: [_jsxs("span", { className: "w7 truncate", children: ["\u00AB", o.phrase[lang], "\u00BB"] }), _jsx("span", { className: "t-sm t-mute truncate", children: o.answer[lang] }), _jsx("span", { children: _jsx("span", { className: `chip ${o.status === 'published' ? 'c-approved' : 'c-draft'}`, children: o.status === 'published' ? t('cra.published') : t('cr.draft') }) }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => setEditO(o), children: t('cra.edit') })] }, o.id))) })))] }));
}
function useHits() {
    const [hits, setHits] = useState({});
    useEffect(() => {
        const since = Timestamp.fromMillis(Date.now() - 90 * 864e5);
        getDocs(query(collection(db, 'criterioHits'), where('at', '>=', since))).then((s) => {
            const h = {};
            for (const d of s.docs) {
                const id = String(d.get('objectionId'));
                h[id] ??= { shown: 0, opened: 0, sent: 0, brands: new Set() };
                const out = d.get('outcome');
                if (out in h[id])
                    h[id][out]++;
                h[id].brands.add(String(d.get('brandId')));
            }
            setHits(h);
        }).catch(() => setHits({}));
    }, []);
    return hits;
}
