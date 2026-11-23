import { useSyncExternalStore } from 'react';

// The folder open in Library, per brand, shared by the explorer and the Upload button above it: upload lands where you
// are looking, and after an upload at the root the explorer opens the folder the files went to.
const open = new Map<string, string>();
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function useOpenFolder(brandId: string) {
  const path = useSyncExternalStore(subscribe, () => open.get(brandId) ?? '');
  const set = (p: string) => { if ((open.get(brandId) ?? '') === p) return; open.set(brandId, p); listeners.forEach((fn) => fn()); };
  return [path, set] as const;
}
