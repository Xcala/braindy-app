import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dayLabel } from '../lib/dates';
import type { BrainId } from './taxonomy';
import type { BrandRequest, RequestComment } from './types';
import { KIND_OF, RELAY, TASKS } from './teamWork';
import { TeamAsk } from './TeamAsk';
import './teamAtWork.css';

type R = Pick<BrandRequest, 'id' | 'category' | 'teamNotes' | 'title' | 'work' | 'status' | 'dueDate'>;

/** «hace 20 min» / «20 min ago», from a step's time. */
function ago(at: number | undefined, lang: string) {
  if (!at) return '';
  const min = Math.round((Date.now() - at) / 60000);
  const f = new Intl.RelativeTimeFormat(lang === 'es' ? 'es' : 'en', { numeric: 'auto', style: 'short' });
  if (min < 60) return f.format(-Math.max(min, 0), 'minute');
  if (min < 60 * 24) return f.format(-Math.round(min / 60), 'hour');
  return f.format(-Math.round(min / 1440), 'day');
}

/**
 * The four Brains on a request, for real and in one line (Nicolas 2026-11-20: concrete and compact, no show).
 * Only the steps the session doing the request moves (work.steps) light up; with none yet, the faces wait and the line
 * says when it arrives. «Ver detalle» unfolds one line per Brain. A question from a Brain shows above with a box to
 * answer. When the piece is delivered the strip turns into the way to it. `compact` is the home-card line.
 */
export function TeamAtWork({ r, compact = false, brandId, addenda = [] }: { r: R; compact?: boolean; brandId?: string; addenda?: RequestComment[] }) {
  const { t, lang } = useI18n();
  const kind = KIND_OF[r.category] ?? 'study';
  const steps = r.work?.steps?.length === RELAY.length ? r.work.steps : null;
  const stepOf = (b: BrainId) => steps?.find((s) => s.brain === b);
  const delivered = r.status === 'to_approve';
  // Delivered with no steps marked: the team's part is over, so nobody shows as «next».
  const stateOf = (b: BrainId) => stepOf(b)?.state ?? (delivered ? 'done' : 'todo');
  const doing = RELAY.find((b) => stateOf(b) === 'doing');
  const lastDone = [...RELAY].reverse().find((b) => stateOf(b) === 'done');
  const finished = !!steps && RELAY.every((b) => ['done', 'skip'].includes(stateOf(b)));
  const started = !!doing || !!lastDone;
  const line = (b: BrainId) => { const s = stepOf(b); return (s?.state === 'done' && s.note?.trim()) || s?.task?.trim() || r.teamNotes?.[b]?.trim() || TASKS[kind][b][lang]; };
  const due = r.dueDate ? t('tw.due', { day: dayLabel(r.dueDate, lang) }) : '';
  const who = doing ?? lastDone;

  // What the line says right now: delivered, finished, who is on it (or who finished last), or that it has not started.
  const headline = delivered ? t('tw.delivered') : finished ? t('tw.done')
    : who ? `${brainName(who)} · ${doing ? t('tw.s.doing') : t('tw.s.done')}` : t('tw.waiting');
  const detail = !delivered && !finished && who ? line(who) : '';

  const faces = (
    <span className="tw-faces row flex-none" aria-hidden="true">
      {RELAY.map((b, k) => { const st = stateOf(b); return (
        <span key={b} className={`brain xs b-${b} ${st === 'doing' ? 'brain-working' : st === 'done' || finished || delivered ? '' : 'tw-off'}`} style={{ marginLeft: k ? -5 : 0 }}><img src={`/brand/brains/${b}.png`} alt="" /></span>
      ); })}
    </span>
  );

  if (compact) {
    return (
      <span className="tw-mini row g8 min-w-0">
        {faces}
        <span className="t-xs t-mute truncate">{headline}{detail && <> · {detail}</>}</span>
      </span>
    );
  }

  const ask = r.work?.ask;
  const askAt = ask?.at ?? 0;
  const answered = !!ask && addenda.some((a) => (a.createdAt?.toMillis?.() ?? 0) > askAt);

  return (
    <section className="tw-strip" aria-label={t('tw.title')}>
      {ask?.text && !answered && !delivered && brandId && <TeamAsk brandId={brandId} requestId={r.id} brain={ask.brain} text={ask.text} />}
      <details className="tw-fold">
        <summary className="tw-row">
          {faces}
          <span className="col min-w-0 grow">
            <span className="t-sm w7 truncate">{headline}{who && !delivered && !finished && <span className="t-xs t-mute w4"> · {ago(stepOf(who)?.at, lang)}</span>}</span>
            {(detail || (!started && !delivered && due)) && <span className="t-xs t-mute tw-clamp">{detail || due}</span>}
          </span>
          {delivered
            ? <a className="btn btn-primary btn-sm flex-none" href="#review" onClick={(e) => { e.preventDefault(); document.querySelector('[data-tour="review-viewer"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{t('tw.see')}</a>
            : <span className="t-xs t-mute flex-none tw-more">{started && due ? `${due} · ` : ''}{t('tw.detail')}</span>}
        </summary>
        <ol className="tw-list">
          {RELAY.map((b) => { const st = stateOf(b); const s = stepOf(b); return (
            <li key={b} className={`tw-item ${st}`}>
              <span className={`brain xs b-${b} ${st === 'doing' ? 'brain-working' : ''}`}><img src={`/brand/brains/${b}.png`} alt="" /></span>
              <span className="t-xs min-w-0"><b>{brainName(b)}</b> <span className="t-mute">· {st === 'todo' ? t('tw.s.todo') : t(`tw.s.${st}`)}{s?.at && st !== 'todo' ? ` ${ago(s.at, lang)}` : ''}</span><br />
                <span className="t-mute tw-clamp">{st === 'skip' ? t('tw.skipped') : line(b)}</span></span>
            </li>
          ); })}
        </ol>
      </details>
    </section>
  );
}
