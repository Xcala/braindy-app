import { studioNow } from './officeHours';

/** The studio is in San Francisco: its light follows the real sun there (day, or night once it is dark). */
const LAT = 37.77, LON = -122.42;
const rad = Math.PI / 180;

/** Sun elevation in degrees over San Francisco (low-precision solar position, good to a fraction of a degree). */
export function sunElevation(d = studioNow()) {
  const n = d.getTime() / 864e5 - 10957.5; // days since J2000
  const g = (357.528 + 0.9856003 * n) * rad;
  const lambda = (280.46 + 0.9856474 * n + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ha = ((18.697374558 + 24.06570982441908 * n) * 15 + LON) * rad - ra;
  return Math.asin(Math.sin(LAT * rad) * Math.sin(dec) + Math.cos(LAT * rad) * Math.cos(dec) * Math.cos(ha)) / rad;
}

export type Light = 'day' | 'night';
/** Night once the sun is 4° below the horizon (city lights on, sky dark). */
export const light = (d = studioNow()): Light => (sunElevation(d) < -4 ? 'night' : 'day');

// Media made so far with a night version: the empty-chair studio and the close-ups of the four Brains and of the empty desk.
// Everything else keeps its daylight file until its night one is made.
const NIGHT = new Set(['-away']);
const NIGHT_CLOSEUPS = new Set(['cu-res', 'cu-mkt', 'cu-cre', 'cu-bui', 'cu-nico-away']);
/** File suffix for a studio media set (outfit or '-away') under the current light, falling back to daylight. */
export const lit = (media: string, l: Light) => (l === 'night' && NIGHT.has(media) ? `${media}-night` : media);
/** File name of a close-up (e.g. 'cu-res', 'cu-nico-away') under the current light, falling back to daylight. */
export const litCloseup = (name: string, l: Light) => (l === 'night' && NIGHT_CLOSEUPS.has(name) ? `${name}-night` : name);
