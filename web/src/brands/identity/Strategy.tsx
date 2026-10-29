import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';

export type BrainDoc = {
  status?: 'draft' | 'signed'; position?: string; audiences?: string; goals?: string; avoid?: string;
  competitors?: Array<{ name?: string; promise?: string; price?: string; url?: string }>;
};

/** The strategy NickMark defined (the signed Brand Brain): what the client most needs to see and share. */
export function Strategy({ brain }: { brain: BrainDoc }) {
  const { t } = useI18n();
  const items: Array<[StringKey, string | undefined]> = [
    ['brand.audiences', brain.audiences], ['brand.goals', brain.goals], ['brand.avoid', brain.avoid],
  ];
  const comps = (brain.competitors ?? []).filter((c) => c.name);
  return (
    <div className="col g20">
      {brain.position && (
        <div className="stage col g12 rounded-[24px] p-6 sm:p-10">
          <p className="label">{t('brand.position')}</p>
          <p className="d-lg" style={{ color: '#fff', fontSize: 34, lineHeight: '40px' }}>{brain.position}</p>
          <span className="row g8">
            <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />
            <span className="t-xs muted">{brain.status === 'signed' ? t('brand.signedBy') : t('brand.draftBy')}</span>
          </span>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {items.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="card col g8">
            <p className="label">{t(k)}</p>
            <p style={{ whiteSpace: 'pre-line' }}>{v}</p>
          </div>
        ))}
      </div>
      {comps.length > 0 && (
        <div className="card col g12">
          <p className="label">{t('brand.competitors')}</p>
          {comps.map((c) => (
            <div key={c.name} className="row between g12 wrap t-sm">
              <span className="w7">{c.name}</span>
              <span className="t-mute">{[c.promise, c.price].filter(Boolean).join(' · ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const hasStrategy = (b?: BrainDoc | null) => !!b && !!(b.position || b.audiences || b.goals || b.avoid);
