import { useEffect, useState } from 'react';
import { useBrandDoc } from '../../brands/useBrandDoc';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import type { Brand } from '../../brands/BrandProvider';
import { apiError, contractsApi, type PresetKey } from '../api';
import type { Contract, Schedule } from '../types';
import { ContractText } from '../ContractText';
import { ContractDownload } from '../ContractDownload';
import { SignaturePad } from '../SignaturePad';
import { Checklist } from '../Checklist';
import { TermsForm } from './TermsForm';
import { GanttEditor } from './GanttEditor';
import { ChecklistEditor } from './ChecklistEditor';

const PRESETS: PresetKey[] = ['brand3m', 'marketing6m', 'empty'];

/** Admin · step 1 of a brand: build the contract, send it, countersign it; after that, keep the schedule live. */
export function ContractPanel({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const contractId = brand.onboarding?.contractId ?? null;
  const live = useBrandDoc(brand.id, `contracts/${contractId ?? '-'}`);
  const liveSchedule = useBrandDoc(brand.id, 'context/schedule').data as Schedule | null;
  const [draft, setDraft] = useState<Contract | null>(null);
  const [preset, setPreset] = useState<PresetKey>('brand3m');
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
      setMsg(err.fields.length ? t('ctr.a.missing', { fields: err.fields.map((f) => (f.startsWith('contratista.') ? t('ctr.contractor') : f)).join(', ') }) : t('ob.a.error'));
    } finally { setBusy(false); }
  };
  const save = () => contractsApi.save(brand.id, draft!.id, { terms: draft!.terms, scope: draft!.scope, schedule: draft!.schedule, checklist: draft!.checklist, signer: draft!.signer });

  if (!contractId || (!contract && !live.loading)) {
    return (
      <div className="card col g12" style={{ padding: 22 }}>
        <h2 className="h3">{t('ctr.a.title')}</h2>
        <p className="t-sm t-mute">{t('ctr.a.createSub')}</p>
        <div className="row g8 wrap">
          <select className="input" value={preset} onChange={(e) => setPreset(e.target.value as PresetKey)} aria-label={t('ctr.a.preset')}>
            {PRESETS.map((p) => <option key={p} value={p}>{t(`ctr.p.${p}` as StringKey)}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => contractsApi.create(brand.id, preset), 'ctr.a.created')}>{t('ctr.a.create')}</button>
        </div>
        {msg && <p className="t-sm" role="status">{msg}</p>}
      </div>
    );
  }
  if (!draft) return <div className="card t-mute">{t('common.loading')}</div>;
  const status = draft.status;

  return (
    <section className="col g16">
      <div className="card col g16" style={{ padding: 22 }}>
        <div className="row between g8 wrap">
          <h2 className="h3">{t('ctr.a.title')}</h2>
          <span className="chip">{t(`ctr.status.${status}` as StringKey)}</span>
        </div>

        {status === 'draft' && (
          <>
            <label className="col g4 t-sm"><span className="w7">{t('ctr.a.signerEmail')}</span>
              <input className="input" type="email" value={draft.signer.email} onChange={(e) => setDraft({ ...draft, signer: { ...draft.signer, email: e.target.value } })} style={missing.includes('signer.email') ? { borderColor: 'var(--danger)' } : undefined} /></label>
            <label className="col g4 t-sm"><span className="w7">{t('ctr.a.signerName')}</span>
              <input className="input" value={draft.signer.name} onChange={(e) => setDraft({ ...draft, signer: { ...draft.signer, name: e.target.value } })} /></label>
            <p className="t-xs t-mute">{t('ctr.a.signerNote')}</p>
            <TermsForm terms={draft.terms} missing={missing} onChange={(terms) => setDraft({ ...draft, terms })} />
            <label className="col g4 t-sm"><span className="w7">{t('ctr.annex1')}</span>
              <textarea className="input" rows={6} value={draft.scope} placeholder={t('ctr.a.scopeHint')} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} /></label>
            <h3 className="w9">{t('ctr.schedule')}</h3>
            <GanttEditor schedule={draft.schedule} onChange={(s) => setDraft({ ...draft, schedule: s })} />
            <h3 className="w9">{t('ctr.checklist')}</h3>
            <ChecklistEditor items={draft.checklist} weeks={draft.schedule.weeks} onChange={(checklist) => setDraft({ ...draft, checklist })} />
            <div className="row g8 wrap">
              <button className="btn btn-secondary" disabled={busy} onClick={() => run(save, 'ob.a.saved')}>{t('ob.a.save')}</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => run(async () => { await save(); setPreview((await contractsApi.preview(brand.id, draft.id)).text); }, 'ob.a.saved')}>{t('ctr.a.preview')}</button>
              <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => { await save(); await contractsApi.send(brand.id, draft.id); }, 'ctr.a.sent')}>{t('ctr.a.send')}</button>
            </div>
          </>
        )}

        {status === 'sent' && (
          <div className="row between g8 wrap">
            <span className="t-sm">{t('ctr.a.sentTo', { email: draft.signer.email })}</span>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => contractsApi.reopen(brand.id, draft.id), 'ctr.a.reopened')}>{t('ctr.a.reopen')}</button>
          </div>
        )}

        {status === 'clientSigned' && (
          <>
            <p className="t-sm">{t('ctr.a.clientSigned', { name: draft.signatures?.client?.name ?? '', company: draft.client?.razonSocial ?? '' })}</p>
            <SignaturePad label={t('ctr.a.yourSignature')} onChange={setSignature} />
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={busy || !signature} onClick={() => run(() => contractsApi.countersign(brand.id, draft.id, signature!), 'ctr.a.countersigned')}>{t('ctr.a.countersign')}</button>
          </>
        )}

        {status === 'signed' && <ContractDownload brandId={brand.id} contract={draft} compact />}
        {msg && <p className="t-sm" role="status">{msg}</p>}
      </div>

      {status !== 'draft' && (draft.sentText || preview) && (
        <details className="card" style={{ padding: 22 }}>
          <summary className="w7" style={{ cursor: 'pointer' }}>{t('ctr.text')}</summary>
          <div style={{ marginTop: 12 }}><ContractText text={draft.sentText ?? preview ?? ''} /></div>
        </details>
      )}
      {status === 'draft' && preview && <div className="card" style={{ padding: 22, maxHeight: 520, overflowY: 'auto' }}><ContractText text={preview} /></div>}

      {status === 'signed' && schedule && (
        <div className="card col g12" style={{ padding: 22 }}>
          <h2 className="h3">{t('ctr.a.liveSchedule')}</h2>
          <p className="t-xs t-mute">{t('ctr.a.liveScheduleSub')}</p>
          <GanttEditor schedule={schedule} onChange={setSchedule} />
          <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => run(() => contractsApi.saveSchedule(brand.id, schedule), 'ob.a.saved')}>{t('ob.a.save')}</button>
        </div>
      )}
      {status !== 'draft' && status !== 'signed' && <div className="card col g8" style={{ padding: 22 }}><h3 className="w9">{t('ctr.checklist')}</h3><Checklist items={draft.checklist} start={draft.schedule.start} /></div>}
    </section>
  );
}
