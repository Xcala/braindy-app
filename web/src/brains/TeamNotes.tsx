import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import type { BrainId } from '../requests/taxonomy';

const ORDER: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];

/** NickMark only: what each Brain brought to the team meeting before the plan. */
export function TeamNotes({ notes }: { notes: Partial<Record<BrainId, string>> & { ai?: boolean } }) {
  const { t } = useI18n();
  return (
    <details className="col g8" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
      <summary className="t-sm w7" style={{ cursor: 'pointer' }}>{t('team.notes')} <span className="t-xs t-mute">· {t(notes.ai ? 'brains.proposedAi' : 'brains.proposedBasic')}</span></summary>
      <div className="col g8" style={{ marginTop: 10 }}>
        {ORDER.filter((b) => notes[b]).map((b) => (
          <div key={b} className="row g12" style={{ alignItems: 'flex-start' }}>
            <span className={`brain b-${b}`} style={{ width: 32, height: 32, flex: 'none' }}><img src={`/brand/brains/${b}.png`} alt="" /></span>
            <span className="col"><span className="t-xs w7">{brainName(b)}</span><span className="t-sm">{notes[b]}</span></span>
          </div>
        ))}
      </div>
    </details>
  );
}
