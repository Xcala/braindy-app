import { useEffect, useMemo, useState } from 'react';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';

/** pageViews/{day}: views keyed "role|device|section|path", brands keyed "brandId|role" (written by the API). */
type Day = { views?: Record<string, number>; brands?: Record<string, number> };
type Split = { total: number; cp: number; cd: number; ap: number; ad: number };
type Row = Split & { key: string };

const DAYS = 30;
const COLS = 'minmax(0,1.6fr) 70px 90px 90px 90px 90px';
const empty = (): Split => ({ total: 0, cp: 0, cd: 0, ap: 0, ad: 0 });

function add(map: Map<string, Split>, key: string, role: string, device: string, n: number) {
  const s = map.get(key) ?? empty();
  const col = `${role === 'admin' ? 'a' : 'c'}${device === 'phone' ? 'p' : 'd'}` as 'cp' | 'cd' | 'ap' | 'ad';
  s[col] += n;
  s.total += n;
  map.set(key, s);
}

const sorted = (m: Map<string, Split>): Row[] => [...m.entries()].map(([key, s]) => ({ key, ...s })).sort((a, b) => b.total - a.total);

function useUsage() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const from = new Date(Date.now() - (DAYS - 1) * 864e5).toISOString().slice(0, 10);
    getDocs(query(collection(db, 'pageViews'), where(documentId(), '>=', from)))
      .then((s) => setDays(s.docs.map((d) => d.data() as Day)))
      .catch(() => setError(true));
  }, []);
  return useMemo(() => {
    if (!days) return { data: null, error };
    const sections = new Map<string, Split>();
    const pages = new Map<string, Split>();
    const brands = new Map<string, { client: number; admin: number }>();
    for (const d of days) {
      for (const [k, n] of Object.entries(d.views ?? {})) {
        const [role, device, section, ...rest] = k.split('|');
        add(sections, section, role, device, n);
        add(pages, rest.join('|'), role, device, n);
      }
      for (const [k, n] of Object.entries(d.brands ?? {})) {
        const [brandId, role] = k.split('|');
        const b = brands.get(brandId) ?? { client: 0, admin: 0 };
        b[role === 'admin' ? 'admin' : 'client'] += n;
        brands.set(brandId, b);
      }
    }
    const bySection = sorted(sections);
    const total = bySection.reduce((a, r) => ({ total: a.total + r.total, cp: a.cp + r.cp, cd: a.cd + r.cd, ap: a.ap + r.ap, ad: a.ad + r.ad }), empty());
    const byBrand = [...brands.entries()].map(([key, b]) => ({ key, ...b })).sort((a, b) => b.client + b.admin - a.client - a.admin);
    return { data: { days: days.length, total, bySection, byPage: sorted(pages).slice(0, 40), byBrand }, error };
  }, [days, error]);
}

/** Section keys as people say them (the counts store the short key). */
const SECTION_NAME: Record<string, [string, string]> = {
  home: ['Inicio', 'Home'], brand: ['Mi marca', 'My brand'], requests: ['Pedidos', 'Requests'], files: ['Archivos y entregas', 'Files and deliveries'],
  apps: ['Sitios y apps', 'Sites and apps'], research: ['Investigación', 'Research'], results: ['Resultados', 'Results'], learn: ['Aprende', 'Learn'],
  accesses: ['Accesos', 'Accesses'], billing: ['Plan y pagos', 'Plan and billing'], admin: ['Admin', 'Admin'], account: ['Cuenta', 'Account'],
  settings: ['Ajustes', 'Settings'], resources: ['Recursos', 'Resources'], wishlist: ['Wishlist', 'Wishlist'], onboarding: ['Onboarding', 'Onboarding'],
  team: ['Equipo', 'Team'], alerts: ['Avisos', 'Alerts'], open: ['Archivo abierto', 'Opened file'], conectar: ['Conectar', 'Connect'], ask: ['Pedir', 'Ask'], other: ['Otras', 'Other'],
};

/** Admin · Usage: visits per section and page, phone vs desktop and client vs admin (first-party counts). */
export function AdminUsage() {
  const { t, lang } = useI18n();
  const { brands } = useBrands();
  const name = (key: string, bySection: boolean) => (bySection ? SECTION_NAME[key]?.[lang === 'es' ? 0 : 1] ?? key : key);
  const { data: u, error } = useUsage();
  const pct = (a: number, b: number) => `${b ? Math.round((a / b) * 100) : 0}%`;

  const table = (rows: Row[], bySection = false) => (
    <div className="table overflow-x-auto">
      <div className="trow head label min-w-[36rem]" style={{ gridTemplateColumns: COLS }}>
        <span>{t('pv.c.what')}</span><span>{t('pv.c.total')}</span><span>{t('pv.c.cp')}</span><span>{t('pv.c.cd')}</span><span>{t('pv.c.ap')}</span><span>{t('pv.c.ad')}</span>
      </div>
      {rows.map((r) => (
        <div key={r.key} className="trow min-w-[36rem] t-sm" style={{ gridTemplateColumns: COLS }}>
          <span className="w7 truncate" title={r.key}>{name(r.key, bySection)}</span><span className="w7">{r.total}</span>
          <span>{r.cp}</span><span>{r.cd}</span><span className="t-mute">{r.ap}</span><span className="t-mute">{r.ad}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="col g24">
      <div className="col g8"><p className="label">{t('bill.a.only')}</p><h1 className="h1">{t('pv.nav')}</h1><p className="t-mute">{t('pv.sub')}</p></div>
      {error && <div className="card" role="alert">{t('pv.error')}</div>}
      {!u && !error && <div className="skel" style={{ height: '15rem' }} />}
      {u && (u.total.total === 0 ? <div className="card t-mute">{t('pv.empty')}</div> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card col g4"><span className="t-sm t-mute w7">{t('pv.views')}</span><span className="h1">{u.total.total}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('pv.client')}</span><span className="h1">{pct(u.total.cp + u.total.cd, u.total.total)}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('pv.phone')}</span><span className="h1">{pct(u.total.cp + u.total.ap, u.total.total)}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('pv.days')}</span><span className="h1">{u.days}</span></div>
          </div>
          <section className="col g12"><h2 className="h3">{t('pv.bySection')}</h2>{table(u.bySection, true)}</section>
          <section className="col g12"><h2 className="h3">{t('pv.byPage')}</h2>{table(u.byPage)}</section>
          <section className="card col g8" aria-label={t('pv.byBrand')}>
            <h2 className="h3">{t('pv.byBrand')}</h2>
            {u.byBrand.map((b, i) => (
              <div key={b.key} className="row between g8 t-sm" style={{ borderTop: i ? '1px solid var(--line)' : undefined, paddingTop: i ? 8 : 0 }}>
                <span className="w7 truncate">{b.key === 'none' ? t('pv.noBrand') : brands.find((x) => x.id === b.key)?.name ?? b.key}</span>
                <span className="t-mute">{t('pv.client')}: {b.client} · Admin: {b.admin}</span>
              </div>
            ))}
          </section>
        </>
      ))}
    </div>
  );
}
