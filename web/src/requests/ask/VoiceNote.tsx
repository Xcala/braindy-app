import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { upload } from '../../assets/fileApi';
import type { AttachedFile } from '../types';

const MAX_S = 180;

/** Record instead of typing, like WhatsApp: up to 3 minutes, uploaded as a file that travels with the request. */
export function VoiceNote({ brandId, onAdd, onBusy }: { brandId: string; onAdd: (f: AttachedFile) => void; onBusy: (b: boolean) => void }) {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'rec' | 'up' | 'error'>('idle');
  const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number>(0);
  useEffect(() => () => { window.clearInterval(timer.current); rec.current?.stream.getTracks().forEach((x) => x.stop()); }, []);
  if (typeof window === 'undefined' || !('MediaRecorder' in window) || !navigator.mediaDevices) return null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((x) => x.stop());
        window.clearInterval(timer.current);
        const type = r.mimeType || 'audio/webm';
        const now = new Date();
        const file = new File(chunks, `${t('vn.fileName')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.${type.includes('mp4') ? 'm4a' : 'webm'}`, { type });
        setState('up'); onBusy(true);
        try { onAdd({ assetId: await upload(brandId, file, () => undefined), name: file.name, size: file.size, contentType: type }); setState('idle'); }
        catch { setState('error'); }
        finally { onBusy(false); }
      };
      rec.current = r; r.start(); setSecs(0); setState('rec');
      timer.current = window.setInterval(() => setSecs((s) => { if (s + 1 >= MAX_S) r.stop(); return s + 1; }), 1000);
    } catch { setState('error'); }
  };
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  return state === 'rec' ? (
    <button type="button" className="btn btn-sm" style={{ background: '#FDECEA', color: '#B3261E', border: '1px solid #F5C2BD' }} onClick={() => rec.current?.stop()}>
      <span aria-hidden style={{ width: '0.5rem', height: '0.5rem', borderRadius: '0.25rem', background: '#D93025' }} />{t('vn.stop', { t: mmss })}
    </button>
  ) : (
    <button type="button" className="btn btn-secondary btn-sm" disabled={state === 'up'} onClick={start} title={state === 'error' ? t('vn.error') : undefined}>
      <Icon name="mic" size={16} />{t(state === 'up' ? 'vn.uploading' : state === 'error' ? 'vn.error' : 'vn.record')}
    </button>
  );
}
