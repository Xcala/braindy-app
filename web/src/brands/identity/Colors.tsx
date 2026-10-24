import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { inkOn, isHex, rgb, useCopy } from './useCopy';

export type Color = { id?: string; hex?: string; name?: string; pantone?: string; chosen?: boolean };

export const brandColors = (colors: Color[]) => {
  const valid = colors.filter((c) => isHex(c.hex));
  return valid.some((c) => c.chosen) ? valid.filter((c) => c.chosen) : valid;
};

export function Colors({ colors }: { colors: Color[] }) {
  const { t } = useI18n();
  const { copied, copy } = useCopy();
  const list = brandColors(colors);
  if (!list.length) return null;

  return (
    <div className="col g24">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((c) => {
          const hex = c.hex!.toUpperCase();
          return (
            <div key={c.id ?? hex} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="swatch" style={{ borderRadius: 0, height: 140, background: hex, borderBottom: inkOn(hex) === '#0B1220' ? '1px solid #E3E7F0' : undefined }} />
              <div className="col g8" style={{ padding: 18 }}>
                <span className="h3">{c.name ?? hex}</span>
                <div className="spec">
                  <span className="k">Hex</span><span className="mono">{hex}</span>
                  <button className="copybtn" onClick={() => copy(hex)} aria-label={`${t('common.copy')} ${hex}`}>
                    <Icon name={copied === hex ? 'check' : 'copy'} size={14} />{copied === hex ? t('common.copied') : t('common.copy')}
                  </button>
                  <span className="k">RGB</span><span className="mono">{rgb(hex).join(' ')}</span><span />
                  {c.pantone && <><span className="k">PMS</span><span className="mono">{c.pantone}</span><span /></>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
