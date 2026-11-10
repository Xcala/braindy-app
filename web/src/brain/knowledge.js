import { boldLead, scanBlocks } from '../lib/scan';
export const AREAS = ['identity', 'voice', 'strategy', 'work', 'rules', 'talks'];
const arr = (v) => (Array.isArray(v) ? v : []);
const has = (v) => (typeof v === 'string' ? v.trim().length > 0 : !!v);
/**
 * Each rule on its own, for the avoid and criterio fields: sentences and comma lists ("white on green, the logo
 * gradient on color, 'Marco Polo Canadá'…") become one point each, the key in **bold**.
 */
export function ruleLines(brain) {
    const text = [brain?.avoid, brain?.criterio].filter((x) => typeof x === 'string').join('\n');
    return scanBlocks(text, { list: true, points: true })
        .flatMap((b) => (b.kind === 'list' ? b.items : b.kind === 'p' ? [boldLead(b.text)] : []))
        .map((s) => s.trim().replace(/\.$/, '')).filter((s) => s.replace(/\*\*/g, '').length >= 3)
        .map((s) => (s.startsWith('**') ? `**${s[2].toUpperCase()}${s.slice(3)}` : s[0].toUpperCase() + s.slice(1)));
}
export function countKnowledge(d) {
    const id = d.identity ?? {};
    const logos = (id.logos ?? {});
    const v = d.voice ?? {};
    const sounds = (v.howItSounds ?? {});
    const b = d.brain ?? {};
    const p = d.primal ?? {};
    return {
        identity: ['primary', 'secondary', 'icon'].filter((k) => has(logos[k])).length + arr(logos.variations).length
            + arr(id.colors).length + arr(id.typography).length + arr(id.concept).length,
        voice: (has(v.essence?.title) ? 1 : 0) + arr(v.archetype).length + arr(v.tonePrinciples).length
            + arr(v.keyLanguage).length + arr(sounds.is).length + arr(sounds.isNot).length + (has(v.example) ? 1 : 0),
        strategy: ['position', 'audiences', 'goals'].filter((k) => has(b[k])).length + arr(b.competitors).length
            + ['creationStory', 'creed', 'icons', 'rituals', 'sacredWords', 'nonBelievers', 'leader'].filter((k) => has(p[k])).length,
        work: arr(d.learnings?.items).length + arr(id.galleryAssets).length,
        rules: ruleLines(b).length,
        talks: d.talks,
    };
}
/** What is missing, in the order it matters most. */
export function gaps(d) {
    const id = d.identity ?? {};
    const b = d.brain ?? {};
    const out = [
        [!id.logos, 'bb.gap.logos'], [!arr(id.colors).length, 'bb.gap.colors'], [!arr(id.typography).length, 'bb.gap.typography'],
        [!d.voice, 'bb.gap.voice'], [!has(b.position), 'bb.gap.position'], [!has(b.audiences), 'bb.gap.audiences'],
        [!ruleLines(b).length, 'bb.gap.avoid'], [!arr(b.competitors).length, 'bb.gap.competitors'],
        [!arr(d.learnings?.items).length, 'bb.gap.learn'], [!d.talks, 'bb.gap.talks'],
    ];
    return out.filter(([missing]) => missing).map(([, k]) => k);
}
