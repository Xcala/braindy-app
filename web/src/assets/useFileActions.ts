import { useCallback, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { downloadZip, moveFile, removeFile, renameFile, restoreFile, shareLink } from './fileApi';
import type { FileItem } from './fileKinds';

/** A few at a time: each change also updates the folder counts, which should not race too hard. */
async function inBatches(ids: string[], run: (id: string) => Promise<unknown>) {
  let failed = 0;
  for (let i = 0; i < ids.length; i += 4) {
    const r = await Promise.allSettled(ids.slice(i, i + 4).map(run));
    failed += r.filter((x) => x.status === 'rejected').length;
  }
  return failed;
}

/** What the Braindy dialog is asking: send files to the trash, or a new name for one file. */
export type FileAsk = { kind: 'trash'; ids: string[]; name?: string } | { kind: 'rename'; f: FileItem } | null;

/**
 * Files ticked in the explorer and what can be done with them: everyone can download them as a .zip; NickMark can
 * also move them, send them to the trash (with Undo), rename one and copy a 7-day link. Outcomes show as toasts.
 */
export function useFileActions(brandId: string, zipName: string) {
  const { t } = useI18n();
  const toast = useToast();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState<FileAsk>(null);
  // Last box ticked by hand: Shift + click ticks everything between it and the new one.
  const anchor = useRef<string | null>(null);

  /** Ticks for the files in `order` (the page as shown). */
  const selIn = (order: string[]) => ({
    on: (id: string) => picked.has(id),
    toggle: (id: string, range = false) => {
      const from = anchor.current ? order.indexOf(anchor.current) : -1;
      const to = order.indexOf(id);
      anchor.current = id;
      setPicked((p) => {
        const n = new Set(p);
        if (range && from >= 0 && to >= 0) {
          // The range takes the state of the box just clicked, like a file manager.
          const turnOn = !p.has(id);
          for (const x of order.slice(Math.min(from, to), Math.max(from, to) + 1)) if (turnOn) n.add(x); else n.delete(x);
        } else if (n.has(id)) n.delete(id); else n.add(id);
        return n;
      });
    },
  });
  const clear = () => { anchor.current = null; setPicked(new Set()); };
  const done = (failed: number, okText: string, undo?: () => unknown) =>
    toast(failed ? { text: t('files.actionError'), tone: 'bad' } : { text: okText, undo });
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  const trash = (ids: string[]) => run(async () => {
    const failed = await inBatches(ids, (id) => removeFile(brandId, id));
    done(failed, t('files.trashedN', { n: String(ids.length) }), () => run(async () => {
      done(await inBatches(ids, (id) => restoreFile(brandId, id)), t('files.restoredN', { n: String(ids.length) }));
    }));
    clear();
  });
  const move = (ids: string[], folder: string) => run(async () => {
    done(await inBatches(ids, (id) => moveFile(brandId, id, folder)), t('files.moved'));
    clear();
  });
  const zip = (ids: string[]) => run(async () => {
    try { await downloadZip(brandId, ids, zipName); }
    catch (e) { toast({ text: t((e as { status?: number }).status === 413 ? 'files.zipTooBig' : 'files.actionError'), tone: 'bad', ms: 6000 }); }
  });
  const rename = (f: FileItem, title: string) => {
    if (title && title !== f.title) run(async () => { done(await inBatches([f.id], (id) => renameFile(brandId, id, title)), t('files.renamed')); });
  };
  const share = (f: FileItem) => run(async () => {
    try { await navigator.clipboard.writeText((await shareLink(brandId, f.id)).url); toast({ text: t('files.shareDone'), ms: 4000 }); }
    catch { toast({ text: t('files.actionError'), tone: 'bad' }); }
  });
  const closeAsk = useCallback(() => setAsk(null), []);

  return { picked, setPicked, selIn, clear, busy, ask, setAsk, closeAsk, trash, move, zip, rename, share };
}
export type FileActions = ReturnType<typeof useFileActions>;
