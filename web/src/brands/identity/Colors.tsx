import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

type Color = { id?: string; hex?: string; name?: string; pantone?: string; chosen?: boolean };

/** Readable text color on top of a swatch. */
const ink = (hex: string) => {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0b0b0f' : '#ffffff';
};

export function Colors({ colors }: { colors: Color[] }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);
  const list = colors.filter((c) => /^#[0-9a-f]{3,8}$/i.test(c.hex ?? ''));
  const shown = list.some((c) => c.chosen) ? list.filter((c) => c.chosen) : list;
  if (!shown.length) return null;

  const copy = async (hex: string) => {
    try { await navigator.clipboard.writeText(hex); setCopied(hex); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {shown.map((c) => (
        <li key={c.id ?? c.hex}>
          <button
            onClick={() => copy(c.hex!)}
            className="flex aspect-square w-full flex-col justify-end rounded-xl p-3 text-left"
            style={{ background: c.hex, color: ink(c.hex!) }}
            aria-label={`${t('common.copy')} ${c.hex}`}
          >
            <span className="text-sm font-medium">{c.name}</span>
            <span className="text-xs opacity-80">{copied === c.hex ? t('common.copied') : c.hex?.toUpperCase()}</span>
            {c.pantone && <span className="text-xs opacity-80">{c.pantone}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
