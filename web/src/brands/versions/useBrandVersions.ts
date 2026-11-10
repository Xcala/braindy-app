import { useMemo } from 'react';
import { useBrandCollection } from '../useBrandDoc';

type Stamp = { toDate?: () => Date } | null | undefined;
/** An earlier version of the brand: Mi marca frozen when a new one was opened (server/src/brandVersions.ts). */
export interface BrandVersion {
  id: string; name: string; logoUrl: string | null; from: Date | null; to: Date | null;
  identity: Record<string, unknown> | null; voice: Record<string, unknown> | null;
  brain: Record<string, unknown> | null; primal: Record<string, unknown> | null;
}

/** Earlier versions of the brand, newest first (empty for a brand never rebranded). */
export function useBrandVersions(brandId: string | undefined) {
  const { docs, loading } = useBrandCollection(brandId, 'versions');
  const list = useMemo(() => docs.map((d): BrandVersion => ({
    id: d.id, name: String(d.name ?? ''), logoUrl: (d.logoUrl as string) ?? null,
    from: (d.from as Stamp)?.toDate?.() ?? null, to: (d.to as Stamp)?.toDate?.() ?? null,
    identity: (d.identity as BrandVersion['identity']) ?? null, voice: (d.voice as BrandVersion['voice']) ?? null,
    brain: (d.brain as BrandVersion['brain']) ?? null, primal: (d.primal as BrandVersion['primal']) ?? null,
  })).sort((a, b) => +(b.to ?? 0) - +(a.to ?? 0)), [docs]);
  return { list, loading };
}

/** The version a file belongs to by its date: after the last rebrand it is the current one (null). */
export const versionAt = (list: BrandVersion[], ms: number | undefined) =>
  ms == null ? null : [...list].reverse().find((v) => v.to && ms < +v.to) ?? null;
