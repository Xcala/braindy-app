import { useI18n } from '../i18n/I18nProvider';
import type { RequestComment } from './types';

/** 75 → «1:15». */
export const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/** The comments of a video as numbered dots on its timeline; a dot jumps the video to its moment. */
export function VideoMarks({ comments, duration, onSeek }: { comments: RequestComment[]; duration: number; onSeek: (t: number) => void }) {
  const { t } = useI18n();
  const marks = comments.filter((c) => typeof c.annotation?.t === 'number');
  if (!duration || !marks.length) return null;
  return (
    <div className="vm-line" role="group" aria-label={t('vm.marks')}>
      {marks.map((c, i) => {
        const at = c.annotation!.t!;
        return (
          <button key={c.id} type="button" className={`vm-dot${c.resolved ? ' is-done' : ''}`} style={{ left: `${Math.min(100, (at / duration) * 100)}%` }}
            onClick={() => onSeek(at)} aria-label={t('vm.goTo', { t: clock(at) })} title={`${clock(at)} · ${c.text.slice(0, 60)}`}>{i + 1}</button>
        );
      })}
    </div>
  );
}
