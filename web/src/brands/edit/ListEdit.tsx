import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { SaveBar, useSave } from './shared';

type Color = { hex?: string; name?: string; pantone?: string };
type Font = { fontFamily?: string; name?: string; role?: string; type?: string; url?: string; downloadUrl?: string; description?: string };
const HEX = /^#[0-9a-f]{6}$/i;

/** Brand palette: hex, name and Pantone per color, main color first. */
export function ColorsEdit({ brandId, colors }: { brandId: string; colors: Color[] }) {
  const { t } = useI18n();
  const { state, error, save } = useSave(brandId);
  const [list, setList] = useState<Color[]>(colors.filter((c) => HEX.test(c.hex ?? '')));
  const set = (i: number, patch: Color) => setList((l) => l.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="col g12">
      {list.map((c, i) => (
        <div key={i} className="row g8 wrap">
          <input type="color" aria-label="Color" value={HEX.test(c.hex ?? '') ? c.hex : '#000000'} onChange={(e) => set(i, { hex: e.target.value.toUpperCase() })} style={{ width: 44, height: 40, border: 0, background: 'none' }} />
          <input className="input" style={{ height: 40, width: 110 }} value={c.hex ?? ''} onChange={(e) => set(i, { hex: e.target.value })} aria-label="Hex" />
          <input className="input grow" style={{ height: 40, minWidth: 140 }} placeholder={t('be.colorName')} value={c.name ?? ''} onChange={(e) => set(i, { name: e.target.value })} />
          <input className="input" style={{ height: 40, width: 120 }} placeholder="Pantone" value={c.pantone ?? ''} onChange={(e) => set(i, { pantone: e.target.value })} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setList((l) => l.filter((_, j) => j !== i))}>{t('be.remove')}</button>
        </div>
      ))}
      <div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setList((l) => [...l, { hex: '#000000', name: '' }])}>+ {t('be.add')}</button></div>
      <SaveBar state={state} error={error} onSave={() => save({ colors: list.map((c) => ({ hex: (c.hex ?? '').trim(), name: c.name, pantone: c.pantone || undefined })) })} />
    </div>
  );
}

/** Brand fonts: family, use, Google Fonts or custom, optional link. */
export function FontsEdit({ brandId, fonts }: { brandId: string; fonts: Font[] }) {
  const { t } = useI18n();
  const { state, error, save } = useSave(brandId);
  const [list, setList] = useState<Font[]>(fonts.map((f) => ({ ...f, fontFamily: f.fontFamily ?? f.name ?? '' })));
  const set = (i: number, patch: Font) => setList((l) => l.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <div className="col g12">
      {list.map((f, i) => (
        <div key={i} className="row g8 wrap">
          <input className="input grow" style={{ height: 40, minWidth: 160 }} placeholder={t('be.font')} value={f.fontFamily ?? ''} onChange={(e) => set(i, { fontFamily: e.target.value })} />
          <input className="input" style={{ height: 40, width: 160 }} placeholder={t('be.fontRole')} value={f.role ?? ''} onChange={(e) => set(i, { role: e.target.value })} />
          <label className="row g4 t-sm"><input type="checkbox" checked={f.type === 'google'} onChange={(e) => set(i, { type: e.target.checked ? 'google' : 'custom' })} />{t('be.fontGoogle')}</label>
          <input className="input" style={{ height: 40, minWidth: 180 }} placeholder={t('be.fontUrl')} value={f.url ?? f.downloadUrl ?? ''} onChange={(e) => set(i, { url: e.target.value })} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setList((l) => l.filter((_, j) => j !== i))}>{t('be.remove')}</button>
        </div>
      ))}
      <div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setList((l) => [...l, { fontFamily: '', role: '', type: 'google' }])}>+ {t('be.add')}</button></div>
      <SaveBar state={state} error={error} onSave={() => save({
        typography: list.filter((f) => f.fontFamily?.trim()).map((f) => ({ fontFamily: f.fontFamily!.trim(), role: f.role, type: f.type === 'google' ? 'google' : 'custom', url: f.url || f.downloadUrl || undefined, description: f.description })),
      })} />
    </div>
  );
}
