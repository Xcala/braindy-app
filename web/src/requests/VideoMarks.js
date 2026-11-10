import { jsx as _jsx } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
/** 75 → «1:15». */
export const clock = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
/** The comments of a video as numbered dots on its timeline; a dot jumps the video to its moment. */
export function VideoMarks({ comments, duration, onSeek }) {
    const { t } = useI18n();
    const marks = comments.filter((c) => typeof c.annotation?.t === 'number');
    if (!duration || !marks.length)
        return null;
    return (_jsx("div", { className: "vm-line", role: "group", "aria-label": t('vm.marks'), children: marks.map((c, i) => {
            const at = c.annotation.t;
            return (_jsx("button", { type: "button", className: `vm-dot${c.resolved ? ' is-done' : ''}`, style: { left: `${Math.min(100, (at / duration) * 100)}%` }, onClick: () => onSeek(at), "aria-label": t('vm.goTo', { t: clock(at) }), title: `${clock(at)} · ${c.text.slice(0, 60)}`, children: i + 1 }, c.id));
        }) }));
}
