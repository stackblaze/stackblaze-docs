// What a blocked IP range covers: block this machine's /32 on a scratch
// service (github-demo-cw8z's crondemo), then try HTTPS and a WebSocket from
// that address, then turn advanced networking off again. No screenshots
// (they would show the address).
import { open } from '../lib.mjs';
import { helpers, probe } from './_settings.mjs';

const MYIP = process.env.MYIP;
if (!MYIP) throw new Error('MYIP not set');
const c = await open();
const h = helpers(c, process.env.CAPTURE_PROJECT ?? 'github-demo-cw8z', process.env.CAPTURE_SERVICE ?? 'crondemo');
const { page } = h;
const s0 = await (async () => { await h.openSettings(); return h.spec(); })();
const host = s0.ingress.hosts[0].host;
const ws = (path) => new Promise((resolve) => {
  const w = new WebSocket(`wss://${host}${path}`);
  const t = setTimeout(() => { resolve('timeout'); try { w.close(); } catch {} }, 15000);
  w.onopen = () => w.send('hi');
  w.onmessage = (e) => { clearTimeout(t); resolve(`message: ${e.data}`); w.close(); };
  w.onerror = () => { clearTimeout(t); resolve('error (refused)'); };
});
console.log('before: https', (await probe(`https://${host}/`)).status, '| ws', await ws('/before'));
await h.jump('Network');
await h.setSwitch('#app-advanced-networking', true);
await page.locator('#net-denylist').fill(`${MYIP}/32`);
await h.commitDeploy('Block one IP (scope test)');
let st = 0;
for (let i = 0; i < 30 && st !== 403; i++) { await page.waitForTimeout(10000); st = (await probe(`https://${host}/`)).status; }
const r = await probe(`https://${host}/`);
console.log('blocked: https', r.status, r.body.replace(/\s+/g, ' ').slice(0, 120), '| ws', await ws('/blocked'));
console.log('blocked: http (no TLS)', (await probe(`http://${host}/`)).status);
await h.openSettings();
await h.jump('Network');
await h.setSwitch('#app-advanced-networking', false);
await h.commitDeploy('Advanced networking off (scope test)');
for (let i = 0; i < 30 && st !== 200; i++) { await page.waitForTimeout(10000); st = (await probe(`https://${host}/`)).status; }
console.log('after off: https', st, '| ws', await ws('/after'));
await c.done();
