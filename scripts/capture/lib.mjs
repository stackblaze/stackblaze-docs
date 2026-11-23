// Screenshot capture: drives the REAL dashboard in the local, signed-in
// Chrome (CDP on 127.0.0.1:9222) and screenshots it in light mode.
// A flow performs the guide's steps; if a step can't be done, the flow throws
// and nothing is written. Only this script writes lib/screenshots.json.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const MANIFEST = path.join(ROOT, 'lib/screenshots.json');
// The service panel that slides in over the right of the canvas.
export const PANEL = { x: 624, y: 112, width: 852, height: 670 };
export const DASHBOARD = process.env.CAPTURE_DASHBOARD ?? 'https://dashboard-dev.stackblaze.com';
const CDP = process.env.CAPTURE_CDP ?? 'http://127.0.0.1:9222';

// Text that must never appear in a published screenshot (the capture
// account's email, etc.), replaced before each shot.
const MASK = (process.env.CAPTURE_MASK ?? '').split(',').filter(Boolean);
// Other text to swap before a shot, e.g. this machine's IP for a
// documentation address: CAPTURE_REPLACE="38.1.2.3=>203.0.113.10".
const REPLACE = (process.env.CAPTURE_REPLACE ?? '').split(';').filter(Boolean).map((p) => p.split('=>'));

export async function open() {
  const browser = await chromium.connectOverCDP(CDP);
  // A fresh 2x context with the signed-in Chrome's cookies and the
  // dashboard's localStorage, so screenshots are sharp and the viewport exact.
  const base = browser.contexts()[0];
  const probe = await base.newPage();
  await probe.goto(DASHBOARD + '/favicon.ico').catch(() => {});
  const local = await probe.evaluate(() => Object.entries(localStorage)).catch(() => []);
  await probe.close();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
    storageState: {
      cookies: await base.cookies(),
      origins: [{ origin: DASHBOARD, localStorage: [...local.filter(([k]) => k !== 'theme').map(([name, value]) => ({ name, value })), { name: 'theme', value: 'light' }] }],
    },
  });
  const page = await context.newPage();
  const pending = {};
  return {
    page,
    async goto(p) {
      // The dashboard keeps a socket open, so 'networkidle' never comes.
      await page.evaluate(() => localStorage.setItem('theme', 'light')).catch(() => {});
      await page.goto(DASHBOARD + p, { waitUntil: 'load' });
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await page.waitForTimeout(1500);
      if (new URL(page.url()).pathname.startsWith('/login')) {
        throw new Error('Not signed in to the dashboard in the capture browser.');
      }
    },
    /** Screenshot the page (or one element) in light mode under `id`. */
    async shot(id, { locator, around, pad = 16, clip, extraBottom = 0 } = {}) {
      await settle(page);
      await page.evaluate(() => {
        localStorage.setItem('theme', 'light');
        document.documentElement.classList.remove('dark');
      });
      await mask(page);
      await page.waitForTimeout(400);
      const rel = `/screenshots/${id}.png`;
      const out = path.join(ROOT, 'public', rel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      if (clip) {
        await page.screenshot({ path: out, clip, animations: 'disabled' });
      } else if (around) {
        // Crop to the union of these elements (plus padding): the part of the
        // screen the step is about, not the whole window.
        const boxes = [];
        for (const sel of [].concat(around)) {
          const b = await (typeof sel === 'string' ? page.locator(sel).first() : sel).boundingBox();
          if (!b) throw new Error(`shot ${id}: nothing to crop around (${sel})`);
          boxes.push(b);
        }
        const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
        const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
        const r = Math.min(1440, Math.max(...boxes.map((b) => b.x + b.width)) + pad);
        const btm = Math.min(900, Math.max(...boxes.map((b) => b.y + b.height)) + pad + extraBottom);
        await page.screenshot({ path: out, clip: { x, y, width: r - x, height: btm - y }, animations: 'disabled' });
      } else {
        const target = locator ? page.locator(locator).first() : page;
        await target.screenshot({ path: out, animations: 'disabled' });
      }
      const { width, height } = pngSize(out);
      const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
      pending[id] = {
        src: rel,
        width: Math.round(width / dpr), height: Math.round(height / dpr),
        capturedAt: new Date().toISOString(),
        source: new URL(page.url()).pathname,
      };
      console.log(`  shot ${id} (${pending[id].width}x${pending[id].height})`);
    },
    /** Screenshot another page (e.g. the deployed app itself) under `id`. */
    async shotPage(id, other, source) {
      const rel = `/screenshots/${id}.png`;
      const out = path.join(ROOT, 'public', rel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await other.screenshot({ path: out });
      const { width, height } = pngSize(out);
      const dpr = await other.evaluate(() => window.devicePixelRatio || 1);
      pending[id] = { src: rel, width: Math.round(width / dpr), height: Math.round(height / dpr), capturedAt: new Date().toISOString(), source };
      console.log(`  shot ${id} (${pending[id].width}x${pending[id].height})`);
    },
    /** Write the manifest only after the whole flow succeeded. */
    async done() {
      const m = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
      Object.assign(m, pending);
      const sorted = Object.fromEntries(Object.keys(m).sort().map((k) => [k, m[k]]));
      fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');
      await context.close();
      await browser.close(); // over CDP this only disconnects
    },
  };
}

async function settle(page) {
  await page.waitForLoadState('load').catch(() => {});
  // No spinners / skeletons left on screen.
  await page.waitForFunction(() => !document.querySelector('.animate-spin, [data-skeleton], .skeleton'), null, { timeout: 15000 }).catch(() => {});
}

// Also blanks credentials the dashboard shows in clear text: the password in
// a `scheme://user:password@host` URL, `*PASSWORD=value` lines, and the
// partly revealed `ab••••••yz` password field.
async function mask(page) {
  await page.evaluate(([words, pairs]) => {
    const fix = (t) => {
      for (const w of words) if (t.includes(w)) t = t.split(w).join('you@example.com');
      for (const [a, b] of pairs) if (t.includes(a)) t = t.split(a).join(b);
      return t
        .replace(/^\s*[^\s•]{0,4}•{6,}[^\s•]{0,4}\s*$/, '••••••••••••')
        .replace(/(:\/\/[^:\/\s@]+:)\S+@/g, '$1••••••••@')
        .replace(/(PASSWORD[A-Z_]*=)\S+/g, '$1••••••••');
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const v = fix(n.nodeValue);
      if (v !== n.nodeValue) n.nodeValue = v;
    }
    for (const el of document.querySelectorAll('input, textarea')) {
      const v = fix(el.value);
      if (v !== el.value) el.value = v;
    }
  }, [MASK, REPLACE]);
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}
