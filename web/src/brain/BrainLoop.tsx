import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { Icon } from '../components/Icon';
import { ago, eventText } from './BrainFeed';
import { useLastBrainEvent } from './useBrainEvents';
import './loop.css';

// Each step wears the colour of the Brain that leads it; the last one closes the loop back to the first.
const STEPS: Array<{ k: string; icon: 'plus' | 'spark' | 'check' | 'repeat'; c: string }> = [
  { k: 'ask', icon: 'plus', c: 'var(--researcher)' },
  { k: 'make', icon: 'spark', c: 'var(--creator)' },
  { k: 'approve', icon: 'check', c: 'var(--marketer)' },
  { k: 'learn', icon: 'repeat', c: 'var(--builder)' },
];

/** The four steps of the Brand Brain loop: ask, we make it, you approve, your Brain learns (and the next one is better). */
export function BrainLoopSteps({ on }: { on?: 'learn' }) {
  const { t } = useI18n();
  return (
    <div className="bl-wrap"><ol className="bl-steps" aria-label={t('bl.line')}>
      {STEPS.map((s) => (
        <li key={s.k} className={`bl-step${on === s.k ? ' is-on' : ''}`} style={{ ['--c' as string]: s.c }}>
          <span className="bl-ico" aria-hidden="true"><Icon name={s.icon} size={16} /></span>
          <span className="col"><span className="t-sm w7">{t(`bl.s.${s.k}` as StringKey)}</span><span className="t-xs t-mute">{t(`bl.s.${s.k}D` as StringKey)}</span></span>
        </li>
      ))}
    </ol></div>
  );
}

/** Home: the loop in one strip, the last thing the Brain learned and a way into it. */
export function HomeBrainLoop({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const last = useLastBrainEvent(brandId);
  return (
    <section className="card bl-card col g16" aria-labelledby="h-bl">
      <div className="row between g12 wrap" style={{ alignItems: 'flex-start' }}>
        <div className="col g4" style={{ maxWidth: 640 }}>
          <h2 className="h3" id="h-bl"><span className="w9">{t('bl.line')}</span></h2>
          <p className="t-sm t-mute">{t('bl.lineSub')}</p>
        </div>
        <Link to="/brand/brain" className="btn btn-secondary btn-sm">{t('bl.open')}<Icon name="arrowRight" size={16} /></Link>
      </div>
      <BrainLoopSteps />
      {last && (
        <Link to="/brand/brain" className="bl-last t-sm">
          <span className="bl-dot" aria-hidden="true" />
          <span className="t-mute">{t('bl.last')}:</span> <span className="truncate">{eventText(last, t)}</span>
          <span className="t-xs t-mute" style={{ flex: 'none' }}>· {ago(last.at, t)}</span>
        </Link>
      )}
    </section>
  );
}
