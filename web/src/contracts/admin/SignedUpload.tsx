import { useState } from 'react';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { contractsApi } from '../api';

const toBase64 = (f: File) => new Promise<string>((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] ?? '');
  r.onerror = () => ko(r.error);
  r.readAsDataURL(f);
});

/** Admin · a contract already signed outside Braindy: pick the brand and the PDF, and it shows as signed in Mi plan and My files. */
export function SignedUpload() {
  const { t } = useI18n();
  const { brands } = useBrands();
  const [brandId, setBrandId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: '', signedOn: '', clientName: '', clientRole: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const send = async () => {
    if (!brandId || !file || !form.signedOn) return;
    setBusy(true); setMsg(null);
    try {
      await contractsApi.uploadSigned(brandId, { ...form, pdf: await toBase64(file), fileName: file.name });
      setMsg(t('ctr.u.done')); setFile(null); setForm({ title: '', signedOn: '', clientName: '', clientRole: '' });
    } catch { setMsg(t('ob.a.error')); } finally { setBusy(false); }
  };

  return (
    <div className="card col g8">
      <h2 className="h3">{t('ctr.u.title')}</h2>
      <p className="t-xs t-mute">{t('ctr.u.sub')}</p>
      <select className="input" value={brandId} onChange={(e) => setBrandId(e.target.value)} aria-label={t('ob.a.pickBrand')}>
        <option value="">{t('ob.a.pickBrand')}</option>
        {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <input className="input" type="file" accept="application/pdf" aria-label={t('ctr.u.file')} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <input className="input" placeholder={t('ctr.u.name')} aria-label={t('ctr.u.name')} value={form.title} onChange={set('title')} />
      <label className="col g4 t-sm"><span className="w7">{t('ctr.u.date')}</span><input className="input" type="date" value={form.signedOn} onChange={set('signedOn')} /></label>
      <input className="input" placeholder={t('ctr.u.signer')} aria-label={t('ctr.u.signer')} value={form.clientName} onChange={set('clientName')} />
      <input className="input" placeholder={t('ctr.u.role')} aria-label={t('ctr.u.role')} value={form.clientRole} onChange={set('clientRole')} />
      <button className="btn btn-secondary btn-sm" disabled={busy || !brandId || !file || !form.signedOn} onClick={send}>{t('ctr.u.send')}</button>
      {msg && <p className="t-sm" role="status">{msg}</p>}
    </div>
  );
}
