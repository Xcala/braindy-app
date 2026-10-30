// Detects credentials pasted where they would be stored in plain text (the notes of an access).
// Lines only, never values, leave this module: callers log counts and platform names.

const PATTERNS: RegExp[] = [
  /\b(api[ _-]?key|api|token|secret|password|contrase[nñ]a|clave|pass)\s*[:=]\s*\S{8,}/i,
  /\bAIza[0-9A-Za-z_-]{30,}/, // Google API key
  /\b(sk|pk|rk)_(live|test)_[0-9A-Za-z]{10,}/, // Stripe
  /\bgh[pousr]_[A-Za-z0-9]{30,}/, // GitHub
  /\bxox[abprs]-[0-9A-Za-z-]{10,}/, // Slack
  /\b[a-f0-9]{40,}\b/i, // long hex tokens (Webflow, many APIs); 24-char ids like a Webflow Site ID stay
  /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{40,}\b/, // long opaque tokens
];

const isSecretLine = (line: string) => PATTERNS.some((re) => re.test(line));

/** True when the text holds something that looks like a password, key or token. */
export const looksLikeSecret = (text: string) => text.split('\n').some(isSecretLine);

/** Splits notes into the lines that look like credentials and the rest. */
export function splitSecretLines(text: string): { secret: string; rest: string } {
  const lines = text.split('\n');
  return {
    secret: lines.filter(isSecretLine).join('\n').trim(),
    rest: lines.filter((l) => !isSecretLine(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim(),
  };
}
