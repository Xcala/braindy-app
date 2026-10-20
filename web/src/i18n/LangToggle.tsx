import { useI18n, type Lang } from './I18nProvider';

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang" role="group" aria-label="Language">
      {(['en', 'es'] as Lang[]).map((l) => (
        <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={lang === l ? 'is-on' : ''}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
