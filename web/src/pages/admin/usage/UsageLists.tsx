import { useBrands } from '../../../brands/BrandProvider';
import { useI18n } from '../../../i18n/I18nProvider';
import { sectionName } from './names';
import { IN_BAR, type Row, type View } from './useUsage';

/** US3: the two lists that decide (clients only). What they open most on a phone and where it sits; what nobody opened (only reported). */
export function DecideLists({ topPhone, nobody, period }: { topPhone: Row[]; nobody: string[]; period: number }) {
  const { t, lang } = useI18n();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="col g8" aria-label={t('pv.topPhone')}>
        <h2 className="h3">{t('pv.topPhone')}</h2>
        {topPhone.length === 0 ? <p className="t-sm t-mute">{t('pv.noPhone')}</p> : (
          <div className="ast-list">
            {topPhone.map((r, i) => {
              const bar = IN_BAR.has(r.key);
              return (
                <div key={r.key} className="ast-item">
                  <div className="ast-top"><span>{i + 1}. {sectionName(r.key, lang)} · {r.cp}</span>
                    <span className={`ast-chip ${!bar && i < 3 ? 'is-warn' : ''}`}>{t(bar ? 'pv.inBar' : 'pv.inMore')}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className="col g8" aria-label={t('pv.nobody', { d: period })}>
        <h2 className="h3">{t('pv.nobody', { d: period })}</h2>
        {nobody.length === 0 ? <p className="t-sm t-mute">{t('pv.nobodyNone')}</p> : (
          <div className="ast-list">
            {nobody.map((s) => <div key={s} className="ast-item"><span className="w7">{sectionName(s, lang)}</span></div>)}
          </div>
        )}
        <p className="t-xs t-mute">{t('pv.onlyClients')}</p>
      </section>
    </div>
  );
}

/** US4: visits per brand of the chosen group, with a bar; in Clients, active brands nobody opened go last, in red. */
export function BrandList({ rows, view }: { rows: Row[]; view: View }) {
  const { t } = useI18n();
  const { brands } = useBrands();
  const name = (id: string) => (id === 'none' ? t('pv.noBrand') : brands.find((x) => x.id === id)?.name ?? id);
  const zero = view === 'client' ? brands.filter((b) => b.status === 'active' && b.kind === 'brand' && !rows.some((r) => r.key === b.id && r.total > 0)) : [];
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <section className="col g8" aria-label={t('pv.byBrand')}>
      <h2 className="h3">{t('pv.byBrand')} · {t(`pv.ofView.${view}`)}</h2>
      <div className="ast-list">
        {rows.map((r) => (
          <div key={r.key} className="ast-item">
            <div className="ast-top"><span>{name(r.key)}</span><span>{r.total}</span></div>
            <span className="ast-bar" aria-hidden="true"><i style={{ width: `${(r.total / max) * 100}%` }} /></span>
            {view === 'all' && <span className="ast-sub">{t('pv.splitAll', { c: r.c, a: r.a })}</span>}
          </div>
        ))}
        {zero.map((b) => (
          <div key={b.id} className="ast-item">
            <div className="ast-top ast-zero"><span>{b.name}</span><span>0</span></div>
            <span className="ast-sub">{t('pv.zeroBrand')}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
