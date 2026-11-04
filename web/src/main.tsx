import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { I18nProvider } from './i18n/I18nProvider';
import { router } from './app/router';
import { installErrorReporting } from './lib/reportError';
import { installExternalLinks } from './lib/externalLinks';
import { applyTheme, readTheme } from './theme/useTheme';
import { installPwa } from './pwa/pwa';
import { PwaBar } from './pwa/PwaBar';
import './tour/tour.css';
import './index.css';

installErrorReporting();
installExternalLinks();
installPwa();
applyTheme(readTheme());
// "System" follows the device even when the account page is not open.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (readTheme() === 'system') applyTheme('system'); });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <PwaBar />
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
);
