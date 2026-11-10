/** Puts the client data into the sent text. Same as server withClient (the hash must match). */
export function withClient(text, client) {
    return text.replace(/\{\{cliente\.(\w+)\}\}/g, (_, k) => client[k]?.trim() || '________');
}
export async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
/** Date of a week (0-based) of the schedule, as a Date at noon UTC. */
export const weekDate = (start, week, plusDays = 0) => new Date(Date.parse(`${start}T12:00:00Z`) + (week * 7 + plusDays) * 864e5);
