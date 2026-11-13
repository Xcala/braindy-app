import { useEffect, useState } from 'react';
import { useBrandDoc } from '../../brands/useBrandDoc';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import type { Brand } from '../../brands/BrandProvider';
import { apiError, contractsApi } from '../api';
import type { Contract, Schedule } from '../types';
import { ContractText } from '../ContractText';
import { ContractDownload } from '../ContractDownload';
import { SignaturePad } from '../SignaturePad';
import { TermsForm } from './TermsForm';
import { GanttEditor } from './GanttEditor';
import { ChecklistEditor } from './ChecklistEditor';

/** The terms the one-step form asks for; the rest come filled in under "More conditions". */
const MAIN = ['objeto', 'pago.cuota', 'plazo.meses', 'plazo.inicio'] as const;

/** Admin · the contract of a brand in one step: a few fields, your signature, send. The client's signature closes it. */
export function ContractPanel({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const contractId = brand.onboarding?.contractId ?? null;
  const live = useBrandDoc(brand.id, `contracts/${contractId ?? '-'}`);
  const liveSchedule = useBrandDoc(brand.id, 'context/schedule').data as Schedule | null;
  const [draft, setDraft] = useState<Contract | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const contract = live.data && contractId ? ({ id: contractId, ...live.data } as Contract) : null;
  useEffect(() => { if (contract && (!draft || draft.id !== contract.id || draft.status !== contract.status)) setDraft(contract); }, [contract, draft]);
  useEffect(() => { if (liveSchedule && !schedule) setSchedule(liveSchedule); }, [liveSchedule, schedule]);

  const run = async (fn: () => Promise<unknown>, ok: StringKey) => {
    setBusy(true); setMsg(null); setMissing([]);
    try { await fn(); setMsg(t(ok)); } catch (e) {
      const err = apiError(e);
      setMissing(err.fields);
      const label = (f: string) => (f.startsWith('contratista.') ? t('ctr.contractor') : f === 'signature' ? t('ctr.yourSignature')
        : f === 'signer.email' ? t('ctr.a.signerEmail') : f === 'schedule' ? t('ctr.schedule') : t(`ctr.t.${f}` as StringKey));
      setMsg(err.fields.length ? t('ctr.a.missing', { fields: [...new Set(err.fields.map(label))].join(', ') }) : t('ob.a.error'));
    } finally { setBusy(false); }
  };
  const save = () => contractsApi.save(brand.id, draft!.id, { terms: draft!.terms, scope: draft!.scope, schedule: draft!.schedule, checklist: draft!.checklist, signer: draft!.signer });

  if (!contractId || (!contract && !live.loading)) return null;
  if (!draft) return <div className="card t-mute">{t('common.loading')}</div>;
  const status = draft.status;
  const term = (k: string) => draft.terms[k] ?? '';
  const setTerm = (k: string, v: string) => setDraft({ ...draft, terms: { ...draft.terms, [k]: v } });
  const bad = (k: string) => (missing.includes(k) ? { borderColor: 'var(--danger)' } : undefined);
  const field = (k: string, label: string, input: React.ReactNode) => <label key={k} className="col g4 t-sm"><span className="w7">{label}</span>{input}</label>;

  return (
    <section className="col g16">
      <div className="card col g16" style={{ padding: '1.375rem' }}>
        <div className="row between g8 wrap">
          <h2 className="h3">{t('ctr.a.title')}</h2>
          <span className="chip">{t(`ctr.status.${status}` as StringKey)}</span>
        </div>

        {status === 'draft' && (
          <>
            <p className="t-sm t-mute">{t('ctr.a.createSub')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {field('signer.name', t('ctr.a.signerName'), <input className="input" value={draft.signer.name} onChange={(e) => setDraft({ ...draft, signer: { ...draft.signer, name: e.target.value } })} />)}
              {field('signer.email', t('ctr.a.signerEmail'), <input className="input" type="email" value={draft.signer.email} style={bad('signer.email')} onChange={(e) => setDraft({ ...draft, signer: { ...draft.signer, email: e.target.value } })} />)}
              {field('pago.cuota', t('ctr.t.pago.cuota'), <input className="input" inputMode="numeric" placeholder="6.250.000" value={term('pago.cuota')} style={bad('pago.cuota')} onChange={(e) => setTerm('pago.cuota', e.target.value)} />)}
              {field('plazo.meses', t('ctr.t.plazo.meses'), <input className="input" type="number" min={1} max={36} value={term('plazo.meses')} style={bad('plazo.meses')} onChange={(e) => setTerm('plazo.meses', e.target.value)} />)}
              {field('plazo.inicio', t('ctr.t.plazo.inicio'), <input className="input" type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(term('plazo.inicio')) ? term('plazo.inicio') : ''} style={bad('plazo.inicio')} onChange={(e) => setTerm('plazo.inicio', e.target.value)} />)}
              {field('objeto', t('ctr.t.objeto'), <input className="input" value={term('objeto')} style={bad('objeto')} onChange={(e) => setTerm('objeto', e.target.value)} />)}
            </div>
            <p className="t-xs t-mute">{t('ctr.a.signerNote')}</p>

            <details className="col g12">
              <summary className="w7 t-sm" style={{ cursor: 'pointer' }}>{t('ctr.a.more')}</summary>
              <div className="col g16" style={{ marginTop: '0.75rem' }}>
                <TermsForm terms={draft.terms} missing={missing} hide={[...MAIN]} onChange={(terms) => setDraft({ ...draft, terms })} />
                {field('scope', t('ctr.annex1'), <textarea className="input" rows={5} value={draft.scope} placeholder={t('ctr.a.scopeHint')} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} />)}
              </div>
            </details>
            <details className="col g12">
              <summary className="w7 t-sm" style={{ cursor: 'pointer' }}>{t('ctr.a.annexes')}</summary>
              <div className="col g16" style={{ marginTop: '0.75rem' }}>
                <GanttEditor schedule={draft.schedule} onChange={(s) => setDraft({ ...draft, schedule: s })} />
                <ChecklistEditor items={draft.checklist} weeks={draft.schedule.weeks} onChange={(checklist) => setDraft({ ...draft, checklist })} />
              </div>
            </details>

            <SignaturePad label={t('ctr.yourSignature')} onChange={setSignature} />
            <div className="row g8 wrap">
              <button className="btn btn-primary" disabled={busy || !signature} onClick={() => run(async () => { await save(); await contractsApi.send(brand.id, draft.id, signature!); }, 'ctr.a.sent')}>{t('ctr.a.send')}</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => run(async () => { await save(); setPreview((await contractsApi.preview(brand.id, draft.id)).text); }, 'ob.a.saved')}>{t('ctr.a.preview')}</button>
            </div>
          </>
        )}

        {status === 'sent' && (
          <div className="row between g8 wrap">
            <span className="t-sm">{t('ctr.a.sentTo', { email: draft.signer.email })}</span>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => contractsApi.reopen(brand.id, draft.id), 'ctr.a.reopened')}>{t('ctr.a.reopen')}</button>
          </div>
        )}

        {status === 'signed' && <ContractDownload brandId={brand.id} contract={draft} compact />}
        {msg && <p className="t-sm" role="status">{msg}</p>}
      </div>

      {status === 'draft' && preview && <div className="card" style={{ padding: '1.375rem', maxHeight: '32.5rem', overflowY: 'auto' }}><ContractText text={preview} /></div>}
      {status === 'sent' && draft.sentText && (
        <details className="card" style={{ padding: '1.375rem' }}>
          <summary className="w7" style={{ cursor: 'pointer' }}>{t('ctr.text')}</summary>
          <div style={{ marginTop: '0.75rem' }}><ContractText text={draft.sentText} /></div>
        </details>
      )}

      {status === 'signed' && schedule && (
        <details className="card col g12" style={{ padding: '1.375rem' }}>
          <summary className="h3" style={{ cursor: 'pointer' }}>{t('ctr.a.liveSchedule')}</summary>
          <p className="t-xs t-mute">{t('ctr.a.liveScheduleSub')}</p>
          <GanttEditor schedule={schedule} onChange={setSchedule} />
          <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => run(() => contractsApi.saveSchedule(brand.id, schedule), 'ob.a.saved')}>{t('ob.a.save')}</button>
        </details>
      )}
    </section>
  );
}
