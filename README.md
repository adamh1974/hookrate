# Hookrate (was Reel Insights), v0.3

A Chrome/Brave extension for Facebook Reels creators. It reads your own Meta Business Suite pages, locally in your browser, and shows:

- **Typical views, and how far each reel beat or missed them** (e.g. 2.3× your typical)
- **3-second hold:** the share of viewers still watching after 3 seconds
- **Estimated follows per reel.** Meta only counts follows for the Page as a whole, so daily follows are shared between that day's and the previous day's reels by views
- **Best posting hours**, and whether posting more reels a day splits your reach
- Plain-English findings at the top

**Free:** scan, typical views, 3-second hold, the reels table, and the breakout and hook findings.
**Pro:** estimated follows per reel, follow-rate findings, best posting hours, and the posts-per-day check. Payments go through [ExtensionPay](https://extensionpay.com) (5% fee plus Stripe's fees; no monthly cost).

No servers of our own, no Meta login, no API. Data is saved in the browser's extension storage, separately for each Page (`asset_id`).

## Install (unpacked, for testing)
1. Open `brave://extensions` (or `chrome://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this `reels-insights` folder.
4. Open Meta Business Suite → **Insights → Results** once, so the extension saves your daily follows automatically.
5. Go to **Insights → Content**, click **📊 Hookrate** (bottom right), then **Scan reels**.

After code changes, press the ↻ reload button on the extension's card, then refresh Business Suite.

## Turning payments on (your steps)
1. Sign up at extensionpay.com and register an extension with the id `hookrate`. If you pick a different id, change `src/config.js` to match.
2. Connect a Stripe account in ExtensionPay. Stripe needs your ID and bank details, and you must be 18+.
3. Create the plan in the ExtensionPay dashboard (suggested: $4.99/month).
4. Load the extension unpacked and press **Unlock Pro** to try a test payment (ExtensionPay starts in test mode).

`lib/ExtPay.js` (v3.1.2) is AGPL-3.0 licensed. The simplest way to comply is to publish this extension's source code openly, e.g. on GitHub.

## Files
- `src/core.js`: parsing and analysis (pure, tested with `node test/core.test.js`)
- `src/scrape.js`: reads the Content table and the Results charts (read-only)
- `src/panel.js`: floating button and side panel (shadow DOM)
- `src/content.js`: wiring, storage, the automatic Results reader, and Pro status checks
- `background.js` + `lib/ExtPay.js` + `src/config.js`: payments (service worker)
- `test/build-inject.sh`: builds a bundle with stubbed storage and payments for testing in a live Business Suite tab

## Not done yet
- Topic and hook tagging, comparing date ranges, CSV export
- Store listing: final name, screenshots, privacy policy (no data collected), $5 developer registration

## Links
- Source: https://github.com/adamh1974/hookrate (AGPL-3.0, see LICENSE)
- Privacy policy: https://adamh1974.github.io/hookrate/store/privacy-policy.html
