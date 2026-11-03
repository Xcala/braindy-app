import { useState } from 'react';
import type { Access } from './useAccesses';

/** What a row or card needs to be dragged: native drag events, a class while dragging, and a keyboard move. */
export type DragItem = { enabled: boolean; className: string; bind: React.HTMLAttributes<HTMLElement> & { draggable?: boolean }; move: (step: -1 | 1) => void };
const OFF: DragItem = { enabled: false, className: '', bind: {}, move: () => undefined };

/**
 * Drag to reorder the apps as they are shown. `group` is the group each one sits in when grouped by group
 * (null otherwise): dropping onto an app of another group moves it there. `commit` gets every id top to bottom.
 */
export function useDragOrder(items: { a: Access; group: string | null }[], enabled: boolean, commit: (ids: string[], groups: Record<string, string>) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const reset = () => { setDragId(null); setOverId(null); };

  // Removing first and inserting at the target's old index puts it after the target going down, before it going up.
  const place = (fromId: string, toId: string) => {
    const ids = items.map((i) => i.a.id);
    const from = ids.indexOf(fromId), to = ids.indexOf(toId);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(from, 1);
    ids.splice(to, 0, fromId);
    const target = items[to].group, mine = items[from].group;
    commit(ids, target !== null && target !== mine ? { [fromId]: target } : {});
  };

  return (a: Access): DragItem => !enabled ? OFF : {
    enabled: true,
    className: (dragId === a.id ? ' is-dragging' : '') + (overId === a.id && dragId && dragId !== a.id ? ' is-over' : ''),
    bind: {
      draggable: true,
      onDragStart: (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', a.platform); setDragId(a.id); },
      onDragOver: (e) => { if (!dragId) return; e.preventDefault(); if (overId !== a.id) setOverId(a.id); },
      onDrop: (e) => { e.preventDefault(); if (dragId) place(dragId, a.id); reset(); },
      onDragEnd: reset,
    },
    move: (step) => {
      const i = items.findIndex((x) => x.a.id === a.id);
      const next = items[i + step];
      if (i >= 0 && next) place(a.id, next.a.id);
    },
  };
}
