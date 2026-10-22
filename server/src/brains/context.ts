// The Brand Brain as the Brains read it: one compact text with the Brand Brain, identity, voice, what the brand
// taught them (learnings) and the team memory (recent work, meetings, insights). Credentials are never part of it.
import { db } from '../firebase.js';

const cut = (s: unknown, n = 600) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export async function brandContext(brandId: string): Promise<{ text: string; lang: 'es' | 'en'; name: string }> {
  const [brand, brain, identity, voice, learnings, settings, recent, meetings, insights] = await Promise.all([
    db.doc(`brands/${brandId}`).get(),
    db.doc(`brands/${brandId}/context/brain`).get(),
    db.doc(`brands/${brandId}/context/identity`).get(),
    db.doc(`brands/${brandId}/context/voice`).get(),
    db.doc(`brands/${brandId}/context/learnings`).get(),
    db.doc(`brands/${brandId}/settings/notices`).get(),
    db.collection(`brands/${brandId}/requests`).orderBy('createdAt', 'desc').limit(10).get(),
    db.collection(`brands/${brandId}/meetings`).orderBy('date', 'desc').limit(5).get(),
    db.collection(`brands/${brandId}/insights`).orderBy('at', 'desc').limit(3).get(),
  ]);
  const name = String(brand.get('name') ?? brandId);
  // Meetings held with the group(s) above this brand (e.g. Grupo Berrío for iPark) are team memory too.
  const ancestors = ((brand.get('ancestors') as string[]) ?? []).slice(0, 3);
  const groupMeetings = (await Promise.all(ancestors.map(async (g) => {
    const [gb, ms] = await Promise.all([
      db.doc(`brands/${g}`).get(),
      db.collection(`brands/${g}/meetings`).orderBy('date', 'desc').limit(3).get(),
    ]);
    return ms.docs.map((d) => `- ${d.get('date') ?? ''} (${gb.get('name') ?? g}) ${cut(d.get('title'), 100)}: ${cut(d.get('notes'), 500)}`);
  }))).flat();
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
    recent.size && `Team memory · recent work:\n${recent.docs.map((d) => `- ${cut(d.get('title'), 120)} · ${d.get('status')} · led by ${d.get('leadBrain')}${d.get('plan.note') ? ` · note: ${cut(d.get('plan.note'), 160)}` : ''}`).join('\n')}`,
    meetings.size && `Team memory · meetings with the client (newest first):\n${meetings.docs.map((d) => `- ${d.get('date') ?? ''} ${cut(d.get('title'), 100)}: ${cut(d.get('notes'), 700)}`).join('\n')}`,
    groupMeetings.length && `Team memory · meetings with the group:\n${groupMeetings.join('\n')}`,
    insights.size && `Team memory · what the team noticed:\n${insights.docs.map((d) => `- ${cut(d.get('title'), 200)}`).join('\n')}`,
    learned.length && `Learned from approvals and changes:\n${learned.map((l) => `- ${l.kind === 'liked' ? 'Liked' : 'Change asked'}: ${cut(l.text, 240)}`).join('\n')}`,
  ].filter(Boolean);
  return { text: lines.join('\n'), lang: settings.get('lang') === 'en' ? 'en' : 'es', name };
}
