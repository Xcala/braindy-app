import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import type { VoiceDoc } from '../identity/Voice';
import type { BrainDoc } from '../identity/Strategy';
import { commas, lines, SaveBar, useSave } from './shared';

function Field({ label, value, onChange, rows = 2 }: { label: StringKey; value: string; onChange: (v: string) => void; rows?: number }) {
  const { t } = useI18n();
  return (
    <label className="col g4"><span className="t-sm w7">{t(label)}</span>
      <textarea className="input" rows={rows} style={{ padding: '10px 12px', resize: 'vertical', lineHeight: 1.45 }} value={value} onChange={(e) => onChange(e.target.value)} /></label>
  );
}

/** Tone and voice: essence, archetypes, principles, how it sounds and does not, key language, example. */
export function VoiceEdit({ brandId, voice }: { brandId: string; voice: (VoiceDoc & { archetype?: string[] }) | null }) {
  const { state, error, save } = useSave(brandId);
  const [f, setF] = useState({
    essence: voice?.essence?.title ?? '', essenceDesc: voice?.essence?.description ?? '', archetype: (voice?.archetype ?? []).join(', '),
    principles: (voice?.tonePrinciples ?? []).map((p) => [p.title, p.description].filter(Boolean).join(' — ')).join('\n'),
    is: (voice?.howItSounds?.is ?? []).join('\n'), isNot: (voice?.howItSounds?.isNot ?? []).join('\n'),
    keyLanguage: (voice?.keyLanguage ?? []).join(', '), example: voice?.example ?? '',
  });
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="col g12">
      <Field label="be.essence" value={f.essence} onChange={set('essence')} rows={1} />
      <Field label="be.essenceDesc" value={f.essenceDesc} onChange={set('essenceDesc')} rows={3} />
      <Field label="be.archetype" value={f.archetype} onChange={set('archetype')} rows={1} />
      <Field label="be.principles" value={f.principles} onChange={set('principles')} rows={4} />
      <div className="grid gap-3 sm:grid-cols-2"><Field label="be.is" value={f.is} onChange={set('is')} rows={4} /><Field label="be.isNot" value={f.isNot} onChange={set('isNot')} rows={4} /></div>
      <Field label="be.keyLanguage" value={f.keyLanguage} onChange={set('keyLanguage')} />
      <Field label="be.example" value={f.example} onChange={set('example')} />
      <SaveBar state={state} error={error} onSave={() => save({
        voice: {
          essence: { title: f.essence, description: f.essenceDesc }, archetype: commas(f.archetype).slice(0, 3),
          tonePrinciples: lines(f.principles).map((l) => { const [title, ...rest] = l.split(/\s+[—–-]\s+/); return { title, description: rest.join(' — ') }; }),
          howItSounds: { is: lines(f.is), isNot: lines(f.isNot) }, keyLanguage: commas(f.keyLanguage), example: f.example,
          ...(voice?.toneBalance ? { toneBalance: voice.toneBalance } : {}),
        },
      })} />
    </div>
  );
}

/** Strategy: positioning, audiences, goals and what to avoid (competitors stay as they are). */
export function StrategyEdit({ brandId, brain }: { brandId: string; brain: BrainDoc | null }) {
  const { state, error, save } = useSave(brandId);
  const [f, setF] = useState({ position: brain?.position ?? '', audiences: brain?.audiences ?? '', goals: brain?.goals ?? '', avoid: brain?.avoid ?? '' });
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="col g12">
      <Field label="be.position" value={f.position} onChange={set('position')} rows={3} />
      <Field label="be.audiences" value={f.audiences} onChange={set('audiences')} rows={3} />
      <Field label="be.goals" value={f.goals} onChange={set('goals')} rows={3} />
      <Field label="be.avoid" value={f.avoid} onChange={set('avoid')} rows={2} />
      <SaveBar state={state} error={error} onSave={() => save({ strategy: f })} />
    </div>
  );
}
