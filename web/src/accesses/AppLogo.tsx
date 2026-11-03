import { useState } from 'react';
import type { Access } from './useAccesses';

const domainOf = (url?: string) => { try { return url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };
const firstWord = (s: string) => s.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

/**
 * The site an access belongs to: its own link, or else the link of another access on the same platform
 * ("Webflow API y Site ID" borrows Webflow's). Empty when nothing points to a site.
 */
export function logoDomain(a: Access, all: Access[]) {
  const own = domainOf(a.link);
  if (own) return own;
  const twin = all.find((o) => o.id !== a.id && o.link && firstWord(o.platform) === firstWord(a.platform));
  return domainOf(twin?.link);
}

/** The app's icon, taken from its website; the platform's initial when there is no site or no icon. */
export function AppLogo({ name, domain, size = 32 }: { name: string; domain: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: size / 4, flex: 'none' } as const;
  if (!domain || failed) {
    return <span aria-hidden="true" className="grid place-items-center w7 t-sm" style={{ ...box, background: 'var(--niebla)', color: 'var(--graphite)' }}>{name.trim().charAt(0).toUpperCase() || '·'}</span>;
  }
  return (
    <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`} alt="" width={size} height={size} loading="lazy"
      onError={() => setFailed(true)} style={{ ...box, objectFit: 'contain', background: '#fff', border: '1px solid var(--line)', padding: size / 8 }} />
  );
}
