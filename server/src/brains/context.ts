// The Brand Brain as the Brains read it: one compact text with the signed (or draft) Brand Brain, identity,
// voice and what the brand has taught them (learnings). Credentials are never part of it.
import { db } from '../firebase.js';

const cut = (s: unknown, n = 600) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export async function brandContext(brandId: string): Promise<{ text: string; lang: 'es' | 'en'; name: string }> {
  const [brand, brain, identity, voice, learnings, settings] = await Promise.all([
    db.doc(`brands/${brandId}`).get(),
    db.doc(`brands/${brandId}/context/brain`).get(),
    db.doc(`brands/${brandId}/context/identity`).get(),
    db.doc(`brands/${brandId}/context/voice`).get(),
    db.doc(`brands/${brandId}/context/learnings`).get(),
    db.doc(`brands/${brandId}/settings/notices`).get(),
  ]);
  const name = String(brand.get('name') ?? brandId);
  const b = brain.data() ?? {};
  const colors = ((identity.get('colors') as Array<{ hex?: string; name?: string }>) ?? []).slice(0, 6).map((c) => `${c.name ?? ''} ${c.hex ?? ''}`.trim());
  const fonts = ((identity.get('typography') as Array<{ fontFamily?: string; name?: string }>) ?? []).slice(0, 3).map((f) => f.fontFamily ?? f.name);
  const v = voice.data() ?? {};
  const learned = ((learnings.get('items') as Array<{ kind: string; text: string }>) ?? []).slice(-15);
  const lines = [
    `Brand: ${name}${b.status === 'signed' ? ' (Brand Brain signed by Nicolas)' : b.status ? ' (Brand Brain draft)' : ''}`,
    b.position && `Position to own: ${cut(b.position)}`,
    b.voice && `Voice: ${cut(b.voice)}`,
    !b.voice && (v.essence?.title || v.tone) && `Voice: ${cut(v.essence?.title ?? v.tone)}`,
    b.audiences && `Audiences: ${cut(b.audiences)}`,
    b.goals && `Goals: ${cut(b.goals)}`,
    b.avoid && `Avoid: ${cut(b.avoid)}`,
    b.criterio && `Criterio (rules from Nicolas): ${cut(b.criterio, 900)}`,
    Array.isArray(b.competitors) && b.competitors.length && `Competitors: ${b.competitors.map((c: { name?: string; promise?: string; price?: string }) => [c.name, c.promise, c.price].filter(Boolean).join(' · ')).join(' | ')}`,
    colors.length && `Colors: ${colors.join(', ')}`,
    fonts.length && `Typography: ${fonts.join(', ')}`,
    learned.length && `Learned from approvals and changes:\n${learned.map((l) => `- ${l.kind === 'liked' ? 'Liked' : 'Change asked'}: ${cut(l.text, 240)}`).join('\n')}`,
  ].filter(Boolean);
  return { text: lines.join('\n'), lang: settings.get('lang') === 'en' ? 'en' : 'es', name };
}
