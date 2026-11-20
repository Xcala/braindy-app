import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { renameRequest } from './api';

/** A request's name in the list, with a pencil to rename it right there. Saves on Enter or leaving the field. */
export function RowTitle({ brandId, id, title, canEdit }: { brandId: string; id: string; title: string; canEdit: boolean }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState(false);
  const done = useRef(false);

  async function save() {
    if (done.current) return;
    done.current = true;
    const next = value.replace(/\s+/g, ' ').trim();
    if (!next || next === title) { setEditing(false); return; }
    try { await renameRequest(brandId, id, next); setEditing(false); setError(false); }
    catch { setError(true); done.current = false; }
  }

  if (editing) {
    return (
      <span className="col g4 min-w-0">
        <input className="input" autoFocus maxLength={160} value={value} aria-label={t('as.titleLabel')} style={{ height: '2.25rem', fontWeight: 700 }}
          onChange={(e) => { setValue(e.target.value); done.current = false; }} onBlur={() => void save()}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void save(); } if (e.key === 'Escape') { done.current = true; setEditing(false); } }} />
        {error && <span className="t-xs" role="alert" style={{ color: 'var(--danger)' }}>{t('as.renameError')}</span>}
      </span>
    );
  }
  return (
    <span className="row g4 min-w-0" style={{ alignItems: 'center' }}>
      <Link to={`/requests/${id}`} className="w7 truncate" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{title}</Link>
      {canEdit && (
        <button type="button" className="btn btn-ghost btn-sm flex-none" style={{ height: '1.75rem', padding: '0 0.375rem' }} aria-label={t('as.rename')} title={t('as.rename')}
          onClick={() => { setValue(title); setError(false); done.current = false; setEditing(true); }}>
          <Icon name="pencil" size={14} />
        </button>
      )}
    </span>
  );
}
