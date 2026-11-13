import type { PointerEvent } from 'react';

/** Turns the help button's glow arc toward the mouse: the arc's middle sits at 270deg of the gradient, so `from` = pointer angle − 270.
 *  The angle is unwrapped so the arc takes the short way round instead of spinning back past 0. */
let last = 200;
export function followPointer(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const deg = (Math.atan2(e.clientX - (r.left + r.width / 2), (r.top + r.height / 2) - e.clientY) * 180) / Math.PI;
  let next = deg - 270;
  next += Math.round((last - next) / 360) * 360;
  last = next;
  el.style.setProperty('--help-ang', `${next}deg`);
}
