import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';

/** The seven pieces of Primal Branding (Patrick Hanlon): what turns a brand into something people believe in. */
export const PRIMAL_KEYS = ['creationStory', 'creed', 'icons', 'rituals', 'sacredWords', 'nonBelievers', 'leader'] as const;
export type PrimalKey = (typeof PRIMAL_KEYS)[number];
export type PrimalDoc = Partial<Record<PrimalKey, string>>;

export const hasPrimal = (p?: PrimalDoc | null) => !!p && PRIMAL_KEYS.some((k) => (p[k] ?? '').trim());

/** Always first in Essence. Empty, it says NickMark is building it, so the client knows it is coming. */
export function Primal({ primal }: { primal: PrimalDoc | null }) {
  const { t } = useI18n();
  if (!hasPrimal(primal)) {
    return (
      <div className="card col g8" style={{ borderStyle: 'dashed' }}>
        <p className="w7" style={{ margin: 0 }}>{t('primal.emptyTitle')}</p>
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t('primal.empty')}</p>
      </div>
    );
  }
  const pieces = PRIMAL_KEYS.filter((k) => (primal![k] ?? '').trim());
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {pieces.map((k) => (
        <div key={k} className={`card col g12${k === 'creed' ? ' md:col-span-2 xl:col-span-1' : ''}`}>
          <span className="row g8">
            <span className="label" style={{ color: 'var(--azul)' }}>{String(PRIMAL_KEYS.indexOf(k) + 1).padStart(2, '0')}</span>
            <span className="label">{t(`primal.${k}` as StringKey)}</span>
          </span>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t(`primal.${k}Hint` as StringKey)}</p>
          <div className="col g6">{primal![k]!.split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => <p key={i} style={{ margin: 0 }}>{l}</p>)}</div>
        </div>
      ))}
    </div>
  );
}
