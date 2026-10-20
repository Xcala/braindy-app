import { useState, type ReactNode } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import type { OptionKey, Proposal } from './types';

/** Proposal content: every field saves on blur (Firestore field path → value). */
export function ProposalForm({ p }: { p: Proposal }) {
  const { t } = useI18n();
  const [saved, setSaved] = useState(false);
  const save = async (path: string, value: string | number | null) => {
    await updateDoc(doc(db, 'proposals', p.id), { [path]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <section className="card col g20" aria-labelledby="pcontent">
      <div className="row between"><h2 className="h3" id="pcontent">{t('proposals.content')}</h2>
        <span className="t-sm" role="status" style={{ color: 'var(--success)', opacity: saved ? 1 : 0 }}>{t('proposals.saved')}</span></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('proposals.f.title')} value={p.title} onSave={(v) => save('title', v)} />
        <Field label={t('proposals.f.company')} value={p.prospect?.company} onSave={(v) => save('prospect.company', v)} />
        <Field label={t('proposals.f.contact')} value={p.prospect?.name} onSave={(v) => save('prospect.name', v)} />
        <Field label={t('proposals.f.email')} type="email" value={p.prospect?.email} onSave={(v) => save('prospect.email', v)} />
        <Field label={t('proposals.f.phone')} type="tel" value={p.prospect?.phone} onSave={(v) => save('prospect.phone', v)} />
        <Field label={t('proposals.f.validUntil')} type="date" value={p.validUntil} onSave={(v) => save('validUntil', v)} />
        <Select label={t('proposals.f.lang')} value={p.lang} options={[['en', 'English'], ['es', 'Español']]} onSave={(v) => save('lang', v)} />
        <Select label={t('proposals.f.recommended')} value={p.recommended ?? 'transform'}
          options={(['launch', 'transform', 'continuity'] as OptionKey[]).map((k) => [k, t(`proposals.opt.${k}`)])} onSave={(v) => save('recommended', v)} />
      </div>
      <Group title={t('proposals.fromAtoB')}>
        <Field area label={t('proposals.f.today')} value={p.fromA?.today} onSave={(v) => save('fromA.today', v)} />
        <Field area label={t('proposals.f.target')} value={p.toB?.target} onSave={(v) => save('toB.target', v)} />
        <Field area label={t('proposals.f.insights')} value={p.fromA?.insights} onSave={(v) => save('fromA.insights', v)} />
        <Field area label={t('proposals.f.changes')} value={p.toB?.changes} onSave={(v) => save('toB.changes', v)} />
      </Group>
      <Group title={t('proposals.prices')}>
        {(['launch', 'transform', 'continuity', 'aiAgents'] as const).map((k) => (
          <Field key={k} label={t(`proposals.opt.${k}`)} placeholder={t('proposals.pricePh')} value={p.options?.[k]?.price} onSave={(v) => save(`options.${k}.price`, v)} />
        ))}
      </Group>
      <Group title={t('proposals.amounts')}>
        <Select label={t('bill.a.currency')} value={p.currency ?? 'usd'} options={[['usd', 'USD'], ['cop', 'COP']]} onSave={(v) => save('currency', v)} />
        <p className="t-xs t-mute" style={{ alignSelf: 'end' }}>{t('proposals.amountsHint')}</p>
        {([['launch', 'amount'], ['transform', 'amount'], ['transform', 'monthly'], ['continuity', 'monthly']] as const).map(([k, f]) => (
          <Field key={`${k}-${f}`} type="number" label={`${t(`proposals.opt.${k}`)} · ${t(f === 'amount' ? 'bill.a.project' : 'bill.a.monthly')}`}
            value={p.options?.[k]?.[f] != null ? String(p.options[k]![f]) : ''} onSave={(v) => save(`options.${k}.${f}`, v.trim() ? Number(v) : null)} />
        ))}
      </Group>
      <Field area label={t('proposals.f.notes')} value={p.notes} onSave={(v) => save('notes', v)} />
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <div className="col g12"><p className="label">{title}</p><div className="grid gap-4 md:grid-cols-2">{children}</div></div>;
}

function Field({ label, value, onSave, type = 'text', area, placeholder }: {
  label: string; value?: string; onSave: (v: string) => void; type?: string; area?: boolean; placeholder?: string;
}) {
  const [v, setV] = useState(value ?? '');
  const id = `f-${label.replace(/\W+/g, '-')}`;
  const commit = () => { if (v !== (value ?? '')) onSave(v); };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {area
        ? <textarea id={id} className="input" style={{ height: 96, padding: '12px 16px', resize: 'vertical' }} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} />
        : <input id={id} className="input" type={type} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} />}
    </div>
  );
}

function Select({ label, value, options, onSave }: { label: string; value: string; options: Array<[string, string]>; onSave: (v: string) => void }) {
  const id = `s-${label.replace(/\W+/g, '-')}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value} onChange={(e) => onSave(e.target.value)}>
        {options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </div>
  );
}
