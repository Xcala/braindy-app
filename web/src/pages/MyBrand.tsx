import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { Logos } from '../brands/identity/Logos';
import { Colors } from '../brands/identity/Colors';
import { Typography } from '../brands/identity/Typography';
import { Voice } from '../brands/identity/Voice';
import { Section } from '../components/Section';
import { useI18n } from '../i18n/I18nProvider';
import { BrandHeader } from '../brands/BrandHeader';

export function MyBrand() {
  const { current } = useBrands();
  const { t } = useI18n();
  const identity = useBrandDoc(current?.id, 'context/identity');
  const voice = useBrandDoc(current?.id, 'context/voice');

  if (!current) return <p className="text-black/55">{t('brand.none')}</p>;
  const id = identity.data as Record<string, never> | null;
  const loading = identity.loading || voice.loading;
  const empty = !loading && !id && !voice.data;

  return (
    <div>
      <BrandHeader brand={current} />
      {loading && <p className="mt-8 text-black/50">{t('common.loading')}…</p>}
      {empty && <p className="mt-8 text-black/55">{t('brand.empty')}</p>}
      {id?.logos && <Section title={t('brand.logos')}><Logos logos={id.logos} /></Section>}
      {Array.isArray(id?.colors) && <Section title={t('brand.colors')}><Colors colors={id.colors} /></Section>}
      {Array.isArray(id?.typography) && <Section title={t('brand.typography')}><Typography fonts={id.typography} /></Section>}
      {voice.data && <Section title={t('brand.voice')}><Voice voice={voice.data} /></Section>}
    </div>
  );
}
