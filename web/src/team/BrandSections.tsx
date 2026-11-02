import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { SHOW_RESULTS } from '../app/navGroups';
import { SECTION_LABEL } from './MemberAccess';
import { SECTIONS, type Section } from './sections';

/**
 * NickMark only: switch parts of the app on or off for the whole brand, above each person's own sections.
 * A client whose contract ended keeps My brand and Deliveries, without Requests. Home is always open.
 */
export function BrandSections({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const brand = useBrands().brands.find((b) => b.id === brandId);
  const [error, setError] = useState(false);
  const off = brand?.sectionsOff ?? [];
  const shown = SECTIONS.filter((s) => SHOW_RESULTS || s !== 'results');
  const toggle = (s: Section) => {
    setError(false);
    const next = off.includes(s) ? off.filter((x) => x !== s) : [...off, s];
    updateDoc(doc(db, 'brands', brandId), { sectionsOff: SECTIONS.filter((x) => next.includes(x)) }).catch(() => setError(true));
  };
  return (
    <div className="col g8" style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
      <p className="w7" style={{ margin: 0 }}>{t('bsec.title')}</p>
      <p className="t-sm t-mute" style={{ margin: 0 }}>{t('bsec.hint')}</p>
      <div className="row g6 wrap" role="group" aria-label={t('bsec.title')}>
        {shown.map((s) => {
          const on = !off.includes(s);
          return (
            <button key={s} type="button" aria-pressed={on} onClick={() => toggle(s)} className="t-xs w7"
              style={{ borderRadius: 999, padding: '5px 10px', cursor: 'pointer', border: `1px solid ${on ? 'var(--azul)' : 'var(--line)'}`,
                background: on ? 'var(--hielo)' : '#fff', color: on ? 'var(--azul)' : 'var(--graphite)', textDecoration: on ? undefined : 'line-through' }}>
              {on ? '✓ ' : ''}{t(SECTION_LABEL[s])}
            </button>
          );
        })}
      </div>
      {error && <p className="t-sm" role="status" style={{ color: 'var(--danger)', margin: 0 }}>{t('perm.error')}</p>}
    </div>
  );
}
