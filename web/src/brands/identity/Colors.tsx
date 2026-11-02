import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { inkOn, isHex, rgb, useCopy } from './useCopy';
import { cmyk, nearestPantone } from './pantone';

const FIRST = 5;

export type Color = { id?: string; hex?: string; name?: string; pantone?: string; chosen?: boolean };

export const brandColors = (colors: Color[]) => {
  const valid = colors.filter((c) => isHex(c.hex));
  return valid.some((c) => c.chosen) ? valid.filter((c) => c.chosen) : valid;
};

export function Colors({ colors }: { colors: Color[] }) {
  const { t } = useI18n();
  const { copied, copy } = useCopy();
  const [all, setAll] = useState(false);
  const list = brandColors(colors);
  if (!list.length) return null;
  // One row first (the main colors); the rest on request, so the page stays short.
  const shown = all ? list : list.slice(0, FIRST);

  return (
    <div className="col g24">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((c) => {
          const hex = c.hex!.toUpperCase();
          return (
            <div key={c.id ?? hex} className="card flex sm:block" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="swatch w-[84px] flex-none sm:w-auto" style={{ borderRadius: 0, height: 'auto', minHeight: 140, background: hex, borderBottom: inkOn(hex) === '#0B1220' ? '1px solid #E3E7F0' : undefined }} />
              <div className="col g8 min-w-0 grow p-3.5 sm:p-[18px]">
                <span className="h3">{c.name ?? hex}</span>
                <div className="spec">
                  <span className="k">Hex</span><span className="mono">{hex}</span>
                  <button className="copybtn" onClick={() => copy(hex)} aria-label={`${t('common.copy')} ${hex}`}>
                    <Icon name={copied === hex ? 'check' : 'copy'} size={14} />{copied === hex ? t('common.copied') : t('common.copy')}
                  </button>
                  <span className="k">RGB</span><span className="mono">{rgb(hex).join(' ')}</span><span />
                  <span className="k">CMYK</span><span className="mono">{cmyk(rgb(hex)).join(' ')}</span><span />
                  {/* Stored Pantone when the brand book has one; otherwise the nearest Solid Coated, marked as approximate. */}
                  <span className="k">PMS</span>
                  {c.pantone ? <span className="mono">{c.pantone}</span>
                    : <span className="mono" title={t('brand.pantoneApprox')}>≈ {nearestPantone(hex).replace(/^PANTONE /, '')}</span>}
                  <span />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {list.length > FIRST && <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setAll((a) => !a)}>{all ? t('common.showLess') : t('common.showAll', { n: String(list.length) })}</button>}
    </div>
  );
}
