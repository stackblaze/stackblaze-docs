// Delete the agent and the AI model: staged, then committed and deployed.
import { open } from '../lib.mjs';
const PROJECT = 'github-demo-cw8z';
const MODEL = process.env.MODEL ?? 'model-40im5e';
const AGENT = process.env.AGENT ?? 'ai-agent';
const c = await open();
const { page } = c;
page.on('dialog', (d) => d.accept());
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
const sheet = () => page.locator('[role=dialog]').last();
const canvas = async () => { await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.locator('button[aria-label^="Manage "]').first().waitFor({ timeout: 180000 }); await page.waitForTimeout(2500); };
async function manage(n) { await canvas(); await page.locator(`button[aria-label="Manage ${n}"]`).first().click(); await page.waitForTimeout(3000); }

if (!process.env.SKIP_MODEL) {
console.log('1. Model → Settings → Delete');
await manage(MODEL);
await sheet().getByRole('tab', { name: 'Settings', exact: true }).click();
await page.waitForTimeout(2000);
await sheet().getByRole('button', { name: 'Delete', exact: true }).click();
await page.waitForTimeout(2500);
console.log('   ', await text(page.locator('[role=dialog], [role=alertdialog]').last()));
const confirm = page.locator('[role=alertdialog]');
if (await confirm.count()) { await c.shot('ai-model/x-delete-confirm'); await confirm.getByRole('button', { name: /Delete/ }).last().click(); await page.waitForTimeout(2500); }
console.log('    toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
await c.shot('ai-model/x-delete-staged');
}

console.log('2. Agent → Settings → delete');
await canvas();
await page.locator(`button[aria-label="Manage ${AGENT}"]`).first().click({ button: 'right' });
await page.waitForTimeout(1500);
if (!process.env.NOSHOT) await c.shot('ai-agent/x-context-menu');
await page.locator('[role=menu]').last().getByText('Delete', { exact: true }).click();
await page.waitForTimeout(2500);
if (await page.locator('[role=dialog], [role=alertdialog]').count()) {
  const dlg = page.locator('[role=alertdialog], [role=dialog]').last();
  console.log('   ', await text(dlg));
  await c.shot('ai-agent/x-delete-dialog');
  if (await dlg.locator('input').count()) { const ph = await dlg.locator('input').first().getAttribute('placeholder'); await dlg.locator('input').first().fill(ph || AGENT); }
  await dlg.getByRole('button', { name: /^Delete/ }).last().click();
  await page.waitForTimeout(3000);
}
console.log('    toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
console.log('3. Commit');
await canvas();
const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
console.log('    ', await commit.innerText().catch(() => 'no commit button'));
await commit.click();
await page.waitForTimeout(2000);
console.log('   ', await text(page.locator('[role=dialog]').last()));
const cd = page.locator('[role=dialog]').last();
const phrase = (await text(cd)).match(/Type (sudo delete [^]+?) to confirm/)?.[1];
if (!process.env.NOSHOT) await c.shot('ai-agent/x-commit-dialog');
if (phrase) await cd.locator('input').first().fill(phrase);
await page.waitForTimeout(800);
await cd.getByRole('button', { name: /^(Deploy \d+ change|Delete \d+ resource)/ }).click();
await page.waitForTimeout(20000);
await canvas();
console.log('    after:', (await text(page.locator('body'))).split('Designer').pop());
if (!process.env.NOSHOT) await c.shot('ai-model/x-after-delete');
await c.done();
