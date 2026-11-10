import { useCallback, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { downloadZip, moveFile, removeFile, renameFile, renameFolder, restoreFile, shareLink, trashFolder } from './fileApi';
/** A few at a time: each change also updates the folder counts, which should not race too hard. */
async function inBatches(ids, run) {
    let failed = 0;
    for (let i = 0; i < ids.length; i += 4) {
        const r = await Promise.allSettled(ids.slice(i, i + 4).map(run));
        failed += r.filter((x) => x.status === 'rejected').length;
    }
    return failed;
}
/**
 * Files ticked in the explorer and what can be done with them: everyone can download them as a .zip; NickMark can
 * also move them, send them to the trash (with Undo), rename one and copy a 7-day link. Outcomes show as toasts.
 */
export function useFileActions(brandId, zipName) {
    const { t } = useI18n();
    const toast = useToast();
    const [picked, setPicked] = useState(new Set());
    const [busy, setBusy] = useState(false);
    const [ask, setAsk] = useState(null);
    // Last box ticked by hand: Shift + click ticks everything between it and the new one.
    const anchor = useRef(null);
    /** Ticks for the files in `order` (the page as shown). */
    const selIn = (order) => ({
        on: (id) => picked.has(id),
        toggle: (id, range = false) => {
            const from = anchor.current ? order.indexOf(anchor.current) : -1;
            const to = order.indexOf(id);
            anchor.current = id;
            setPicked((p) => {
                const n = new Set(p);
                if (range && from >= 0 && to >= 0) {
                    // The range takes the state of the box just clicked, like a file manager.
                    const turnOn = !p.has(id);
                    for (const x of order.slice(Math.min(from, to), Math.max(from, to) + 1))
                        if (turnOn)
                            n.add(x);
                        else
                            n.delete(x);
                }
                else if (n.has(id))
                    n.delete(id);
                else
                    n.add(id);
                return n;
            });
        },
    });
    const clear = () => { anchor.current = null; setPicked(new Set()); };
    const done = (failed, okText, undo) => toast(failed ? { text: t('files.actionError'), tone: 'bad' } : { text: okText, undo });
    const run = async (fn) => { setBusy(true); try {
        await fn();
    }
    finally {
        setBusy(false);
    } };
    const trash = (ids) => run(async () => {
        const failed = await inBatches(ids, (id) => removeFile(brandId, id));
        done(failed, t('files.trashedN', { n: String(ids.length) }), () => run(async () => {
            done(await inBatches(ids, (id) => restoreFile(brandId, id)), t('files.restoredN', { n: String(ids.length) }));
        }));
        clear();
    });
    const move = (ids, folder) => run(async () => {
        done(await inBatches(ids, (id) => moveFile(brandId, id, folder)), t('files.moved'));
        clear();
    });
    const zip = (ids) => run(async () => {
        try {
            await downloadZip(brandId, ids, zipName);
        }
        catch (e) {
            toast({ text: t(e.status === 413 ? 'files.zipTooBig' : 'files.actionError'), tone: 'bad', ms: 6000 });
        }
    });
    const rename = (f, title) => {
        if (title && title !== f.title)
            run(async () => { done(await inBatches([f.id], (id) => renameFile(brandId, id, title)), t('files.renamed')); });
    };
    const share = (f) => run(async () => {
        try {
            await navigator.clipboard.writeText((await shareLink(brandId, f.id)).url);
            toast({ text: t('files.shareDone'), ms: 4000 });
        }
        catch {
            toast({ text: t('files.actionError'), tone: 'bad' });
        }
    });
    const renameDir = (path, name) => {
        if (name && name !== path.split('/').pop())
            run(async () => { done(await renameFolder(brandId, path, name).then(() => 0, () => 1), t('files.renamed')); });
    };
    // Undo puts every file back in its folder.
    const trashDir = (path) => run(async () => {
        const r = await trashFolder(brandId, path).catch(() => null);
        if (!r) {
            done(1, '');
            return;
        }
        done(0, t('files.trashedN', { n: String(r.ids.length) }), () => run(async () => {
            done(await inBatches(r.ids, (id) => restoreFile(brandId, id)), t('files.restoredN', { n: String(r.ids.length) }));
        }));
    });
    const closeAsk = useCallback(() => setAsk(null), []);
    return { picked, setPicked, selIn, clear, busy, ask, setAsk, closeAsk, trash, move, zip, rename, share, renameDir, trashDir };
}
