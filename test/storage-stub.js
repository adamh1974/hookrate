(function(){ if (window.__riLoaded) { document.getElementById('reel-insights-root')?.remove(); }
window.__riLoaded = true;
const mem = window.__riStore || (window.__riStore = {});
window.chrome = window.chrome || {};
chrome.storage = { local: { get: (k, cb) => cb({ [k]: mem[k] && JSON.parse(JSON.stringify(mem[k])) }), set: (o, cb) => { Object.assign(mem, JSON.parse(JSON.stringify(o))); cb && cb(); } } };
// Fake background worker: window.__riPaid toggles Pro; clicks on Unlock are counted.
chrome.runtime = { lastError: undefined, sendMessage: (msg, cb) => { if (msg.t === 'ri:pay') window.__riPayClicks = (window.__riPayClicks || 0) + 1; setTimeout(() => cb && cb({ ok: true, paid: !!window.__riPaid }), 50); } };
})();
