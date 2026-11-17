import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { useToast } from '../../components/Toaster';
import { slug } from '../../brands/identity/logoExport';

/**
 * «New brand» (2026-11-12): name, brand or group, and optionally the group it hangs from. It is created active and the
 * page opens its Manage sheet so NickMark adds its people right away. Same shape as a brand born from a won proposal.
 */
export function NewBrand({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { brands } = useBrands();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'brand' | 'group'>('brand');
  const [groupId, setGroupId] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const groups = brands.filter((b) => b.kind === 'group').sort((a, b) => a.name.localeCompare(b.name));
  const ok = name.trim().length >= 2;

  useEffect(() => {
    input.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  async function create() {
    if (!ok || busy) return;
    setBusy(true);
    const clean = name.trim();
    const base = slug(clean) || `brand-${Date.now().toString(36)}`;
    try {
      let id = base;
      for (let i = 2; (await getDoc(doc(db, 'brands', id))).exists(); i++) id = `${base}-${i}`;
      const parent = brands.find((b) => b.id === groupId);
      const parentAncestors = parent ? (((await getDoc(doc(db, 'brands', parent.id))).get('ancestors') as string[]) ?? []) : [];
      await setDoc(doc(db, 'brands', id), {
        name: clean, slug: id, kind, groupId: parent?.id ?? null, ancestors: parent ? [parent.id, ...parentAncestors] : [],
        status: 'active', logoUrl: null, legacyIds: { brands: [], orbit: [], brandingProjects: [], briefEmails: [] },
        createdInApp: true, createdAt: serverTimestamp(),
      });
      toast({ text: t('anav.newDone', { name: clean }), tone: 'ok' });
      onCreated(id);
    } catch {
      toast({ text: t('anav.newError'), tone: 'bad' });
      setBusy(false);
    }
  }

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal w-full max-w-[30rem]" role="dialog" aria-modal="true" aria-labelledby="nb-title" onSubmit={(e) => { e.preventDefault(); void create(); }}>
        <h2 className="h2" id="nb-title">{t('anav.newTitle')}</h2>
        <label className="col g8">
          <span className="label">{t('anav.newName')}</span>
          <input ref={input} className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="col g8">
          <span className="label">{t('anav.newKind')}</span>
          <div className="seg self-start" role="radiogroup" aria-label={t('anav.newKind')}>
            {(['brand', 'group'] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>
                {k === 'group' ? t('brand.group') : t('admin.brands.brand')}
              </button>
            ))}
          </div>
        </div>
        {groups.length > 0 && (
          <label className="col g8">
            <span className="label">{t('anav.newGroup')}</span>
            <select className="input" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">{t('anav.newNoGroup')}</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        )}
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t('anav.newHint')}</p>
        <div className="row g12 wrap" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={!ok || busy}>{t('anav.newCreate')}</button>
        </div>
      </form>
    </div>
  );
}
