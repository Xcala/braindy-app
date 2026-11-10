// Same rule as server/src/lib/secrets.ts: lines in the (plain text) notes that look like a password, key or token.
const PATTERNS = [
    /\b(api[ _-]?key|api|token|secret|password|contrase[nñ]a|clave|pass)\s*[:=]\s*\S{8,}/i,
    /\bAIza[0-9A-Za-z_-]{30,}/,
    /\b(sk|pk|rk)_(live|test)_[0-9A-Za-z]{10,}/,
    /\bgh[pousr]_[A-Za-z0-9]{30,}/,
    /\bxox[abprs]-[0-9A-Za-z-]{10,}/,
    /\b[a-f0-9]{40,}\b/i,
    /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{40,}\b/,
];
const isSecretLine = (line) => PATTERNS.some((re) => re.test(line));
export const looksLikeSecret = (text) => text.split('\n').some(isSecretLine);
/** Moves the credential lines out of the notes so they can go to the encrypted password field. */
export function splitSecretLines(text) {
    const lines = text.split('\n');
    return {
        secret: lines.filter(isSecretLine).join('\n').trim(),
        rest: lines.filter((l) => !isSecretLine(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    };
}
