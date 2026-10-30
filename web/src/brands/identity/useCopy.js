import { useState } from 'react';
import { useToast } from '../../components/Toaster';
import { useI18n } from '../../i18n/I18nProvider';
/** Copies text to the clipboard and remembers which value was copied for ~1.5 s. */
export function useCopy() {
    const [copied, setCopied] = useState(null);
    const toast = useToast();
    const { t } = useI18n();
    const copy = async (value) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(value);
            toast({ text: t('toast.copied', { value: value.length > 40 ? `${value.slice(0, 40)}…` : value }) });
            setTimeout(() => setCopied((c) => (c === value ? null : c)), 1500);
        }
        catch {
            toast({ text: t('toast.copyFailed'), tone: 'bad' });
        }
    };
    return { copied, copy };
}
export const isHex = (s) => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);
export const rgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Readable text color on top of a color. */
export const inkOn = (hex) => {
    const [r, g, b] = rgb(hex);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0B1220' : '#FFFFFF';
};
