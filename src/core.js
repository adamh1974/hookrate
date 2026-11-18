// Pure parsing + analysis. No DOM, no chrome.* — runs in the extension and in node tests.
(function (root) {
  const RI = root.RI || (root.RI = {});
  const DASHES = /^[‐-―\-−]+$/;

  RI.clean = (s) => String(s == null ? '' : s).replace(/[​‎‏]/g, '').trim();

  // "1,179" → 1179, "29.4K" → 29400, "$0.00" → 0, "‑‑" → null
  RI.num = function (s) {
    s = RI.clean(s).replace(/\s/g, '').replace(/^[$£€]/, '');
    if (!s || DASHES.test(s)) return null;
    const m = s.match(/^(-?[\d,]*\.?\d+)([KkMm])?%?$/);
    if (!m) return null;
    let v = parseFloat(m[1].replace(/,/g, ''));
    if (m[2]) v *= /k/i.test(m[2]) ? 1e3 : 1e6;
    return v;
  };

  // "5s" → 5, "1m 5s" → 65, "1:05" → 65
  RI.secs = function (s) {
    s = RI.clean(s);
    if (!s || DASHES.test(s)) return null;
    let t = 0, hit = false;
    for (const m of s.matchAll(/(\d+(?:\.\d+)?)\s*([hms])\b/g)) {
      hit = true;
      t += parseFloat(m[1]) * (m[2] === 'h' ? 3600 : m[2] === 'm' ? 60 : 1);
    }
    if (hit) return t;
    const c = s.match(/^(\d+):(\d{2})$/);
    if (c) return +c[1] * 60 + +c[2];
    return RI.num(s);
  };

  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  // "18 November 12:00", "18 November 2025 12:00", "November 18, 2025 at 12:00" → ms (local time)
  RI.parseDate = function (s, now) {
    now = now || new Date();
    const t = RI.clean(s).toLowerCase();
    let month = -1;
    for (const w of t.split(/[^a-z]+/)) {
      const i = MONTHS.indexOf(w.slice(0, 3));
      if (i >= 0 && w.length >= 3) { month = i; break; }
    }
    if (month < 0) return null;
    const time = t.match(/(\d{1,2}):(\d{2})/);
    const rest = t.replace(/(\d{1,2}):(\d{2})/, ' ');
    const year = rest.match(/\b(20\d{2})\b/);
    const day = rest.replace(/\b20\d{2}\b/, ' ').match(/\b(\d{1,2})\b/);
    if (!day) return null;
    let y = year ? +year[1] : now.getFullYear();
    let d = new Date(y, month, +day[1], time ? +time[1] : 0, time ? +time[2] : 0);
    if (!year && d - now > 36e5 * 36) d = new Date(y - 1, month, +day[1], d.getHours(), d.getMinutes());
    return d.getTime();
  };

  const TYPES = ['Reel', 'Video', 'Photo', 'Text', 'Link', 'Album', 'Status', 'Story', 'Live'];

  // Column header → field. Matching is loose so renamed/reordered columns still work.
  const FIELDS = [
    ['title', /^title$/i], ['date', /date/i], ['views3s', /3-second/i], ['avgPlay', /average play/i],
    ['watchMs', /watch time/i], ['viewers', /^viewers$/i], ['views', /^views$/i], ['reach', /^reach$/i],
    ['interactions', /^interactions$/i], ['reactions', /reactions/i], ['comments', /^comments$/i],
    ['shares', /^shares$/i], ['saves', /^saves$/i], ['follows', /^follows$/i], ['earnings', /earnings/i],
  ];
  RI.mapHeaders = function (hdr) {
    const map = {};
    hdr.forEach((h, i) => {
      h = RI.clean(h);
      for (const [f, re] of FIELDS) if (map[f] == null && re.test(h)) { map[f] = i; break; }
    });
    return map;
  };

  // cells: array of cell innerText, map from mapHeaders
  RI.rowToReel = function (cells, map, now) {
    const get = (f) => (map[f] == null ? null : cells[map[f]]);
    const dateText = RI.clean(get('date'));
    if (!dateText) return null;
    const lines = String(get('title') || '').split('\n').map(RI.clean).filter(Boolean);
    const title = lines[0] || '(untitled)';
    const type = lines.find((l) => TYPES.includes(l)) || '';
    const r = {
      key: title.slice(0, 80) + '|' + dateText, title, type, dateText,
      published: RI.parseDate(dateText, now),
      avgPlay: RI.secs(get('avgPlay')),
    };
    for (const f of ['views', 'reach', 'viewers', 'interactions', 'reactions', 'comments', 'shares', 'saves', 'follows', 'watchMs', 'views3s', 'earnings']) {
      r[f] = RI.num(get(f));
    }
    return r;
  };

  // Results-page charts: innerText lines → { follows: [{ts, v}], views: [...] }
  RI.parseCharts = function (text) {
    const lines = RI.clean(text).split('\n').map(RI.clean).filter(Boolean);
    const out = {};
    for (let i = 0; i < lines.length - 1; i++) {
      // Business Suite separates these with spaces or tabs depending on how the text is read.
      if (!/^\d{9,11}(\s+\d{9,11})+$/.test(lines[i]) || !/^Primary\s/.test(lines[i + 1])) continue;
      const ts = lines[i].split(/\s+/).map(Number);
      const vals = lines[i + 1].slice(8).trim().split(/\s+/).map(Number);
      let j = i;
      while (j > 0 && lines[j] !== 'Export') j--;
      const name = j > 0 ? lines[j - 1].toLowerCase() : 'chart' + i;
      if (!out[name]) out[name] = ts.map((t, k) => ({ ts: t * 1000, v: vals[k] || 0 }));
    }
    return out;
  };

  const median = (a) => {
    const s = a.filter((x) => x != null && !isNaN(x)).sort((x, y) => x - y);
    if (!s.length) return null;
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  RI.median = median;

  // Merge stored state with a fresh scan. State: { reels: {key: reel}, follows: {ts: v}, views: {ts: v}, updated }
  RI.merge = function (state, scan) {
    state = state || { reels: {}, follows: {}, views: {} };
    for (const r of scan.reels || []) state.reels[r.key] = Object.assign(state.reels[r.key] || {}, r, { seen: Date.now() });
    for (const name of ['follows', 'views']) {
      for (const p of (scan.charts && scan.charts[name]) || []) state[name][p.ts] = p.v;
    }
    state.updated = Date.now();
    return state;
  };

  // Estimate follows per reel. Meta credits follows to the Page, not to reels, so each day's
  // follows are split across reels published that day or the day before, weighted by views.
  RI.attribute = function (reels, follows) {
    const days = Object.keys(follows || {}).map(Number).sort((a, b) => a - b);
    const est = {};
    let unattributed = 0, total = 0;
    if (!days.length) return { est, unattributed, total, hasData: false };
    const dayOf = (t) => { let d = null; for (const x of days) if (x <= t) d = x; else break; return d; };
    const byDay = {};
    for (const r of reels) {
      if (!r.published || !r.views) continue;
      const d = dayOf(r.published);
      if (d == null) continue;
      (byDay[d] = byDay[d] || []).push(r);
    }
    days.forEach((d, i) => {
      const f = follows[d] || 0;
      total += f;
      if (!f) return;
      const cands = [...(byDay[d] || []), ...(i > 0 ? byDay[days[i - 1]] || [] : [])];
      const w = cands.reduce((s, r) => s + r.views, 0);
      if (!w) { unattributed += f; return; }
      for (const r of cands) est[r.key] = (est[r.key] || 0) + (f * r.views) / w;
    });
    return { est, unattributed, total, hasData: true };
  };

  RI.analyze = function (state) {
    const all = Object.values((state && state.reels) || {});
    const reels = all.filter((r) => r.views != null && (!r.type || r.type === 'Reel' || r.type === 'Video'));
    const med = median(reels.map((r) => r.views)) || 0;
    const att = RI.attribute(reels, state && state.follows);
    const rows = reels.map((r) => ({
      ...r,
      x: med ? r.views / med : null,
      hold: r.views3s != null && r.views ? r.views3s / r.views : null,
      ipk: r.interactions != null && r.views ? (r.interactions / r.views) * 1000 : null,
      estFollows: att.hasData ? att.est[r.key] || 0 : null,
    }));
    rows.forEach((r) => { r.fpk = r.estFollows != null && r.views ? (r.estFollows / r.views) * 1000 : null; });

    const totalViews = rows.reduce((s, r) => s + (r.views || 0), 0);
    const holdMed = median(rows.map((r) => r.hold));

    // Time of day (local hour posted)
    const slotMap = {};
    for (const r of rows) {
      if (!r.published) continue;
      const h = new Date(r.published).getHours();
      (slotMap[h] = slotMap[h] || []).push(r.views);
    }
    const slots = Object.entries(slotMap).map(([h, v]) => ({ hour: +h, n: v.length, med: median(v) })).sort((a, b) => a.hour - b.hour);

    // Posting load: how many posts that day vs views per reel
    const dayMap = {};
    for (const r of rows) {
      if (!r.published) continue;
      const d = new Date(r.published); d.setHours(0, 0, 0, 0);
      (dayMap[d.getTime()] = dayMap[d.getTime()] || []).push(r.views);
    }
    const loadMap = {};
    for (const v of Object.values(dayMap)) {
      const b = v.length >= 4 ? '4+' : String(v.length);
      (loadMap[b] = loadMap[b] || []).push(...v);
    }
    const load = ['1', '2', '3', '4+'].filter((b) => loadMap[b]).map((b) => ({ bucket: b, n: loadMap[b].length, med: median(loadMap[b]) }));

    // Plain-English findings
    // Each finding is { text, pro }. Pro findings are hidden behind the paywall in the panel.
    const tips = [];
    const free = (text) => tips.push({ text, pro: false });
    const pro = (text) => tips.push({ text, pro: true });
    const breakouts = rows.filter((r) => r.x >= 2).sort((a, b) => b.views - a.views);
    if (breakouts.length) free(`${breakouts.length} breakout${breakouts.length > 1 ? 's' : ''} (2×+ your typical ${fmt(med)} views). Make more like: “${breakouts[0].title.slice(0, 60)}”.`);
    const hi = rows.filter((r) => r.hold != null && r.hold >= 0.45), lo = rows.filter((r) => r.hold != null && r.hold < 0.45);
    if (hi.length >= 2 && lo.length >= 2) {
      const a = median(hi.map((r) => r.views)), b = median(lo.map((r) => r.views));
      if (a && b) free(`Reels where 45%+ watched past 3 seconds got ${ratio(a, b)} the views (${fmt(a)} vs ${fmt(b)}). The first 3 seconds decide reach.`);
    }
    const l1 = load.find((x) => x.bucket === '1' || x.bucket === '2'), l4 = load.find((x) => x.bucket === '4+') || load.find((x) => x.bucket === '3');
    if (l1 && l4 && l4.n >= 3 && l1.med > l4.med * 1.2) pro(`On days you post ${l4.bucket} reels, each gets a median ${fmt(l4.med)} views vs ${fmt(l1.med)} on lighter days. Posting more is splitting your reach.`);
    const goodSlots = slots.filter((s) => s.n >= 2).sort((a, b) => b.med - a.med);
    if (goodSlots.length >= 2) pro(`Best posting hour so far: ${pad(goodSlots[0].hour)}:00 (median ${fmt(goodSlots[0].med)} views, ${goodSlots[0].n} posts). Weakest: ${pad(goodSlots.at(-1).hour)}:00 (${fmt(goodSlots.at(-1).med)}).`);
    if (att.hasData && att.total) {
      const first = Math.min(...Object.keys(state.follows).map(Number));
      const winViews = rows.filter((r) => r.published >= first).reduce((s, r) => s + (r.views || 0), 0) || totalViews;
      const fpk = winViews ? (att.total / winViews) * 1000 : 0;
      pro(`${att.total} follows from ${fmt(winViews)} reel views = ${fpk.toFixed(2)} per 1,000 views. At this rate 1,000 followers needs about ${fmt(fpk ? 1000 / fpk * 1000 : 0)} views.`);
      const topF = rows.filter((r) => r.estFollows >= 1).sort((a, b) => b.estFollows - a.estFollows)[0];
      if (topF) pro(`Most followers (est. ${topF.estFollows.toFixed(1)}) came around “${topF.title.slice(0, 60)}”.`);
    } else if (!att.hasData) {
      free('Open Insights → Results once so Hookrate can read your daily follows and estimate which reels bring followers.');
    }

    return { rows, med, holdMed, totalViews, slots, load, tips, att, count: rows.length, other: all.length - rows.length };
  };

  function fmt(n) {
    if (n == null) return '–';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e4) return Math.round(n / 1e3) + 'K';
    return Math.round(n).toLocaleString('en-GB');
  }
  function ratio(a, b) { return (a / b).toFixed(1) + '×'; }
  function pad(h) { return String(h).padStart(2, '0'); }
  RI.fmt = fmt;

  if (typeof module !== 'undefined' && module.exports) module.exports = RI;
})(typeof window !== 'undefined' ? window : globalThis);
