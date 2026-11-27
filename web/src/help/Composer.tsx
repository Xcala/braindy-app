import { forwardRef, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { upload } from '../assets/fileApi';
import type { AttachedFile } from '../requests/types';
import { markStep } from './firstSteps';
import { filesFrom, hasFiles } from './clipboardFiles';

type Rec = { start: () => void; stop: () => void; abort: () => void; lang: string; interimResults: boolean; continuous: boolean; onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const SR = (): (new () => Rec) | null => {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};
const MAX_FILES = 5;
/** The box grows with the text (up to its max height), like Claude or ChatGPT. */
const grow = (el: HTMLTextAreaElement) => { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; };

/**
 * The chat's message box: write, dictate (the browser turns speech into text, where it can) or attach up to 5 files
 * (photos, PDFs…), uploaded to the brand's Uploads like in «Ask for something». The assistant sees the photos and the
 * files travel with whatever it proposes in that answer.
 */
export const Composer = forwardRef<HTMLTextAreaElement, { brandId: string; busy: boolean; ph?: string; onSend: (text: string, files: AttachedFile[]) => void }>(function Composer({ brandId, busy, ph, onSend }, ref) {
  const { t, lang } = useI18n();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState(false);
  const [listening, setListening] = useState(false);
  const [over, setOver] = useState(false);
  // Small local previews of the photos and videos attached (from the file itself, nothing uploaded twice).
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const clearThumbs = () => setThumbs((m) => { Object.values(m).forEach((u) => URL.revokeObjectURL(u)); return {}; });
  const rec = useRef<Rec | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  useEffect(() => () => rec.current?.abort(), []);
  useEffect(() => { setFiles([]); setText(''); clearThumbs(); }, [brandId]);
  // The «What I can do» cards start a tool here, so the person learns it by using it.
  const dictateRef = useRef<(auto?: boolean) => void>(() => undefined);
  useEffect(() => {
    const attach = () => pick.current?.click();
    const talk = () => (SR() ? dictateRef.current() : attach());
    window.addEventListener('bd-help-attach', attach);
    window.addEventListener('bd-help-dictate', talk);
    // Hands-free mode: listen once and send what was said.
    const once = () => { if (SR()) dictateRef.current(true); };
    window.addEventListener('bd-help-listen', once);
    return () => { window.removeEventListener('bd-help-attach', attach); window.removeEventListener('bd-help-dictate', talk); window.removeEventListener('bd-help-listen', once); };
  }, []);

  const send = () => {
    if (busy || uploading || (!text.trim() && !files.length)) return;
    rec.current?.stop();
    onSend(text.trim() || t('help.filesOnly'), files);
    setText(''); setFiles([]); clearThumbs();
    const box = (ref as React.RefObject<HTMLTextAreaElement> | null)?.current; if (box) box.style.height = '';
  };

  async function add(list: FileList | File[] | null) {
    const chosen = [...(list ?? [])].slice(0, MAX_FILES - files.length);
    if (!chosen.length) return;
    setError(false); setUploading((n) => n + chosen.length);
    await Promise.all(chosen.map(async (f) => {
      try {
        const assetId = await upload(brandId, f, () => undefined);
        setFiles((x) => [...x, { assetId, name: f.name, size: f.size, contentType: f.type || 'application/octet-stream' }]);
        if (/^(image|video)\//.test(f.type)) setThumbs((m) => ({ ...m, [assetId]: URL.createObjectURL(f) }));
        if (f.type.startsWith('image/')) markStep('photo');
      } catch { setError(true); } finally { setUploading((n) => n - 1); }
    }));
  }

  const sendRef = useRef<(said: string) => void>(() => undefined);
  sendRef.current = (said) => { if (busy || uploading) return; onSend(said, files); setText(''); setFiles([]); clearThumbs(); };
  function dictate(auto = false) {
    const Ctor = SR();
    if (!Ctor) return;
    if (listening) { if (!auto) rec.current?.stop(); return; }
    const r = new Ctor();
    r.lang = lang === 'es' ? 'es-CO' : 'en-US';
    r.interimResults = false; r.continuous = !auto;
    const base = text ? `${text.trimEnd()} ` : '';
    let said = '';
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i]!.isFinal) said += `${e.results[i]![0]!.transcript} `;
      setText(`${base}${said}`.trimEnd());
      if (said.trim()) markStep('voice');
    };
    r.onend = () => { setListening(false); if (auto && said.trim()) sendRef.current(`${base}${said}`.trim()); };
    r.onerror = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  }
  dictateRef.current = (auto?: boolean) => dictate(auto === true);

  return (
    <form className={`help-form${over ? ' is-drop' : ''}`} onSubmit={(e) => { e.preventDefault(); send(); }}
      onDragOver={(e) => { if (hasFiles(e.dataTransfer)) { e.preventDefault(); setOver(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false); }}
      onDrop={(e) => { if (!hasFiles(e.dataTransfer)) return; e.preventDefault(); setOver(false); void add(filesFrom(e.dataTransfer, lang)); }}>
      {over && <div className="help-drop" aria-hidden="true">{t('help.dropHere')}</div>}
      {(files.length > 0 || uploading > 0 || error) && (
        <div className="help-files">
          {files.map((f) => (
            <span key={f.assetId} className="chip help-file">
              {thumbs[f.assetId] && (f.contentType.startsWith('video/')
                ? <video className="help-thumb" src={thumbs[f.assetId]} muted playsInline preload="metadata" aria-hidden="true" />
                : <img className="help-thumb" src={thumbs[f.assetId]} alt="" />)}
              <span className="help-fname">{f.name}</span>
              <button type="button" aria-label={t('help.fileRemove', { name: f.name })} onClick={() => setFiles((x) => x.filter((y) => y.assetId !== f.assetId))}>×</button>
            </span>
          ))}
          {uploading > 0 && <span className="t-xs t-mute">{t('help.fileUploading')}</span>}
          {error && <span className="t-xs" role="alert" style={{ color: 'var(--rojo, #C62828)' }}>{t('help.fileError')}</span>}
        </div>
      )}
      <textarea ref={ref} className="help-input" rows={1} value={text} maxLength={1500} placeholder={listening ? t('help.listening') : ph ?? t('help.ph')} aria-label={t('help.ph')}
        onChange={(e) => { setText(e.target.value); grow(e.currentTarget); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        onPaste={(e) => { const got = filesFrom(e.clipboardData, lang); if (got.length) { e.preventDefault(); void add(got); } }} />
      <div className="help-bar">
        <button type="button" className="help-tool" data-tour="help-attach" onClick={() => pick.current?.click()} disabled={files.length >= MAX_FILES} aria-label={t('help.attach')} title={t('help.attach')}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <input ref={pick} type="file" multiple hidden onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
        <span className="help-gap" />
        {SR() && (
          <button type="button" className={`help-tool${listening ? ' is-on' : ''}`} data-tour="help-mic" onClick={() => dictate()} aria-pressed={listening} aria-label={t(listening ? 'help.dictateStop' : 'help.dictate')} title={t(listening ? 'help.dictateStop' : 'help.dictate')}>
            <Icon name="mic" size={20} />
          </button>
        )}
        <button type="submit" className="help-send" disabled={busy || uploading > 0 || (!text.trim() && !files.length)} aria-label={t('help.send')} title={t('help.send')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </button>
      </div>
    </form>
  );
});
