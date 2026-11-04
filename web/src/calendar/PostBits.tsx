import type { SocialPost } from './useSocialPosts';

const NET: Record<string, { label: string; short: string; color: string }> = {
  instagram: { label: 'Instagram', short: 'IG', color: '#D62976' },
  facebook: { label: 'Facebook', short: 'FB', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', short: 'in', color: '#0A66C2' },
  youtube: { label: 'YouTube', short: 'YT', color: '#FF0000' },
  tiktok: { label: 'TikTok', short: 'TT', color: '#111111' },
  twitter: { label: 'X', short: 'X', color: '#111111' },
  threads: { label: 'Threads', short: '@', color: '#111111' },
  pinterest: { label: 'Pinterest', short: 'P', color: '#E60023' },
  bluesky: { label: 'Bluesky', short: 'B', color: '#1185FE' },
  gmb: { label: 'Google', short: 'G', color: '#4285F4' },
};
export const netInfo = (n: string) => NET[n] ?? { label: n, short: n.slice(0, 2).toUpperCase(), color: '#5C6375' };

/** A small round badge with the network's initials and color. */
export function NetBadge({ network }: { network: string }) {
  const n = netInfo(network);
  return <span className="cal-net" style={{ background: n.color }} title={n.label} aria-label={n.label}>{n.short}</span>;
}

/** The post's first image or video frame, square. */
export function PostThumb({ post, className = '' }: { post: SocialPost; className?: string }) {
  const m = post.media[0];
  if (post.thumb) return <img className={`cal-thumb ${className}`} src={post.thumb} alt="" loading="lazy" />;
  if (!m) return <span className={`cal-thumb is-text ${className}`} aria-hidden="true">Aa</span>;
  return m.kind === 'video'
    ? <video className={`cal-thumb ${className}`} src={`${m.url}#t=0.5`} preload="metadata" muted playsInline aria-hidden="true" />
    : <img className={`cal-thumb ${className}`} src={m.url} alt="" loading="lazy" />;
}
