import { useState } from 'react';
import { upload } from './fileApi';
/** Uploads a batch of files with one shared progress bar. `folder` is where they land (NickMark only; else Uploads). */
export function useUploader(brandId) {
    const [progress, setProgress] = useState(null);
    const [state, setState] = useState('idle');
    async function run(list, folder) {
        const files = list ? [...list] : [];
        if (!files.length)
            return;
        setState('idle');
        try {
            for (const [i, f] of files.entries())
                await upload(brandId, f, (p) => setProgress((i + p) / files.length), folder);
            setState('done');
        }
        catch {
            setState('error');
        }
        finally {
            setProgress(null);
        }
    }
    return { progress, state, run };
}
