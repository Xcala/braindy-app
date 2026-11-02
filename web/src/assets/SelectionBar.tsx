import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import type { FileActions } from './useFileActions';

/**
 * What to do with the ticked files: download them as a .zip (everyone) and, for NickMark, move them to a folder or
 * send them to the trash. Without a selection it only offers "Select all".
 */
export function SelectionBar({ actions, pageIds, folders, admin }: { actions: FileActions; pageIds: string[]; folders: string[]; admin: boolean }) {
  const { t } = useI18n();
  const [to, setTo] = useState('');
  const ids = [...actions.picked];
  if (!ids.length) {
    return pageIds.length > 0
      ? <button type="button" className="t-xs w7 self-start" style={{ color: 'var(--azul)' }} onClick={() => actions.setPicked(new Set(pageIds))}>{t('files.selectAll')}</button>
      : null;
  }
  return (
    <div className="selbar" role="toolbar" aria-label={t('files.selected', { n: String(ids.length) })}>
      <span className="fx-count">{t('files.selected', { n: String(ids.length) })}</span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={actions.busy} onClick={() => actions.zip(ids)}><Icon name="download" size={14} /> {t('files.zip')}</button>
      {admin && (
        <span className="fx-move">
          <label className="fx-select is-sm"><select value={to} onChange={(e) => setTo(e.target.value)} aria-label={t('files.moveTo')}>
            <option value="">{t('files.moveTo')}…</option>
            {folders.map((p) => <option key={p || '·'} value={p || '/'}>{p || t('files.rootFolder')}</option>)}
          </select><Icon name="chevronDown" size={14} /></label>
          <button type="button" className="btn btn-secondary btn-sm" disabled={!to || actions.busy} onClick={() => { actions.move(ids, to === '/' ? '' : to); setTo(''); }}>{t('files.moveBtn')}</button>
        </span>
      )}
      {admin && (
        <button type="button" className="btn btn-danger btn-sm" disabled={actions.busy}
          onClick={() => window.confirm(t('files.deleteSelConfirm', { n: String(ids.length) })) && actions.trash(ids)}>
          <Icon name="trash" size={14} /> {t('files.toTrash')}
        </button>
      )}
      <button type="button" className="btn btn-ghost btn-sm fx-end" disabled={actions.busy} onClick={actions.clear}>{t('files.clearSel')}</button>
    </div>
  );
}
