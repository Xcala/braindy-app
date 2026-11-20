import { useEffect, useRef } from 'react';
import { api } from '../lib/api';

type Due = { id: string; text: string; at: number };

/** Once per brand and visit: the reminders the person set in the chat that are due now (the server marks them shown). */
export function useDueReminders(brandId: string, onDue: (due: Due[]) => void) {
  const seen = useRef(new Set<string>());
  const cb = useRef(onDue);
  cb.current = onDue;
  useEffect(() => {
    if (!brandId || seen.current.has(brandId)) return;
    seen.current.add(brandId);
    api<{ due: Due[] }>(`/v1/help/reminders/due?brandId=${encodeURIComponent(brandId)}`)
      .then((r) => { if (r.due?.length) cb.current(r.due); })
      .catch(() => { /* older API or offline: the push alert still reaches them */ });
  }, [brandId]);
}
