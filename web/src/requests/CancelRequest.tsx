import { useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { BrandRequest } from './types';

const call = (brandId: string, id: string, undo: boolean) =>
  api(`/v1/brands/${brandId}/requests/${id}/cancel`, { method: 'POST', body: JSON.stringify({ undo }) });

/** «Cancel request» (2026-11-20): for a request sent by mistake, while it is not approved. Asks first; NickMark is told. */
export function CancelButton({ brandId, r }: { brandId: string; r: BrandRequest }) {
  const { t } = useI18n();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  if (r.cancelled || r.status === 'approved' || r.status === 'published') return null;
  const go = () => {
    setBusy(true);
    call(brandId, r.id, false).then(() => { setAsking(false); toast({ text: t('rc.done'), tone: 'ok' }); }, () => toast({ text: t('rc.error'), tone: 'bad' })).finally(() => setBusy(false));
  };
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsking(true)}>{t('rc.cancel')}</button>
      {asking && (
        <ConfirmDialog title={t('rc.ask', { title: r.title })} confirmLabel={t('rc.cancel')} danger busy={busy} onConfirm={go} onCancel={() => setAsking(false)}>
          <p className="t-sm t-mute" style={{ margin: 0 }}>{t('rc.askBody')}</p>
        </ConfirmDialog>
      )}
    </>
  );
}

/** Shown on a cancelled request: when, and «Reopen» (back to where it was). */
export function CancelledBanner({ brandId, r, canUndo }: { brandId: string; r: BrandRequest; canUndo: boolean }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!r.cancelled) return null;
  const day = r.cancelled.at?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }) ?? '';
  const undo = () => {
    setBusy(true);
    call(brandId, r.id, true).then(() => toast({ text: t('rc.reopened'), tone: 'ok' }), () => toast({ text: t('rc.error'), tone: 'bad' })).finally(() => setBusy(false));
  };
  return (
    <div className="row between g12 wrap" role="status" style={{ background: 'var(--danger-bg)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', alignItems: 'center' }}>
      <span className="t-sm"><b>{t('rc.chip')}.</b> {t('rc.banner', { day })}</span>
      {canUndo && <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={undo}>{t('rc.reopen')}</button>}
    </div>
  );
}
