import { useI18n } from '../../i18n/I18nProvider';

export type VoiceDoc = {
  essence?: { title?: string; description?: string };
  tonePrinciples?: Array<{ id?: string; title?: string; description?: string }>;
  howItSounds?: { is?: string[]; isNot?: string[] };
  toneBalance?: { tradition?: number; modernity?: number; intellect?: number; emotion?: number };
  keyLanguage?: string[];
  example?: string;
};

export function Voice({ voice }: { voice: VoiceDoc | null }) {
  const { t } = useI18n();
  if (!voice) return null;
  const { essence, tonePrinciples = [], howItSounds, toneBalance, example } = voice;
  const keyLanguage = (voice.keyLanguage ?? []).flatMap((k) => k.split(/[·,;]/)).map((k) => k.trim()).filter(Boolean);

  return (
    <div className="col g20">
      <div className={`grid gap-5 ${toneBalance || keyLanguage.length ? 'lg:grid-cols-[1.2fr_1fr]' : ''}`}>
        <div className="card col g20">
          <p className="label">{t('brand.essence')}</p>
          {essence?.title && <p className="d-lg" style={{ fontSize: 30, lineHeight: '36px' }}><span className="w9">{essence.title}</span></p>}
          {essence?.description && <p className="t-mute">{essence.description}</p>}
          {example && <p className="t-lg w7">{example}</p>}
          {(howItSounds?.is?.length || howItSounds?.isNot?.length) ? (
            <>
              <div className="divider" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col g8"><p className="label">{t('brand.is')}</p>{(howItSounds?.is ?? []).map((s) => <p key={s}>{s}</p>)}</div>
                <div className="col g8"><p className="label">{t('brand.isNot')}</p>{(howItSounds?.isNot ?? []).map((s) => <p key={s} className="t-mute">{s}</p>)}</div>
              </div>
            </>
          ) : null}
        </div>
        {(toneBalance || keyLanguage.length > 0) && (
          <div className="card col g20">
            {toneBalance && (
              <>
                <p className="label">{t('brand.toneBalance')}</p>
                <Balance left={t('brand.tradition')} right={t('brand.modernity')} a={toneBalance.tradition} b={toneBalance.modernity} />
                <Balance left={t('brand.intellect')} right={t('brand.emotion')} a={toneBalance.intellect} b={toneBalance.emotion} />
              </>
            )}
            {keyLanguage.length > 0 && (
              <>
                {toneBalance && <div className="divider" />}
                <p className="label">{t('brand.keyLanguage')}</p>
                <div className="row g8 wrap">{keyLanguage.map((k) => <span key={k} className="chip chip-plain c-type">{k}</span>)}</div>
              </>
            )}
          </div>
        )}
      </div>
      {tonePrinciples.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tonePrinciples.map((p, i) => (
            <div key={p.id ?? p.title} className="card col g8">
              <span className="sec-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="h3">{p.title}</span>
              {p.description && <p className="t-sm t-mute">{p.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Position between two poles, from the two weights stored in the brand book. */
function Balance({ left, right, a, b }: { left: string; right: string; a?: number; b?: number }) {
  const set = typeof a === 'number' && typeof b === 'number' && a + b > 0;
  const pos = set ? (b! / (a! + b!)) * 100 : 50;
  return (
    <div className="col g8">
      <div className="row between t-sm"><span className="w7">{left}</span><span className="w7">{right}</span></div>
      <div className={`track ${set ? '' : 'unset'}`} role={set ? 'img' : undefined} aria-label={set ? `${left} ${Math.round(100 - pos)}% · ${right} ${Math.round(pos)}%` : undefined}>
        {set && <span className="knob" style={{ left: `${pos}%` }} />}
      </div>
    </div>
  );
}
