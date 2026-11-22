import { useRef, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Brand } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { useToast } from '../../components/Toaster';

/** The image is shrunk in the browser to 256 px on its longest side (WebP, keeps transparency) and kept on the brand
 *  itself, so it shows everywhere at once with no extra file to host. */
async function shrink(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, 256 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/webp', 0.9);
}

/** Manage › name and image of the brand (admin). A plain fix: renaming here is not a rebrand (that keeps a version). */
export function BrandIdentityEdit({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const toast = useToast();
  const [name, setName] = useState(brand.name);
  const [busy, setBusy] = useState(false);
  const pick = useRef<HTMLInputElement>(null);
  const save = async (patch: Partial<Pick<Brand, 'name' | 'logoUrl'>>) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'brands', brand.id), { ...patch, updatedAt: serverTimestamp() });
      toast({ text: t('anav.saved'), tone: 'ok' });
    } catch { toast({ text: t('anav.saveError'), tone: 'bad' }); } finally { setBusy(false); }
  };
  const clean = name.trim();
  return (
    <div className="card col g12" style={{ padding: '1rem' }}>
      <span className="w7">{t('anav.identity')}</span>
      <div className="row g12" style={{ alignItems: 'center' }}>
        <span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none', flex: 'none' }}><BrandMark brand={brand} /></span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => pick.current?.click()}>{t('anav.image')}</button>
        {brand.logoUrl && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void save({ logoUrl: null })}>{t('anav.imageRemove')}</button>}
        <input ref={pick} type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) { try { await save({ logoUrl: await shrink(f) }); } catch { toast({ text: t('anav.saveError'), tone: 'bad' }); } }
        }} />
      </div>
      <p className="t-xs t-mute" style={{ margin: 0 }}>{t('anav.imageHint')}</p>
      <form className="row g8" onSubmit={(e) => { e.preventDefault(); if (clean && clean !== brand.name) void save({ name: clean }); }}>
        <input className="input" style={{ flex: 1, minWidth: 0 }} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label={t('anav.newName')} />
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !clean || clean === brand.name}>{t('anav.save')}</button>
      </form>
    </div>
  );
}
