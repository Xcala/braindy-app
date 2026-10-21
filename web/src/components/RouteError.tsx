import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { reportError } from '../lib/reportError';

/** Shown instead of a blank page when a screen crashes. The error is reported; the person can go on. */
export function RouteError() {
  const err = useRouteError();
  const { t } = useI18n();
  useEffect(() => { reportError(err); }, [err]);
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="card col g12" style={{ maxWidth: 480 }}>
        <img src="/brand/braindy-logo.svg" alt="Braindy" style={{ height: 24, alignSelf: 'flex-start' }} />
        <h1 className="h2">{t('err.title')}</h1>
        <p className="t-mute">{t('err.body')}</p>
        <div className="row g12 wrap">
          <button className="btn btn-primary" onClick={() => location.reload()}>{t('err.reload')}</button>
          <a className="btn btn-secondary" href="/">{t('err.home')}</a>
        </div>
      </div>
    </div>
  );
}
