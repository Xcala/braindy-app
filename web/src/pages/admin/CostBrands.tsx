import { Link } from 'react-router';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { money } from '../../billing/useBilling';
import type { BrandCost, Costs } from '../../costs/useCosts';

type Row = BrandCost & { margin: number | null; pays: string | null; pesos: boolean };
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const COLS = 'minmax(170px,1.4fr) 100px 100px 110px 64px 92px 92px 80px 92px 64px';
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Margin of a brand in the period. USD plans: what it paid minus its cost. Peso plans: «—» with a hint (no conversion,
 *  decision CI-A). No plan at all: the cost in red, because nobody is paying it. */
function withMargin(b: BrandCost, months: number, lang: 'en' | 'es'): Row {
  const p = b.plan;
  const pays = p?.monthly ? money(p.monthly, p.currency, lang) : null;
  if (!p) return { ...b, margin: -b.real, pays, pesos: false };
  if (!p.monthly) return { ...b, margin: null, pays, pesos: false };
  if (p.currency && p.currency !== 'usd') return { ...b, margin: null, pays, pesos: true };
  return { ...b, margin: p.monthly * months - b.real, pays, pesos: false };
}

/** Costos IA › By brand (CI2): lowest margin first; phones get two-line rows with the detail on tap, desktop a table
 *  with «Margin» next to «Real cost». Spend with no brand goes apart, so it never reads as one more client. */
export function CostBrands({ c, usd }: { c: Costs; usd: (v: number | null) => string }) {
  const { t, lang } = useI18n();
  const { brands } = useBrands();
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? id;
  const all = c.brands.filter((b) => b.brandId).map((b) => withMargin(b, c.months, lang))
    .sort((a, b) => (a.margin ?? Infinity) - (b.margin ?? Infinity) || b.real - a.real);
  const loose = c.brands.filter((b) => !b.brandId);
  const looseUsd = loose.reduce((n, b) => n + b.real, 0);
  const tone = (m: number | null) => (m === null ? undefined : m >= 0 ? 'cx-pos' : 'cx-neg');
  const marginText = (r: Row) => (r.margin === null ? '—' : `${r.margin >= 0 ? '+' : '−'}${usd(Math.abs(r.margin))}`);
  const hint = (r: Row) => (r.pesos ? t('cost.copHint') : !r.plan ? t('cost.noPlanHint') : undefined);
  const pieces = (n: number | null) => (n === null ? null : n === 1 ? t('cost.onePiece') : t('cost.nPieces', { n }));
  const payLine = (r: Row) => (!r.plan ? t('cost.noPlan') : r.pesos ? t('cost.pesos') : r.pays ? t('cost.pays', { v: r.pays }) : null);
  const link = (r: Row) => <Link to={`/admin/brands?manage=${r.brandId}`} style={{ color: 'inherit' }}>{brandName(r.brandId!)}</Link>;

  return (
    <section className="col g12" aria-labelledby="cb-h">
      <div className="row between g12 wrap"><h2 className="h3" id="cb-h">{t('cost.byBrand')}</h2><span className="t-xs t-mute">{t('cost.lowFirst')}</span></div>

      <div className="card cb-list" style={{ paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
        {all.map((r) => (
          <details key={r.key} className="cb-item">
            <summary>
              <span className="cb-av" aria-hidden="true">{initials(brandName(r.brandId!))}</span>
              <span className="col" style={{ minWidth: 0 }}>
                <span className="cb-name">{brandName(r.brandId!)}</span>
                <span className="t-xs t-mute">{[usd(r.real), payLine(r), pieces(r.pieces)].filter(Boolean).join(' · ')}</span>
              </span>
              <span className={`cb-m ${tone(r.margin) ?? 't-mute'}`} title={hint(r)}>{marginText(r)}</span>
            </summary>
            <dl className="cb-det">
              <div><dt>{t('cost.c.max')}</dt><dd>{usd(r.max)}</dd></div>
              <div><dt>{t('cost.c.api')}</dt><dd>{usd(r.api)}</dd></div>
              <div><dt>{t('cost.c.perPiece')}</dt><dd>{r.perPiece === null ? '—' : usd(r.perPiece)}</dd></div>
              <div><dt>{t('cost.c.share')}</dt><dd>{pct(r.share)}</dd></div>
              <div><dt>{t('cost.c.eq')}</dt><dd>{usd(r.eq)}</dd></div>
              {hint(r) && <p className="t-xs t-mute" style={{ gridColumn: '1 / -1' }}>{hint(r)}</p>}
              <p style={{ gridColumn: '1 / -1' }}>{link(r)}</p>
            </dl>
          </details>
        ))}
      </div>

      <div className="table cost-table cb-table">
        <div className="trow head label min-w-[71.875rem]" style={{ gridTemplateColumns: COLS }}>
          <span className="cost-name">{t('cost.c.brand')}</span><span>{t('cost.c.real')}</span><span>{t('cost.c.margin')}</span><span>{t('cost.c.plan')}</span>
          <span>{t('cost.c.pieces')}</span><span>{t('cost.c.perPiece')}</span><span>{t('cost.c.max')}</span><span>{t('cost.c.api')}</span><span>{t('cost.c.eq')}</span><span>{t('cost.c.share')}</span>
        </div>
        {all.map((r) => (
          <div key={r.key} className="trow min-w-[71.875rem] t-sm" style={{ gridTemplateColumns: COLS }}>
            <span className="w7 cost-name" title={brandName(r.brandId!)}><b>{link(r)}</b></span>
            <span className="w7">{usd(r.real)}</span>
            <span className={`w7 ${tone(r.margin) ?? 't-mute'}`} title={hint(r)}>{marginText(r)}</span>
            <span className={r.plan ? undefined : 't-mute'}>{r.pays ?? (r.plan ? '—' : t('cost.noPlan'))}</span>
            <span>{r.pieces ?? '—'}</span><span>{r.perPiece === null ? '—' : usd(r.perPiece)}</span>
            <span>{usd(r.max)}</span><span>{usd(r.api)}</span><span className="t-mute">{usd(r.eq)}</span>
            <span className="col g4"><span>{pct(r.share)}</span><span className="costbar" aria-hidden="true"><i style={{ width: pct(r.share) }} /></span></span>
          </div>
        ))}
      </div>

      {loose.length > 0 && (
        <details className="card cb-loose">
          <summary className="row between g12" style={{ cursor: 'pointer', listStyle: 'none' }}>
            <span className="col g4"><b>{t('cost.loose', { v: usd(looseUsd) })}</b>
              <span className="t-xs t-mute">{loose.length === 1 ? t('cost.loose1') : t('cost.looseN', { n: loose.length })}</span></span>
            <span className="btn btn-secondary btn-sm" aria-hidden="true">{t('cost.assign')}</span>
          </summary>
          <div className="col g8" style={{ marginTop: '0.75rem' }}>
            <p className="t-sm t-mute">{t('cost.looseHow')}</p>
            {loose.map((b) => (
              <p key={b.key} className="row between g12 t-sm"><span className="truncate">{(b.project ?? '').replace(/^C--Users-Mark-/, '')}</span><b>{usd(b.real)}</b></p>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
