import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useI18n } from '../../i18n/I18nProvider';
import { WhatsappAccess } from '../../whatsapp/WhatsappAccess';
import { WhatsappInbox } from '../../whatsapp/WhatsappInbox';
import { WhatsappProfileCard } from '../../whatsapp/WhatsappProfileCard';
import { WhatsappStatus } from '../../whatsapp/WhatsappStatus';
import { MailChannel } from '../../whatsapp/MailChannel';
import { groupByPhone, useWaInbox } from '../../whatsapp/useWaInbox';
import '../../whatsapp/whatsapp.css';

type Zone = 'inbox' | 'brands' | 'profile';
const PARAM: Record<Zone, string | null> = { inbox: null, brands: 'marcas', profile: 'perfil' };

/**
 * Admin WhatsApp: a short title, the channel's state in one line, and three tabs: what waits for an answer
 * (one row per number), who uses WhatsApp in each brand, and the profile (with requests by email as a one-line card).
 * The tab lives in ?zona= (none · marcas · perfil); coming back from connecting Gmail (?correo=) opens Perfil.
 */
export function AdminWhatsapp() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [help, setHelp] = useState(false);
  const z = params.get('zona');
  const zone: Zone = z === 'marcas' ? 'brands' : z === 'perfil' || params.get('correo') ? 'profile' : 'inbox';
  const pick = (next: Zone) => setParams(PARAM[next] ? { zona: PARAM[next]! } : {}, { replace: true });
  const { items, error, retry } = useWaInbox();
  const groups = useMemo(() => (items ? groupByPhone(items) : null), [items]);
  const tabs: Array<[Zone, string]> = [
    ['inbox', groups ? `${t('wa.tabInbox')} · ${groups.length}` : t('wa.tabInbox')],
    ['brands', t('waa.zoneBrands')],
    ['profile', t('wa.tabProfile')],
  ];

  return (
    <div className="col g16" style={{ maxWidth: '50rem' }}>
      <div className="col g4">
        <h1 className="h1 row g8" style={{ alignItems: 'center' }}>
          <span className="w9">WhatsApp</span>
          <button type="button" className="wa-q" aria-expanded={help} aria-label={t('wa.help')} onClick={() => setHelp(!help)}>?</button>
        </h1>
        {help && <p className="t-xs t-mute wa-help">{t('wa.helpText')}</p>}
        <WhatsappStatus />
      </div>
      <div className="wa-tabs" role="tablist" aria-label="WhatsApp">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={zone === k} className={zone === k ? 'is-on' : ''} onClick={() => pick(k)}>{label}</button>
        ))}
      </div>
      {zone === 'inbox' && <WhatsappInbox groups={groups} total={items?.length ?? 0} error={error} retry={retry} />}
      {zone === 'brands' && <WhatsappAccess />}
      {zone === 'profile' && (
        <div className="col g16">
          <WhatsappProfileCard />
          <MailChannel />
        </div>
      )}
    </div>
  );
}
