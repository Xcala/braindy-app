import { useMemo } from 'react';
import { useBrandCollection } from '../useBrandDoc';
/** Earlier versions of the brand, newest first (empty for a brand never rebranded). */
export function useBrandVersions(brandId) {
    const { docs, loading } = useBrandCollection(brandId, 'versions');
    const list = useMemo(() => docs.map((d) => ({
        id: d.id, name: String(d.name ?? ''), logoUrl: d.logoUrl ?? null,
        from: d.from?.toDate?.() ?? null, to: d.to?.toDate?.() ?? null,
        identity: d.identity ?? null, voice: d.voice ?? null,
        brain: d.brain ?? null, primal: d.primal ?? null,
        folders: d.folders ?? [],
    })).sort((a, b) => +(b.to ?? 0) - +(a.to ?? 0)), [docs]);
    return { list, loading };
}
/** The version a file belongs to by its date: after the last rebrand it is the current one (null). */
export const versionAt = (list, ms) => ms == null ? null : [...list].reverse().find((v) => v.to && ms < +v.to) ?? null;
