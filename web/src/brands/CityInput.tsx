import { useEffect, useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { cityById, type CityPlace } from './cities';
import type { Brand } from './BrandProvider';

type Hit = CityPlace & { region: string };

/** Admin › Brands: type any city, pick it from the search, and the brand gets its name, country and time zone. */
export function CityInput({ brand }: { brand: Brand }) {
  const { t, lang } = useI18n();
  const current = cityById(brand.city);
  const label = current ? (lang === 'es' ? current.es : current.en) : '';
  const [q, setQ] = useState(label);
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const typed = useRef(false);
  useEffect(() => { if (!typed.current) setQ(label); }, [label]);
  useEffect(() => {
    if (!typed.current || q.trim().length < 2) { setHits([]); return; }
    const id = setTimeout(() => {
      api<{ cities: Hit[] }>(`/v1/admin/geo/cities?${new URLSearchParams({ q, lang })}`).then((r) => { setHits(r.cities); setActive(0); setOpen(true); }).catch(() => setHits([]));
    }, 300);
    return () => clearTimeout(id);
  }, [q, lang]);

  const pick = (h: Hit | null) => {
    typed.current = false; setOpen(false); setHits([]);
    setQ(h ? h.name : '');
    updateDoc(doc(db, 'brands', brand.id), { city: h ? { name: h.name, country: h.country, tz: h.tz } : null });
  };
  return (
    <span className="relative block" style={{ minWidth: '10rem' }}>
      <input className="input" style={{ height: '2.125rem', padding: '0 0.625rem' }} value={q} placeholder={t('admin.brands.noCity')}
        aria-label={`${t('admin.brands.colCity')} ${brand.name}`} role="combobox" aria-expanded={open && hits.length > 0} aria-autocomplete="list"
        onChange={(e) => { typed.current = true; setQ(e.target.value); if (!e.target.value) pick(null); }}
        onBlur={() => setTimeout(() => { setOpen(false); if (typed.current) { typed.current = false; setQ(label); } }, 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); pick(hits[active]); }
          else if (e.key === 'Escape') setOpen(false);
        }} />
      {open && hits.length > 0 && (
        <ul role="listbox" className="card absolute z-30 col" style={{ top: '2.375rem', left: 0, minWidth: '16.25rem', padding: '0.375rem', gap: 2 }}>
          {hits.map((h, i) => (
            <li key={`${h.name}-${h.region}-${h.country}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(h); }} onMouseEnter={() => setActive(i)}
              className="col" style={{ padding: '0.375rem 0.5rem', borderRadius: '0.5rem', cursor: 'pointer', background: i === active ? 'var(--hielo)' : 'transparent' }}>
              <span className="t-sm w7">{h.name}</span>
              <span className="t-xs t-mute">{[h.region, h.country].filter(Boolean).join(', ')} · {h.tz}</span>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
