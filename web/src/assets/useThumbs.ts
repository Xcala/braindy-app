import { useEffect, useState } from 'react';
import { signedUrls } from './fileApi';

/** Signed thumbnail URLs for the given image assets, fetched in batches of 60. */
export function useThumbs(brandId: string, ids: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = ids.join(',');

  useEffect(() => {
    let alive = true;
    const missing = key ? key.split(',').filter((id) => !urls[id]) : [];
    if (!missing.length) return;
    (async () => {
      for (let i = 0; i < missing.length; i += 60) {
        try {
          const batch = await signedUrls(brandId, missing.slice(i, i + 60));
          if (alive) setUrls((u) => ({ ...u, ...batch }));
        } catch { /* thumbnails are best-effort */ }
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, key]);

  useEffect(() => { setUrls({}); }, [brandId]);
  return urls;
}
