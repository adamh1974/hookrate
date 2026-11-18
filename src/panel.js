// The floating button + insights panel, drawn in a shadow root so Business Suite's CSS can't touch it.
(function (root) {
  const RI = root.RI;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (x) => (x == null ? '–' : Math.round(x * 100) + '%');
  const fmt = (n) => RI.fmt(n);

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .fab { position: fixed; right: 20px; bottom: 20px; z-index: 2147483646; background: #111827; color: #fff; border: 0;
    border-radius: 999px; padding: 11px 16px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.25); }
  .fab:hover { background: #1f2937; }
  .panel { position: fixed; top: 0; right: 0; width: min(560px, 100vw); height: 100vh; z-index: 2147483647; background: #fff; color: #111827;
    box-shadow: -10px 0 30px rgba(0,0,0,.18); display: flex; flex-direction: column; font-size: 13px; }
  header { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; }
  header h1 { font-size: 15px; margin: 0; flex: 1; }
  button.b { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; color: #111827; }
  button.b.primary { background: #111827; color: #fff; border-color: #111827; }
  .body { overflow: auto; padding: 14px 16px 40px; flex: 1; }
  .status { color: #6b7280; font-size: 12px; margin-bottom: 10px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .kpi { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 8px; }
  .kpi b { display: block; font-size: 17px; }
  .kpi span { color: #6b7280; font-size: 11px; }
  h2 { font-size: 13px; margin: 18px 0 8px; }
  ul.tips { margin: 0; padding-left: 18px; } ul.tips li { margin: 0 0 6px; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: right; color: #6b7280; font-weight: 600; padding: 5px 4px; border-bottom: 1px solid #e5e7eb; cursor: pointer; white-space: nowrap; user-select: none; }
  th:first-child, td:first-child { text-align: left; }
  td { text-align: right; padding: 5px 4px; border-bottom: 1px solid #f3f4f6; font-variant-numeric: tabular-nums; }
  td.t { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .scroll-x { overflow-x: auto; }
  td small { color: #9ca3af; display: block; }
  .hot { color: #047857; font-weight: 600; } .cold { color: #b91c1c; }
  .bar { height: 8px; background: #111827; border-radius: 4px; display: inline-block; vertical-align: middle; }
  .note { color: #6b7280; font-size: 11px; margin-top: 6px; line-height: 1.4; }
  .lock { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 12px; margin-top: 14px; line-height: 1.5; }
  .lock b { display: block; margin-bottom: 4px; }
  .badge { background: #ede9fe; color: #5b21b6; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 700; }
  button.b.pro { background: #6d28d9; color: #fff; border-color: #6d28d9; }
  .empty { padding: 30px 0; text-align: center; color: #4b5563; line-height: 1.6; }
  `;

  let host, shadow, sortKey = 'views', sortDir = -1;

  RI.mountUI = function (handlers) {
    if (host) return;
    host = document.createElement('div');
    host.id = 'reel-insights-root';
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${CSS}</style><button class="fab">📊 Hookrate</button><div class="panel" hidden></div>`;
    shadow.querySelector('.fab').onclick = handlers.open;
    RI._handlers = handlers;
  };

  RI.setFab = (text) => { if (shadow) shadow.querySelector('.fab').textContent = text; };

  RI.renderPanel = function (state, status) {
    const panel = shadow.querySelector('.panel');
    panel.hidden = false;
    shadow.querySelector('.fab').hidden = true;
    const a = RI.analyze(state);
    const page = RI.page();
    const scanBtn = page === 'content' ? '<button class="b primary" data-act="scan">Scan reels</button>'
      : page === 'results' ? '<button class="b primary" data-act="charts">Read follows</button>' : '';
    const pro = !!RI.pro;
    const proBtn = pro ? '<button class="b badge" data-act="pay" title="Manage your subscription">PRO ✓</button>' : '<button class="b pro" data-act="pay">Unlock Pro</button>';
    let html = `<header><h1>📊 Hookrate</h1>${proBtn}${scanBtn}<button class="b" data-act="close">Close</button></header><div class="body">`;
    html += `<div class="status">${esc(status || statusLine(state, a))}</div>`;

    if (!a.count) {
      html += `<div class="empty">No reels scanned yet.<br>Go to <b>Insights → Content</b> and press <b>Scan reels</b>.<br>Then open <b>Insights → Results</b> once so I can read your daily follows.</div></div>`;
      panel.innerHTML = html;
      wire(panel);
      return;
    }

    const follows = a.att.hasData ? a.att.total : null;
    html += `<div class="kpis">
      <div class="kpi"><b>${fmt(a.count)}</b><span>reels</span></div>
      <div class="kpi"><b>${fmt(a.med)}</b><span>typical views</span></div>
      <div class="kpi"><b>${pct(a.holdMed)}</b><span>typical 3-s hold</span></div>
      <div class="kpi"><b>${!pro ? '🔒' : follows == null ? '–' : follows}</b><span>follows${pro && follows == null ? ' (open Results)' : ''}</span></div>
    </div>`;

    const shown = a.tips.filter((t) => pro || !t.pro), locked = a.tips.length - shown.length;
    html += `<h2>What the data says</h2><ul class="tips">${shown.map((t) => `<li>${esc(t.text)}</li>`).join('')}</ul>`;
    if (locked) html += lockCard(`${locked} more finding${locked > 1 ? 's' : ''} in Pro`, 'Which reels actually bring followers, your best posting hours, and whether posting more is splitting your reach.');

    // Reels table
    const cols = [
      ['title', 'Reel'], ['views', 'Views'], ['x', 'vs typical'], ['hold', '3-s hold'], ['avgPlay', 'Avg play'], ['ipk', 'Int./1k'], ['estFollows', 'Est. follows'],
    ];
    const rows = [...a.rows].sort((p, q) => {
      const x = p[sortKey], y = q[sortKey];
      if (typeof x === 'string') return sortDir * String(x).localeCompare(String(y));
      return sortDir * ((x == null ? -Infinity : x) - (y == null ? -Infinity : y));
    });
    html += `<h2>Reels <span style="font-weight:400;color:#6b7280">(click a column to sort)</span></h2><div class="scroll-x"><table><thead><tr>${cols.map(([k, l]) => `<th data-sort="${k}">${l}${sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : ''}</th>`).join('')}</tr></thead><tbody>`;
    for (const r of rows) {
      const xCls = r.x >= 2 ? 'hot' : r.x != null && r.x < 0.8 ? 'cold' : '';
      const hCls = r.hold >= 0.45 ? 'hot' : r.hold != null && r.hold < 0.3 ? 'cold' : '';
      html += `<tr><td class="t" title="${esc(r.title)}">${esc(r.title)}<small>${esc(r.dateText)}</small></td>
        <td>${fmt(r.views)}</td><td class="${xCls}">${r.x == null ? '–' : r.x.toFixed(1) + '×'}</td><td class="${hCls}">${pct(r.hold)}</td>
        <td>${r.avgPlay == null ? '–' : Math.round(r.avgPlay) + 's'}</td><td>${r.ipk == null ? '–' : r.ipk.toFixed(1)}</td>
        <td>${!pro ? '🔒' : r.estFollows == null ? '–' : r.estFollows < 0.05 ? '0' : r.estFollows.toFixed(1)}</td></tr>`;
    }
    html += `</tbody></table></div><div class="note">Est. follows: Meta counts follows for the Page, not per reel, so each day's follows are shared between that day's and the previous day's reels by views. Treat it as a guide, not an exact count.</div>`;

    // Time of day and posting load are Pro
    if (!pro && (a.slots.length || a.load.length > 1)) {
      html += lockCard('Posting times and posts-per-day are in Pro', 'See which hours get you the most views and how many reels a day you can post before they start splitting reach.');
    }
    if (pro && a.slots.length) {
      const max = Math.max(...a.slots.map((s) => s.med || 0)) || 1;
      html += `<h2>When you posted (median views)</h2><table><tbody>${a.slots.map((s) => `<tr><td>${String(s.hour).padStart(2, '0')}:00</td><td style="text-align:left"><span class="bar" style="width:${Math.round(((s.med || 0) / max) * 220)}px"></span> ${fmt(s.med)}</td><td>${s.n} post${s.n > 1 ? 's' : ''}</td></tr>`).join('')}</tbody></table>`;
    }
    if (pro && a.load.length > 1) {
      html += `<h2>Posts per day vs views per reel</h2><table><tbody>${a.load.map((l) => `<tr><td>${l.bucket} a day</td><td>median ${fmt(l.med)} views</td><td>${l.n} reels</td></tr>`).join('')}</tbody></table>`;
    }
    html += `<div class="note">All numbers come from your Business Suite pages and stay in this browser. Payments are handled by ExtensionPay and Stripe.</div></div>`;
    panel.innerHTML = html;
    wire(panel);
  };

  function lockCard(title, body) {
    return `<div class="lock"><b>🔒 ${esc(title)}</b>${esc(body)}<div style="margin-top:8px"><button class="b pro" data-act="pay">Unlock Pro</button></div></div>`;
  }

  function statusLine(state, a) {
    const days = Object.keys(state.follows || {}).length;
    const when = state.updated ? new Date(state.updated).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'never';
    return `${a.count} reels${a.other ? ` (+${a.other} other posts hidden)` : ''} · ${days ? days + ' days of follow data' : 'no follow data yet'} · last update ${when}`;
  }

  function wire(panel) {
    panel.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => RI._handlers[b.dataset.act]()));
    panel.querySelectorAll('th[data-sort]').forEach((th) => (th.onclick = () => {
      const k = th.dataset.sort;
      if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = k === 'title' ? 1 : -1; }
      RI._handlers.refresh();
    }));
  }

  RI.closePanel = function () {
    shadow.querySelector('.panel').hidden = true;
    shadow.querySelector('.fab').hidden = false;
  };
  RI.panelOpen = () => shadow && !shadow.querySelector('.panel').hidden;
})(window);
