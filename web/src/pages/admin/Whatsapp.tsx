import { useI18n } from '../../i18n/I18nProvider';
import { WhatsappAccess } from '../../whatsapp/WhatsappAccess';
import { WhatsappInbox } from '../../whatsapp/WhatsappInbox';
import { WhatsappProfileCard } from '../../whatsapp/WhatsappProfileCard';

/** Admin WhatsApp: who may use the channel per brand, messages from unknown numbers, the business profile. */
export function AdminWhatsapp() {
  const { t } = useI18n();
  return (
    <div className="col g24">
      <div className="col g8"><p className="label">{t('waa.kicker')}</p><h1 className="h1"><span className="w9">WhatsApp.</span> {t('waa.tagline')}</h1></div>
      <WhatsappAccess />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <WhatsappInbox />
        <WhatsappProfileCard />
      </div>
    </div>
  );
}
