import { useI18n } from '../i18n/I18nProvider';
import { Packs } from './Packs';
import { Gantt } from './Gantt';
import { CareBlock } from './CareBlock';
import { progress, type Contract, type PackStatus } from './types';

const fmt = (iso: string | undefined, lang: string) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/** The whole contracted plan: summary, then the three blocks. Admin callbacks turn on the progress controls. */
export function ContractView({ c, brandName, onToggle, onPackStatus }: {
  c: Contract; brandName: string;
  onToggle?: (section: number, row: number, done: boolean) => void; onPackStatus?: (i: number, s: PackStatus) => void;
}) {
  const { t, lang } = useI18n();
  const p = progress(c);
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  return (
    <div className="col g40">
      <header className="card col g16" style={{ background: 'linear-gradient(135deg,#0B1220 0%,#16224A 60%,#2F4DE0 140%)', color: '#fff', borderColor: '#0B1220' }}>
        <p className="label" style={{ color: '#8FA0FF', margin: 0 }}>{brandName} · {t(`plan.status.${c.status}`)}</p>
        <h1 className="h1" style={{ color: '#fff' }}><span className="w3">{t('plan.title')} · </span><span className="w9">{c.title}</span></h1>
        {c.summary && <p style={{ margin: 0, color: '#C9D0DE', maxWidth: 720 }}>{c.summary}</p>}
        <div className="row g24" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {(c.start || c.end) && (
            <div className="col"><span className="label" style={{ color: '#8FA0FF' }}>{t('plan.dates')}</span><span className="w7">{fmt(c.start, lang)}{c.end ? ` → ${fmt(c.end, lang)}` : ''}</span></div>
          )}
          {p.total > 0 && (
            <div className="col g4" style={{ minWidth: 220, flex: '1 1 220px', maxWidth: 360 }}>
              <span className="label" style={{ color: '#8FA0FF' }}>{t('plan.progress')}</span>
              <span className="w7">{t('plan.delivered').replace('{done}', String(p.done)).replace('{total}', String(p.total))}</span>
              <span role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('plan.progress')} style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,.18)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#10B981,#06B6D4)' }} />
              </span>
            </div>
          )}
        </div>
        <p className="t-sm" style={{ margin: 0, color: '#C9D0DE' }}>
          {/* The "ai" inside Brains goes in 900 in signatures. */}
          {t('plan.signature').split('Brains').flatMap((part, i) => (i ? [<span key={i}>Br<b className="w9">ai</b>ns</span>, part] : [part]))}
        </p>
      </header>
      <Packs c={c} onStatus={onPackStatus} />
      {c.schedule && <Gantt s={c.schedule} onToggle={onToggle} />}
      <CareBlock c={c} />
    </div>
  );
}
