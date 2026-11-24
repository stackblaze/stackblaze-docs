// Settings → Scale: 2 instances, then autoscale, then sleep mode — each one
// committed and deployed — and back to 1 instance with everything off.
// Runs on github-demo-kpw0's nginx-unprivileged.
import { open } from '../lib.mjs';
import { helpers } from './_settings.mjs';

const c = await open();
const h = helpers(c);
const { page } = h;
const scale = () => h.section('scale');

console.log('1. Settings → Scale');
await h.openSettings();
await h.jump('Scale');
const s0 = await h.spec();
if (s0.web?.replicaCount !== 1 || s0.autoscale || (s0.sleep && s0.sleep !== 'disabled')) {
  // A re-run after a failed one: back to 1 instance, nothing on (not captured).
  await h.setSwitch('#res-autoscale', false);
  await h.setSwitch('#sleep-enabled', false);
  while (Number(await scale().locator('span.tabular-nums').first().innerText()) > 1) {
    await page.getByRole('button', { name: 'Fewer instances' }).click();
    await page.waitForTimeout(200);
  }
  await h.commitDeploy('Back to 1 instance (reset)');
  await h.waitRunning(300000, (x) => x?.deployments?.[0]?.desired === 1);
  await h.openSettings();
  await h.jump('Scale');
}
console.log('   ', (await scale().innerText()).replace(/\s+/g, ' '));
await c.shot('settings/scale', { locator: '[data-settings-section="scale"]' });

console.log('2. Instances 1 → 2, deploy');
await page.getByRole('button', { name: 'More instances' }).click();
await page.waitForTimeout(500);
await c.shot('settings/scale-2', { locator: '[data-settings-section="scale"]' });
await h.commitDeploy('Run 2 instances', 'settings/scale-commit');
let st = await h.waitRunning(300000, (x) => x?.deployments?.[0]?.desired === 2 && x.deployments[0].ready === 2);
console.log('   workloads:', st.deployments.map((d) => `${d.ready}/${d.desired}`), 'pods', st.pods.length);
c.checkpoint();

console.log('3. Autoscale on');
await h.openSettings();
await h.jump('Scale');
await h.setSwitch('#res-autoscale', true);
console.log('   ', (await scale().innerText()).replace(/\s+/g, ' '));
console.log('   cpu target', await page.locator('#scale-cpu-target').inputValue(), 'mem target', await page.locator('#scale-mem-target').inputValue(),
  'min', await page.locator('#scale-web-min').inputValue(), 'max', await page.locator('#scale-web-max').inputValue());
await c.shot('settings/autoscale-on', { locator: '[data-settings-section="scale"]' });
// Memory too: the note about heap-holding runtimes.
await page.locator('#scale-on-memory').click();
await page.waitForTimeout(400);
await c.shot('settings/autoscale-memory', { locator: '[data-settings-section="scale"]' });
// Neither metric: autoscaling is inactive.
await page.locator('#scale-on-memory').click();
await page.locator('#scale-on-cpu').click();
await page.waitForTimeout(400);
console.log('   no metric:', await page.getByTestId('no-metric-note').innerText());
await c.shot('settings/autoscale-no-metric', { locator: '[data-settings-section="scale"]' });
await page.locator('#scale-on-cpu').click();
// Min above max pulls max up with it.
await page.locator('#scale-web-max').fill('3');
await page.locator('#scale-web-min').fill('5');
await page.locator('#scale-web-min').blur();
await page.waitForTimeout(300);
console.log('   min 5 →', await page.locator('#scale-web-min').inputValue(), await page.locator('#scale-web-max').inputValue());
await page.locator('#scale-web-min').fill('1');
await page.locator('#scale-web-max').fill('3');
await page.locator('#scale-cpu-target').fill('70');
await page.locator('#scale-cpu-target').blur();
await page.waitForTimeout(400);
await c.shot('settings/autoscale-set', { locator: '[data-settings-section="scale"]' });
await h.commitDeploy('Autoscale 1-3 on CPU 70%', 'settings/autoscale-commit');
st = await h.waitRunning();
let s = await h.spec();
console.log('   saved: autoscale', s.autoscale, JSON.stringify(s.web?.autoscaling), '| workloads', st.deployments.map((d) => `${d.ready}/${d.desired}`));
c.checkpoint();

console.log('4. Autoscale off, 1 instance; sleep mode on (15 minutes)');
await h.openSettings();
await h.jump('Scale');
await h.setSwitch('#res-autoscale', false);
while (Number(await scale().locator('span.tabular-nums').first().innerText()) > 1) {
  await page.getByRole('button', { name: 'Fewer instances' }).click();
  await page.waitForTimeout(200);
}
await h.setSwitch('#sleep-enabled', true);
const sleepCard = page.locator('.form-subsection-card').filter({ hasText: 'Sleep mode' }).last();
console.log('   sleep default:', (await sleepCard.innerText()).replace(/\s+/g, ' '));
await page.locator('#sleep-preset').click();
await page.getByRole('option').first().waitFor();
console.log('   presets:', await page.getByRole('option').allInnerTexts());
await c.shot('settings/sleep-presets', { around: [sleepCard, page.locator('[role=listbox]')], pad: 12 });
await page.getByRole('option', { name: '15 minutes without traffic' }).click();
await page.waitForTimeout(400);
await c.shot('settings/sleep-on', { around: [sleepCard], pad: 2 });
await h.commitDeploy('Sleep after 15 minutes', 'settings/sleep-commit');
st = await h.waitRunning();
s = await h.spec();
console.log('   saved: autoscale', s.autoscale, 'replicas', s.web?.replicaCount, 'sleep', s.sleep);
if (s.sleep !== '15m') throw new Error('sleep not saved');
c.checkpoint();

console.log('5. Put back: sleep mode off');
await h.openSettings();
await h.jump('Scale');
await h.setSwitch('#sleep-enabled', false);
await h.commitDeploy('Sleep mode off');
await h.waitRunning();
s = await h.spec();
console.log('   saved: autoscale', s.autoscale, 'replicas', s.web?.replicaCount, 'sleep', s.sleep);

await c.done();
