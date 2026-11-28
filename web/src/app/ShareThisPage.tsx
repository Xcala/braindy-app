import { useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { usePwa } from '../pwa/pwa';

/** The link to the page being viewed. Brand pages carry ?brand= so the person who opens it lands in the same brand. */
export function pageLink(pathname: string, search: string, brandId?: string | null) {
  const q = new URLSearchParams(search);
  if (brandId && !pathname.startsWith('/admin')) q.set('brand', brandId);
  const s = q.toString();
  return `${location.origin}${pathname}${s ? `?${s}` : ''}${location.hash}`;
}

/**
 * The installed app has no address bar, so this is how to pass on the page you are looking at: the phone's share
 * sheet where there is one (WhatsApp, mail…), otherwise the link is copied. Only shown in the installed app.
 */
export function ShareThisPage() {
  const { t } = useI18n();
  const toast = useToast();
  const { installed } = usePwa();
  const { pathname, search } = useLocation();
  const brand = useBrandsMaybe()?.current?.id;
  if (!installed) return null;

  async function share() {
    const url = pageLink(pathname, search, brand);
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); toast({ text: t('brand.linkCopied') }); } catch { toast({ text: t('toast.copyFailed'), tone: 'bad' }); }
  }

  return (
    <button type="button" className="btn btn-ghost btn-icon" onClick={() => void share()} aria-label={t('app.sharePage')} title={t('app.sharePage')}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
    </button>
  );
}
