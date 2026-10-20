import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AuthLayout } from '../components/AuthLayout';
import { Icon } from '../components/Icon';

export function NoAccess() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  return (
    <AuthLayout>
      <div className="col g24 w-full max-w-[440px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px]" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
          <Icon name="unlink" size={30} />
        </div>
        <div className="col g12">
          <h2 className="h1">{t('noaccess.title')}</h2>
          <p className="t-lg t-mute">
            {t('noaccess.signedAs')} <strong style={{ color: 'var(--ink)' }}>{user?.email}</strong>{t('noaccess.noBrand')}
          </p>
        </div>
        <div className="card card-tight col g12" style={{ background: 'var(--niebla)', border: 0 }}>
          <p className="label">{t('noaccess.whatToDo')}</p>
          <p>{t('noaccess.body')}</p>
        </div>
        <div className="row g12 wrap">
          <a className="btn btn-primary" href="mailto:nicolas@braindy.co">{t('login.writeNicolas')}</a>
          <button className="btn btn-secondary" onClick={logout}>{t('noaccess.otherAccount')}</button>
        </div>
      </div>
    </AuthLayout>
  );
}
