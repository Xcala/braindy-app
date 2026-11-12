import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toaster';
import { downloadLogo, loadSvg, type Format, type Tone } from './logoExport';

/** The download button of one logo cell: a menu of formats (PNG with or without the ground, JPG, PDF, and SVG when the logo is one). */
export function LogoDownload({ url, tone, ground, name, label, style, className }: {
  url: string; tone: Tone; ground: string | null; name: string; label: string; style?: CSSProperties; className?: string;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [svg, setSvg] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  useEffect(() => { let on = true; loadSvg(url).then((s) => on && setSvg(!!s)); return () => { on = false; }; }, [url]);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node) && !pop.current?.contains(e.target as Node)) setOpen(null);
    };
    const close = () => setOpen(null);
    window.addEventListener('scroll', close, true);
    document.addEventListener('mousedown', off); document.addEventListener('keydown', off);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', off); window.removeEventListener('scroll', close, true); };
  }, [open]);

  // Without a ground of its own (a transparent tile) the plain PNG already has no background.
  const formats: Format[] = [...(ground ? ['png', 'pngClear'] as Format[] : ['pngClear'] as Format[]), 'jpg', 'pdf', ...(svg ? ['svg'] as Format[] : [])];
  const get = async (f: Format) => {
    setOpen(null); setBusy(true);
    try { await downloadLogo(url, tone, ground, f, name); } catch { toast({ text: t('logoDl.failed'), tone: 'bad' }); } finally { setBusy(false); }
  };

  return (
    <>
      <button ref={box} type="button" className={`btn btn-ghost btn-icon btn-sm ${className ?? ''}`} style={style} disabled={busy}
        aria-haspopup="menu" aria-expanded={!!open} aria-label={`${t('common.download')} ${label}`} title={t('common.download')}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const right = document.documentElement.clientWidth - r.right;
          setOpen((o) => (o ? null : r.bottom + 240 > window.innerHeight ? { bottom: window.innerHeight - r.top + 4, right } : { top: r.bottom + 4, right })); }}>
        <Icon name="download" size={16} />
      </button>
      {open && createPortal(
        <span ref={pop} role="menu" className="fmenu" style={open} aria-label={`${t('common.download')} ${label}`}>
          {formats.map((f) => (
            <button key={f} type="button" role="menuitem" onClick={() => get(f)}>
              <b style={{ minWidth: '2.125rem' }}>{f === 'pngClear' ? 'PNG' : f.toUpperCase()}</b>
              <span className="t-mute">{t(`logoDl.${f}` as StringKey)}</span>
            </button>
          ))}
        </span>, document.body)}
    </>
  );
}
