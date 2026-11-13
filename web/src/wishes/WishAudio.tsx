import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { signedUrl } from '../assets/fileApi';
import type { Wish } from './useWishes';

/** A wish's voice note: the link is asked for only when someone wants to hear it. */
export function WishAudio({ brandId, audio }: { brandId: string; audio: NonNullable<Wish['audio']> }) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  if (url) return <audio className="wl-audio" src={url} controls autoPlay preload="none" />;
  return (
    <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={state === 'loading'}
      onClick={() => { setState('loading'); signedUrl(brandId, audio.assetId, true).then(setUrl, () => setState('error')); }}>
      ▶ {t(state === 'error' ? 'wl.audioError' : 'wl.listen')}
    </button>
  );
}
