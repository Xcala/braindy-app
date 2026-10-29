import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { fromUrl, PickImages, SaveBar, Thumb, toSrc, useSave, type Img } from './shared';

export type LogoSet = { primary?: string; secondary?: string; icon?: string; variations?: string[] };

/** Logos: primary, secondary, icon and other versions. */
export function LogosEdit({ brandId, logos }: { brandId: string; logos?: LogoSet }) {
  const { t } = useI18n();
  const { state, error, save } = useSave(brandId);
  const [slots, setSlots] = useState<Record<'primary' | 'secondary' | 'icon', Img | null>>({ primary: fromUrl(logos?.primary), secondary: fromUrl(logos?.secondary), icon: fromUrl(logos?.icon) });
  const [vars, setVars] = useState<Img[]>((logos?.variations ?? []).filter((v) => v.startsWith('http')).map((v) => fromUrl(v)!));
  const [err, setErr] = useState('');

  return (
    <div className="col g16">
      <p className="t-xs t-mute">{t('be.imgHint')}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {(['primary', 'secondary', 'icon'] as const).map((k) => (
          <div key={k} className="col g8">
            <span className="label">{t(k === 'primary' ? 'brand.logoPrimary' : k === 'secondary' ? 'brand.logoSecondary' : 'brand.logoIcon')}</span>
            {slots[k] ? <Thumb img={slots[k]!} onRemove={() => setSlots((s) => ({ ...s, [k]: null }))} /> : <div className="card t-sm t-mute">{t('be.empty')}</div>}
            <PickImages onError={setErr} onPick={([img]) => setSlots((s) => ({ ...s, [k]: img }))}>{slots[k] ? t('be.replace') : t('be.upload')}</PickImages>
          </div>
        ))}
      </div>
      <div className="row between g8"><span className="label">{t('be.variations')}</span>
        <PickImages multiple onError={setErr} onPick={(imgs) => setVars((v) => [...v, ...imgs])}>{t('be.addImages')}</PickImages></div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">{vars.map((v, i) => <Thumb key={v.preview} img={v} onRemove={() => setVars((x) => x.filter((_, j) => j !== i))} />)}</div>
      {err && <p className="t-sm" style={{ color: 'var(--danger)' }}>{err}</p>}
      <SaveBar state={state} error={error} onSave={() => save({
        logos: {
          ...Object.fromEntries((['primary', 'secondary', 'icon'] as const).map((k) => [k, slots[k] ? toSrc(slots[k]!) : null])),
          variations: vars.map(toSrc),
        },
      })} />
    </div>
  );
}

/** Concept images or mockups: a list of images with a caption each. */
export function ImagesEdit({ brandId, field, items }: { brandId: string; field: 'concept' | 'mockups'; items: Array<{ url?: string; caption?: string; name?: string }> }) {
  const { t } = useI18n();
  const { state, error, save } = useSave(brandId);
  const [list, setList] = useState<Array<{ img: Img; text: string }>>(items.filter((i) => i.url?.startsWith('http')).map((i) => ({ img: fromUrl(i.url)!, text: i.caption ?? i.name ?? '' })));
  const [err, setErr] = useState('');
  return (
    <div className="col g16">
      <div><PickImages multiple onError={setErr} onPick={(imgs) => setList((l) => [...l, ...imgs.map((img) => ({ img, text: '' }))])}>{t('be.addImages')}</PickImages></div>
      {list.length === 0 && <p className="t-sm t-mute">{t('be.empty')}</p>}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {list.map((x, i) => (
          <Thumb key={x.img.preview} img={x.img} onRemove={() => setList((l) => l.filter((_, j) => j !== i))}>
            <input className="input" style={{ height: 36, fontSize: 13 }} placeholder={t(field === 'concept' ? 'be.caption' : 'be.mockupName')} value={x.text}
              onChange={(e) => setList((l) => l.map((y, j) => (j === i ? { ...y, text: e.target.value } : y)))} />
          </Thumb>
        ))}
      </div>
      {err && <p className="t-sm" style={{ color: 'var(--danger)' }}>{err}</p>}
      <SaveBar state={state} error={error} onSave={() => save(field === 'concept'
        ? { concept: list.map((x) => ({ image: toSrc(x.img), caption: x.text })) }
        : { mockups: list.map((x) => ({ image: toSrc(x.img), name: x.text })) })} />
    </div>
  );
}
