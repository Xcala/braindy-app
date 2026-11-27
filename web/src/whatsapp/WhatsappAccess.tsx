import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { AccessBrand, type Summary } from './AccessBrand';

/**
 * NickMark only: every active brand at a glance, those with the agent on first. A brand's people (and its «3 of 5 with
 * WhatsApp») load only when it is opened: one request per brand opened, none for the whole list.
 */
export function WhatsappAccess() {
  const { t } = useI18n();
  const { brands } = useBrands();
  const [agentOn, setAgentOn] = useState<Set<string>>(new Set());
  const [sum, setSum] = useState<Record<string, Summary>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [help, setHelp] = useState(false);

  // One query for the brands whose agent is on (only those documents come back).
  useEffect(() => {
    getDocs(query(collection(db, 'brands'), where('waAgent.on', '==', true)))
      .then((s) => setAgentOn(new Set(s.docs.map((d) => d.id))), () => undefined);
  }, []);
  const list = useMemo(() => brands.filter((b) => b.status === 'active' && b.kind === 'brand')
    .sort((a, b) => Number(agentOn.has(b.id)) - Number(agentOn.has(a.id)) || a.name.localeCompare(b.name)), [brands, agentOn]);
  const onSummary = useCallback((id: string, s: Summary) => {
    setSum((m) => ({ ...m, [id]: s }));
    setAgentOn((prev) => { const n = new Set(prev); if (s.agent) n.add(id); else n.delete(id); return n; });
  }, []);

  return (
    <section className="col g12" aria-labelledby="h-waa">
      <h2 className="sr-only" id="h-waa">{t('waa.title')}</h2>
      <p className="t-sm t-mute" style={{ margin: 0 }}>
        {t('waa.help')}{' '}
        <button type="button" className="wa-q" aria-expanded={help} aria-label={t('wa.help')} onClick={() => setHelp(!help)}>?</button>
      </p>
      {help && <p className="t-xs t-mute wa-help">{t('waa.agentHint')} {t('waa.hint')}</p>}
      <ul className="wa-list card">
        {list.map((b) => {
          const s = sum[b.id];
          const agent = s ? s.agent : agentOn.has(b.id);
          const line = [s ? (s.on ? t('waa.summary', { n: s.on, m: s.total }) : t('waa.none')) : '', agent ? t('waa.agentOn') : ''].filter(Boolean).join(' · ');
          const isOpen = open === b.id;
          return (
            <li key={b.id} className="wa-row">
              <button type="button" className="wa-head wa-brand" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : b.id)}>
                <span className="col" style={{ minWidth: 0 }}>
                  <span className="wa-name">{b.name}</span>
                  {line && <span className="t-xs t-mute">{line}</span>}
                </span>
                <span className="wa-chev" aria-hidden="true">{isOpen ? '⌄' : '›'}</span>
              </button>
              {isOpen && <AccessBrand brandId={b.id} onSummary={(x) => onSummary(b.id, x)} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
