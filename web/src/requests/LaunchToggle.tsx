import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { setLaunch } from '../studio/Launches';
import { SuggestInput } from '../components/SuggestInput';
import type { BrandRequest } from './types';

/** NickMark's switch: show this approved work to every client as a launch beside the studio. Off until he turns it on. */
export function LaunchToggle({ brandId, r }: { brandId: string; r: BrandRequest }) {
  const { t } = useI18n();
  const brand = useBrandsMaybe()?.brands.find((b) => b.id === brandId)?.name ?? '';
  const [title, setTitle] = useState(r.launch?.title ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const on = !!r.launch;

  async function toggle() {
    if (!r.latestVersion) return;
    setBusy(true); setError(false);
    try { await setLaunch(brandId, r.id, r.launch?.versionId ?? r.latestVersion, !on, title || t('st.launchTitlePh', { brand })); }
    catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <div className="col g8">
      <div className="field"><label htmlFor="lt">{t('st.launchTitle')}</label>
        <SuggestInput id="lt" value={title} disabled={on} onChange={setTitle} suggestion={t('st.launchTitlePh', { brand })} maxLength={120} /></div>
      <div className="row g12 wrap">
        <button className="btn btn-secondary" disabled={busy || !r.latestVersion} onClick={toggle}>{on ? t('st.launchUnmark') : t('st.launchMark')}</button>
        {on && <span className="t-sm t-mute">{t('st.launchOn')}</span>}
      </div>
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('st.launchErr')}</p>}
    </div>
  );
}
