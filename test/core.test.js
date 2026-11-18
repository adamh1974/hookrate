const RI = require('../src/core.js');
const assert = require('assert');
assert.equal(RI.num('1,179'), 1179); assert.equal(RI.num('29.4K'), 29400); assert.equal(RI.num('‑‑'), null); assert.equal(RI.num('$0.00'), 0);
assert.equal(RI.secs('5s'), 5); assert.equal(RI.secs('1m 5s'), 65);
const now = new Date(2026, 10, 18, 15);
assert.equal(new Date(RI.parseDate('18 November 12:00', now)).getDate(), 18);
assert.equal(new Date(RI.parseDate('28 December 12:00', now)).getFullYear(), 2025);
const hdr = ["Title","Date published","Views","Reach","Viewers","Interactions","Likes and reactions","Comments","Shares","Saves","Link clicks","Replies","Follows","Watch time","Video average play time","3-second views","Approximate in-stream ad earnings"];
const map = RI.mapHeaders(hdr);
assert.equal(map.views, 2); assert.equal(map.views3s, 15); assert.equal(map.follows, 12); assert.equal(map.reactions, 6);
const rows = [
 ['Ukraine says it hit Russia 1,000 km deep\nReel\nWar Room Files','16 November 14:00','1,179','‑‑','1,034','70','68','0','0','0','‑‑','‑‑','0','8,000,000','8s','615','$0.00'],
 ['Can drone hunters keep up?\nReel','16 November 18:00','812','‑‑','738','3','2','1','0','0','‑‑','‑‑','0','6,528,266','9s','439','$0.00'],
 ['Why Ukraine flew drones to Siberia\nReel','13 November 15:00','4,432','‑‑','3,912','62','58','4','1','0','‑‑','‑‑','0','38,714,164','10s','2,285','$0.00'],
 ['Oil\nReel','17 November 16:00','276','‑‑','246','0','0','0','0','0','‑‑','‑‑','0','1,179,963','5s','78','$0.00'],
 ['Bridge\nReel','17 November 19:00','271','‑‑','252','1','1','0','0','0','‑‑','‑‑','0','1,232,973','5s','79','$0.00'],
 ['Tape\nReel','17 November 22:00','254','‑‑','237','1','1','0','0','0','‑‑','‑‑','0','956,881','4s','72','$0.00'],
 ['Drones\nReel','17 November 13:00','278','‑‑','258','1','1','0','0','0','‑‑','‑‑','0','1,738,264','7s','102','$0.00'],
 ['Profile pic\nPhoto','9 November 10:00','50','‑‑','40','1','1','0','0','0','‑‑','‑‑','0','‑‑','‑‑','‑‑','$0.00'],
].map(c => RI.rowToReel(c, map, now));
assert.equal(rows[0].type, 'Reel'); assert.equal(rows[0].views, 1179); assert.equal(rows[7].type, 'Photo');
// Results-page chart text (Pacific-midnight day starts, as Business Suite emits)
const chartText = 'Views\n​\nExport\n29.4K\n1794643200 1794729600 1794816000 1794902400\nPrimary 15481 1894 3252 1774\nFacebook visits\nFollows\n​\nExport\n32\n1794470400 1794556800 1794643200 1794729600 1794816000 1794902400\nPrimary 2 0 18 1 5 0\n';
const charts = RI.parseCharts(chartText);
assert.equal(charts.follows.length, 6); assert.equal(charts.follows[2].v, 18); assert.equal(charts.views[0].v, 15481);
const state = RI.merge(null, { reels: rows, charts });
const a = RI.analyze(state);
assert.equal(a.count, 7); assert.equal(a.other, 1);
const total = Object.values(a.att.est).reduce((s, v) => s + v, 0) + a.att.unattributed;
assert.ok(Math.abs(total - a.att.total) < 1e-9, 'attribution conserves follows');
console.log('tips:\n- ' + a.tips.map(t => (t.pro ? '[PRO] ' : '') + t.text).join('\n- '));
console.log('est:', a.rows.map(r => r.title.slice(0, 14) + '=' + (r.estFollows || 0).toFixed(1)).join(', '), '| unattributed', a.att.unattributed);
console.log('OK');
