/** Ad platforms Pauta knows (same list as the connector). Only the ones a brand actually has are ever shown. */
export const PLATFORMS: Record<string, { label: string; color: string; mark: string }> = {
  meta: { label: 'Meta', color: '#0866FF', mark: 'M' }, google: { label: 'Google', color: '#1A73E8', mark: 'G' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', mark: 'in' }, tiktok: { label: 'TikTok', color: '#111111', mark: 'T' },
  chatgpt: { label: 'ChatGPT', color: '#10A37F', mark: 'AI' }, microsoft: { label: 'Microsoft', color: '#00A4EF', mark: 'Ms' },
  pinterest: { label: 'Pinterest', color: '#E60023', mark: 'P' }, x: { label: 'X', color: '#111111', mark: 'X' },
  snapchat: { label: 'Snapchat', color: '#F7C600', mark: 'S' }, reddit: { label: 'Reddit', color: '#FF4500', mark: 'R' },
  perplexity: { label: 'Perplexity', color: '#1F6F75', mark: 'Px' }, spotify: { label: 'Spotify', color: '#1DB954', mark: 'Sp' },
  amazon: { label: 'Amazon', color: '#FF9900', mark: 'a' }, mercadolibre: { label: 'Mercado Libre', color: '#E8C300', mark: 'ML' },
  doordash: { label: 'DoorDash', color: '#FF3008', mark: 'D' }, ubereats: { label: 'Uber Eats', color: '#06C167', mark: 'U' },
  rappi: { label: 'Rappi', color: '#FF441F', mark: 'R' }, ctv: { label: 'TV', color: '#5B4BDB', mark: 'TV' },
  programmatic: { label: 'Programática', color: '#6B7280', mark: 'P' }, ooh: { label: 'Vallas', color: '#6B7280', mark: 'V' },
  other: { label: 'Otra', color: '#6B7280', mark: '•' },
};
export const platformOf = (p: string) => PLATFORMS[p] ?? PLATFORMS.other!;

export function PlatformBadge({ platform }: { platform: string }) {
  const p = platformOf(platform);
  return <span className="pa-badge" style={{ background: p.color }} aria-hidden="true">{p.mark}</span>;
}
