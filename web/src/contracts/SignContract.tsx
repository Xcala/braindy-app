import { useEffect, useMemo, useState } from 'react';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { completeVerifyLink, sendVerifyLink } from '../auth/emailLink';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { ContractText } from './ContractText';
import { Gantt } from './Gantt';
import { SignaturePad } from './SignaturePad';
import { Checklist } from './Checklist';
import { apiError, contractsApi } from './api';
import { sha256, withClient } from './text';
import { CLIENT_FIELDS, type ClientField, type Contract } from './types';

const FRESH_MS = 14 * 60 * 1000;

/** Step 1 for the legal representative: read the rules of the game, verify the email, fill in, draw and sign. */
export function SignContract({ brandId, contract }: { brandId: string; contract: Contract }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const email = (user?.email ?? '').toLowerCase();
  const isSigner = email === contract.signer.email;
  const [fresh, setFresh] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [data, setData] = useState<Record<ClientField, string>>(() => ({ ...Object.fromEntries(CLIENT_FIELDS.map((k) => [k, ''])), representante: contract.signer.name, cargo: t('ctr.f.cargoDefault'), tipoDoc: 'C.C.' }) as Record<ClientField, string>);
  const [signature, setSignature] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Back from the emailed link: finish the fresh sign-in, then the page knows it is them.
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, location.href) || !email) return;
    completeVerifyLink(email).then(() => setFresh(true)).catch(() => setError(t('ctr.verifyError')));
  }, [email, t]);
  useEffect(() => {
    const check = () => auth.currentUser?.getIdTokenResult().then((r) => setFresh(Date.now() - Date.parse(r.authTime) < FRESH_MS));
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  const text = useMemo(() => withClient(contract.sentText ?? '', { ...data, correo: email }), [contract.sentText, data, email]);
  const missing = CLIENT_FIELDS.filter((k) => !data[k].trim());
  const ready = isSigner && fresh && !missing.length && signature && consent;

  async function sign() {
    if (!ready || !signature) return;
    setBusy(true); setError(null);
    try {
      await contractsApi.sign(brandId, contract.id, { client: data, signature, consent, textHash: await sha256(text) });
    } catch (e) {
      const { code } = apiError(e);
      if (code === 'verify_email') setFresh(false);
      setError(t((`ctr.err.${code}` in ERR ? `ctr.err.${code}` : 'ctr.err.error') as StringKey));
    } finally { setBusy(false); }
  }

  return (
    <section className="col g20 min-w-0">
      <div className="stage col g12 rounded-[20px] p-6 sm:p-9">
        <p className="label">{t('ctr.step1')}</p>
        <h1 className="d-lg" style={{ color: '#fff', fontSize: 40, lineHeight: '44px' }}><span className="w9">{t('ctr.rules1')}</span> {t('ctr.rules2')}</h1>
        <p className="t-lg muted">{t('ctr.rulesSub')}</p>
      </div>

      <div className="card col g12" style={{ padding: 22 }}>
        <h2 className="h3">{t('ctr.schedule')}</h2>
        <Gantt schedule={contract.schedule} />
      </div>
      <div className="card col g12" style={{ padding: 22 }}>
        <h2 className="h3">{t('ctr.checklist')}</h2>
        <p className="t-sm t-mute">{t('ctr.checklistSub')}</p>
        <Checklist items={contract.checklist} start={contract.schedule.start} />
      </div>
      <div className="card col g12" style={{ padding: 22, maxHeight: 640, overflowY: 'auto' }} tabIndex={0} aria-label={t('ctr.text')}>
        <ContractText text={text} />
        {contract.scope && <><h3 className="w9" style={{ fontSize: 15 }}>{t('ctr.annex1')}</h3><ContractText text={contract.scope} /></>}
      </div>

      {!isSigner ? (
        <div className="card t-sm" role="status" style={{ background: '#EAF0FF', border: 0 }}>{t('ctr.notSigner', { email: contract.signer.email })}</div>
      ) : (
        <div className="card col g16" style={{ padding: 22 }}>
          <h2 className="h3">{t('ctr.signTitle')}</h2>
          <div className="row between g12 wrap" style={{ background: fresh ? '#E9F7EF' : '#FFF6E5', borderRadius: 12, padding: '10px 14px' }}>
            <span className="t-sm">{fresh ? t('ctr.verified', { email }) : linkSent ? t('ctr.linkSent', { email }) : t('ctr.verifyFirst', { email })}</span>
            {!fresh && <button className="btn btn-secondary btn-sm" onClick={() => sendVerifyLink(email, lang).then(() => setLinkSent(true)).catch(() => setError(t('ctr.verifyError')))}>{linkSent ? t('ctr.resend') : t('ctr.sendLink')}</button>}
          </div>
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
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
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

const ERR = { 'ctr.err.verify_email': 1, 'ctr.err.not_signer': 1, 'ctr.err.text_changed': 1, 'ctr.err.not_signable': 1, 'ctr.err.missing': 1, 'ctr.err.signature': 1 };
