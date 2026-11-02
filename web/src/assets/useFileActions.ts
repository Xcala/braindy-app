import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { downloadZip, moveFile, removeFile, renameFile, shareLink } from './fileApi';
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

/**
 * Files ticked in the explorer and what can be done with them: everyone can download them as a .zip; NickMark can
 * also move them, send them to the trash, rename one and copy a 7-day link. `note` is the last outcome, for a status line.
 */
export function useFileActions(brandId: string, zipName: string) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const sel = {
    on: (id: string) => picked.has(id),
    toggle: (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
  };
  const clear = () => setPicked(new Set());
  const done = (failed: number, okText: string) => setNote(failed ? { ok: false, text: t('files.actionError') } : { ok: true, text: okText });
  const run = async (fn: () => Promise<void>) => { setBusy(true); setNote(null); try { await fn(); } finally { setBusy(false); } };

  const trash = (ids: string[]) => run(async () => {
    done(await inBatches(ids, (id) => removeFile(brandId, id)), t('files.trashedN', { n: String(ids.length) }));
    clear();
  });
  const move = (ids: string[], folder: string) => run(async () => {
    done(await inBatches(ids, (id) => moveFile(brandId, id, folder)), t('files.moved'));
    clear();
  });
  const zip = (ids: string[]) => run(async () => {
    try { await downloadZip(brandId, ids, zipName); }
    catch (e) { setNote({ ok: false, text: t((e as { status?: number }).status === 413 ? 'files.zipTooBig' : 'files.actionError') }); }
  });
  const rename = (f: FileItem) => {
    const title = window.prompt(t('files.renamePrompt'), f.title)?.trim();
    if (title && title !== f.title) run(async () => { done(await inBatches([f.id], (id) => renameFile(brandId, id, title)), t('files.moved')); });
  };
  const share = (f: FileItem) => run(async () => {
    try { await navigator.clipboard.writeText((await shareLink(brandId, f.id)).url); setNote({ ok: true, text: t('files.shareDone') }); }
    catch { setNote({ ok: false, text: t('files.actionError') }); }
  });

  return { picked, setPicked, sel, clear, busy, note, trash, move, zip, rename, share };
}
export type FileActions = ReturnType<typeof useFileActions>;
