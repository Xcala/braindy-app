import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { StringKey } from '../i18n/strings';

export type Group = { key: string; calls: number; failed: number; retried: number; usd: number; p50: number };
export type AiHealth = {
  configured: boolean; days: number;
  totals: { calls: number; failed: number; retried: number; usd: number; p50: number; p95: number; failedLastHour: number };
  byKind: Group[]; byBrand: Group[]; byDay: Group[];
  errors: Array<{ at: number; kind: string; brandId: string | null; error?: string; attempts: number }>;
  tasks: { total: number; fallback: number; stuck: Array<{ id: string; brain: string; brandId: string; kind: string; title: string; at: number }> };
  lastAlert: number | null;
};

/** Admin only: the AI health summary from the API (aiCalls is never read from the browser). */
export function useAiHealth(days: number) {
  const [data, setData] = useState<AiHealth | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    setData(null); setError(false);
    api<AiHealth>(`/v1/admin/ai-health?days=${days}`).then((d) => live && setData(d), () => live && setError(true));
    return () => { live = false; };
  }, [days]);
  return { data, error };
}

/** Plain-language name of an error code from the API. */
export function errorLabel(code?: string): StringKey {
  if (!code) return 'aih.e.other';
  if (code === 'ai_http_429') return 'aih.e.429';
  if (code === 'ai_http_529' || code === 'ai_http_503') return 'aih.e.overload';
  if (/^ai_http_5/.test(code)) return 'aih.e.server';
  if (code === 'ai_http_401' || code === 'ai_http_403') return 'aih.e.key';
  if (/^ai_http_4/.test(code)) return 'aih.e.bad';
  if (code === 'ai_timeout') return 'aih.e.timeout';
  if (code === 'ai_network') return 'aih.e.network';
  if (code === 'ai_bad_json') return 'aih.e.json';
  return 'aih.e.other';
}

export const secs = (ms: number) => (ms >= 10_000 ? `${Math.round(ms / 1000)} s` : `${(ms / 1000).toFixed(1)} s`);
