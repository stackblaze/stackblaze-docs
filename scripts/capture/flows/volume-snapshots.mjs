// Volumes: the Snapshots tab of a service (github-demo-gv35 nginx, which has
// a `data` volume): snapshot, look at it, clone it into a new service, then
// delete the clone and the snapshot. Runs in STEPs.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-gv35';
const STEP = process.env.STEP ?? 'explore';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
const ctl = (l) => l.locator('button, [role=tab], [role=checkbox], input').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40)}:${e.disabled ? 'disabled' : ''}`));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByTestId('canvas-new-service').waitFor({ timeout: 60000 });
await page.waitForTimeout(2500);
await page.getByText('service', { exact: true }).first().click();
await page.waitForTimeout(3000);
const tabs = await page.getByRole('tab').allInnerTexts();
console.log('tabs:', tabs.join(' | '));
await page.getByRole('tab', { name: 'Snapshots' }).click();
await page.getByText('CSI point-in-time snapshots').waitFor({ timeout: 30000 });
await page.waitForTimeout(3000);
const panel = page.locator('[role=dialog]').last();
if (STEP === 'explore') {
  console.log('PANEL:', await text(panel));
  console.log('controls:', JSON.stringify(await ctl(panel)));
  await c.shot('volumes/snapshots-tab', { locator: '[role=dialog] >> nth=-1' });
}
if (STEP === 'snap') {
  await panel.getByRole('button', { name: 'Snapshot now' }).first().click();
  await page.waitForTimeout(3000);
  console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  console.log('PANEL:', await text(panel));
}
if (STEP === 'expand') {
  await panel.locator('button:has(.iconify), button').filter({ hasText: '' }).first();
  const rows = panel.getByText(/\d+ snapshots?$/);
  console.log('rows', await rows.count());
  // the chevron button before the volume
  const chevrons = panel.locator('button:not([disabled])').filter({ hasNotText: /\w/ });
  console.log('chevrons', await chevrons.count());
  await chevrons.first().click();
  await page.waitForTimeout(2000);
  console.log('PANEL:', await text(panel));
  console.log('controls:', JSON.stringify(await ctl(panel)));
  await c.shot('volumes/snapshots-list', { locator: '[role=dialog] >> nth=-1' });
}
await c.done();
