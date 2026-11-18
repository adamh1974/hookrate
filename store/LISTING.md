# Chrome Web Store listing: Hookrate

Copy each field into the Developer Dashboard (chrome.google.com/webstore/devconsole).

## Store listing tab

**Name** (taken from manifest.json): Hookrate: Reels follows, hooks & best times

**Summary** (from manifest.json, 118/132 chars):
See which Facebook Reels bring followers, which hooks hold viewers, and when to post. Your data stays in your browser.

**Category:** Productivity → Tools (or Social & Communication, if offered)
**Language:** English (UK)

**Description:**

Meta Business Suite tells you how many followers your Page gained, but not which Reels earned them. Hookrate fills that gap.

Open Insights in Meta Business Suite, click the Hookrate button, and get a side panel that shows:

• Which Reels brought followers. Meta only counts follows for the whole Page, so Hookrate shares each day's new followers between the Reels that were pulling views that day. It's an estimate, and it's labelled as one.
• Your typical views, and how far each Reel beat or missed them (e.g. 25× your typical).
• Hook hold: the share of viewers who were still watching after 3 seconds, for every Reel. Reels that hold attention get shown to more people.
• Breakouts: the Reels that did 2× or more your typical views, so you can make more like them.
• Best posting hours, based on your own results.
• Posts per day: whether posting more Reels a day is splitting your reach.
• Plain-English findings at the top, like "Reels where 45%+ watched past 3 seconds got 4.8× the views."

FREE
• Reel scan, typical views, 3-second hold, the full Reels table, and breakout and hook findings.

PRO (monthly subscription, cancel any time)
• Estimated follows per Reel and follow-rate findings
• Best posting hours
• The posts-per-day check

PRIVACY
Hookrate reads the Insights pages you open in Meta Business Suite and stores the numbers in your browser's extension storage. It has no servers, sends your insights nowhere, and never asks for your Facebook password. Payments for Pro are handled by ExtensionPay and Stripe.

Hookrate is an independent tool and is not affiliated with, endorsed by or sponsored by Meta or Facebook.

**Images:** `store/images/screenshot-1.png`, `-2.png`, `-3.png` (1280×800), and the optional small promo tile `promo-tile-440x280.png`. Icon: `icon128.png`.

## Privacy practices tab

**Single purpose:**
Show Facebook Reels creators analytics for their own Reels (follows, hook hold, posting times), using the Insights pages they open in Meta Business Suite.

**Permission justifications:**
- `storage`: saves the user's scanned Reel stats and daily follow counts locally, so findings build up over time without re-scanning.
- Host access to `https://business.facebook.com/*` (content script): reads the Insights → Content table and the Insights → Results charts the user is viewing, and adds the Hookrate button and panel. It doesn't click, post or change anything on the page.
- Host access to `https://extensionpay.com/*` (content script): required by ExtensionPay to confirm a Pro payment and unlock Pro straight away.
- Remote code: **No.** All code is in the package. (ExtPay.js talks to extensionpay.com's API, but it doesn't load code from there.)

**Data usage (tick boxes):**
- Website content: **Yes.** Reel analytics shown on the user's Business Suite Insights pages. Stored only locally.
- Personally identifiable information: **Yes, for Pro buyers only.** ExtensionPay/Stripe collect an email address and payment details at checkout. Hookrate itself never sees card details.
- Financial and payment information: handled by Stripe through ExtensionPay, not by the extension.
- Everything else (health, auth info, personal communications, location, web history, user activity): **No.**

Certify:
- Data is not sold to third parties.
- Data is not used or transferred for purposes unrelated to the single purpose.
- Data is not used to work out creditworthiness or for lending.

**Privacy policy URL:** https://adamh1974.github.io/hookrate/store/privacy-policy.html (source: https://github.com/adamh1974/hookrate)

## Distribution
- Visibility: Public. Regions: all.
- Pricing on the listing: free. Pro is an in-extension purchase; the description says so (Google asks for paywalls to be disclosed in the listing).

## Notes for the reviewer (Test instructions field)
Hookrate only runs on Meta Business Suite Insights pages, so testing needs a Facebook Page with at least a few Reels. Open business.facebook.com → Insights → Results (follows are saved automatically), then Insights → Content → click "📊 Hookrate" (bottom right) → Scan reels. Pro features show locked until a payment is made through ExtensionPay.
