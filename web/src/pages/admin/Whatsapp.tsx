import { useSearchParams } from 'react-router';
import { useI18n } from '../../i18n/I18nProvider';
import { WhatsappAccess } from '../../whatsapp/WhatsappAccess';
import { WhatsappInbox } from '../../whatsapp/WhatsappInbox';
import { WhatsappProfileCard } from '../../whatsapp/WhatsappProfileCard';
import { MailChannel } from '../../whatsapp/MailChannel';

/**
 * Admin WhatsApp, in two zones that never mix: Braindy's own channel (status, unknown numbers, business profile),
 * which belongs to no brand, and who may use the channel in each brand.
 */
export function AdminWhatsapp() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const zone = params.get('zona') === 'marcas' ? 'brands' : 'channel';
  const pick = (z: 'channel' | 'brands') => setParams(z === 'brands' ? { zona: 'marcas' } : {}, { replace: true });
  return (
    <div className="col g24">
      <div className="col g8"><p className="label">{t('waa.kicker')}</p><h1 className="h1"><span className="w9">WhatsApp.</span> {t('waa.tagline')}</h1></div>
      <div className="seg" role="tablist" aria-label="WhatsApp">
        <button role="tab" aria-selected={zone === 'channel'} className={zone === 'channel' ? 'is-on' : ''} onClick={() => pick('channel')}>{t('waa.zoneChannel')}</button>
        <button role="tab" aria-selected={zone === 'brands'} className={zone === 'brands' ? 'is-on' : ''} onClick={() => pick('brands')}>{t('waa.zoneBrands')}</button>
      </div>
      {zone === 'channel' ? (
        <>
          <p className="t-sm t-mute" style={{ margin: 0 }}>{t('waa.channelHint')}</p>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <WhatsappInbox />
            <WhatsappProfileCard />
            <MailChannel />
          </div>
        </>
      ) : <WhatsappAccess />}
    </div>
  );
}
