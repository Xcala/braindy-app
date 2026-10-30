import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NoticeResult } from '../review/NoticeResult';
import { noticesApi } from '../review/api';
import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { brainName } from '../components/BrainStack';
import { markPublished, uploadVersion } from './api';
/** Nicolas's delivery panel: upload a new version (files + reason), publish to the client, mark live. */
export function AdminVersionPanel({ brandId, r }) {
    const { t } = useI18n();
    const input = useRef(null);
    const [files, setFiles] = useState([]);
    const [notes, setNotes] = useState('');
    const [reason, setReason] = useState('');
    const [brain, setBrain] = useState(r.leadBrain);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(false);
    const [notice, setNotice] = useState(null);
    async function deliver() {
        setError(false);
        try {
            setNotice(await uploadVersion(brandId, r.id, files, { notes, reason, brain }, setProgress));
            setFiles([]);
            setNotes('');
            setReason('');
        }
        catch {
            setError(true);
        }
        finally {
            setProgress(null);
        }
    }
    return (_jsxs("section", { className: "card col g16", style: { borderStyle: 'dashed' }, "aria-labelledby": "deliver", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsx("h2", { className: "h3", id: "deliver", children: t('req.deliverTitle', { n: (r.versionCount ?? 0) + 1 }) }), _jsx("span", { className: "chip c-group", children: t('role.admin') })] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("input", { ref: input, type: "file", multiple: true, className: "sr", onChange: (e) => setFiles([...(e.target.files ?? [])]), "aria-label": t('req.pickFiles') }), _jsxs("button", { className: "btn btn-secondary", onClick: () => input.current?.click(), children: [_jsx(Icon, { name: "upload" }), t('req.pickFiles')] }), _jsx("span", { className: "t-sm t-mute", children: files.length ? files.map((f) => f.name).join(', ') : t('req.noFilesPicked') })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "vb", children: t('req.madeByBrain') }), _jsx("select", { id: "vb", className: "input", value: brain, onChange: (e) => setBrain(e.target.value), children: ['researcher', 'marketer', 'creator', 'builder'].map((b) => _jsx("option", { value: b, children: brainName(b) }, b)) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "vn", children: t('req.versionNotes') }), _jsx("input", { id: "vn", className: "input", value: notes, onChange: (e) => setNotes(e.target.value), placeholder: t('req.versionNotesPh') })] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "vr", children: t('req.whyItWorks') }), _jsx("input", { id: "vr", className: "input", value: reason, onChange: (e) => setReason(e.target.value), placeholder: t('req.reasonPh') })] }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('req.deliverError') }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-primary", disabled: !files.length || progress !== null, onClick: deliver, children: progress !== null ? `${Math.round(progress * 100)}%` : t('req.deliver') }), r.status === 'to_approve' && r.latestVersion && _jsx("button", { className: "btn btn-secondary", onClick: async () => setNotice(await noticesApi.sendLink(brandId, r.id, r.latestVersion).catch(() => ({ status: 'error' }))), children: t('rev.sendLink') }), r.status === 'approved' && _jsx("button", { className: "btn btn-secondary", onClick: () => markPublished(brandId, r.id), children: t('req.markLive') }), _jsx("span", { className: "t-sm t-mute", children: t('req.deliverHint') })] }), notice && _jsx(NoticeResult, { notice: notice })] }));
}
