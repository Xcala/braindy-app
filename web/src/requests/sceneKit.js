/** Each scene runs on one clock: an element appears at its delay (seconds), so the work is seen happening in order. */
export const at = (d, extra) => ({ ['--d']: `${d}s`, ...extra });
