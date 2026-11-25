// Settings → Scale on a web service that also runs a worker process
// (added with `stackblaze scale web=1 worker=1`), and the autoscale target
// field's limits. Nothing is committed: every change is discarded.
// Runs on github-demo-cw8z's crondemo (a scratch service).
import { open } from '../lib.mjs';
import { helpers } from './_settings.mjs';

const c = await open();
const h = helpers(c, process.env.CAPTURE_PROJECT ?? 'github-demo-cw8z', process.env.CAPTURE_SERVICE ?? 'crondemo');
const { page } = h;
await h.openSettings();
await h.jump('Scale');
const scale = h.section('scale');
console.log('scale card:', (await scale.innerText()).replace(/\s+/g, ' ').slice(0, 500));
await c.shot('net/scale-worker-process', { locator: '[data-settings-section="scale"]' });

console.log('autoscale on');
const sw = scale.getByRole('switch').first();
await h.setSwitch(sw, true);
await page.waitForTimeout(800);
console.log('autoscale card:', (await scale.innerText()).replace(/\s+/g, ' ').slice(0, 700));
const cpu = page.locator('[data-settings-section="scale"] input[type=number][max="90"]').first();
console.log('cpu attrs:', await cpu.getAttribute('min'), await cpu.getAttribute('max'), await cpu.getAttribute('step'));
for (const v of ['5', '95']) {
  await cpu.fill(v); await cpu.blur(); await page.waitForTimeout(600);
  console.log(`typed ${v} → value`, await cpu.inputValue(), '| valid:', await cpu.evaluate((e) => e.checkValidity()), (await cpu.evaluate((e) => e.validationMessage)));
}
await cpu.fill('70'); await cpu.blur(); await page.waitForTimeout(600);
await c.shot('net/autoscale-worker-range', { locator: '[data-settings-section="scale"]' });
await h.discard();
await c.done();
