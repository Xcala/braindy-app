import { useState } from 'react';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import { contractsApi, type PresetKey } from '../api';
import { SignedUpload } from './SignedUpload';

const PRESETS: PresetKey[] = ['brand3m', 'marketing6m', 'empty'];

/** Admin · start a contract for a brand: prepare it here (from a plan), or upload one already signed outside. */
export function NewContract({ onCreated }: { onCreated: (brandId: string) => void }) {
  const { t } = useI18n();
  const { brands } = useBrands();
  const [brandId, setBrandId] = useState('');
  const [preset, setPreset] = useState<PresetKey>('brand3m');
  const [upload, setUpload] = useState(false);
  const [busy, setBusy] = useState(false);
  const fresh = !brands.find((b) => b.id === brandId)?.onboarding;
  const done = () => { onCreated(brandId); setBrandId(''); setUpload(false); };

  return (
    <div className="card col g8">
      <h2 className="h3">{t('ctr.a.new')}</h2>
      <select className="input" value={brandId} onChange={(e) => setBrandId(e.target.value)} aria-label={t('ob.a.pickBrand')}>
        <option value="">{t('ob.a.pickBrand')}</option>
        {brands.filter((b) => b.status === 'active').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      {!upload && (
        <>
          <select className="input" value={preset} onChange={(e) => setPreset(e.target.value as PresetKey)} aria-label={t('ctr.a.title')}>
            {PRESETS.map((p) => <option key={p} value={p}>{t(`ctr.p.${p}` as StringKey)}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" disabled={!brandId || !fresh || busy}
            onClick={() => { setBusy(true); contractsApi.create(brandId, preset).then(done).finally(() => setBusy(false)); }}>{t('ctr.a.newCreate')}</button>
        </>
      )}
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setUpload(!upload)}>{upload ? t('ctr.a.newCreate') : t('ctr.a.newUpload')}</button>
      {upload && brandId && <SignedUpload brandId={brandId} onDone={done} />}
    </div>
  );
}
