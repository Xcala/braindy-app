import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { Popover } from '../requests/Popover';
import { useToast } from '../components/Toaster';
import { shareApi, shareUrl, type ShareKind, type ShareLink } from './api';

/**
 * On My files, for NickMark and the brand's owners: a link to receive files without an account, and the showcase of
 * approved work. Nothing shows for anyone else (the API answers 403).
 */
export function ShareLinks({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [links, setLinks] = useState<Record<ShareKind, ShareLink[]> | null>(null);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => shareApi.list(brandId).then(setLinks, () => setLinks(null)), [brandId]);
  useEffect(() => { void load(); }, [load]);
  if (!links) return null;

  const copy = async (kind: ShareKind, token: string) => {
    await navigator.clipboard.writeText(shareUrl(kind, token)).catch(() => undefined);
    toast({ text: t('ul.copied') });
  };
  const create = async (kind: ShareKind) => {
    setBusy(true);
    try { const { token } = await shareApi.create(brandId, kind, kind === 'upload' ? label.trim() : ''); setLabel(''); await load(); await copy(kind, token); }
    finally { setBusy(false); }
  };
  const off = async (kind: ShareKind, token: string) => { await shareApi.off(brandId, kind, token); await load(); toast({ text: t('ul.offDone') }); };
  const show = links.showcase[0];

  return (
    <div className="row g8 wrap">
      <Popover align="right" className="btn btn-secondary" label={<><Icon name="upload" />{t('ul.btn')}</>}>
        {() => (
          <div className="col g12">
            <p className="w7">{t('ul.title')}</p>
            <p className="t-sm t-mute">{t('ul.lead')}</p>
            {links.upload.length === 0 && <p className="t-xs t-mute">{t('ul.none')}</p>}
            {links.upload.map((l) => (
              <div key={l.token} className="col g4 share-row">
                <span className="t-sm w7 truncate">{l.label || t('ul.title')}</span>
                <span className="t-xs t-mute">{t('ul.count', { n: l.count })}</span>
                <div className="row g8">
                  <button className="btn btn-primary btn-sm" onClick={() => copy('upload', l.token)}>{t('ul.copy')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => off('upload', l.token)}>{t('ul.off')}</button>
                </div>
              </div>
            ))}
            <label className="col g4"><span className="t-xs w7">{t('ul.label')}</span>
              <input className="input" value={label} maxLength={60} placeholder={t('ul.labelPh')} onChange={(e) => setLabel(e.target.value)} style={{ height: '2.5rem' }} />
            </label>
            <button className="btn btn-secondary btn-sm self-start" disabled={busy} onClick={() => create('upload')}><Icon name="plus" size={16} />{t('ul.create')}</button>
          </div>
        )}
      </Popover>
      <Popover align="right" className="btn btn-secondary" label={<><Icon name="grid" />{t('sh.btn')}</>}>
        {() => (
          <div className="col g12">
            <p className="w7">{t('sh.title')}</p>
            <p className="t-sm t-mute">{t('sh.lead')}</p>
            {show ? (
              <div className="row g8 wrap">
                <a className="btn btn-primary btn-sm" href={shareUrl('showcase', show.token)} target="_blank" rel="noreferrer">{t('sh.open')} ↗</a>
                <button className="btn btn-secondary btn-sm" onClick={() => copy('showcase', show.token)}>{t('sh.copy')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => off('showcase', show.token)}>{t('sh.off')}</button>
              </div>
            ) : <button className="btn btn-primary btn-sm self-start" disabled={busy} onClick={() => create('showcase')}>{t('sh.create')}</button>}
          </div>
        )}
      </Popover>
    </div>
  );
}
