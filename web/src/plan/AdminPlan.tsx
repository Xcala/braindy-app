import { useConfirm } from '../components/useConfirm';
import { useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { planApi } from './usePlan';
import { EXAMPLE } from './example';
import { tidy } from './formFields';
import { EMPTY_PLAN, PlanForm } from './PlanForm';
import type { BrandPlan } from './types';
import { Scan } from '../components/Scan';

interface AdminProps<T> {
  title: string; help: string; value: T | null; empty: T; example: T;
  save: (v: T) => Promise<{ summary: string }>; remove: () => Promise<unknown>;
  form: (v: T, set: (v: T) => void) => ReactNode;
  /** Inside the «Edit plan» panel: always open, no frame, no fold. */
  flat?: boolean;
}

/** A collapsible admin form with save, load example and delete; the server validates and says what is missing. */
function Admin<T>({ title, help, value, empty, example, save, remove, form, flat }: AdminProps<T>) {
  const { t } = useI18n();
  const [dialog, ask] = useConfirm();
  const [folded, setOpen] = useState(!value);
  const open = flat || folded;
  const [v, setV] = useState<T>(() => structuredClone(value ?? empty));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (x: T) => { setV(x); setMsg(null); };

  async function onSave() {
    setBusy(true); setMsg(null);
    try {
      const r = await save(tidy(v));
      setMsg({ ok: true, text: `${t('plan.a.saved')} ${r.summary}.` });
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message ?? e).replace(/^API \d+ · /, '') });
    } finally { setBusy(false); }
  }
  async function onRemove() {
    if (!(await ask({ title: t('plan.a.removeConfirm'), confirmLabel: t('acc.delete'), danger: true }))) return;
    await remove(); set(structuredClone(empty));
  }

  return (
    <section className={flat ? 'col g12' : 'card card-tight col g12'} style={flat ? undefined : { borderStyle: 'dashed' }} aria-label={title}>
      {dialog}
      <div className="row g8" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <button type="button" onClick={() => !flat && setOpen((o) => !o)} aria-expanded={open} className="col" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
          {!flat && <span className="label">{t('bill.a.only')}</span>}<span className={flat ? 'h3' : 'w7'}>{title}</span>
        </button>
        {open
          ? <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={busy}>{busy ? `${t('common.loading')}…` : msg?.ok ? `✓ ${t('set.saved').replace(/\.$/, '')}` : t('set.save')}</button>
          : <button type="button" className="t-sm" style={{ color: 'var(--azul)', border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setOpen(true)}>{t('plan.a.edit')}</button>}
      </div>
      {open && (
        <>
          <Scan text={help} />
          {msg && <p role="status" className="t-sm w7" style={{ margin: 0, color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
          {form(v, set)}
          {msg && !msg.ok && <p role="status" className="t-sm w7" style={{ margin: 0, color: 'var(--danger)' }}>{msg.text}</p>}
          <div className="row g8" style={{ flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={busy}>{t('set.save')}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => set(structuredClone(example))}>{t('plan.a.example')}</button>
            {value != null && <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>{t('plan.a.remove')}</button>}
            {!flat && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>{t('plan.a.hide')}</button>}
          </div>
        </>
      )}
    </section>
  );
}

/** Admin only · What the brand contracted (connector tool braindy_plan), as a form. Its apps live in Apps de terceros (accesses) since 2026-11-20.
 *  The schedule is edited in the contract panel (Onboarding), where it is Anexo 2. */
export function AdminPlan({ brandId, plan, flat }: { brandId: string; plan: BrandPlan | null; flat?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="col g12">
      <Admin<BrandPlan> title={t('plan.a.title')} help={t('plan.a.help')} value={plan} empty={EMPTY_PLAN} example={EXAMPLE}
        save={(v) => planApi.set(brandId, v)} remove={() => planApi.remove(brandId)} form={(v, set) => <PlanForm v={v} set={set} />} flat={flat} />
    </div>
  );
}
