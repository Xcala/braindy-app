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
          <p className="d-lg d-fit d-fit-lg" style={{ color: '#fff' }}>{brain.position}</p>
          <span className="row g8">
            <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />
            <span className="t-xs muted">{brain.status === 'signed' ? t('brand.signedBy') : t('brand.draftBy')}</span>
          </span>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {items.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className={`card col g12 sfield sf-${k.split('.')[1]}`}>
            <p className="label">{t(k)}</p>
            <Field text={v!} />
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

/** A strategy text as written in the Brand Brain: an intro paragraph, then "· Title — detail" lines shown as a list. */
function Field({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const isItem = (l: string) => /^([·•*–-]|\d+[.)])\s+/.test(l);
  const intro = lines.filter((l) => !isItem(l));
  const list = lines.filter(isItem).map((l) => l.replace(/^([·•*–-]|\d+[.)])\s+/, ''));
  return (
    <>
      {intro.map((p, i) => <p key={p} className={i === 0 ? 'sf-intro' : 'sf-v'}>{p}</p>)}
      {list.length > 0 && (
        <ul className="sf-list">
          {list.map((l) => {
            const m = /^(.{2,60}?)\s+[—–-]\s+(.+)$/.exec(l) ?? /^([^:]{2,40}):\s+(.+)$/.exec(l);
            return (
              <li key={l}>
                {m ? <><span className="sf-k">{m[1]}</span><span className="sf-v">{m[2]}</span></> : <span className="sf-solo">{l}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
