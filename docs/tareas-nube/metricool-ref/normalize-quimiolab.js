// Normalize Metricool raw responses for Quimiolab -> quimiolab.json
const fs = require('fs'), path = require('path');
const R = f => JSON.parse(fs.readFileSync(path.join(__dirname, 'raw', 'quimiolab-' + f + '.json'), 'utf8'));
const FROM = '20260328', TO = '20261105';
const num = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
const dt = s => s ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10) || '00'}:${s.slice(10, 12) || '00'}` : null;
const inRange = s => !!s && s.slice(0, 8) >= FROM && s.slice(0, 8) <= TO;
const txt = s => s == null ? null : String(s).slice(0, 280);
const sum = (...a) => a.every(x => x == null) ? null : a.reduce((t, x) => t + (x || 0), 0);
const byDate = (a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0;

function daily(file, map) {
  const j = R(file), keys = j.metrics.map(m => map[m]);
  return j.response.rows.filter(r => inRange(r[r.length - 1])).map(r => {
    const d = r[r.length - 1], o = { d: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` };
    keys.forEach((k, i) => { o[k] = num(r[i]); });
    return o;
  }).sort((a, b) => a.d < b.d ? -1 : 1);
}
const rowsObj = file => { const j = R(file); return j.response.rows.map(r => Object.fromEntries(j.metrics.map((m, i) => [m, r[i]]))); };

const out = { brandId: 'quimiolab', metricoolId: 6032280, timezone: 'America/Bogota', from: '2026-03-28', to: '2026-11-05', networks: {} };

// Instagram
{
  const map = { IGEV01: 'followers', IGEV02: 'following', IGEV05: 'views', IGEV06: 'reach', IGEV37: 'posts', IGEV38: 'interactions', IGEV04: 'feedPosts', IGEV22: 'reels', IGEV16: 'stories', IGEV09: 'feedInteractions', IGEV25: 'reelsInteractions', IGEV42: 'accountsEngaged', IGEV43: 'followersGained', IGEV44: 'followersLost', IGEV11: 'feedReach', IGEV26: 'reelsReach', IGEV18: 'storiesReach' };
  const tmap = { FEED_IMAGE: 'post', FEED_CAROUSEL_ALBUM: 'carousel', FEED_VIDEO: 'video', REELS: 'reel' };
  const posts = rowsObj('instagram-posts').filter(p => inRange(p.IGPO02)).map(p => ({ id: p.IGPO04, date: dt(p.IGPO02), type: tmap[p.IGPO07] || 'post', text: txt(p.IGPO03), image: p.IGPO05 || null, url: p.IGPO06 || null, views: num(p.IGPO28), reach: num(p.IGPO14), likes: num(p.IGPO13), comments: num(p.IGPO08), saves: num(p.IGPO15), shares: num(p.IGPO27), interactions: num(p.IGPO12), engagement: num(p.IGPO10), watchTime: null }));
  const reels = rowsObj('instagram-reels').filter(p => inRange(p.IGRE02)).map(p => ({ id: p.IGRE04, date: dt(p.IGRE02), type: 'reel', text: txt(p.IGRE03), image: p.IGRE05 || null, url: p.IGRE06 || null, views: num(p.IGRE23), reach: num(p.IGRE11), likes: num(p.IGRE10), comments: num(p.IGRE07), saves: num(p.IGRE12), shares: num(p.IGRE21), interactions: num(p.IGRE09), engagement: num(p.IGRE08), watchTime: num(p.IGRE24) }));
  out.networks.instagram = {
    handle: 'quimiolab_sas',
    daily: daily('instagram-evolution', map),
    posts: [...posts, ...reels].sort(byDate),
    audience: {
      countries: rowsObj('instagram-country').map(r => ({ name: r.IGDP01, n: num(r.IGDP02) })),
      cities: rowsObj('instagram-city').map(r => ({ name: r.IGDC01, n: num(r.IGDC02) })),
      ageGender: rowsObj('instagram-agegender').map(r => ({ age: r.IGAG01, gender: r.IGAG02, v: num(r.IGAG03) })),
    },
    fieldMap: {
      daily: map,
      posts: 'IGPO04 id, 02 date, 07 type, 03 text, 05 image, 06 url, 28 views, 14 reach, 13 likes, 08 comments, 15 saves, 27 shares, 12 interactions, 10 engagement',
      reels: 'IGRE04 id, 02 date, 03 text, 05 image, 06 url, 23 views, 11 reach, 10 likes, 07 comments, 12 saves, 21 shares, 09 interactions, 08 engagement, 24 watchTime (avg seconds)',
      stories: 'IGST* returned no rows',
      audience: 'IGDP country, IGDC city, IGAG age/gender: all empty (account under 100 followers)',
    },
  };
}

// LinkedIn
{
  const map = { LIEV01: 'followers', LIEV08: 'newFollowers', LIEV18: 'postsImpressions', LIEV22: 'views', LIEV04: 'feedPosts', LIEV27: 'posts', LIEV10: 'postsInteractions', LIEV28: 'interactions', LIEV05: 'likes', LIEV06: 'comments', LIEV07: 'clicks', LIEV19: 'shares', LIEV31: 'pageImpressions', LIEV30: 'pageUniqueImpressions', LIEV29: 'buttonClicks' };
  const tmap = { VIDEO: 'video', MULTIIMAGE: 'carousel', IMAGE: 'post', ARTICLE: 'post' };
  const posts = rowsObj('linkedin-posts').filter(p => inRange(p.LIPO02)).map(p => {
    const re = num(p.LIPO13), c = num(p.LIPO10), s = num(p.LIPO18), cl = num(p.LIPO09);
    return { id: p.LIPO06, date: dt(p.LIPO02), type: tmap[p.LIPO19] || 'post', rawType: p.LIPO19 || null, text: txt(p.LIPO04), image: p.LIPO07 || null, url: p.LIPO08 || null, views: num(p.LIPO12), reach: null, likes: re, comments: c, saves: null, shares: s, interactions: sum(re, c, s, cl), engagement: num(p.LIPO9999), watchTime: num(p.LIPO14), clicks: cl, videoViews: num(p.LIPO16) };
  }).sort(byDate);
  const D = R('linkedin-demographics').calls;
  const dem = k => (D[k] ? D[k].response.rows : []).map(r => ({ name: r[0], n: num(r[1]) }));
  out.networks.linkedin = {
    handle: null,
    daily: daily('linkedin-evolution', map).map(o => ({ ...o, reach: null })),
    posts,
    audience: { countries: dem('country'), cities: dem('area'), ageGender: [], industry: dem('industry'), seniority: dem('seniority'), function: dem('function'), companySize: dem('companySize') },
    fieldMap: {
      daily: map,
      posts: 'LIPO06 id, 02 date, 19 type, 04 text, 07 image, 08 url, 12 views (impressions), 13 likes (reactions), 10 comments, 18 shares, 09 clicks, 9999 engagement, 16 videoViews, 14 watchTime (timeWatched); interactions = reactions+comments+shares+clicks; reach and saves not available',
      audience: 'n = fraction of followers; cities = LinkedIn area (LIDC country, area/industry/seniority/function/companySize from demographics connectors)',
    },
  };
}

// YouTube (videos row order: id, date, title, thumb, url, views, likes, comments, shares, watchMinutes, avgViewDuration)
{
  const map = { YTEV01: 'followers', YTEV02: 'views', YTEV04: 'posts', YTEV05: 'followersGained', YTEV06: 'followersLost', YTEV14: 'likes', YTEV16: 'comments', YTEV17: 'videoViews', YTEV18: 'shares' };
  const j = R('youtube-videos');
  out.networks.youtube = {
    handle: null,
    daily: daily('youtube-evolution', map).map(o => ({ ...o, reach: null, interactions: sum(o.likes, o.comments, o.shares) })),
    posts: j.response.rows.filter(r => inRange(r[1])).map(r => {
      const v = num(r[5]), l = num(r[6]), c = num(r[7]), s = num(r[8]), i = sum(l, c, s);
      return { id: r[0], date: dt(r[1]), type: 'video', text: txt(r[2]), image: r[3] || null, url: r[4] || null, views: v, reach: null, likes: l, comments: c, saves: null, shares: s, interactions: i, engagement: v && i != null ? +(i / v * 100).toFixed(2) : null, watchTime: num(r[9]), avgViewDuration: num(r[10]) };
    }).sort(byDate),
    audience: { countries: rowsObj('youtube-country').map(r => ({ name: r.YTDP01, n: num(r.YTDP02) })), cities: [], ageGender: [] },
    fieldMap: {
      daily: { ...map, interactions: 'likes+comments+shares (computed)' },
      posts: 'YTVP04 id, 02 date, 17 title -> text, 03 thumbnail -> image, 05 url, 06 views, 09 likes, 11 comments, 12 shares, 07 watchTime (minutes), 08 avgViewDuration (s); engagement = interactions/views*100 (computed)',
      audience: 'YTDP01 ISO-2 country, YTDP02 fraction; age/gender (YTDA/YTDG) empty',
    },
  };
}

fs.writeFileSync(path.join(__dirname, 'quimiolab.json'), JSON.stringify(out, null, 1));
for (const [k, n] of Object.entries(out.networks)) {
  const keys = new Set(); n.daily.forEach(o => Object.keys(o).forEach(x => keys.add(x)));
  const types = n.posts.reduce((t, p) => (t[p.type] = (t[p.type] || 0) + 1, t), {});
  console.log(k, 'days', n.daily.length, n.daily[0] && n.daily[0].d, '..', n.daily.length && n.daily[n.daily.length - 1].d,
    '| posts', n.posts.length, JSON.stringify(types),
    '| audience', Object.entries(n.audience).map(([x, v]) => x + ':' + v.length).join(','),
    '\n  daily keys:', [...keys].join(','));
}
