import { RequestLink, useFmt, type Health, type Task } from './kit';

/** SA4: stuck Brain tasks first and in red (with how long and «See request»), then the ones that came out without AI, to review. One line when all is fine. */
export function Tasks({ tasks, period }: { tasks: Health['tasks']; period: string }) {
  const f = useFmt();
  const { t } = f;
  const fellBack = tasks.fellBack ?? [];
  const row = (s: Task, action: string, extra?: string) => (
    <div key={s.id} className="ast-item">
      <div className="ast-top">
        <span>{f.brain(s.brain)} · {s.title || f.kind(s.kind)}</span>
        <RequestLink requestId={s.requestId} brandId={s.brandId} label={action} />
      </div>
      <span className="ast-sub">{f.kind(s.kind)} · {f.brand(s.brandId)} · {extra ?? f.when(s.at)}</span>
    </div>
  );
  return (
    <>
      {tasks.stuck.length > 0 && (
        <section className="col g8" aria-label={t('aih.stuckN', { n: tasks.stuck.length })}>
          <h2 className="h3 ast-zero">{t('aih.stuckN', { n: tasks.stuck.length })}</h2>
          <div className="ast-list" style={{ borderColor: 'var(--danger)' }}>
            {tasks.stuck.map((s) => row(s, t('aih.seeRequest'), t('aih.stuckFor', { m: Math.max(15, Math.round((Date.now() - s.at) / 60_000)) })))}
          </div>
        </section>
      )}
      {tasks.fallback > 0 && (
        <section className="col g8" aria-label={t('aih.fbN', { n: tasks.fallback })}>
          <h2 className="h3">{t('aih.fbN', { n: tasks.fallback })}</h2>
          {fellBack.length > 0 && <div className="ast-list">{fellBack.map((s) => row(s, t('aih.review')))}</div>}
        </section>
      )}
      <p className="t-sm t-mute">{t(tasks.stuck.length ? 'aih.tasksLine' : 'aih.tasksOk', { n: tasks.total, p: period })}</p>
    </>
  );
}
