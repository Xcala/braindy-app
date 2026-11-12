import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { Icon } from '../components/Icon';
import { publicShareApi, type PublicBrand } from '../share/api';
import '../share/share.css';

const MAX = 500 * 1024 ** 2;
const kb = (n: number) => (n > 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Upload link (idea from Air): anyone with it sends files to a brand without an account. They land in «Recibidos». */
export function PublicUpload() {
  const { token = '' } = useParams();
  const { t } = useI18n();
  const [brand, setBrand] = useState<PublicBrand | null>(null);
  const [gone, setGone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [sender, setSender] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<{ i: number; p: number } | null>(null);
  const [done, setDone] = useState(0);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { publicShareApi.upload(token).then((r) => setBrand(r.brand), () => setGone(true)); }, [token]);

  const add = (list: FileList | null) => {
    const picked = [...(list ?? [])];
    const big = picked.find((f) => f.size > MAX);
    setError(big ? t('ul.tooBig', { name: big.name }) : '');
    setFiles((cur) => [...cur, ...picked.filter((f) => f.size <= MAX)].slice(0, 50));
  };
  async function send() {
    setError('');
    try {
      for (const [i, f] of files.entries()) {
        setStep({ i, p: 0 });
        await publicShareApi.send(token, f, { sender: sender.trim(), note: note.trim() }, (p) => setStep({ i, p }));
      }
      setDone(files.length); setFiles([]);
    } catch { setError(t('ul.error')); } finally { setStep(null); }
  }

  const shell = (body: ReactNode) => (
    <div className="pub-page">
      <header className="row between g12 pub-head">
        <img src="/brand/braindy-logo.svg" alt="Braindy" style={{ height: '1.5rem' }} />
        <LangToggle />
      </header>
      <main className="pub-main">{body}</main>
    </div>
  );
  if (gone) return shell(<div className="card col g8"><p className="h3">{t('ul.gone')}</p></div>);
  if (!brand) return shell(<div className="skel" style={{ height: '20rem' }} />);

  return shell(
    <div className="card col g20">
      <div className="row g12">
        {brand.logoUrl && <img src={brand.logoUrl} alt="" className="pub-logo" />}
        <h1 className="h2" style={{ margin: 0 }}>{t('ul.pageTitle', { brand: brand.name })}</h1>
      </div>
      {done > 0 && !files.length ? (
        <div className="col g12" role="status">
          <p className="h3 row g8" style={{ margin: 0 }}><Icon name="check" />{t('ul.done')}</p>
          <p className="t-mute">{t('ul.doneLead', { n: done })}</p>
          <button className="btn btn-secondary self-start" onClick={() => setDone(0)}>{t('ul.more')}</button>
        </div>
      ) : (
        <>
          <p className="t-mute">{t('ul.pageLead', { brand: brand.name })}</p>
          <div className={`pub-drop${over ? ' is-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}>
            <Icon name="upload" size={28} />
            <button type="button" className="btn btn-primary" onClick={() => input.current?.click()} disabled={!!step}>{t('ul.pick')}</button>
            <span className="t-sm t-mute">{t('ul.drop')}</span>
            <input ref={input} type="file" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
          </div>
          {files.length > 0 && (
            <ul className="pub-files">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="row between g8">
                  <span className="truncate t-sm">{f.name} <span className="t-mute">· {kb(f.size)}</span></span>
                  {step ? (step.i === i ? <span className="t-xs w7">{Math.round(step.p * 100)}%</span> : step.i > i ? <Icon name="check" size={16} /> : null)
                    : <button className="btn btn-ghost btn-sm" aria-label={`${t('common.cancel')} ${f.name}`} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))}><Icon name="x" size={16} /></button>}
                </li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="col g4"><span className="t-sm w7">{t('ul.name')}</span><input className="input" value={sender} maxLength={60} onChange={(e) => setSender(e.target.value)} autoComplete="name" /></label>
            <label className="col g4"><span className="t-sm w7">{t('ul.note')}</span><input className="input" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} /></label>
          </div>
          {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button className="btn btn-primary self-start" disabled={!files.length || !!step} onClick={send}>
            {step ? t('ul.sending', { i: step.i + 1, n: files.length }) : files.length ? t('ul.send', { n: files.length }) : t('ul.sendEmpty')}
          </button>
        </>
      )}
      <p className="t-xs t-mute">{t('sh.madeBy')}</p>
    </div>,
  );
}
