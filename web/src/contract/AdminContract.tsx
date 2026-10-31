import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { contractApi } from './useContract';
import { EXAMPLE } from './example';
import type { Contract } from './types';

/** Admin only · Load or replace the brand's plan as JSON (same shape as the connector tool braindy_contract). */
export function AdminContract({ brandId, contract }: { brandId: string; contract: Contract | null }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(!contract);
  const [text, setText] = useState(() => JSON.stringify(contract ?? EXAMPLE, null, 2));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const r = await contractApi.set(brandId, JSON.parse(text));
      setMsg({ ok: true, text: `${t('plan.a.saved')} ${r.summary}.` });
    } catch (e) {
      const m = String((e as Error).message ?? e);
      setMsg({ ok: false, text: e instanceof SyntaxError ? `${t('plan.a.badJson')} ${m}` : m.replace(/^API \d+ · /, '') });
    } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm(t('plan.a.removeConfirm'))) return;
    await contractApi.remove(brandId); setText(JSON.stringify(EXAMPLE, null, 2));
  }

  return (
    <section className="card card-tight col g12" style={{ borderStyle: 'dashed' }} aria-label={t('plan.a.title')}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="row g8" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', justifyContent: 'space-between' }}>
        <span className="col" style={{ textAlign: 'left' }}><span className="label">{t('bill.a.only')}</span><span className="w7">{t('plan.a.title')}</span></span>
        <span className="t-sm" style={{ color: 'var(--azul)' }}>{open ? t('plan.a.hide') : t('plan.a.edit')}</span>
      </button>
      {open && (
        <>
          <p className="t-sm t-mute" style={{ margin: 0 }}>{t('plan.a.help')}</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="JSON"
            style={{ width: '100%', minHeight: 360, fontFamily: 'var(--f-mono, monospace)', fontSize: 12, lineHeight: '18px', border: '1px solid var(--line-strong)', borderRadius: 12, padding: 12 }} />
          {msg && <p role="status" className="t-sm w7" style={{ margin: 0, color: msg.ok ? '#0E8A5F' : '#B42318' }}>{msg.text}</p>}
          <div className="row g8" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>{busy ? `${t('common.loading')}…` : t('plan.a.save')}</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setText(JSON.stringify(EXAMPLE, null, 2))}>{t('plan.a.example')}</button>
            {contract && <button className="btn btn-ghost btn-sm" onClick={remove}>{t('plan.a.remove')}</button>}
          </div>
        </>
      )}
    </section>
  );
}
