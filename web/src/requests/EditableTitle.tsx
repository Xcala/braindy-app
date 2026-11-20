import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { renameRequest } from './api';

/**
 * The request's title, with a pencil for whoever may rename it (who asked, who approves, or the studio). What is typed
 * is never lost: it saves with Enter, the Save button, or simply leaving the field (tapping elsewhere or moving to
 * another request). Only Escape or Cancel throw it away. The request listens live, so the new title shows everywhere.
 */
export function EditableTitle({ brandId, requestId, title, canEdit }: { brandId: string; requestId: string; title: string; canEdit: boolean }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // What is being edited and for which request, so moving to another request still saves the right one.
  const pending = useRef<{ requestId: string; title: string; value: string } | null>(null);

  async function persist(p: { requestId: string; title: string; value: string }) {
    const next = p.value.replace(/\s+/g, ' ').trim();
    if (!next || next === p.title) return true;
    await renameRequest(brandId, p.requestId, next);
    return true;
  }

  // Leaving this request (arrows, back, another page) with a title half-typed: save it, never drop it.
  useEffect(() => () => {
    const p = pending.current;
    pending.current = null;
    if (p) void persist(p).catch(() => undefined);
  }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setEditing(false); setError(false); setSaved(false); }, [requestId]);
  useEffect(() => { if (!saved) return; const id = setTimeout(() => setSaved(false), 2500); return () => clearTimeout(id); }, [saved]);

  const start = () => { setValue(title); setError(false); setSaved(false); pending.current = { requestId, title, value: title }; setEditing(true); };
  const cancel = () => { pending.current = null; setEditing(false); setError(false); };
  const change = (v: string) => { setValue(v); pending.current = { requestId, title, value: v }; };

  async function save() {
    const p = pending.current;
    if (!p || busy) return;
    const next = p.value.replace(/\s+/g, ' ').trim();
    if (!next || next === p.title) { cancel(); return; }
    setBusy(true); setError(false);
    try {
      await persist(p);
      pending.current = null;
      setEditing(false); setSaved(true);
    } catch { setError(true); } finally { setBusy(false); }
  }

  if (!editing) {
    return (
      <span className="row g8" style={{ minWidth: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 className="h2" style={{ overflowWrap: 'anywhere', minWidth: 0 }}>{title}</h1>
        {canEdit && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={start} aria-label={t('as.rename')} title={t('as.rename')}>
            <Icon name="pencil" size={16} />
          </button>
        )}
        {saved && <span className="chip c-approved" role="status"><Icon name="check" size={14} />{t('as.renamed')}</span>}
      </span>
    );
  }

  return (
    <form ref={formRef} className="col g8" style={{ minWidth: 0, width: '100%', flexBasis: '100%' }} onSubmit={(e) => { e.preventDefault(); void save(); }}
      onBlur={(e) => { if (!formRef.current?.contains(e.relatedTarget as Node | null)) void save(); }}>
      <div className="row g8 wrap">
        <input className="input grow" autoFocus maxLength={160} value={value} aria-label={t('as.titleLabel')} style={{ height: '2.75rem', fontSize: '1.125rem', fontWeight: 700, minWidth: '14rem' }}
          onChange={(e) => change(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }} />
        <button type="submit" className="btn btn-primary btn-sm" style={{ height: '2.75rem' }} disabled={busy || !value.trim()}>{t('as.renameSave')}</button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ height: '2.75rem' }} onMouseDown={(e) => e.preventDefault()} onClick={cancel}>{t('as.renameCancel')}</button>
      </div>
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)', margin: 0 }}>{t('as.renameError')}</p>}
    </form>
  );
}
