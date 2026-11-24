// + Service → Docker image: every control in the Container registry dialog
// and the review panel. EXPLORE=1 only logs controls.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-kpw0';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
const controls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().slice(0, 50)}`));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByTestId('canvas-new-service').click();
await page.getByText('Run a public or private image').click();
await page.waitForTimeout(2500);
const d = page.locator('[role=dialog]').last();
console.log('1.', await text(d));
console.log('   controls', JSON.stringify(await controls(d)));
await c.shot('docker/1-open', { locator: '[role=dialog]' });
const input = d.getByPlaceholder(/^Search Docker Hub or paste a reference/);
console.log('2. search: redis');
await input.fill('redis');
await page.waitForTimeout(3500);
console.log('   ', (await text(d)).slice(0, 900));
console.log('   controls', JSON.stringify((await controls(d)).slice(0, 30)));
await c.shot('docker/2-search', { locator: '[role=dialog]' });

console.log('3. paste a full reference');
await input.fill('ghcr.io/nginxinc/nginx-unprivileged:stable-alpine');
await page.waitForTimeout(3500);
console.log('   ', (await text(d)).slice(0, 900));
console.log('   controls', JSON.stringify(await controls(d)));
await c.shot('docker/3-reference', { locator: '[role=dialog]' });
console.log('4. Enter → use it');
await input.press('Enter');
await page.waitForTimeout(4000);
console.log('   ', (await text(page.locator('body'))).split('Designer').pop().slice(0, 500));
await c.shot('docker/4-ready');
for (let i = 0; i < 24; i++) {
  await page.getByText('Application', { exact: true }).last().click();
  await page.waitForTimeout(4000);
  if (await page.getByRole('button', { name: /^Deploy/ }).count()) break;
}
const sheet = page.locator('[role=dialog]').last();
console.log('5. review:', await text(sheet));
console.log('   controls', JSON.stringify(await controls(sheet)));
await c.shot('docker/5-review');
const tagSel = sheet.locator('select, [role=combobox]').first();
if (await tagSel.count()) {
  await tagSel.click(); await page.waitForTimeout(2000);
  console.log('   tag menu:', (await text(page.locator('[role=listbox], [role=menu]').last().or(sheet))).slice(0, 500));
  await c.shot('docker/6-tag');
  await page.keyboard.press('Escape');
}
console.log('6. Add application');
await sheet.getByRole('button', { name: 'Add application' }).click();
await page.waitForTimeout(2500);
console.log('   ', (await text(page.locator('[role=dialog]').last())).slice(0, 700));
console.log('   controls', JSON.stringify(await controls(page.locator('[role=dialog]').last())));
await c.shot('docker/6-add-app');
await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
if (!(await page.getByRole('button', { name: /^Deploy/ }).count())) { await page.getByText('Application', { exact: true }).last().click(); await page.waitForTimeout(3000); }

console.log('7. Configure');
await page.getByRole('button', { name: 'Configure', exact: true }).first().click();
await page.waitForTimeout(3000);
const cfg = await page.locator('[role=dialog]').last().innerText();
const i = cfg.search(/Source|Image|Registry/);
console.log('   ', cfg.replace(/\s+/g, ' ').slice(0, 1600));
await c.shot('docker/7-configure');
await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
if (!(await page.getByRole('button', { name: /^Deploy/ }).count())) { await page.getByText('Application', { exact: true }).last().click(); await page.waitForTimeout(3000); }
const rev = () => page.locator('[role=dialog]').last();

console.log('8. Remove the extra app (×)');
const before = await rev().getByRole('button', { name: 'Runtime' }).count();
// the unlabeled button next to each app's Configure is its remove (×)
const xs = rev().locator('button:not(:has-text("Configure")):not(:has-text("Runtime"))').filter({ hasText: /^$/ });
console.log('    apps before', before, 'x buttons', await xs.count());
await xs.last().click(); await page.waitForTimeout(1500);
console.log('    apps after', await rev().getByRole('button', { name: 'Runtime' }).count());
await c.shot('docker/8-removed');

console.log('9. Change → back to search');
await rev().getByRole('button', { name: 'Change', exact: true }).click(); await page.waitForTimeout(1500);
console.log('   ', (await text(rev())).slice(0, 300));
await c.shot('docker/9-change', { locator: '[role=dialog]' });
const inp = rev().getByPlaceholder(/^Search Docker Hub or paste a reference/);
await inp.fill('ghcr.io/nginxinc/nginx-unprivileged:stable-alpine'); await inp.press('Enter'); await page.waitForTimeout(3000);

console.log('10. Deploy');
await rev().getByRole('button', { name: /^Deploy/ }).first().click();
let host;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(10000);
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  const body = await page.locator('body').innerText();
  host = body.match(/nginx-unprivileged-[a-z0-9]{4}\.[\w.-]+\.stackblaze\.app/)?.[0];
  if (host && /Running/.test(body) && !/Deploying|Updating|Pending/.test(body)) break;
}
console.log('    host', host);
await c.shot('docker/10-running');
c.checkpoint();
const app = await page.context().newPage();
const res = await app.goto(`https://${host}`); console.log('    status', res.status(), await app.title());
await app.close();
await c.done();
