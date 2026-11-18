// Service worker: payments only. ExtPay talks to extensionpay.com; nothing else leaves the browser.
importScripts('src/config.js', 'lib/ExtPay.js');
ExtPay(RI_EXTPAY_ID).startBackground();

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  const extpay = ExtPay(RI_EXTPAY_ID); // redeclare inside callbacks (service-worker quirk, per ExtPay docs)
  if (msg && msg.t === 'ri:user') {
    extpay.getUser()
      .then((u) => reply({ ok: true, paid: !!u.paid, status: u.subscriptionStatus || null, email: u.email || null }))
      .catch((e) => reply({ ok: false, error: String(e && e.message || e) }));
    return true; // async reply
  }
  if (msg && msg.t === 'ri:pay') {
    extpay.openPaymentPage().then(() => reply({ ok: true })).catch((e) => reply({ ok: false, error: String(e) }));
    return true;
  }
});
