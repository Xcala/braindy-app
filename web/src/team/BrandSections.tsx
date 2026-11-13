import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { SECTION_LABEL } from './MemberAccess';
import { SECTIONS, type Section } from './sections';

/**
 * NickMark only: switch parts of the app on or off for the whole brand, above each person's own sections.
 * A client whose contract ended keeps My brand and Deliveries, without Requests. Home is always open.
 * Results is the other way round: off unless switched on here (brands/{id}.resultsOn), for brands with data to show.
 */
export function BrandSections({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const brand = useBrands().brands.find((b) => b.id === brandId);
  const [error, setError] = useState(false);
  const off = brand?.sectionsOff ?? [];
  const isOn = (s: Section) => !off.includes(s) && (s !== 'results' || !!brand?.resultsOn);
  const toggle = (s: Section) => {
    setError(false);
    if (s === 'results') {
      updateDoc(doc(db, 'brands', brandId), { resultsOn: !isOn(s), sectionsOff: off.filter((x) => x !== 'results') }).catch(() => setError(true));
      return;
    }
    const next = off.includes(s) ? off.filter((x) => x !== s) : [...off, s];
    updateDoc(doc(db, 'brands', brandId), { sectionsOff: SECTIONS.filter((x) => next.includes(x)) }).catch(() => setError(true));
  };
  return (
    <div className="col g8" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
      <p className="w7" style={{ margin: 0 }}>{t('bsec.title')}</p>
      <p className="t-sm t-mute" style={{ margin: 0 }}>{t('bsec.hint')}</p>
      <div className="row g6 wrap" role="group" aria-label={t('bsec.title')}>
        {SECTIONS.map((s) => {
          const on = isOn(s);
          return (
            <button key={s} type="button" aria-pressed={on} onClick={() => toggle(s)} className="t-xs w7"
              style={{ borderRadius: '62.4375rem', padding: '0.3125rem 0.625rem', cursor: 'pointer', border: `1px solid ${on ? 'var(--azul)' : 'var(--line)'}`,
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
