import { useI18n } from '../i18n/I18nProvider';
import { useTheme, type ThemePref } from './useTheme';

/** Light · Dark · System, same pill as the language switch. */
export function ThemeToggle() {
  const { t } = useI18n();
  const { pref, set } = useTheme();
  return (
    <div className="lang" role="group" aria-label={t('theme.title')}>
      {(['light', 'dark', 'system'] as ThemePref[]).map((p) => (
        <button key={p} onClick={() => set(p)} aria-pressed={pref === p} className={pref === p ? 'is-on' : ''}>{t(`theme.${p}`)}</button>
      ))}
    </div>
  );
}
