// The opening pop-ups go one after another: first the alerts invitation, then whatever waits for it to be out of the way.
let alertsDone = false;
const waiting = new Set<() => void>();

/** The alerts invitation was closed, answered or is not going to show. */
export function alertsSettled() {
  if (alertsDone) return;
  alertsDone = true;
  waiting.forEach((f) => f());
  waiting.clear();
}

/** Calls back once the alerts invitation is out of the way (right away if it already is). Returns an unsubscribe. */
export function afterAlerts(f: () => void) {
  if (alertsDone) { f(); return () => undefined; }
  waiting.add(f);
  return () => { waiting.delete(f); };
}
