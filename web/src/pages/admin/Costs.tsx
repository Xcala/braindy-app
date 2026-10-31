import { useState } from 'react';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { money } from '../../billing/useBilling';
import { MAX_USD, useCosts } from '../../costs/useCosts';

const thisMonth = () => new Date().toISOString().slice(0, 7);
const lastMonths = (n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); return d.toISOString().slice(0, 7); });
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const mtok = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const BRAND_COLS = 'minmax(0,1.4fr) 100px 64px 92px 80px 92px 64px 92px 100px 92px';
const MODEL_COLS = 'minmax(0,1.3fr) 110px 80px 80px 100px 100px 100px 64px';

/** Admin · AI costs (Brand OS): real cost per brand (Claude Max prorated + Claude API), per piece, against what it pays. */
export function AdminCosts() {
  const { brands } = useBrands();
  const { t, lang } = useI18n();
  const [month, setMonth] = useState(thisMonth());
  const c = useCosts(month);
  const usd = (v: number | null) => money(v === null ? null : Math.round(v * 100) / 100, 'usd', lang);
  const name = (id: string | null, project?: string) => (id ? brands.find((b) => b.id === id)?.name ?? id : t('cost.unassigned', { project: (project ?? '').replace(/^C--Users-Mark-/, '').slice(0, 40) }));

  return (
    <div className="col g24">
      <div className="row between g12 wrap">
        <div className="col g8"><p className="label">{t('bill.a.only')}</p><h1 className="h1">{t('cost.nav')}</h1><p className="t-mute">{t('cost.sub')}</p></div>
        <div className="field" style={{ minWidth: 140 }}>
          <label htmlFor="cost-month">{t('cost.month')}</label>
          <select id="cost-month" className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
            {lastMonths(6).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {!c ? <div className="card t-mute">{t('common.loading')}…</div> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card col g4"><span className="t-sm t-mute w7">{t('cost.total')}</span><span className="h1">{usd(c.real)}</span><span className="t-xs t-mute">{t('cost.totalSub')}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('cost.apiEq')}</span><span className="h1">{usd(c.eq)}</span><span className="t-xs t-mute">{t('cost.apiEqSub')}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('cost.api')}</span><span className="h1">{usd(c.api)}</span><span className="t-xs t-mute">{t('cost.apiSub')}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('cost.tokens')}</span><span className="h1">{mtok(c.tokens)}</span><span className="t-xs t-mute">{t('cost.tokensSub', { cache: String(c.cachePct) })}</span></div>
          </div>

          {c.brands.length === 0 ? <div className="card t-mute">{t('cost.empty')}</div> : (
            <>
              <section className="col g12">
                <h2 className="h3">{t('cost.byBrand')}</h2>
                <div className="table overflow-x-auto">
                  <div className="trow head label min-w-[940px]" style={{ gridTemplateColumns: BRAND_COLS }}>
                    <span>{t('cost.c.brand')}</span><span>{t('cost.c.real')}</span><span>{t('cost.c.share')}</span><span>{t('cost.c.max')}</span><span>{t('cost.c.api')}</span>
                    <span>{t('cost.c.eq')}</span><span>{t('cost.c.pieces')}</span><span>{t('cost.c.perPiece')}</span><span>{t('cost.c.plan')}</span><span>{t('cost.c.margin')}</span>
                  </div>
                  {c.brands.map((b) => {
                    const paysUsd = b.plan?.currency === 'usd' ? b.plan.monthly ?? null : null;
                    return (
                      <div key={b.key} className="trow min-w-[940px] t-sm" style={{ gridTemplateColumns: BRAND_COLS }}>
                        <span className="w7 truncate" title={name(b.brandId, b.project)}>{name(b.brandId, b.project)}</span>
                        <span className="w7">{usd(b.real)}</span>
                        <span className="col g4"><span>{pct(b.share)}</span><span className="costbar" aria-hidden="true"><i style={{ width: pct(b.share) }} /></span></span>
                        <span>{usd(b.max)}</span><span>{usd(b.api)}</span><span className="t-mute">{usd(b.eq)}</span>
                        <span>{b.pieces ?? '—'}</span><span>{b.perPiece === null ? '—' : usd(b.perPiece)}</span>
                        <span>{b.plan?.monthly ? money(b.plan.monthly, b.plan.currency, lang) : '—'}</span>
                        <span style={{ color: paysUsd === null ? undefined : paysUsd - b.real >= 0 ? 'var(--success)' : 'var(--danger)' }}>{paysUsd === null ? '—' : usd(paysUsd - b.real)}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="col g12">
                <h2 className="h3">{t('cost.byModel')}</h2>
                <div className="table overflow-x-auto">
                  <div className="trow head label min-w-[760px]" style={{ gridTemplateColumns: MODEL_COLS }}>
                    <span>{t('cost.c.model')}</span><span>{t('cost.c.source')}</span><span>{t('cost.c.input')}</span><span>{t('cost.c.output')}</span>
                    <span>{t('cost.c.cacheW')}</span><span>{t('cost.c.cacheR')}</span><span>{t('cost.c.eq')}</span><span>{t('cost.c.share')}</span>
                  </div>
                  {c.models.map((m) => (
                    <div key={m.key} className="trow min-w-[760px] t-sm" style={{ gridTemplateColumns: MODEL_COLS }}>
                      <span className="w7 truncate">{m.model}</span><span>{t(m.source === 'api' ? 'cost.src.api' : 'cost.src.session')}</span>
                      <span>{mtok(m.input)}</span><span>{mtok(m.output)}</span><span>{mtok(m.cacheW)}</span><span>{mtok(m.cacheR)}</span>
                      <span>{usd(m.usd)}</span><span>{pct(m.share)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="card col g8">
            <h2 className="h3">{t('cost.subs')}</h2>
            <p className="t-sm"><b>{usd(MAX_USD)}</b> · {t('cost.subsMax')}</p>
            <p className="t-sm"><b>{usd(45)}</b> · {t('cost.subsMagnific')}</p>
            <p className="t-sm t-mute">{t('cost.subsHiggs')}</p>
            <p className="t-sm t-mute"><b>{usd(543.2)}</b> · {t('cost.subsFixed')}</p>
            <p className="t-xs t-mute">{t('cost.note')}</p>
          </section>
        </>
      )}
    </div>
  );
}
