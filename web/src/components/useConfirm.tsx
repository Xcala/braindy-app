import { useCallback, useState, type ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

type Ask = { title: string; body?: ReactNode; confirmLabel: string; danger?: boolean };

/**
 * Braindy's own confirmation instead of window.confirm (UX #7).
 * const [dialog, ask] = useConfirm(); render {dialog}; then: if (await ask({ title, confirmLabel })) …
 */
export function useConfirm(): [ReactNode, (a: Ask) => Promise<boolean>] {
  const [open, setOpen] = useState<(Ask & { done: (v: boolean) => void }) | null>(null);
  const ask = useCallback((a: Ask) => new Promise<boolean>((done) => setOpen({ ...a, done })), []);
  const finish = (v: boolean) => { open?.done(v); setOpen(null); };
  const dialog = open ? (
    <ConfirmDialog title={open.title} confirmLabel={open.confirmLabel} danger={open.danger} onConfirm={() => finish(true)} onCancel={() => finish(false)}>{open.body}</ConfirmDialog>
  ) : null;
  return [dialog, ask];
}
