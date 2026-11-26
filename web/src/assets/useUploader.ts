import { useState } from 'react';
import { upload } from './fileApi';

/** Uploads a batch of files with one shared progress bar. `folder` is where they land (NickMark only; else Uploads). */
export function useUploader(brandId: string) {
  const [progress, setProgress] = useState<number | null>(null);
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');
  async function run(list: FileList | File[] | null, folder?: string) {
    const files = list ? [...list] : [];
    if (!files.length) return false;
    setState('idle');
    try {
      for (const [i, f] of files.entries()) await upload(brandId, f, (p) => setProgress((i + p) / files.length), folder);
      setState('done');
      return true;
    } catch {
      setState('error');
      return false;
    } finally {
      setProgress(null);
    }
  }
  return { progress, state, run };
}
