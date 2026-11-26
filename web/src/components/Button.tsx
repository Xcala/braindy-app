import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
type Size = 'md' | 'sm';

/**
 * UX #21 · One button for the app. The variant says its role:
 * primary = the one action of the screen, secondary = the rest, ghost = quiet, danger = deletes, text = looks like a link.
 * `picked` marks a chosen option (soft fill + ✓), never the primary blue.
 */
export function Button({ variant = 'secondary', size = 'md', block, picked, className = '', type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant; size?: Size; block?: boolean; picked?: boolean;
}) {
  const cls = variant === 'text' ? 'btn-text'
    : ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', block && 'btn-block', picked && 'is-picked'].filter(Boolean).join(' ');
  return <button type={type} className={`${cls} ${className}`.trim()} aria-pressed={picked} {...rest} />;
}
