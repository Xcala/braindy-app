import type { ClientData } from './types';

/** Puts the client data into the sent text. Same as server withClient (the hash must match). */
export function withClient(text: string, client: Partial<ClientData>): string {
  return text.replace(/\{\{cliente\.(\w+)\}\}/g, (_, k: string) => (client as Record<string, string>)[k]?.trim() || '________');
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Date of a week (0-based) of the schedule, as a Date at noon UTC. */
export const weekDate = (start: string, week: number, plusDays = 0) => new Date(Date.parse(`${start}T12:00:00Z`) + (week * 7 + plusDays) * 864e5);
