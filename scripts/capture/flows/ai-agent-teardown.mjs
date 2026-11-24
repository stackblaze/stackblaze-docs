// Delete what the ai-agent-* flows used: the agent, its AI Gateway and the
// AI model, staged from each card's menu and committed together. No shots.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const NAMES = (process.env.NAMES ?? 'ai-agent-mkgv,ai-gateway-ad1o,docs-qwen').split(',');
const MODEL = process.env.MODEL ?? 'docs-qwen';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
// Designer view: the agent, its gateway and the model are separate nodes there.
const card = (n) => page.locator(`[data-id="hub-${n}"], [data-id="aimodel-${n}"]`).first();
const canvas = async () => {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await page.getByRole('button', { name: 'Designer' }).waitFor({ timeout: 120000 });
  await page.getByRole('button', { name: 'Designer' }).click();
  await page.waitForTimeout(6000);
};
for (const n of NAMES) {
  await canvas();
  const k = card(n);
  if (!(await k.count())) { console.log(`${n}: no card`); continue; }
  if (n === MODEL) {
    // An AI model is deleted from its sheet: Settings → Delete.
    await k.click({ position: { x: 40, y: 20 } });
    await page.waitForTimeout(3000);
    const sh = page.locator('[role=dialog]').last();
    await sh.getByRole('tab', { name: 'Settings', exact: true }).click();
    await page.waitForTimeout(2000);
    await sh.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.waitForTimeout(2500);
    const a = page.locator('[role=alertdialog]');
    if (await a.count()) { console.log('    dialog:', await text(a.last())); await a.last().getByRole('button', { name: /Delete/ }).last().click(); await page.waitForTimeout(2500); }
    console.log('    toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
    continue;
  }
  await k.click({ button: 'right', position: { x: 40, y: 20 } });
  await page.waitForTimeout(1500);
  console.log(`${n} menu:`, await text(page.locator('[role=menu]').last()));
  await page.locator('[role=menu]').last().getByText('Delete', { exact: true }).click();
  await page.waitForTimeout(2500);
  console.log('    after Delete:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 600));
  const dlg = page.locator('[role=alertdialog]');
  if (await dlg.count()) {
    console.log('    dialog:', await text(dlg.last()));
    await dlg.last().getByRole('button', { name: /^Delete/ }).last().click();
    await page.waitForTimeout(2500);
  }
  console.log('    toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
}
await canvas();
const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
console.log('commit:', await commit.innerText());
await commit.click();
await page.waitForTimeout(2000);
const cd = page.locator('[role=dialog]').last();
console.log('   ', await text(cd));
const phrase = (await text(cd)).match(/Type (sudo delete .+?) to confirm/)?.[1];
if (phrase) await cd.locator('input').first().fill(phrase);
await page.waitForTimeout(800);
await cd.getByRole('button', { name: /^(Deploy \d+ change|Delete \d+ resource)/ }).click();
await page.waitForTimeout(20000);
await canvas();
console.log('after:', (await text(page.locator('body'))).split('Designer').pop());
await c.done();
