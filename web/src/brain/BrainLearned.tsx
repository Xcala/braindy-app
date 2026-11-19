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
  const palette = (arr(identity?.colors) as Array<{ hex?: string; name?: string }>).filter((c) => /^#[0-9a-f]{6}$/i.test(c.hex ?? '')).slice(0, 6);
  const colors = arr(identity?.colors).length, fonts = arr(identity?.typography).length;
  const live = (arr(learnings?.items) as Array<{ kind?: string; text?: string; retired?: boolean }>).filter((x) => !x.retired);
  const lastChange = [...live].reverse().find((x) => x.kind === 'changed' && x.text);
  const tone = String((voice?.essence as { title?: string } | undefined)?.title ?? '').trim();
  const rules = ruleLines(brain).length, learned = live.length;
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
        {palette.length > 0 && <span className="bl-pal" aria-hidden="true">{palette.map((c, i) => <i key={i} style={{ background: c.hex }} title={c.name} />)}</span>}
        <span className="t-xs t-mute">{parts.length ? parts.join(' · ') : t('bl.knowsNone')}</span>
        {lastChange && <span className="t-xs"><b className="w7">{t('bl.remembers')}</b> «{clip(lastChange.text!, 110)}»</span>}
        <Link to="/brand/brain?uso=1" className="t-xs w7" style={{ color: 'var(--azul)' }}>{t('bl.seeMap')}</Link>
      </span>
    </div>
  );
}
