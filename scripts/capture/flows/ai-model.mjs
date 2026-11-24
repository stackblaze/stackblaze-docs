// + Service → AI model (GPU): every screen, step by step.
import { open } from '../lib.mjs';
const PROJECT = 'github-demo-cw8z';
const STEP = Number(process.env.STEP ?? 99);
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2500);
const ctrls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=radio], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 50)}`));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
const card = () => page.getByRole('button', { name: /^Manage ai-model/ }).first();
if (!(await card().count())) {
  console.log('1. + Service → AI model (GPU)');
  await page.getByTestId('canvas-new-service').click();
  await page.getByText('Run an open model on a GPU').click();
  await page.waitForTimeout(3000);
  await c.shot('ai-model/1-card');
}
console.log('2. Open the card → create form');
await card().click();
await page.waitForTimeout(4000);
const d = page.locator('[role=dialog]').last();
console.log('   ', await text(d));
console.log('    controls:', JSON.stringify(await ctrls(d)));
await c.shot('ai-model/2-form');
const menuText = async () => text(page.locator('[role=menu], [role=listbox], [data-reka-popper-content-wrapper]').last());
const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(800); };

console.log('3. Hugging Face account menu');
await d.getByRole('button', { name: 'Hugging Face account' }).click();
await page.waitForTimeout(1500);
console.log('   ', await menuText());
await c.shot('ai-model/3-hf-menu', { locator: '[role=dialog]' });
await esc();

console.log('4. Model picker');
await d.getByRole('button', { name: /^Model:/ }).click();
await page.waitForTimeout(2500);
console.log('   ', (await menuText()).slice(0, 2000));
await c.shot('ai-model/4-models');
await esc();

console.log('5. GPU type');
await d.getByRole('combobox', { name: 'GPU type (advanced)' }).click();
await page.waitForTimeout(1500);
console.log('   ', await menuText());
await c.shot('ai-model/5-gpu-type', { locator: '[role=dialog]' });
await esc();
console.log('6. Search Hugging Face');
await d.getByRole('button', { name: /^Model:/ }).click();
await page.getByPlaceholder('Search, or type owner/model…').fill('smollm2');
await page.waitForTimeout(4000);
console.log('   ', (await menuText()).slice(0, 1200));
await c.shot('ai-model/6-hf-search');
await esc();

console.log('7. Region → Canada');
const fees = async () => (await text(d)).match(/On demand \$[^·]+·[^·]+·[^·]+/)?.[0];
await d.getByRole('radio', { name: /^Canada/ }).click();
await page.waitForTimeout(2500);
console.log('    price:', await fees());
await c.shot('ai-model/7-region', { locator: '[role=dialog]' });
await d.getByRole('radio', { name: /^Any region/ }).click();
await page.waitForTimeout(1500);

console.log('8. GPUs: one more');
await d.getByRole('button', { name: 'One GPU more' }).click();
await page.waitForTimeout(1500);
console.log('   ', (await text(d)).match(/GPUs .{0,260}/)?.[0]);
console.log('    price:', await fees());
await c.shot('ai-model/8-gpus-2', { locator: '[role=dialog]' });
await d.getByRole('button', { name: 'One GPU fewer' }).click();
await page.waitForTimeout(1000);

console.log('9. How it runs → Always on');
await d.getByRole('radio', { name: /^Always on/ }).click();
await page.waitForTimeout(1500);
console.log('   ', (await text(d)).match(/How it runs.{0,400}/)?.[0]);
await c.shot('ai-model/9-always-on', { locator: '[role=dialog]' });
await d.getByRole('radio', { name: /^On demand/ }).click();
await page.waitForTimeout(1000);
if (STEP >= 10) {
  console.log('10. Deploy');
  await d.getByRole('button', { name: 'Deploy', exact: true }).click();
  await page.waitForTimeout(8000);
  console.log('   ', (await text(page.locator('[role=dialog]').last())).slice(0, 1500));
  await c.shot('ai-model/10-deploying');
  c.checkpoint();
}
await c.done();
