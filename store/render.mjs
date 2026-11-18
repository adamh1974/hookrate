// Renders the store images from store/demo.html with headless Brave over the DevTools protocol.
// Usage: <node> store/render.mjs   (node 22+ for the built-in WebSocket)
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BRAVE = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const PORT = 9411;
const profile = mkdtempSync(join(tmpdir(), 'hookrate-shot-'));
const brave = spawn(BRAVE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
}
if (!target) { brave.kill(); throw new Error('Brave did not start'); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const waiting = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

const page = pathToFileURL(join(here, 'demo.html')).href;
const shots = [['#1', 'screenshot-1.png', 1280, 800], ['#2', 'screenshot-2.png', 1280, 800], ['#3', 'screenshot-3.png', 1280, 800], ['#tile', 'promo-tile-440x280.png', 440, 280]];
for (const [hash, file, w, h] of shots) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'about:blank' });
  await sleep(200);
  await send('Page.navigate', { url: page + hash });
  await sleep(1500);
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  writeFileSync(join(here, 'images', file), Buffer.from(r.result.data, 'base64'));
  console.log('wrote', file);
}
ws.close(); brave.kill(); await sleep(300); rmSync(profile, { recursive: true, force: true });
