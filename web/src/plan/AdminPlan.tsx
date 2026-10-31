import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { planApi } from './usePlan';
import { EXAMPLE, EXAMPLE_STACK } from './example';
import type { BrandPlan, StackItem } from './types';

interface JsonAdminProps {
  title: string; help: string; value: unknown; example: unknown;
  save: (v: unknown) => Promise<{ summary: string }>; remove: () => Promise<unknown>;
}

/** A collapsible JSON editor with save, load example and delete; the server validates and says what is wrong. */
function JsonAdmin({ title, help, value, example, save, remove }: JsonAdminProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(!value);
  const [text, setText] = useState(() => JSON.stringify(value ?? example, null, 2));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSave() {
    setBusy(true); setMsg(null);
    try {
      const r = await save(JSON.parse(text));
      setMsg({ ok: true, text: `${t('plan.a.saved')} ${r.summary}.` });
    } catch (e) {
      const m = String((e as Error).message ?? e);
      setMsg({ ok: false, text: e instanceof SyntaxError ? `${t('plan.a.badJson')} ${m}` : m.replace(/^API \d+ · /, '') });
    } finally { setBusy(false); }
  }
  async function onRemove() {
    if (!window.confirm(t('plan.a.removeConfirm'))) return;
    await remove(); setText(JSON.stringify(example, null, 2));
  }

  return (
    <section className="card card-tight col g12" style={{ borderStyle: 'dashed' }} aria-label={title}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="row g8" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', justifyContent: 'space-between' }}>
        <span className="col" style={{ textAlign: 'left' }}><span className="label">{t('bill.a.only')}</span><span className="w7">{title}</span></span>
        <span className="t-sm" style={{ color: 'var(--azul)' }}>{open ? t('plan.a.hide') : t('plan.a.edit')}</span>
      </button>
      {open && (
        <>
          <p className="t-sm t-mute" style={{ margin: 0 }}>{help}</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="JSON"
            style={{ width: '100%', minHeight: 320, fontFamily: 'var(--f-mono, monospace)', fontSize: 12, lineHeight: '18px', border: '1px solid var(--line-strong)', borderRadius: 12, padding: 12 }} />
          {msg && <p role="status" className="t-sm w7" style={{ margin: 0, color: msg.ok ? '#0E8A5F' : '#B42318' }}>{msg.text}</p>}
          <div className="row g8" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={onSave} disabled={busy}>{busy ? `${t('common.loading')}…` : t('plan.a.save')}</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setText(JSON.stringify(example, null, 2))}>{t('plan.a.example')}</button>
            {value != null && <button className="btn btn-ghost btn-sm" onClick={onRemove}>{t('plan.a.remove')}</button>}
          </div>
        </>
      )}
    </section>
  );
}

/** Admin only · What the brand contracted (connector tool braindy_plan) and its apps stack (braindy_stack), as JSON.
 *  The schedule is edited in the contract panel (Onboarding), where it is Anexo 2. */
export function AdminPlan({ brandId, plan, stack }: { brandId: string; plan: BrandPlan | null; stack: StackItem[] | null }) {
  const { t } = useI18n();
  return (
    <div className="col g12">
      <JsonAdmin title={t('plan.a.title')} help={t('plan.a.help')} value={plan} example={EXAMPLE}
        save={(v) => planApi.set(brandId, v)} remove={() => planApi.remove(brandId)} />
      <JsonAdmin title={t('plan.a.stackTitle')} help={t('plan.a.stackHelp')} value={stack} example={EXAMPLE_STACK}
        save={(v) => planApi.setStack(brandId, v)} remove={() => planApi.removeStack(brandId)} />
    </div>
  );
}
