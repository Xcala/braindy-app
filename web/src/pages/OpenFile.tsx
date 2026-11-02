import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { signedUrl } from '../assets/fileApi';
import { useI18n } from '../i18n/I18nProvider';

/** Opened in a new tab from a link (never blocked): fetches the short-lived file link and replaces itself with the file. */
export function OpenFile() {
  const { brandId = '', assetId = '' } = useParams();
  const { t } = useI18n();
  const [error, setError] = useState(false);
  useEffect(() => {
    signedUrl(brandId, assetId, true).then((u) => window.location.replace(u)).catch(() => setError(true));
  }, [brandId, assetId]);
  return <p className="t-mute" style={{ padding: 32 }}>{error ? t('files.previewError') : `${t('common.loading')}…`}</p>;
}
