// Every control on the GitHub repository picker and the review panel,
// opened one by one on a fresh project (nothing is deployed here).
import { open } from '../lib.mjs';

const REPO = process.env.REPO ?? 'stackblaze/react-vite-starter';
const NAME = REPO.split('/')[1];
const PROJECT = process.env.PROJECT ?? `github-opts-${Date.now().toString(36).slice(-4)}`;
const c = await open();
const { page } = c;
const dialog = page.locator('[role=dialog]').last();
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1200);
const onlyDemo = async () => {
  const v = await page.locator('[role=dialog]').getByText(/^[\w.-]+\/[\w.-]+$/).allInnerTexts();
  if (v.some((r) => r !== REPO)) throw new Error(`other repositories visible: ${v}`);
};

if (!process.env.PROJECT) {
  await c.goto('/');
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder(/^Leave blank to auto-generate/).fill(PROJECT);
  await page.getByRole('button', { name: 'Create Project' }).click();
  await page.getByText('Deploy your first app').waitFor({ timeout: 60000 });
} else await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);

console.log('1. Service menu');
await page.getByTestId('canvas-new-service').click();
await page.waitForTimeout(1500);
console.log('   ', await text(page.locator('[role=dialog], [role=menu]').last()));
await c.shot('github-opts/1-service-menu', { locator: '[role=dialog], [role=menu]' });
await page.getByText('Build and deploy from a repo').click();
const search = page.getByPlaceholder(/^Search repositories/);
await search.waitFor({ timeout: 30000 });
await search.fill(NAME);
await page.getByText(REPO, { exact: true }).waitFor({ timeout: 30000 });
await page.waitForTimeout(1000);
await onlyDemo();

console.log('2. Git source menu');
await dialog.getByRole('button', { name: 'Git source' }).click();
await page.waitForTimeout(1500);
const menu = page.locator('[role=menu], [role=listbox]').last();
console.log('   ', await text(menu));
// The personal account's avatar is a photo: hide it (its name is masked).
await menu.locator('[role=menuitem], [role=option]').filter({ hasNotText: /stackblaze|public repo/i }).locator('img').evaluateAll((is) => is.forEach((i) => (i.style.visibility = 'hidden')));
await c.shot('github-opts/2-source', { locator: '[role=dialog]' });
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

console.log('3. GitHub account (gear)');
const pages0 = page.context().pages().length;
await page.getByRole('button', { name: 'GitHub account' }).click();
await page.waitForTimeout(2500);
console.log('    new tabs:', page.context().pages().length - pages0);
for (const t of page.context().pages().slice(pages0)) { console.log('    tab url:', new URL(t.url()).origin + new URL(t.url()).pathname); await t.close(); }
console.log('   ', await text(page.locator('[role=menu], [role=dialog]').last()));
const gearMenu = page.locator('[role=menu]').last();
const add = gearMenu.getByText('Add org / repositories');
const href = await add.evaluate((el) => el.closest('a')?.href ?? '');
console.log('    add href:', href.replace(/\?.*/, ''));
await c.shot('github-opts/3-gear', { locator: '[role=dialog]' });
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

console.log('4. Use a public repo');
await dialog.getByRole('button', { name: 'Git source' }).click();
await page.getByText('Use a public repo').click();
await page.waitForTimeout(1500);
console.log('   ', await text(page.locator('[role=dialog]').last()));
await c.shot('github-opts/4-public', { locator: '[role=dialog]' });
c.checkpoint();

console.log('5. Paste a public URL → Enter');
const url = page.getByPlaceholder(/^Paste public git URL/);
await url.fill(`https://github.com/${REPO}`);
await url.press('Enter');
await page.waitForTimeout(6000);
console.log('   ', await text(page.locator('body')).then((t) => t.split('Designer').pop()));
await c.shot('github-opts/5-after-public');

console.log('6. Open the card → review panel');
for (let i = 0; i < 24; i++) {
  await page.getByText('Application', { exact: true }).last().click();
  await page.waitForTimeout(4000);
  if (await page.getByRole('button', { name: /^Deploy/ }).count()) break;
}
await page.getByRole('button', { name: /^Deploy/ }).first().waitFor({ timeout: 10000 });
const review = page.getByRole('button', { name: /^Deploy/ }).first().locator('xpath=ancestor::*[.//*[normalize-space()="Configure applications"]][1]');
console.log('   ', await text(review));
const controls = await review.locator('button, [role=combobox], select, input').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || '').trim().slice(0, 40)}`));
console.log('    controls:', JSON.stringify(controls));
await c.shot('github-opts/6-review-public');

console.log('7. Runtime');
await review.getByRole('button', { name: 'Runtime', exact: true }).click();
await page.waitForTimeout(1200);
console.log('   ', (await text(review)).split('Runtime').pop().slice(0, 300));
await c.shot('github-opts/7-runtime');

console.log('8. App name button');
await review.getByRole('button', { name: 'react-vite-starter', exact: true }).click();
await page.waitForTimeout(1500);
console.log('   ', (await text(page.locator('[role=dialog]').last())).slice(0, 600));
await c.shot('github-opts/8-name');
await page.keyboard.press('Escape'); await page.waitForTimeout(800);

console.log('9. Configure');
await page.getByRole('button', { name: 'Configure', exact: true }).first().click();
await page.waitForTimeout(3000);
const cfgText = (await page.locator('[role=dialog]').last().innerText());
(await import('node:fs')).writeFileSync(`${process.env.SP ?? '/tmp'}/configure-sheet.txt`, cfgText);
await c.shot('github-opts/9-configure');
await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
if (!(await page.getByRole('button', { name: /^Deploy/ }).count())) {
  await page.getByText('Application', { exact: true }).last().click(); await page.waitForTimeout(3000);
}

console.log('10. Add another app from this repo');
await page.getByRole('button', { name: 'Add another app from this repo' }).click();
await page.waitForTimeout(3000);
console.log('   ', (await text(page.locator('[role=dialog]').last())).slice(0, 800));
await c.shot('github-opts/10-another');
await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
if (!(await page.getByRole('button', { name: /^Deploy/ }).count())) {
  await page.getByText('Application', { exact: true }).last().click(); await page.waitForTimeout(3000);
}

console.log('11. Change');
await page.getByRole('button', { name: 'Change', exact: true }).first().click();
await page.waitForTimeout(2500);
console.log('   ', (await text(page.locator('[role=dialog]').last())).slice(0, 400));
await onlyDemo().catch((e) => console.log('    (not shot):', e.message.slice(0, 40)));

console.log('12. GitHub App route → branch menu');
await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByTestId('canvas-new-service').click();
await page.getByText('Build and deploy from a repo').click();
await search.waitFor({ timeout: 30000 });
if (!(await search.count())) throw new Error('no search');
await dialog.getByRole('button', { name: 'Git source' }).click();
await page.locator('[role=menu], [role=listbox]').last().getByText('stackblaze', { exact: true }).click();
await search.fill(NAME);
await page.getByText(REPO, { exact: true }).waitFor({ timeout: 30000 });
await onlyDemo();
await dialog.getByRole('button', { name: 'Select' }).click();
await page.waitForTimeout(3000);
for (let i = 0; i < 24; i++) {
  await page.getByText('Application', { exact: true }).last().click();
  await page.waitForTimeout(4000);
  if (await page.getByRole('button', { name: /^Deploy/ }).count()) break;
}
const sheet = page.locator('[role=dialog]').last();
const bc = await sheet.locator('button, [role=combobox]').evaluateAll((els) => els.map((e) => `${e.getAttribute('role') ?? ''}:${(e.innerText || '').trim().slice(0, 30)}`));
console.log('    controls:', JSON.stringify(bc));
await sheet.locator('button, [role=combobox]').filter({ hasText: /^main$/ }).first().click();
await page.waitForTimeout(2000);
console.log('    branches:', await text(page.locator('[role=listbox], [role=menu]').last()));
await c.shot('github-opts/12-branch');
await page.keyboard.press('Escape');
c.checkpoint();
await c.done();
console.log(JSON.stringify({ project: PROJECT }));
