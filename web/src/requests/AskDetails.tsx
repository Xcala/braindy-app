import { useI18n } from '../i18n/I18nProvider';
import { findCategory } from './taxonomy';
import { AskCard } from './AskCards';
import type { Card } from './types';

export type AskDetailValue = { sub: string; type: string; application: Card; scene: Card; format: string; language: string };

/** Optional detail for "Ask for something": exact piece, where it lives, how it should feel, format and language. */
export function AskDetails({ cat, value, onChange }: { cat: string; value: AskDetailValue; onChange: (v: AskDetailValue) => void }) {
  const { t, lang } = useI18n();
  const category = findCategory(cat);
  const subcat = category?.subs.find((s) => s.id === value.sub);
  const set = (p: Partial<AskDetailValue>) => onChange({ ...value, ...p });
  return (
    <div className="col g16">
      {category && (
        <div className="card col g12">
          <div className="row g8 wrap">
            {category.subs.map((s) => (
              <button key={s.id} aria-pressed={s.id === value.sub} onClick={() => set({ sub: s.id, type: '' })}
                className={`btn btn-sm ${s.id === value.sub ? 'btn-primary' : 'btn-secondary'}`}>{s.label[lang]}</button>
            ))}
          </div>
          {subcat && (
            <div className="row g8 wrap">
              {subcat.types.map((ty) => (
                <button key={ty.en} aria-pressed={value.type === ty[lang]} onClick={() => set({ type: ty[lang] })}
                  className={`chip ${value.type === ty[lang] ? 'c-approved' : 'chip-plain'}`} style={{ cursor: 'pointer', border: 0 }}>{ty[lang]}</button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <AskCard k="application" value={value.application} onChange={(c) => set({ application: c })} />
        <AskCard k="scene" value={value.scene} onChange={(c) => set({ scene: c })} />
      </div>
      <div className="card grid gap-4 md:grid-cols-2">
        <div className="field"><label htmlFor="d2">{t('ask.format')}</label><input className="input" id="d2" value={value.format} placeholder={t('ask.formatPh')} onChange={(e) => set({ format: e.target.value })} /></div>
        <div className="field"><label htmlFor="d3">{t('ask.language')}</label><input className="input" id="d3" value={value.language} onChange={(e) => set({ language: e.target.value })} /></div>
      </div>
    </div>
  );
}
