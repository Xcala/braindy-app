import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

export function Placeholder({ title, phase }: { title: StringKey; phase: number }) {
  const { t } = useI18n();
  return (
    <section>
      <h1 className="text-3xl font-black tracking-tight">{t(title)}</h1>
      <p className="mt-2 text-black/55">{t('common.comingPhase', { n: phase })}</p>
    </section>
  );
}
