#!/bin/sh
# Builds test/inject-bundle.js: the extension with an in-memory chrome.storage stub, for testing in a
# Business Suite tab without installing. Load it via a file input + blob: <script> (the page's CSP allows blob:,
# blocks eval and fetch to localhost).
cd "$(dirname "$0")/.." && cat test/storage-stub.js src/config.js src/core.js src/scrape.js src/panel.js src/content.js > test/inject-bundle.js && echo test/inject-bundle.js
