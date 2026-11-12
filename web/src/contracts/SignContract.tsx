import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { ContractText } from './ContractText';
import { Gantt } from './Gantt';
import { SignaturePad } from './SignaturePad';
import { Checklist } from './Checklist';
import { apiError, contractsApi } from './api';
import { sha256, withClient } from './text';
import { CLIENT_FIELDS, type ClientField, type Contract } from './types';

/** One step for the legal representative: read, fill in the company, draw and sign. NickMark signed when
 *  sending, so this signature closes the contract. */
export function SignContract({ brandId, contract }: { brandId: string; contract: Contract }) {
  const { t } = useI18n();
  const { brands } = useBrands();
  const { user } = useAuth();
  const email = (user?.email ?? '').toLowerCase();
  const isSigner = email === contract.signer.email;
  const [data, setData] = useState<Record<ClientField, string>>(() => ({ ...Object.fromEntries(CLIENT_FIELDS.map((k) => [k, ''])), razonSocial: brands.find((b) => b.id === brandId)?.name ?? '', representante: contract.signer.name, cargo: t('ctr.f.cargoDefault'), tipoDoc: 'C.C.' }) as Record<ClientField, string>);
  const [signature, setSignature] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = useMemo(() => withClient(contract.sentText ?? '', { ...data, correo: email }), [contract.sentText, data, email]);
  const missing = CLIENT_FIELDS.filter((k) => !data[k].trim());
  const ready = isSigner && !missing.length && signature && consent;

  async function sign() {
    if (!ready || !signature) return;
    setBusy(true); setError(null);
    try {
      await contractsApi.sign(brandId, contract.id, { client: data, signature, consent, textHash: await sha256(text) });
    } catch (e) {
      const { code } = apiError(e);
      setError(t((`ctr.err.${code}` in ERR ? `ctr.err.${code}` : 'ctr.err.error') as StringKey));
    } finally { setBusy(false); }
  }

  return (
    <section className="col g20 min-w-0">
      <div className="stage col g12 rounded-[1.25rem] p-6 sm:p-9">
        <p className="label">{t('ctr.step1')}</p>
        <h1 className="d-lg" style={{ color: '#fff', fontSize: '2.5rem', lineHeight: '44px' }}><span className="w9">{t('ctr.rules1')}</span> {t('ctr.rules2')}</h1>
        <p className="t-lg muted">{t('ctr.rulesSub')}</p>
      </div>

      <div className="card col g12" style={{ padding: '1.375rem', maxHeight: '40rem', overflowY: 'auto' }} tabIndex={0} aria-label={t('ctr.text')}>
        <ContractText text={text} />
        {contract.scope && <><h3 className="w9" style={{ fontSize: '0.9375rem' }}>{t('ctr.annex1')}</h3><ContractText text={contract.scope} /></>}
      </div>
      {contract.schedule && (
        <details className="card col g12" style={{ padding: '1.375rem' }}>
          <summary className="w7" style={{ cursor: 'pointer' }}>{t('ctr.annexes')}</summary>
          <div className="col g16" style={{ marginTop: '0.75rem' }}>
            <Gantt schedule={contract.schedule} />
            <Checklist items={contract.checklist} start={contract.schedule.start} />
          </div>
        </details>
      )}

      {!isSigner ? (
        <div className="card t-sm" role="status" style={{ background: '#EAF0FF', border: 0 }}>{t('ctr.notSigner', { email: contract.signer.email })}</div>
      ) : (
        <div className="card col g16" style={{ padding: '1.375rem' }}>
          <h2 className="h3">{t('ctr.signTitle')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CLIENT_FIELDS.map((k) => (
              <label key={k} className="col g4 t-sm">
                <span className="w7">{t(`ctr.f.${k}` as StringKey)}</span>
                <input className="input" value={data[k]} onChange={(e) => setData({ ...data, [k]: e.target.value })} autoComplete="off" required />
              </label>
            ))}
          </div>
          <SignaturePad label={t('ctr.yourSignature')} onChange={setSignature} />
          <label className="row g8 t-sm" style={{ alignItems: 'flex-start' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: '0.1875rem' }} />
            <span>{t('ctr.consent')}</span>
          </label>
          {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
          <div className="row between g12 wrap">
            <span className="t-xs t-mute">{missing.length ? t('ctr.missing', { n: missing.length }) : t('ctr.legal')}</span>
            <button className="btn btn-primary" disabled={!ready || busy} onClick={sign}>{busy ? t('common.loading') : t('ctr.signBtn')}</button>
          </div>
        </div>
      )}
    </section>
  );
}

const ERR = { 'ctr.err.not_signer': 1, 'ctr.err.text_changed': 1, 'ctr.err.not_signable': 1, 'ctr.err.missing': 1, 'ctr.err.signature': 1 };
