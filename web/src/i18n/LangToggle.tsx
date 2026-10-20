import { useI18n, type Lang } from './I18nProvider';

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div role="group" aria-label="Language" className="flex rounded-full border border-black/15 p-0.5 text-xs">
      {(['en', 'es'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase ${lang === l ? 'bg-ink text-white' : 'text-black/60 hover:text-ink'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
