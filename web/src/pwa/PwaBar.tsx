import { useI18n } from '../i18n/I18nProvider';
import { applyUpdate, usePwa } from './pwa';
import './pwa.css';

/** Two quiet notices above everything: no connection, and a new version ready to load. */
export function PwaBar() {
  const { t } = useI18n();
  const { offline, update } = usePwa();
  if (!offline && !update) return null;
  return (
    <div className="pwa-bar" role="status" aria-live="polite">
      {offline ? (
        <span className="pwa-pill is-off"><i aria-hidden="true" />{t('pwa.offline')}</span>
      ) : (
        <span className="pwa-pill">{t('pwa.update')}<button type="button" onClick={applyUpdate}>{t('pwa.reload')}</button></span>
      )}
    </div>
  );
}

/** iPhone and iPad have no install button: the two taps that add Braindy to the home screen. */
export function IosSteps() {
  const { t } = useI18n();
  const share = <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>;
  return (
    <ol className="pwa-steps">
      <li><span className="pwa-n">1</span><span>{t('pwa.ios1')} <b className="pwa-ico">{share}</b></span></li>
      <li><span className="pwa-n">2</span><span>{t('pwa.ios2')}</span></li>
    </ol>
  );
}
