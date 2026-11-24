// + Service → Developer sandbox, in one run (the card is a placeholder until
// it is deployed, so a reload drops it).  STEP=form stops at the create form.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-bmme';
const STEP = process.env.STEP ?? 'form';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2500);
const controls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=radio], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 60)}${e.disabled ? ' [disabled]' : ''}`));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.waitForTimeout(2000);

console.log('1. + Service → Developer sandbox');
await page.getByTestId('canvas-new-service').click();
await page.waitForTimeout(800);
await c.shot('sandbox/1-menu', { locator: '[role=dialog]' });
await page.getByText('Isolated VM with a shell and checkpoints').click();
await page.waitForTimeout(2500);
await c.shot('sandbox/2-ready');

console.log('2. Card → create form');
await page.getByRole('button', { name: 'Manage sandbox' }).first().click();
await page.waitForTimeout(3000);
const d = page.locator('[role=dialog]').last();
console.log('   ', await text(d));
console.log('    controls:', JSON.stringify(await controls(d)));
await c.shot('sandbox/3-form');
if (STEP === 'form') { await c.done(); process.exit(0); }

console.log('3. Name it, pick Small, Deploy sandbox');
await d.getByPlaceholder('sbx-7f3a2c').fill(process.env.NAME ?? 'docs-sandbox');
await d.getByRole('radio', { name: /^Small/ }).click();
await c.shot('sandbox/4-filled');
await d.getByRole('button', { name: 'Deploy sandbox' }).click();
await page.waitForTimeout(5000);
console.log('   ', (await text(page.locator('body'))).split('Designer').pop().slice(0, 800));
await c.shot('sandbox/5-deploying');
c.checkpoint();
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(10000);
  const t = await text(page.locator('[role=dialog]').last().or(page.locator('body')).first());
  if (i % 3 === 0) console.log('    ...', t.slice(0, 300));
  if (/Running|Ready/.test(t) && !/Starting|Creating|Provisioning/.test(t)) break;
}
console.log('   ', await text(page.locator('body')));
await c.shot('sandbox/6-running');
await c.done();
