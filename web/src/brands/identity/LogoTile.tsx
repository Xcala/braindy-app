import { useState, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toaster';

// Grounds a viewer cycles through to check a logo: light gray, transparent (checkerboard), dark and white.
const CHECKER = 'repeating-conic-gradient(#D9DDE5 0% 25%, #FFFFFF 0% 50%) 50% / 20px 20px';
const GROUNDS: Array<{ key: 'fog' | 'checker' | 'dark' | 'white'; bg: string; dark?: boolean }> = [
  { key: 'fog', bg: '#CDD1D9' },
  { key: 'checker', bg: CHECKER },
  { key: 'dark', bg: '#111318', dark: true },
  { key: 'white', bg: '#FFFFFF' },
];

/** One logo version: change its ground, copy the image (or its link) and download it. */
export function LogoTile({ url, label }: { url: string; label: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [g, setG] = useState(0);
  const ground = GROUNDS[g];
  const next = GROUNDS[(g + 1) % GROUNDS.length];

  const copy = async () => {
    try {
      const blob = await (await fetch(url)).blob();
      if (blob.type !== 'image/png' || !('ClipboardItem' in window)) throw new Error('as link');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast({ text: t('brand.imageCopied') });
    } catch {
      try { await navigator.clipboard.writeText(url); toast({ text: t('brand.linkCopied') }); } catch { toast({ text: t('toast.copyFailed'), tone: 'bad' }); }
    }
  };

  const btn: CSSProperties = { width: 34, height: 34, background: ground.dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.75)', color: ground.dark ? '#fff' : 'var(--ink)' };
  return (
    <div className="vcell vtile" style={{ background: ground.bg, border: ground.key === 'white' ? '1px solid #E3E7F0' : undefined }}>
      <img src={url} alt={label} loading="lazy" />
      <button type="button" className="btn btn-ghost btn-icon btn-sm vt-ground" style={btn} onClick={() => setG((x) => (x + 1) % GROUNDS.length)}
        aria-label={`${t('brand.changeGround')}: ${t(`brand.ground.${next.key}`)}`} title={`${t('brand.changeGround')}: ${t(`brand.ground.${next.key}`)}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" /></svg>
      </button>
      <span className="vt-actions row g4">
        <button type="button" className="btn btn-ghost btn-icon btn-sm" style={btn} onClick={copy} aria-label={`${t('common.copy')} ${label}`} title={t('common.copy')}><Icon name="copy" size={16} /></button>
        <a className="btn btn-ghost btn-icon btn-sm" style={btn} href={url} target="_blank" rel="noreferrer" download aria-label={`${t('common.download')} ${label}`} title={t('common.download')}><Icon name="download" size={16} /></a>
      </span>
    </div>
  );
}
