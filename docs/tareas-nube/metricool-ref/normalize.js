// Normalizes raw Metricool responses (raw/<slug>-*.json) into <slug>.json
// usage: node normalize.js milohas
const fs = require('fs'), path = require('path');
const slug = process.argv[2] || 'milohas';
const dir = __dirname, rawDir = path.join(dir, 'raw');
const META = { brandId: 'milohas', metricoolId: 6370556, timezone: 'America/Los_Angeles', from: '2026-06-09', to: '2026-11-05' };
const HANDLES = { instagram: 'milohaspastries', facebook: '517984548276994' };

const load = (label) => {
  const f = path.join(rawDir, `${slug}-${label}.json`);
  if (!fs.existsSync(f)) return null;
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { metrics: j.request.metrics, rows: (j.response && j.response.rows) || [] };
};
const num = (v) => { if (v === null || v === undefined || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const round = (v, d = 4) => v == null ? null : Math.round(v * 10 ** d) / 10 ** d;
const ymd = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
const dt = (s) => s ? `${ymd(s)}T${s.slice(8, 10)}:${s.slice(10, 12)}` : null;
const txt = (s) => s ? String(s).slice(0, 280) : null;
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const country = (c) => { try { return regionNames.of(c) || c; } catch { return c; } };

// field id -> camelCase key
const IG_DAILY = { IGEV01: 'followers', IGEV02: 'following', IGEV05: 'views', IGEV06: 'reach', IGEV38: 'interactions', IGEV37: 'posts',
  IGEV04: 'feedPosts', IGEV22: 'reels', IGEV16: 'stories', IGEV42: 'accountsEngaged', IGEV43: 'followersGained', IGEV44: 'followersLost',
  IGEV09: 'feedInteractions', IGEV11: 'feedReach', IGEV12: 'feedViews', IGEV13: 'feedLikes', IGEV14: 'feedComments', IGEV15: 'feedSaves', IGEV40: 'feedShares', IGEV9999: 'feedEngagement',
  IGEV23: 'reelsViews', IGEV25: 'reelsInteractions', IGEV26: 'reelsReach', IGEV27: 'reelsLikes', IGEV28: 'reelsComments', IGEV29: 'reelsSaves', IGEV39: 'reelsShares', IGEV41: 'reelsEngagement',
  IGEV17: 'storiesImpressions', IGEV18: 'storiesReach' };
const FB_DAILY = { FBEV17: 'followers', FBEV49: 'views', FBEV34: 'interactions', FBEV33: 'posts', FBEV04: 'feedPosts', FBEV21: 'reels', FBEV35: 'stories',
  FBEV03: 'pageViews', FBEV30: 'pagePostsImpressions', FBEV31: 'pagePostsReactions', FBEV47: 'followersGained', FBEV48: 'followersLost',
  FBEV10: 'feedInteractions', FBEV11: 'feedAvgReach', FBEV20: 'feedReach', FBEV12: 'feedImpressions', FBEV13: 'feedReactions', FBEV14: 'feedComments', FBEV15: 'feedShares', FBEV16: 'feedClicks', FBEV9999: 'feedEngagement',
  FBEV22: 'reelsViews', FBEV23: 'reelsLikes', FBEV24: 'reelsComments', FBEV25: 'reelsAvgReach', FBEV26: 'reelsInteractions', FBEV27: 'reelsEngagement' };

function daily(raw, map) {
  if (!raw) return { daily: [], fieldMap: {} };
  const fieldMap = {};
  raw.metrics.forEach((m) => { if (map[m]) fieldMap[map[m]] = m; });
  const order = ['followers', 'views', 'reach', 'interactions', 'posts'];
  const keys = [...order, ...Object.values(map).filter((k) => !order.includes(k))];
  const out = raw.rows.map((r) => {
    const o = { d: ymd(r[r.length - 1]) };
    for (const k of keys) { const i = raw.metrics.indexOf(fieldMap[k]); o[k] = i < 0 ? null : round(num(r[i])); }
    return o;
  }).sort((a, b) => a.d.localeCompare(b.d));
  return { daily: out, fieldMap };
}
const pick = (raw, r, id) => { const i = raw.metrics.indexOf(id); return i < 0 ? undefined : r[i]; };
const n = (raw, r, id) => round(num(pick(raw, r, id)));

const IG_TYPE = { FEED_CAROUSEL_ALBUM: 'carousel', FEED_IMAGE: 'post', FEED_VIDEO: 'video', CAROUSEL_ALBUM: 'carousel', IMAGE: 'post', VIDEO: 'video' };

function igPosts() {
  const out = [];
  const po = load('igpo');
  if (po) for (const r of po.rows) out.push({ id: pick(po, r, 'IGPO04'), date: dt(pick(po, r, 'IGPO02')), type: IG_TYPE[pick(po, r, 'IGPO07')] || String(pick(po, r, 'IGPO07')).toLowerCase(),
    text: txt(pick(po, r, 'IGPO03')), image: pick(po, r, 'IGPO05') || null, url: pick(po, r, 'IGPO06') || null,
    views: n(po, r, 'IGPO28'), reach: n(po, r, 'IGPO14'), likes: n(po, r, 'IGPO13'), comments: n(po, r, 'IGPO08'), saves: n(po, r, 'IGPO15'), shares: n(po, r, 'IGPO27'),
    interactions: n(po, r, 'IGPO12'), engagement: n(po, r, 'IGPO10'), watchTime: null, follows: n(po, r, 'IGPO29'),
    paidImpressions: n(po, r, 'IGPO17'), paidReach: n(po, r, 'IGPO19'), interactionsTotal: n(po, r, 'IGPO24'), spend: n(po, r, 'IGPO26') });
  const re = load('igre');
  if (re) for (const r of re.rows) out.push({ id: pick(re, r, 'IGRE04'), date: dt(pick(re, r, 'IGRE02')), type: 'reel',
    text: txt(pick(re, r, 'IGRE03')), image: pick(re, r, 'IGRE05') || null, url: pick(re, r, 'IGRE06') || null,
    views: n(re, r, 'IGRE23'), reach: n(re, r, 'IGRE11'), likes: n(re, r, 'IGRE10'), comments: n(re, r, 'IGRE07'), saves: n(re, r, 'IGRE12'), shares: n(re, r, 'IGRE21'),
    interactions: n(re, r, 'IGRE09'), engagement: n(re, r, 'IGRE08'), watchTime: n(re, r, 'IGRE24'),
    totalWatchTime: n(re, r, 'IGRE25'), duration: n(re, r, 'IGRE26'), retention: n(re, r, 'IGRE27'), viewRate: n(re, r, 'IGRE28'), reposts: n(re, r, 'IGRE29'),
    paidViews: n(re, r, 'IGRE14'), paidReach: n(re, r, 'IGRE16'), interactionsTotal: n(re, r, 'IGRE22') });
  const st = load('igst');
  if (st) for (const r of st.rows) out.push({ id: pick(st, r, 'IGST04'), date: dt(pick(st, r, 'IGST02')), type: 'story', mediaType: String(pick(st, r, 'IGST07') || '').toLowerCase() || null,
    text: txt(pick(st, r, 'IGST03')), image: pick(st, r, 'IGST05') || null, url: pick(st, r, 'IGST06') || null,
    views: n(st, r, 'IGST09'), reach: n(st, r, 'IGST10'), likes: null, comments: null, saves: null, shares: null,
    interactions: n(st, r, 'IGST11'), engagement: null, watchTime: null,
    replies: n(st, r, 'IGST11'), exits: n(st, r, 'IGST08'), tapsBack: n(st, r, 'IGST12'), tapsForward: n(st, r, 'IGST13') });
  return out.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

function fbPosts() {
  const out = [];
  const po = load('fbpo');
  const FB_TYPE = { photo: 'post', album: 'carousel', video: 'video', link: 'post', status: 'post' };
  if (po) for (const r of po.rows) {
    const reactions = n(po, r, 'FBPO13'), comments = n(po, r, 'FBPO08'), shares = n(po, r, 'FBPO14'), clicks = n(po, r, 'FBPO23');
    const parts = [reactions, comments, shares, clicks];
    out.push({ id: pick(po, r, 'FBPO04'), date: dt(pick(po, r, 'FBPO02')), type: FB_TYPE[pick(po, r, 'FBPO07')] || pick(po, r, 'FBPO07') || null, fbType: pick(po, r, 'FBPO07') || null,
      text: txt(pick(po, r, 'FBPO03')), image: pick(po, r, 'FBPO05') || null, url: pick(po, r, 'FBPO06') || null,
      views: n(po, r, 'FBPO11'), reach: n(po, r, 'FBPO12'), likes: reactions, comments, saves: null, shares,
      interactions: parts.every((x) => x == null) ? null : parts.reduce((s, x) => s + (x || 0), 0), engagement: n(po, r, 'FBPO10'), watchTime: n(po, r, 'FBPO15'),
      clicks, linkClicks: n(po, r, 'FBPO09'), videoViews: n(po, r, 'FBPO16'), paidImpressions: n(po, r, 'FBPO17'), paidReach: n(po, r, 'FBPO19'), spend: n(po, r, 'FBPO24') });
  }
  const re = load('fbre');
  if (re) for (const r of re.rows) {
    const likes = n(re, r, 'FBRE08'), actions = n(re, r, 'FBRE07'), reach = n(re, r, 'FBRE11');
    const interactions = likes == null && actions == null ? null : (likes || 0) + (actions || 0);
    out.push({ id: pick(re, r, 'FBRE03'), date: dt(pick(re, r, 'FBRE02')), type: 'reel',
      text: txt(pick(re, r, 'FBRE05')), image: pick(re, r, 'FBRE04') || null, url: pick(re, r, 'FBRE06') || null,
      views: n(re, r, 'FBRE10'), reach, likes, comments: null, saves: null, shares: null,
      interactions, engagement: n(re, r, 'FBRE09'), watchTime: n(re, r, 'FBRE13'),
      actions, totalWatchTime: n(re, r, 'FBRE12') });
  }
  return out.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

function shares(raw, nameId, valId, followers, isCountry) {
  if (!raw) return [];
  return raw.rows.map((r) => {
    const share = num(pick(raw, r, valId));
    const code = pick(raw, r, nameId);
    return { name: isCountry ? country(code) : code, ...(isCountry ? { code } : {}), n: share == null || followers == null ? null : Math.round(share * followers), share: round(share, 5) };
  }).sort((a, b) => (b.share || 0) - (a.share || 0));
}
function ageGender(raw) {
  if (!raw) return [];
  const rows = raw.rows.map((r) => ({ age: pick(raw, r, 'IGAG01'), gender: pick(raw, r, 'IGAG02'), n: num(pick(raw, r, 'IGAG03')) }));
  const total = rows.reduce((s, x) => s + (x.n || 0), 0);
  return rows.map((x) => ({ age: x.age, gender: x.gender, v: total ? round((x.n / total) * 100, 2) : null, n: x.n }))
    .sort((a, b) => a.age.localeCompare(b.age) || a.gender.localeCompare(b.gender));
}
const lastFollowers = (d) => { for (let i = d.length - 1; i >= 0; i--) if (d[i].followers != null) return d[i].followers; return null; };

const ig = daily(load('igev'), IG_DAILY);
const igF = lastFollowers(ig.daily);
const fb = daily(load('fbev'), FB_DAILY);
const fbF = lastFollowers(fb.daily);
const fbLocale = load('fbdl-fbdl01fbdl02');

const result = { ...META, generatedAt: new Date().toISOString(), networks: {
  instagram: { handle: HANDLES.instagram, daily: ig.daily, posts: igPosts(), audience: {
      countries: shares(load('igdp-igdp01igdp02'), 'IGDP01', 'IGDP02', igF, true),
      cities: shares(load('igdc-igdc01igdc02'), 'IGDC01', 'IGDC02', igF, false),
      ageGender: ageGender(load('igag-igag01igag02igag03')) },
    fieldMap: { ...ig.fieldMap, posts_connector: 'IGPO*', reels_connector: 'IGRE*', stories_connector: 'IGST*', countries: 'IGDP01/IGDP02', cities: 'IGDC01/IGDC02', ageGender: 'IGAG01-03' } },
  facebook: { handle: HANDLES.facebook, daily: fb.daily, posts: fbPosts(), audience: {
      countries: shares(load('fbdp-fbdp03fbdp04'), 'FBDP03', 'FBDP04', fbF, true),
      cities: shares(load('fbdc-fbdc03fbdc04'), 'FBDC03', 'FBDC04', fbF, false),
      ageGender: [], locales: fbLocale ? fbLocale.rows.map((r) => ({ name: r[0], v: num(r[1]) })) : [] },
    fieldMap: { ...fb.fieldMap, reach: null, posts_connector: 'FBPO*', reels_connector: 'FBRE*', countries: 'FBDP03/FBDP04', cities: 'FBDC03/FBDC04', locales: 'FBDL01/FBDL02', ageGender: null } },
}, notes: [
  'Audience countries/cities: Metricool returns follower shares (0-1); n = round(share * latest followers) is an estimate.',
  'Instagram ageGender: v = percent of followers, n = follower count as returned (IGAG03).',
  'Facebook has no account-level reach metric; daily.reach is null. feedReach = FBEV20 (avg reach per feed post x feed posts). views = Page Media View (FBEV49).',
  'Facebook post interactions = reactions + comments + shares + clicks (matches Metricool engagement). FB reel interactions = likes + actions (matches FBEV26); FB reel comments not exposed separately.',
  'Facebook age/gender demographics are deprecated in Metricool; locale reach (FBDL) returned no rows.',
  'Post dates are as returned by Metricool (YYYYMMDDHHmmss, no offset).',
  'Engagement values are Metricool\'s (interactions per reach x100).',
] };

fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(result, null, 1));
for (const [k, v] of Object.entries(result.networks)) {
  const keys = new Set(); v.daily.forEach((d) => Object.entries(d).forEach(([kk, vv]) => { if (vv != null) keys.add(kk); }));
  const types = {}; v.posts.forEach((p) => { types[p.type] = (types[p.type] || 0) + 1; });
  console.log(k, 'days', v.daily.length, v.daily[0] && v.daily[0].d, '->', v.daily.at(-1) && v.daily.at(-1).d, 'posts', v.posts.length, JSON.stringify(types),
    'countries', v.audience.countries.length, 'cities', v.audience.cities.length, 'ageGender', v.audience.ageGender.length);
  console.log('  keys with data:', [...keys].join(','));
  const all = Object.keys(v.daily[0] || {}); console.log('  all-null keys:', all.filter((x) => !keys.has(x)).join(','));
}
