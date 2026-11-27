import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { InboxGroup } from './InboxGroup';
import { LoadFail } from './LoadFail';
import type { WaGroup } from './useWaInbox';

const FIRST = 10;

/**
 * NickMark only: messages that did not become a request (unknown numbers, a client's greetings), one row per number.
 * Ten numbers show; «See the other N» opens the rest.
 */
export function WhatsappInbox({ groups, total, error, retry }: { groups: WaGroup[] | null; total: number; error: boolean; retry: () => void }) {
  const { t } = useI18n();
  const { brands } = useBrands();
  const [all, setAll] = useState(false);
  const active = brands.filter((b) => b.status === 'active').sort((a, b) => a.name.localeCompare(b.name));

  if (error) return <LoadFail onRetry={retry} />;
  if (!groups) return <div className="skel" style={{ height: '8rem' }} />;
  if (!groups.length) return <p className="t-sm t-mute">{t('wa.empty')}</p>;
  const shown = all ? groups : groups.slice(0, FIRST);
  return (
    <section className="col g8" aria-labelledby="h-wa">
      <h2 className="t-sm t-mute" id="h-wa" style={{ margin: 0, fontWeight: 600 }}>{t('wa.waiting', { n: groups.length, m: total })}</h2>
      <ul className="wa-list card">{shown.map((g) => <InboxGroup key={g.phone} g={g} brands={active} />)}</ul>
      {!all && groups.length > FIRST && (
        <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setAll(true)}>{t('wa.more', { n: groups.length - FIRST })}</button>
      )}
    </section>
  );
}
