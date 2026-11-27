import { useState } from 'react';
import type { Brand } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useBilling } from '../billing/useBilling';
import { useBrandLinks } from '../links/useBrandLinks';
import { HostingPlans } from './HostingPlans';
import { BrandPieces } from './BrandPieces';
import { CREDITS } from './hostingData';
import { fmt } from './HostingParts';

const host = (url: string) => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; } };

/**
 * «Mejorar mi plan» (2026-11-26, audit C6): Hosting and the On-Brand AI Studio in one tab, what the brand has first and the
 * catalog under it, opened on request. With a hosting plan the hosting block keeps its own status card (HostingPlans);
 * without one, a card says so and «Ver planes de hosting» opens the plans. The pieces card opens the credits the same way.
 */
export function UpgradeTab({ brand }: { brand: Brand }) {
  const { t, lang } = useI18n();
  const { plan } = useBilling(brand.id);
  const { links } = useBrandLinks(brand.id, 'apps');
  const [plans, setPlans] = useState(false);
  const [credits, setCredits] = useState(false);
  if (plan === undefined) return <p className="t-mute">{t('common.loading')}…</p>;
  const site = links.find((l) => l.kind === 'web') ?? null;
  const hosting = plan?.hosting ?? null;
  const cur = lang === 'es' ? 'cop' : 'usd';

  return (
    <div className="col g24">
      {hosting ? <HostingPlans current={hosting} brandName={brand.name} brandId={brand.id} paid={plan?.hostingStatus === 'active'} billing={plan} /> : (
        <section className="card col g12" aria-labelledby="up-site">
          <div className="row between g8 wrap" style={{ alignItems: 'flex-start' }}>
            <span className="col g4" style={{ minWidth: 0 }}>
              <span className="label">{t('ct.u.site')}</span>
              <span className="h2" id="up-site" style={{ overflowWrap: 'anywhere' }}>{site ? host(site.url) : t('ct.u.noSite')}</span>
            </span>
            <span className="chip c-draft">{t('ct.u.noHosting')}</span>
          </div>
          <p className="t-sm t-mute" style={{ margin: 0 }}>{t('ct.u.noHostingSub')}</p>
          <button type="button" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} aria-expanded={plans} onClick={() => setPlans((x) => !x)}>
            {t(plans ? 'ct.u.hidePlans' : 'ct.u.seePlans')}
          </button>
        </section>
      )}
      {!hosting && plans && <HostingPlans current={null} brandName={brand.name} brandId={brand.id} billing={plan} />}

      <section className="card col g12" aria-labelledby="up-pieces">
        <div className="row between g8 wrap" style={{ alignItems: 'flex-start' }}>
          <span className="col g4" style={{ minWidth: 0 }}>
            <span className="label">{t('ct.u.pieces')}</span>
            <span className="h2" id="up-pieces">{t('ct.u.from', { price: `${fmt(CREDITS[cur], cur)} ${cur.toUpperCase()}` })}</span>
          </span>
        </div>
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t('ct.u.piecesSub')}</p>
        <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} aria-expanded={credits} onClick={() => setCredits((x) => !x)}>
          {t(credits ? 'ct.u.hideCredits' : 'ct.u.seeCredits')}
        </button>
      </section>
      {credits && <BrandPieces brand={brand} />}
    </div>
  );
}
