import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { Scan } from '../components/Scan';
const ORDER = ['researcher', 'marketer', 'creator', 'builder'];
/** NickMark only: what each Brain brought to the team meeting before the plan. */
export function TeamNotes({ notes }) {
    const { t } = useI18n();
    return (_jsxs("details", { className: "col g8", style: { borderTop: '1px solid var(--line)', paddingTop: 12 }, children: [_jsxs("summary", { className: "t-sm w7", style: { cursor: 'pointer' }, children: [t('team.notes'), " ", _jsxs("span", { className: "t-xs t-mute", children: ["\u00B7 ", t(notes.ai ? 'brains.proposedAi' : 'brains.proposedBasic')] })] }), _jsx("div", { className: "col g8", style: { marginTop: 10 }, children: ORDER.filter((b) => notes[b]).map((b) => (_jsxs("div", { className: "row g12", style: { alignItems: 'flex-start' }, children: [_jsx("span", { className: `brain b-${b}`, style: { width: 32, height: 32, flex: 'none' }, children: _jsx("img", { src: `/brand/brains/${b}.png`, alt: "" }) }), _jsxs("span", { className: "col", children: [_jsx("span", { className: "t-xs w7", children: brainName(b) }), _jsx(Scan, { text: notes[b], points: true, tone: "ink" })] })] }, b))) })] }));
}
