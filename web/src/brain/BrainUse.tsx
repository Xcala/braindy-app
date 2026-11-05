import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { ruleLines } from './knowledge';

type Doc = Record<string, unknown> | null;
const arr = (v: unknown) => (Array.isArray(v) ? v : []);

/** How the Brains use the Brain on each request: the layers they read (mirrors server/src/brains/context.ts), the rules, the gaps. */
export function BrainUse({ identity, voice, brain, learnings, talks, requests, gaps }: { identity: Doc; voice: Doc; brain: Doc; learnings: Doc; talks: number; requests: number; gaps: StringKey[] }) {
  const { t } = useI18n();
  const learned = arr(learnings?.items).length;
  const brainFields = ['position', 'audiences', 'goals', 'avoid', 'criterio'].filter((k) => brain?.[k]).length;
  const layers = [
    { k: 'brain', n: brainFields, label: t('bb.l.brain'), d: t('bb.l.brainD'), c: 'var(--azul)' },
    { k: 'identity', n: arr(identity?.colors).length + arr(identity?.typography).length, label: t('bb.l.identity'), d: t('bb.l.identityD', { colors: arr(identity?.colors).length, fonts: arr(identity?.typography).length }), c: 'var(--creator)' },
    { k: 'voice', n: voice ? 2 : 0, label: t('bb.l.voice'), d: t('bb.l.voiceD'), c: 'var(--marketer)' },
    { k: 'learn', n: Math.min(15, learned), label: t('bb.l.learn'), d: t('bb.l.learnD', { n: Math.min(15, learned), total: learned }), c: 'var(--success)' },
    { k: 'work', n: Math.min(10, requests), label: t('bb.l.work'), d: t('bb.l.workD'), c: 'var(--builder)' },
    { k: 'talks', n: Math.min(5, talks), label: t('bb.l.talks'), d: t('bb.l.talksD'), c: 'var(--researcher)' },
  ].filter((l) => l.n > 0);
  const total = layers.reduce((s, l) => s + l.n, 0) || 1;
  const rules = ruleLines(brain).slice(0, 8);
  return (
    <div className="col g24">
      <div className="col g4"><h2 className="h2">{t('bb.use')}</h2><p className="t-mute" style={{ maxWidth: '70ch' }}>{t('bb.useSub')}</p></div>
      <div className="bb-use">
        <section className="card card-tight col g16">
          <h3 className="h3">{t('bb.ctx')}</h3>
          <div className="bb-stack" aria-hidden="true">{layers.map((l) => <i key={l.k} style={{ flexGrow: l.n, background: l.c }} />)}</div>
          <ul className="bb-layers">
            {layers.map((l) => (
              <li key={l.k}><span className="bb-sw" style={{ background: l.c }} /><div className="col"><span className="t-sm w7">{l.label}</span><span className="t-xs t-mute">{l.d}</span></div><span className="mono t-mute">{Math.round(l.n / total * 100)} %</span></li>
            ))}
          </ul>
          <p className="t-xs t-mute">{t('bb.ctxNever')}</p>
        </section>
        <section className="card card-tight col g12">
          <div className="col g4"><h3 className="h3">{t('bb.rules')}</h3><p className="t-sm t-mute">{t('bb.rulesSub')}</p></div>
          {rules.length ? <ul className="bb-pins">{rules.map((r, i) => <li key={i} className="t-sm">{r}</li>)}</ul> : <p className="t-sm t-mute">{t('bb.rulesEmpty')}</p>}
        </section>
        <section className="card card-tight col g12">
          <div className="col g4"><h3 className="h3">{t('bb.gaps')}</h3><p className="t-sm t-mute">{t('bb.gapsSub')}</p></div>
          {gaps.length ? <ul className="bb-gaps">{gaps.slice(0, 6).map((g) => <li key={g} className="t-sm">{t(g)}</li>)}</ul> : <p className="t-sm t-mute">{t('bb.gapsNone')}</p>}
        </section>
      </div>
    </div>
  );
}
