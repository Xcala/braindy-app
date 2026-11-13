import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useBrandDoc } from '../brands/useBrandDoc';
import { ruleLines } from './knowledge';
import './loop.css';

const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const clip = (s: string, n = 140) => { const one = s.replace(/\s+/g, ' ').trim(); return one.length > n ? `${one.slice(0, n - 1)}…` : one; };

/** Right after an approval or a change: what the Brand Brain just learned (the server records the same in brainEvents). */
export function LearnedMoment({ kind, text }: { kind: 'approved' | 'changed'; text: string }) {
  const { t } = useI18n();
  return (
    <div className="bl-learned" role="status">
      <span className="bl-ico" aria-hidden="true"><Icon name="repeat" size={16} /></span>
      <div className="col g4 min-w-0">
        <span className="t-sm w7">{t(kind === 'approved' ? 'bl.learnedApproved' : 'bl.learnedChanged')}</span>
        {text && <span className="t-sm">«{clip(text)}»</span>}
        <span className="t-xs t-mute">{t('bl.learnedNext')} <Link to="/brand/brain" className="w7" style={{ color: 'var(--azul)' }}>{t('bl.open')}</Link></span>
      </div>
    </div>
  );
}

/** New request: the piece is made with what the brand's Brain already knows (palette, type, tone, rules, past approvals). */
export function BrainKnows({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const identity = useBrandDoc(brandId, 'context/identity').data;
  const voice = useBrandDoc(brandId, 'context/voice').data;
  const brain = useBrandDoc(brandId, 'context/brain').data;
  const learnings = useBrandDoc(brandId, 'context/learnings').data;
  const colors = arr(identity?.colors).length, fonts = arr(identity?.typography).length;
  const tone = String((voice?.essence as { title?: string } | undefined)?.title ?? '').trim();
  const rules = ruleLines(brain).length, learned = arr(learnings?.items).length;
  const count = (n: number, k: 'colors' | 'fonts' | 'rules' | 'learned') => n && (n === 1 ? t(`bl.k.${k}1`) : t(`bl.k.${k}`, { n }));
  const parts = [
    count(colors, 'colors'), count(fonts, 'fonts'),
    voice && (tone ? t('bl.k.voice', { v: clip(tone, 40) }) : t('bl.k.voicePlain')),
    count(rules, 'rules'), count(learned, 'learned'),
  ].filter(Boolean) as string[];
  return (
    <div className="bl-knows">
      <span className="bl-ico" aria-hidden="true"><Icon name="repeat" size={14} /></span>
      <span className="col g4 min-w-0">
        <span className="t-sm w7">{t('bl.knows')}</span>
        <span className="t-xs t-mute">{parts.length ? parts.join(' · ') : t('bl.knowsNone')}</span>
      </span>
    </div>
  );
}

/** Cerebro: the changes the client asked for, which now go into every piece (and the quality check before delivery). */
export function BrainBetter({ learnings }: { learnings: Record<string, unknown> | null }) {
  const { t } = useI18n();
  const changes = (arr(learnings?.items) as Array<{ kind?: string; text?: string }>).filter((l) => l.kind === 'changed' && l.text).slice(-5).reverse();
  return (
    <section className="card card-tight col g12" aria-labelledby="h-bl-better">
      <div className="col g4"><h2 className="h3" id="h-bl-better">{t('bl.better')}</h2><p className="t-sm t-mute">{t('bl.betterSub')}</p></div>
      {changes.length
        ? <ul className="bb-pins">{changes.map((c, i) => <li key={i} className="t-sm">{clip(c.text!, 180)}</li>)}</ul>
        : <p className="t-sm t-mute">{t('bl.betterEmpty')}</p>}
    </section>
  );
}
