import { useRef, type FormEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { FileActions } from './useFileActions';

/** The Braindy dialogs of the file browser: send to the trash, and rename (in place of the browser's own boxes). */
export function FileDialogs({ actions }: { actions: FileActions }) {
  const { t } = useI18n();
  const field = useRef<HTMLInputElement>(null);
  const ask = actions.ask;
  if (!ask) return null;

  if (ask.kind === 'trash') {
    const one = ask.ids.length === 1 && ask.name;
    return (
      <ConfirmDialog danger title={t('files.toTrash')} confirmLabel={t('files.toTrash')} busy={actions.busy} onCancel={actions.closeAsk}
        onConfirm={() => { actions.closeAsk(); actions.trash(ask.ids); }}>
        {one ? t('files.deleteConfirm', { name: ask.name! }) : t('files.deleteSelConfirm', { n: String(ask.ids.length) })}
      </ConfirmDialog>
    );
  }

  const f = ask.f;
  const save = (e?: FormEvent) => { e?.preventDefault(); actions.closeAsk(); actions.rename(f, field.current?.value.trim() ?? ''); };
  return (
    <ConfirmDialog title={t('files.rename')} confirmLabel={t('files.rename')} onCancel={actions.closeAsk} onConfirm={save}>
      <form onSubmit={save} className="col g8" style={{ marginTop: 4 }}>
        <label className="t-sm w7" htmlFor="file-rename" style={{ color: 'var(--ink)' }}>{t('files.renamePrompt')}</label>
        {/* Uncontrolled: typing does not re-render the dialog (which would move the focus). */}
        <input id="file-rename" ref={field} className="input" defaultValue={f.title} data-autofocus
          onFocus={(e) => { const dot = f.title.lastIndexOf('.'); e.currentTarget.setSelectionRange(0, dot > 0 ? dot : f.title.length); }} />
      </form>
    </ConfirmDialog>
  );
}
