import { useEffect, useState } from 'react';
import { versionFileUrl } from './api';
/** Signed (or legacy direct) URL for one file of a version. */
export function useFileUrl(brandId, requestId, v, index = 0) {
    const [url, setUrl] = useState(null);
    useEffect(() => {
        setUrl(null);
        if (!v?.files?.[index])
            return;
        const direct = v.files[index].url;
        if (direct) {
            setUrl(direct);
            return;
        }
        let alive = true;
        versionFileUrl(brandId, requestId, v.id, index).then((u) => alive && setUrl(u)).catch(() => undefined);
        return () => { alive = false; };
    }, [brandId, requestId, v?.id, index, v]);
    return url;
}
export const isImage = (ct) => !!ct && ct.startsWith('image/') && !ct.includes('photoshop');
export const isVideo = (ct) => !!ct && ct.startsWith('video/');
