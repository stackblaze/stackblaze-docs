// The AI Gateway an agent deploys: its card, its menu, Open app (its own
// admin page) and the sign-in from its Variables. GW=<resource name>.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const GW = process.env.GW ?? 'ai-gateway-lm3u';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2000);
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByRole('button', { name: 'Designer' }).waitFor({ timeout: 90000 });
await page.getByRole('button', { name: 'Designer' }).click();
await page.waitForTimeout(6000);
const card = page.locator(`[data-id="hub-${GW}"]`);
console.log('edges:', JSON.stringify(await page.locator('[data-id*="->"]').evaluateAll((e) => e.map((x) => x.getAttribute('data-id')))));
await c.shot('ai-agent/gw-canvas', { clip: { x: 0, y: 150, width: 1440, height: 700 } });
await card.click({ button: 'right', position: { x: 40, y: 20 } });
await page.waitForTimeout(1500);
const before = page.context().pages().length;
await page.locator('[role=menu]').last().getByText('Open app', { exact: true }).click();
await page.waitForTimeout(6000);
const ui = page.context().pages().slice(before)[0];
await ui.waitForLoadState('load').catch(() => {});
await ui.waitForTimeout(3000);
console.log('open app:', new URL(ui.url()).pathname, '::', (await ui.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400));
// Its sign-in is in the gateway's variables (never printed).
const v = await page.evaluate(async ([P, N]) => {
  const r = await (await fetch(`/api/apps/${P}/dev/${N}/env?reveal=true`)).json();
  const env = r.vars ?? [];
  const g = (k) => env.find((e) => e.name === k)?.value;
  return { u: g('UI_USERNAME'), p: g('UI_PASSWORD') };
}, [PROJECT, GW]);
console.log('UI_USERNAME set:', !!v.u, 'UI_PASSWORD set:', !!v.p);
if (v.u && v.p) {
  await ui.locator('input').first().fill(v.u);
  await ui.locator('input[type=password]').first().fill(v.p);
  await ui.keyboard.press('Enter');
  await ui.waitForTimeout(8000);
  console.log('after sign-in:', new URL(ui.url()).pathname, '::', (await ui.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 600));
}
await ui.close();
await c.done();
