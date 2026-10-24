import type { BrainId } from '../requests/taxonomy';

const ORDER: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];
const NAMES: Record<BrainId, string> = { researcher: 'Researcher', marketer: 'Marketer', creator: 'Creator', builder: 'Builder' };
export type BrainState = 'idle' | 'working' | 'approval';

/** The four Brains as a signature (design: "sig"). The lead Brain carries the request's state. */
export function BrainStack({ lead, state = 'idle', size = 'sm', label }: { lead?: BrainId; state?: BrainState; size?: 'xs' | 'sm'; label?: string }) {
  return (
    <span className="sig row g8" style={{ minWidth: 0 }} title={ORDER.map((b) => NAMES[b]).join(', ')}>
      <span className="row" style={{ flex: 'none' }} aria-label={ORDER.map((b) => NAMES[b]).join(', ')}>
        {ORDER.map((b, i) => (
          <span key={b} className={`brain ${size} b-${b} ${b === lead && state !== 'idle' ? `brain-${state}` : ''}`}
            style={{ marginLeft: i ? -7 : 0, boxShadow: '0 0 0 2px #FFFFFF' }}>
            <img src={`/brand/brains/${b}.png`} alt="" />
          </span>
        ))}
      </span>
      {label && <span className="t-sm" style={{ minWidth: 0 }}>{label}</span>}
    </span>
  );
}

export const brainName = (b?: BrainId | null) => (b ? NAMES[b] : '');
