// Normalizes raw Metricool responses (raw/level-*.json, raw/braindy-*.json) into revista-level.json and braindy.json
// usage: node normalize-level-braindy.js
const fs = require('fs'), path = require('path');
const dir = __dirname, rawDir = path.join(dir, 'raw');
const FROM = '2025-11-01', TO = '2026-11-05';

const load = (slug, label) => {
  const f = path.join(rawDir, `${slug}-${label}.json`);
  if (!fs.existsSync(f)) return null;
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { metrics: j.request.metrics, rows: (j.response && j.response.rows) || [] };
};
const num = (v) => { if (v === null || v === undefined || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const round = (v, d = 4) => v == null ? null : Math.round(v * 10 ** d) / 10 ** d;
const ymd = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
const dt = (s) => s ? `${ymd(s)}T${s.slice(8, 10) || '00'}:${s.slice(10, 12) || '00'}` : null;
const inRange = (d) => !!d && d.slice(0, 10) >= FROM && d.slice(0, 10) <= TO;
const txt = (s) => s ? String(s).slice(0, 280) : null;
const sum = (...a) => a.every((x) => x == null) ? null : a.reduce((t, x) => t + (x || 0), 0);
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const country = (c) => { try { return regionNames.of(c) || c; } catch { return c; } };
const pick = (raw, r, id) => { const i = raw.metrics.indexOf(id); return i < 0 ? undefined : r[i]; };
const n = (raw, r, id) => round(num(pick(raw, r, id)));
const byDate = (a, b) => (a.date || '').localeCompare(b.date || '');
const cap = (a) => a.filter((p) => inRange(p.date)).sort(byDate).slice(-600);

// daily: one row per day (duplicates merged, first non-null wins), in range, sorted
function daily(raw, map, order = ['followers', 'views', 'reach', 'interactions', 'posts']) {
  if (!raw) return { daily: [], fieldMap: {} };
  const fieldMap = {};
  raw.metrics.forEach((m) => { if (map[m]) fieldMap[map[m]] = m; });
  const keys = [...order, ...Object.values(map).filter((k) => !order.includes(k))];
  const byDay = new Map();
  for (const r of raw.rows) {
    const d = ymd(r[r.length - 1]);
    if (!inRange(d)) continue;
    const o = byDay.get(d) || { d };
    for (const k of keys) {
      const i = raw.metrics.indexOf(fieldMap[k]);
      const v = i < 0 ? null : round(num(r[i]));
      if (o[k] == null) o[k] = v;
    }
    byDay.set(d, o);
  }
  return { daily: [...byDay.values()].sort((a, b) => a.d.localeCompare(b.d)), fieldMap };
}
const lastFollowers = (d) => { for (let i = d.length - 1; i >= 0; i--) if (d[i].followers != null) return d[i].followers; return null; };
function shares(raw, followers, isCountry) {
  if (!raw) return [];
  return raw.rows.map((r) => {
    const share = num(r[1]), code = r[0];
    return { name: isCountry ? country(code) : code, ...(isCountry ? { code } : {}), n: share == null || followers == null ? null : Math.round(share * followers), share: round(share, 5) };
  }).sort((a, b) => (b.share || 0) - (a.share || 0));
}
const fractions = (raw) => raw ? raw.rows.map((r) => ({ name: r[0], n: round(num(r[1]), 5) })).sort((a, b) => (b.n || 0) - (a.n || 0)) : [];
function igAgeGender(raw) {
  if (!raw) return [];
  const rows = raw.rows.map((r) => ({ age: r[0], gender: r[1], n: num(r[2]) }));
  const total = rows.reduce((s, x) => s + (x.n || 0), 0);
  return rows.map((x) => ({ age: x.age, gender: x.gender, v: total ? round((x.n / total) * 100, 2) : null, n: x.n }))
    .sort((a, b) => a.age.localeCompare(b.age) || a.gender.localeCompare(b.gender));
}
function summary(name, net) {
  const keys = new Set(); net.daily.forEach((d) => Object.entries(d).forEach(([k, v]) => { if (v != null && k !== 'd') keys.add(k); }));
  const types = {}; net.posts.forEach((p) => { types[p.type] = (types[p.type] || 0) + 1; });
  const aud = Object.entries(net.audience).map(([k, v]) => `${k}:${v.length}`).join(' ');
  console.log(`  ${name}: days ${net.daily.length} ${net.daily[0] ? net.daily[0].d : '-'} -> ${net.daily.length ? net.daily.at(-1).d : '-'} | posts ${net.posts.length} ${JSON.stringify(types)} | audience ${aud}`);
  console.log(`    daily keys with data: ${[...keys].join(',') || '(none)'}`);
}

// ---------- field maps (same ids as milohas/quimiolab) ----------
const IG_DAILY = { IGEV01: 'followers', IGEV02: 'following', IGEV05: 'views', IGEV06: 'reach', IGEV38: 'interactions', IGEV37: 'posts',
  IGEV04: 'feedPosts', IGEV22: 'reels', IGEV16: 'stories', IGEV42: 'accountsEngaged', IGEV43: 'followersGained', IGEV44: 'followersLost',
  IGEV09: 'feedInteractions', IGEV11: 'feedReach', IGEV12: 'feedViews', IGEV13: 'feedLikes', IGEV14: 'feedComments', IGEV15: 'feedSaves', IGEV40: 'feedShares', IGEV9999: 'feedEngagement',
  IGEV23: 'reelsViews', IGEV25: 'reelsInteractions', IGEV26: 'reelsReach', IGEV27: 'reelsLikes', IGEV28: 'reelsComments', IGEV29: 'reelsSaves', IGEV39: 'reelsShares', IGEV41: 'reelsEngagement',
  IGEV17: 'storiesImpressions', IGEV18: 'storiesReach' };
const FB_DAILY = { FBEV17: 'followers', FBEV49: 'views', FBEV34: 'interactions', FBEV33: 'posts', FBEV04: 'feedPosts', FBEV21: 'reels', FBEV35: 'stories',
  FBEV03: 'pageViews', FBEV30: 'pagePostsImpressions', FBEV31: 'pagePostsReactions', FBEV47: 'followersGained', FBEV48: 'followersLost',
  FBEV10: 'feedInteractions', FBEV11: 'feedAvgReach', FBEV20: 'feedReach', FBEV12: 'feedImpressions', FBEV13: 'feedReactions', FBEV14: 'feedComments', FBEV15: 'feedShares', FBEV16: 'feedClicks', FBEV9999: 'feedEngagement',
  FBEV22: 'reelsViews', FBEV23: 'reelsLikes', FBEV24: 'reelsComments', FBEV25: 'reelsAvgReach', FBEV26: 'reelsInteractions', FBEV27: 'reelsEngagement' };
const LI_DAILY = { LIEV01: 'followers', LIEV08: 'newFollowers', LIEV18: 'postsImpressions', LIEV22: 'views', LIEV04: 'feedPosts', LIEV27: 'posts', LIEV10: 'postsInteractions', LIEV28: 'interactions', LIEV05: 'likes', LIEV06: 'comments', LIEV07: 'clicks', LIEV19: 'shares', LIEV31: 'pageImpressions', LIEV30: 'pageUniqueImpressions', LIEV29: 'buttonClicks' };
const TK_DAILY = { TKEV07: 'followers', TKEV02: 'views', TKEV11: 'reach', TKEV06: 'interactions', TKEV01: 'posts', TKEV12: 'accountViews', TKEV03: 'likes', TKEV04: 'comments', TKEV05: 'shares',
  TKEV08: 'newFollowers', TKEV16: 'followersGained', TKEV17: 'followersLost', TKEV09: 'profileViews', TKEV13: 'totalLikes', TKEV14: 'accountComments', TKEV15: 'accountShares', TKEV9998: 'engagement' };
const YT_DAILY = { YTEV01: 'followers', YTEV02: 'views', YTEV04: 'posts', YTEV05: 'followersGained', YTEV06: 'followersLost', YTEV14: 'likes', YTEV16: 'comments', YTEV17: 'videoViews', YTEV18: 'shares' };
const GB_DAILY = { GMEV20: 'views', GMEV18: 'searchViews', GMEV19: 'mapsViews', GMEV24: 'clicks', GMEV21: 'websiteClicks', GMEV22: 'callClicks', GMEV23: 'directionsClicks',
  GMEV28: 'actions', GMEV25: 'messages', GMEV26: 'bookings', GMEV27: 'foodOrders', GMEV17: 'posts', GMEV16: 'postsViews', GMEV15: 'photos', GMEV14: 'photosViews', GMEV13: 'reviews', GMEV12: 'rating' };

// ---------- network builders ----------
const IG_TYPE = { FEED_CAROUSEL_ALBUM: 'carousel', FEED_IMAGE: 'post', FEED_VIDEO: 'video', CAROUSEL_ALBUM: 'carousel', IMAGE: 'post', VIDEO: 'video' };
function instagram(s, handle) {
  const ig = daily(load(s, 'igev'), IG_DAILY);
  const out = [];
  const po = load(s, 'igpo');
  if (po) for (const r of po.rows) out.push({ id: pick(po, r, 'IGPO04'), date: dt(pick(po, r, 'IGPO02')), type: IG_TYPE[pick(po, r, 'IGPO07')] || 'post',
    text: txt(pick(po, r, 'IGPO03')), image: pick(po, r, 'IGPO05') || null, url: pick(po, r, 'IGPO06') || null,
    views: n(po, r, 'IGPO28'), reach: n(po, r, 'IGPO14'), likes: n(po, r, 'IGPO13'), comments: n(po, r, 'IGPO08'), saves: n(po, r, 'IGPO15'), shares: n(po, r, 'IGPO27'),
    interactions: n(po, r, 'IGPO12'), engagement: n(po, r, 'IGPO10'), clicks: null, watchTime: null, follows: n(po, r, 'IGPO29') });
  const re = load(s, 'igre');
  if (re) for (const r of re.rows) out.push({ id: pick(re, r, 'IGRE04'), date: dt(pick(re, r, 'IGRE02')), type: 'reel',
    text: txt(pick(re, r, 'IGRE03')), image: pick(re, r, 'IGRE05') || null, url: pick(re, r, 'IGRE06') || null,
    views: n(re, r, 'IGRE23'), reach: n(re, r, 'IGRE11'), likes: n(re, r, 'IGRE10'), comments: n(re, r, 'IGRE07'), saves: n(re, r, 'IGRE12'), shares: n(re, r, 'IGRE21'),
    interactions: n(re, r, 'IGRE09'), engagement: n(re, r, 'IGRE08'), clicks: null, watchTime: n(re, r, 'IGRE24'),
    totalWatchTime: n(re, r, 'IGRE25'), duration: n(re, r, 'IGRE26'), retention: n(re, r, 'IGRE27') });
  const st = load(s, 'igst');
  if (st) for (const r of st.rows) out.push({ id: pick(st, r, 'IGST04'), date: dt(pick(st, r, 'IGST02')), type: 'story', mediaType: String(pick(st, r, 'IGST07') || '').toLowerCase() || null,
    text: txt(pick(st, r, 'IGST03')), image: pick(st, r, 'IGST05') || null, url: pick(st, r, 'IGST06') || null,
    views: n(st, r, 'IGST09'), reach: n(st, r, 'IGST10'), likes: null, comments: null, saves: null, shares: null,
    interactions: n(st, r, 'IGST11'), engagement: null, clicks: null, watchTime: null, exits: n(st, r, 'IGST08'), tapsForward: n(st, r, 'IGST13') });
  const f = lastFollowers(ig.daily);
  return { handle, daily: ig.daily, posts: cap(out), audience: {
      countries: shares(load(s, 'igdp-igdp01igdp02'), f, true), cities: shares(load(s, 'igdc-igdc01igdc02'), f, false), ageGender: igAgeGender(load(s, 'igag-igag01igag02igag03')) },
    fieldMap: { ...ig.fieldMap, posts: 'IGPO*', reels: 'IGRE*', stories: 'IGST*', countries: 'IGDP01/02', cities: 'IGDC01/02', ageGender: 'IGAG01-03' } };
}
function facebook(s, handle) {
  const fb = daily(load(s, 'fbev'), FB_DAILY);
  const FB_TYPE = { photo: 'post', album: 'carousel', video: 'video', link: 'post', status: 'post' };
  const out = [];
  const po = load(s, 'fbpo');
  if (po) for (const r of po.rows) {
    const reactions = n(po, r, 'FBPO13'), comments = n(po, r, 'FBPO08'), sh = n(po, r, 'FBPO14'), clicks = n(po, r, 'FBPO23');
    out.push({ id: pick(po, r, 'FBPO04'), date: dt(pick(po, r, 'FBPO02')), type: FB_TYPE[pick(po, r, 'FBPO07')] || 'post', fbType: pick(po, r, 'FBPO07') || null,
      text: txt(pick(po, r, 'FBPO03')), image: pick(po, r, 'FBPO05') || null, url: pick(po, r, 'FBPO06') || null,
      views: n(po, r, 'FBPO11'), reach: n(po, r, 'FBPO12'), likes: reactions, comments, saves: null, shares: sh,
      interactions: sum(reactions, comments, sh, clicks), engagement: n(po, r, 'FBPO10'), clicks, watchTime: n(po, r, 'FBPO15'), videoViews: n(po, r, 'FBPO16') });
  }
  const re = load(s, 'fbre');
  if (re) for (const r of re.rows) {
    const likes = n(re, r, 'FBRE08'), actions = n(re, r, 'FBRE07');
    out.push({ id: pick(re, r, 'FBRE03'), date: dt(pick(re, r, 'FBRE02')), type: 'reel',
      text: txt(pick(re, r, 'FBRE05')), image: pick(re, r, 'FBRE04') || null, url: pick(re, r, 'FBRE06') || null,
      views: n(re, r, 'FBRE10'), reach: n(re, r, 'FBRE11'), likes, comments: null, saves: null, shares: null,
      interactions: sum(likes, actions), engagement: n(re, r, 'FBRE09'), clicks: null, watchTime: n(re, r, 'FBRE13'), actions, totalWatchTime: n(re, r, 'FBRE12') });
  }
  const f = lastFollowers(fb.daily);
  return { handle, daily: fb.daily.map((o) => ({ ...o, reach: null })), posts: cap(out), audience: {
      countries: shares(load(s, 'fbdp-fbdp03fbdp04'), f, true), cities: shares(load(s, 'fbdc-fbdc03fbdc04'), f, false), ageGender: [] },
    fieldMap: { ...fb.fieldMap, reach: null, posts: 'FBPO*', reels: 'FBRE*', countries: 'FBDP03/04', cities: 'FBDC03/04', ageGender: null } };
}
function linkedin(s, handle) {
  const li = daily(load(s, 'liev'), LI_DAILY);
  const tmap = { VIDEO: 'video', MULTIIMAGE: 'carousel', IMAGE: 'post', ARTICLE: 'post', DOCUMENT: 'carousel' };
  const po = load(s, 'lipo');
  const posts = po ? po.rows.map((r) => {
    const re = n(po, r, 'LIPO13'), c = n(po, r, 'LIPO10'), sh = n(po, r, 'LIPO18'), cl = n(po, r, 'LIPO09');
    return { id: pick(po, r, 'LIPO06'), date: dt(pick(po, r, 'LIPO02')), type: tmap[pick(po, r, 'LIPO19')] || 'post', rawType: pick(po, r, 'LIPO19') || null,
      text: txt(pick(po, r, 'LIPO04')), image: pick(po, r, 'LIPO07') || null, url: pick(po, r, 'LIPO08') || null,
      views: n(po, r, 'LIPO12'), reach: null, likes: re, comments: c, saves: null, shares: sh, interactions: sum(re, c, sh, cl),
      engagement: n(po, r, 'LIPO9999'), clicks: cl, watchTime: n(po, r, 'LIPO14'), videoViews: n(po, r, 'LIPO16') };
  }) : [];
  const f = lastFollowers(li.daily);
  const liShares = (raw) => raw ? raw.rows.map((r) => ({ name: r[0], n: f == null || num(r[1]) == null ? null : Math.round(num(r[1]) * f), share: round(num(r[1]), 5) })).sort((a, b) => (b.share || 0) - (a.share || 0)) : [];
  return { handle, daily: li.daily.map((o) => ({ ...o, reach: null })), posts: cap(posts), audience: {
      countries: liShares(load(s, 'lidc-lidc01lidc02')), cities: liShares(load(s, 'lida-lida01lida02')), ageGender: [],
      industry: fractions(load(s, 'lidi-lidi01lidi02')), seniority: fractions(load(s, 'lids-lids01lids02')),
      function: fractions(load(s, 'lidf-lidf01lidf02')), companySize: fractions(load(s, 'lidz-lidz01lidz02')) },
    fieldMap: { ...li.fieldMap, reach: null, posts: 'LIPO06 id, 02 date, 19 type, 04 text, 07 image, 08 url, 12 views (impressions), 13 likes (reactions), 10 comments, 18 shares, 09 clicks, 9999 engagement, 16 videoViews, 14 watchTime; interactions = reactions+comments+shares+clicks',
      audience: 'LIDC country, LIDA area (-> cities), LIDI industry, LIDS seniority, LIDF function, LIDZ companySize; industry..companySize n = fraction of followers' } };
}
function tiktok(s, handle) {
  const tk = daily(load(s, 'tkev'), TK_DAILY);
  const po = load(s, 'tkpo');
  const posts = po ? po.rows.map((r) => {
    const url = pick(po, r, 'TKPO03') || null, l = n(po, r, 'TKPO08'), c = n(po, r, 'TKPO09'), sh = n(po, r, 'TKPO10');
    const m = url && url.match(/video\/(\d+)/);
    return { id: m ? m[1] : url, date: dt(pick(po, r, 'TKPO02')), type: pick(po, r, 'TKPO22') === 'PHOTO' ? 'carousel' : 'video', rawType: pick(po, r, 'TKPO22') || null,
      text: txt(pick(po, r, 'TKPO05')), image: pick(po, r, 'TKPO04') || null, url: url ? url.split('?')[0] : null,
      views: n(po, r, 'TKPO07'), reach: n(po, r, 'TKPO11'), likes: l, comments: c, saves: null, shares: sh, interactions: sum(l, c, sh),
      engagement: n(po, r, 'TKPO9999'), clicks: null, watchTime: n(po, r, 'TKPO15'), totalWatchTime: n(po, r, 'TKPO14'), duration: n(po, r, 'TKPO06'), fullWatchRate: n(po, r, 'TKPO13') };
  }) : [];
  const f = lastFollowers(tk.daily);
  return { handle, daily: tk.daily, posts: cap(posts), audience: {
      countries: shares(load(s, 'tkdc-tkdc01tkdc02'), f, true), cities: [], ageGender: [], gender: fractions(load(s, 'tkdg-tkdg01tkdg02')) },
    fieldMap: { ...tk.fieldMap, note: 'views = TKEV02 (views of videos published that day; TKEV12 account video views returned null); totalLikes = TKEV13 cumulative account likes',
      posts: 'TKPO02 date, 03 url, 04 cover, 05 text, 06 duration, 07 views, 08 likes, 09 comments, 10 shares, 11 reach, 9999 engagement, 13 fullWatchRate, 14 totalWatchTime, 15 avg watch (s), 22 type (PHOTO->carousel, VIDEO->video)',
      audience: 'TKDC country, TKDG gender (both returned no rows)' } };
}
function youtube(s, handle) {
  const yt = daily(load(s, 'ytev'), YT_DAILY);
  const j = load(s, 'ytvp');
  const posts = j ? j.rows.map((r) => {
    const v = n(j, r, 'YTVP06'), l = n(j, r, 'YTVP09'), c = n(j, r, 'YTVP11'), sh = n(j, r, 'YTVP12'), i = sum(l, c, sh);
    const title = pick(j, r, 'YTVP17') || '';
    return { id: pick(j, r, 'YTVP04'), date: dt(pick(j, r, 'YTVP02')), type: /#shorts/i.test(title) ? 'short' : 'video',
      text: txt(title), image: pick(j, r, 'YTVP03') || null, url: pick(j, r, 'YTVP05') || null,
      views: v, reach: null, likes: l, comments: c, saves: null, shares: sh, interactions: i,
      engagement: v && i != null ? round((i / v) * 100, 2) : null, clicks: null, watchTime: n(j, r, 'YTVP07'), avgViewDuration: n(j, r, 'YTVP08') };
  }) : [];
  const f = lastFollowers(yt.daily);
  return { handle, daily: yt.daily.map((o) => ({ ...o, reach: null, interactions: sum(o.likes, o.comments, o.shares) })), posts: cap(posts), audience: {
      countries: shares(load(s, 'ytdp-ytdp01ytdp02'), f, true), cities: [], ageGender: [],
      age: fractions(load(s, 'ytda-ytda01ytda02')).filter((x) => x.name !== '65-').sort((a, b) => a.name.localeCompare(b.name)), gender: fractions(load(s, 'ytdg-ytdg01ytdg02')) },
    fieldMap: { ...yt.fieldMap, interactions: 'likes+comments+shares (computed)',
      posts: 'YTVP04 id, 02 date, 17 title, 03 thumb, 05 url, 06 views, 09 likes, 11 comments, 12 shares, 07 watchTime (min), 08 avgViewDuration (s); type short when title has #shorts',
      audience: 'YTDP country (fraction), YTDA age and YTDG gender as separate fraction lists (YouTube does not cross age x gender)' } };
}
function gbp(s) {
  const g = daily(load(s, 'gmev'), GB_DAILY);
  const po = load(s, 'gmpo');
  const posts = po ? po.rows.map((r) => ({ id: pick(po, r, 'GMPO04'), date: dt(pick(po, r, 'GMPO02')), type: 'post', text: txt(pick(po, r, 'GMPO10')),
    image: pick(po, r, 'GMPO09') || pick(po, r, 'GMPO05') || null, url: null, views: n(po, r, 'GMPO12'), reach: null, likes: null, comments: null, saves: null, shares: null,
    interactions: null, engagement: null, clicks: null, watchTime: null })) : [];
  return { handle: null, daily: g.daily.map((o) => {
      const views = o.views ?? sum(o.searchViews, o.mapsViews), clicks = o.clicks ?? sum(o.websiteClicks, o.callClicks, o.directionsClicks), actions = o.actions ?? sum(o.messages, o.bookings, o.foodOrders);
      return { ...o, followers: null, views, reach: null, clicks, actions, interactions: sum(clicks, actions) };
    }), posts: cap(posts), audience: {
      countries: [], cities: [], ageGender: [],
      keywords: load(s, 'gmkw-gmkw01gmkw02') ? load(s, 'gmkw-gmkw01gmkw02').rows.map((r) => ({ name: r[0], n: num(r[1]) })) : [],
      reachSources: load(s, 'gmid-gmid01gmid02') ? load(s, 'gmid-gmid01gmid02').rows.map((r) => ({ name: r[0], n: num(r[1]) })) : [] },
    fieldMap: { ...g.fieldMap, followers: null, interactions: 'clicks (GMEV24 website+call+directions) + actions (GMEV28 messages+bookings+food orders)', views: 'GMEV20 reach total (search+maps)' } };
}

// ---------- brands ----------
const NOTES = [
  'Audience countries/cities: Metricool returns follower shares (0-1); n = round(share * latest followers) is an estimate.',
  'Instagram ageGender: v = percent of followers, n = follower count as returned (IGAG03).',
  'Facebook and LinkedIn have no account-level reach metric; daily.reach is null.',
  'Post dates are as returned by Metricool (YYYYMMDDHHmmss, no offset). Engagement values are Metricool\'s unless noted.',
];
const level = { brandId: 'revista-level', metricoolId: 7475921, timezone: 'America/Los_Angeles', from: FROM, to: TO, generatedAt: new Date().toISOString(), networks: {
  instagram: instagram('level', 'revistalevel'),
  facebook: facebook('level', '1420406544756938'),
  linkedin: linkedin('level', 'urn:li:organization:33235450'),
  tiktok: tiktok('level', 'revistalevel'),
  youtube: youtube('level', 'UCxfDy9bWDSnFPsbOgcaVIUw'),
}, notes: NOTES };
const braindy = { brandId: 'braindy', metricoolId: 7483838, timezone: 'America/Los_Angeles', from: FROM, to: TO, generatedAt: new Date().toISOString(), networks: {
  linkedin: linkedin('braindy', 'urn:li:organization:3729774'),
  gmb: gbp('braindy'),
}, notes: [...NOTES, 'gmb = Google Business Profile: no followers; views = search+maps reach; Metricool returned a single all-zero day.'] };

for (const [file, b] of [['revista-level.json', level], ['braindy.json', braindy]]) {
  fs.writeFileSync(path.join(dir, file), JSON.stringify(b, null, 1));
  console.log(`${file} (${b.brandId})`);
  for (const [k, v] of Object.entries(b.networks)) summary(k, v);
}
