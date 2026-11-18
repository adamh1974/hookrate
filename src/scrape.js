// DOM readers for Meta Business Suite. Read-only: they scroll the table but never click or change anything.
(function (root) {
  const RI = root.RI;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  RI.assetId = () => new URLSearchParams(location.search).get('asset_id') || 'default';
  RI.page = () => (/\/insights\/content/.test(location.pathname) ? 'content' : /\/insights\/results/.test(location.pathname) ? 'results' : /\/insights/.test(location.pathname) ? 'insights' : 'other');

  function scroller(el) {
    while (el && el !== document.body) {
      const st = getComputedStyle(el);
      if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 5) return el;
      el = el.parentElement;
    }
    return document.scrollingElement;
  }

  // Reads every row of Insights → Content, scrolling the virtualised table to load them all.
  RI.scrapeContent = async function (onProgress) {
    const grid = document.querySelector('[role="grid"], [role="table"]');
    if (!grid) throw new Error('No content table on this page. Open Insights → Content.');
    const hdr = [...grid.querySelectorAll('[role="columnheader"]')].map((h) => RI.clean(h.innerText));
    const map = RI.mapHeaders(hdr);
    if (map.date == null || map.views == null) throw new Error('The table needs the “Date published” and “Views” columns. Turn them on under Columns.');
    const sc = scroller(grid);
    const start = sc.scrollTop;
    const seen = new Map();
    const now = new Date();
    const grab = () => {
      let added = 0;
      for (const row of grid.querySelectorAll('[role="row"]')) {
        const cells = [...row.querySelectorAll('[role="cell"], [role="gridcell"]')].map((c) => c.innerText);
        if (!cells.length) continue;
        const r = RI.rowToReel(cells, map, now);
        if (!r) continue;
        if (!seen.has(r.key)) added++;
        seen.set(r.key, r);
      }
      return added;
    };
    sc.scrollTop = 0;
    await sleep(500);
    let stale = 0;
    for (let i = 0; i < 300 && stale < 4; i++) {
      const added = grab();
      if (onProgress) onProgress(seen.size);
      const before = sc.scrollTop;
      sc.scrollTop = before + Math.max(300, sc.clientHeight * 0.8);
      await sleep(550);
      stale = added || sc.scrollTop !== before ? 0 : stale + 1;
    }
    grab();
    sc.scrollTop = start;
    return { hdr, reels: [...seen.values()] };
  };

  // Reads the daily charts on Insights → Results (they include their data as text).
  RI.scrapeCharts = function () {
    return RI.parseCharts(document.body.innerText);
  };
})(window);
