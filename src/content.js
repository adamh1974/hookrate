// Wires everything up on business.facebook.com. Business Suite is a single-page app, so we watch the URL.
(function (root) {
  const RI = root.RI;
  const key = () => 'ri:' + RI.assetId();

  const load = () => new Promise((res) => chrome.storage.local.get(key(), (o) => res(o[key()] || { reels: {}, follows: {}, views: {} })));
  const save = (state) => new Promise((res) => chrome.storage.local.set({ [key()]: state }, res));

  // Pro status comes from the background worker (ExtensionPay). Any failure → free.
  RI.pro = false;
  RI.checkPro = () => new Promise((res) => {
    try {
      chrome.runtime.sendMessage({ t: 'ri:user' }, (u) => {
        void chrome.runtime.lastError;
        RI.pro = !!(u && u.ok && u.paid);
        res(RI.pro);
      });
    } catch (e) { res(false); }
  });
  const pay = () => { try { chrome.runtime.sendMessage({ t: 'ri:pay' }, () => void chrome.runtime.lastError); } catch (e) {} };

  async function scan() {
    RI.renderPanel(await load(), 'Scanning… scrolling through your reels.');
    try {
      const out = await RI.scrapeContent((n) => RI.setFab(`Scanning… ${n}`));
      const state = RI.merge(await load(), { reels: out.reels });
      await save(state);
      RI.renderPanel(state, `Scanned ${out.reels.length} posts just now.`);
    } catch (e) {
      RI.renderPanel(await load(), '⚠️ ' + e.message);
    }
    RI.setFab('📊 Hookrate');
  }

  async function readCharts(quiet) {
    const charts = RI.scrapeCharts();
    if (!charts.follows) {
      if (!quiet) RI.renderPanel(await load(), '⚠️ No Follows chart found yet. Wait for the page to finish loading and try again.');
      return false;
    }
    const state = RI.merge(await load(), { charts });
    await save(state);
    if (!quiet || RI.panelOpen()) RI.renderPanel(state, `Read ${charts.follows.length} days of follows just now.`);
    return true;
  }

  RI.mountUI({
    open: async () => {
      await RI.checkPro();
      const page = RI.page();
      if (page === 'content') return scan();
      if (page === 'results') return readCharts(false);
      RI.renderPanel(await load());
    },
    scan,
    charts: () => readCharts(false),
    pay,
    refresh: async () => RI.renderPanel(await load()),
    close: () => RI.closePanel(),
  });

  window.addEventListener('focus', async () => {
    if (RI.panelOpen && RI.panelOpen()) { const was = RI.pro; if ((await RI.checkPro()) !== was) RI.renderPanel(await load()); }
  });

  // Quietly save daily follows whenever the Results page is open (read-only).
  let lastUrl = '', tries = 0;
  setInterval(async () => {
    if (location.href !== lastUrl) { lastUrl = location.href; tries = 0; }
    if (RI.page() === 'results' && tries < 6) {
      tries++;
      if (await readCharts(true)) tries = 99;
    }
  }, 2500);
})(window);
