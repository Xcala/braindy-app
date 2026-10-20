import { useAuth } from '../auth/AuthProvider';
import { FullScreenMessage } from '../components/FullScreenMessage';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';

export function NoAccess() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  return (
    <FullScreenMessage title={t('noaccess.title')}>
      <p className="max-w-sm text-sm text-black/60">{t('noaccess.body', { email: user?.email ?? '' })}</p>
      <div className="flex items-center gap-3">
        <LangToggle />
        <button onClick={logout} className="rounded-full border border-black/15 px-4 py-2 text-sm hover:bg-black/5">
          {t('common.signOut')}
        </button>
      </div>
    </FullScreenMessage>
  );
}
