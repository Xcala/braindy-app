import { forwardRef, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { upload } from '../assets/fileApi';
import type { AttachedFile } from '../requests/types';

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
  const rec = useRef<Rec | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  useEffect(() => () => rec.current?.abort(), []);
  useEffect(() => { setFiles([]); setText(''); }, [brandId]);

  const send = () => {
    if (busy || uploading || (!text.trim() && !files.length)) return;
    rec.current?.stop();
    onSend(text.trim() || t('help.filesOnly'), files);
    setText(''); setFiles([]);
    const box = (ref as React.RefObject<HTMLTextAreaElement> | null)?.current; if (box) box.style.height = '';
  };

  async function add(list: FileList | null) {
    const chosen = [...(list ?? [])].slice(0, MAX_FILES - files.length);
    if (!chosen.length) return;
    setError(false); setUploading((n) => n + chosen.length);
    await Promise.all(chosen.map(async (f) => {
      try {
        const assetId = await upload(brandId, f, () => undefined);
        setFiles((x) => [...x, { assetId, name: f.name, size: f.size, contentType: f.type || 'application/octet-stream' }]);
      } catch { setError(true); } finally { setUploading((n) => n - 1); }
    }));
  }

  function dictate() {
    const Ctor = SR();
    if (!Ctor) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new Ctor();
    r.lang = lang === 'es' ? 'es-CO' : 'en-US';
    r.interimResults = false; r.continuous = true;
    const base = text ? `${text.trimEnd()} ` : '';
    let said = '';
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i]!.isFinal) said += `${e.results[i]![0]!.transcript} `;
      setText(`${base}${said}`.trimEnd());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  }

  return (
    <form className="help-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
      {(files.length > 0 || uploading > 0 || error) && (
        <div className="help-files">
          {files.map((f) => (
            <span key={f.assetId} className="chip help-file">{f.name}
              <button type="button" aria-label={t('help.fileRemove', { name: f.name })} onClick={() => setFiles((x) => x.filter((y) => y.assetId !== f.assetId))}>×</button>
            </span>
          ))}
          {uploading > 0 && <span className="t-xs t-mute">{t('help.fileUploading')}</span>}
          {error && <span className="t-xs" role="alert" style={{ color: 'var(--rojo, #C62828)' }}>{t('help.fileError')}</span>}
        </div>
      )}
      <textarea ref={ref} className="help-input" rows={1} value={text} maxLength={1500} placeholder={listening ? t('help.listening') : ph ?? t('help.ph')} aria-label={t('help.ph')}
        onChange={(e) => { setText(e.target.value); grow(e.currentTarget); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
      <div className="help-bar">
        <button type="button" className="help-tool" onClick={() => pick.current?.click()} disabled={files.length >= MAX_FILES} aria-label={t('help.attach')} title={t('help.attach')}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <input ref={pick} type="file" multiple hidden onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
        <span className="help-gap" />
        {SR() && (
          <button type="button" className={`help-tool${listening ? ' is-on' : ''}`} onClick={dictate} aria-pressed={listening} aria-label={t(listening ? 'help.dictateStop' : 'help.dictate')} title={t(listening ? 'help.dictateStop' : 'help.dictate')}>
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
