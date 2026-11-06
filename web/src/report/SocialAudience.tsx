import { useI18n } from '../i18n/I18nProvider';
import type { Audience } from './useSocialStats';

/** A labelled horizontal bar per row; n is the row's share of all followers per ten thousand (as the server stores it). */
function Bars({ title, rows }: { title: string; rows: Array<{ name: string; n: number }> }) {
  const { lang } = useI18n();
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="col g8">
      <p className="label">{title}</p>
      {rows.map((r) => (
        <div key={r.name} className="col g4">
          <div className="row between t-sm"><span>{r.name}</span><span className="t-mute" style={{ fontVariantNumeric: 'tabular-nums' }}>{new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { style: 'percent', maximumFractionDigits: 1 }).format(r.n / 10000)}</span></div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--hielo)' }}><div style={{ width: `${(r.n / max) * 100}%`, height: '100%', borderRadius: 999, background: '#2F4DE0' }} /></div>
        </div>
      ))}
    </div>
  );
}

/** Who follows the brand: country, city, age and gender (Metricool's latest picture, not by period). */
export function SocialAudience({ audience }: { audience: Audience }) {
  const { t } = useI18n();
  const ages = new Map<string, number>();
  const sex = new Map<string, number>();
  for (const r of audience.ageGender) {
    ages.set(r.age, (ages.get(r.age) ?? 0) + r.v);
    sex.set(r.gender, (sex.get(r.gender) ?? 0) + r.v);
  }
  const gender = (g: string) => (g === 'F' ? t('soc.women') : g === 'M' ? t('soc.men') : t('soc.otherG'));
  const blocks = [
    audience.countries.length > 0 && <Bars key="c" title={t('soc.countries')} rows={audience.countries.slice(0, 6)} />,
    audience.cities.length > 0 && <Bars key="ci" title={t('soc.cities')} rows={audience.cities.slice(0, 6)} />,
    ages.size > 0 && <Bars key="a" title={t('soc.ages')} rows={[...ages].sort((a, b) => a[0].localeCompare(b[0])).map(([name, n]) => ({ name, n }))} />,
    sex.size > 0 && <Bars key="g" title={t('soc.gender')} rows={[...sex].map(([g, n]) => ({ name: gender(g), n }))} />,
    ...(['industry', 'function', 'seniority', 'companySize'] as const).map((k) => (audience[k]?.length ?? 0) > 0 && <Bars key={k} title={t(`soc.a.${k}`)} rows={audience[k]!.slice(0, 6)} />),
  ].filter(Boolean);
  if (!blocks.length) return null;
  return (
    <div className="card col g16">
      <div className="col g4"><h3 className="h3">{t('soc.audience')}</h3><p className="t-xs t-mute">{t('soc.audienceSub')}</p></div>
      <div className="grid gap-6 md:grid-cols-2">{blocks}</div>
    </div>
  );
}
