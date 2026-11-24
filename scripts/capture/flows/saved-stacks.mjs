// Left nav → Saved stacks (/templates): list, designer, save a stack from a
// project, deploy it. STEP selects what to perform.
import { open } from '../lib.mjs';
const STEP = process.env.STEP ?? 'explore';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2000);
const ctl = (l) => l.locator('button, a, input, [role=tab]').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || '').trim().slice(0, 40)}`).filter((x) => !/^A::$/.test(x)));
await c.goto('/templates'); await page.waitForTimeout(5000);
console.log('url', new URL(page.url()).pathname);
const main = page.locator('main').last();
console.log('1.', await text(main));
console.log('   controls', JSON.stringify((await ctl(main)).slice(0, 40)));
await c.shot('stacks/1-list');
if (STEP === 'save') {
  await c.goto('/pipeline/github-demo-kpw0/apps?phase=dev'); await page.waitForTimeout(4000);
  await page.getByRole('button', { name: 'Designer' }).first().click(); await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Group actions' }).first().click(); await page.waitForTimeout(1200);
  const m = page.locator('[role=menu]').last();
  console.log('menu:', await text(m));
  await c.shot('stacks/2-group-menu');
  await m.getByText(/Save as stack/).click(); await page.waitForTimeout(2500);
  const d = page.locator('[role=dialog]').last();
  console.log('dialog:', await text(d));
  console.log('   controls', JSON.stringify(await ctl(d)));
  await d.locator('input').nth(0).fill('docs-nginx');
  await d.locator('input').nth(1).fill('One nginx service, for the docs');
  await d.locator('input').nth(2).fill('Docs');
  await c.shot('stacks/3-save-dialog', { locator: '[role=dialog]' });
  await d.getByRole('button', { name: 'View YAML' }).click(); await page.waitForTimeout(1500);
  console.log('yaml:', (await text(page.locator('[role=dialog]').last())).slice(0, 700));
  await c.shot('stacks/4-yaml', { locator: '[role=dialog]' });
  const back = page.locator('[role=dialog]').last().getByRole('button', { name: /Back|Hide YAML|Close YAML/ });
  if (await back.count()) await back.first().click(); else await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  const d2 = page.locator('[role=dialog]').last();
  await d2.getByRole('button', { name: /^Save$/ }).click(); await page.waitForTimeout(3000);
  console.log('after save:', (await text(page.locator('body'))).slice(0, 300));
  await c.goto('/templates'); await page.waitForTimeout(4000);
  console.log('list:', await text(page.locator('main').last()));
  await c.shot('stacks/5-saved');
}
if (STEP === 'deploy') {
  const card = page.locator('main').last();
  await card.getByRole('button', { name: /^Deploy$/ }).first().click(); await page.waitForTimeout(3000);
  console.log('url', new URL(page.url()).pathname + new URL(page.url()).search);
  const d = page.locator('[role=dialog]').last();
  const where = (await d.count()) ? d : page.locator('main').last();
  console.log('deploy view:', await text(where));
  console.log('   controls', JSON.stringify((await ctl(where)).slice(0, 40)));
  await c.shot('stacks/6-deploy');
  if (process.env.GO) {
    await where.getByText('Choose a project…').first().click(); await page.waitForTimeout(1200);
    const opts = page.locator('[role=option], [role=menuitem]');
    console.log('   projects:', (await opts.allInnerTexts()).join(' | ').slice(0, 300));
    await opts.filter({ hasText: 'github-demo-cw8z' }).first().click(); await page.waitForTimeout(1200);
    console.log('   after pick:', await text(where));
    await c.shot('stacks/7-deploy-picked', { locator: '[role=dialog]' });
    await where.getByRole('button', { name: /^Deploy$/ }).click(); await page.waitForTimeout(6000);
    console.log('   url', new URL(page.url()).pathname + new URL(page.url()).search);
    console.log('   canvas:', (await text(page.locator('body'))).slice(0, 500));
    await c.shot('stacks/8-staged');
    await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
    const dl = page.locator('[role=dialog]').last();
    console.log('   commit:', await text(dl));
    await c.shot('stacks/9-commit', { locator: '[role=dialog]' });
    await dl.getByRole('button', { name: /^Deploy \d+ change/ }).click(); await page.waitForTimeout(60000);
    console.log('   after:', (await text(page.locator('main').first())).slice(0, 400));
    await c.shot('stacks/10-running');
  }
}
if (STEP === 'delete') {
  const main = page.locator('main').last();
  await main.locator('[aria-label="More"]').first().click(); await page.waitForTimeout(1500); console.log('menus', await page.locator('[role=menu], [role=listbox], [data-reka-popper-content-wrapper]').count());
  const m = page.locator('[role=menu], [data-reka-popper-content-wrapper]').last();
  console.log('menu:', await text(m));
  await c.shot('stacks/11-menu');
  await page.evaluate(() => { window.confirm = (msg) => { window.__c = msg; return true; }; });
  await m.getByRole('menuitem').filter({ hasText: /Delete/ }).first().click(); await page.waitForTimeout(1500);
  console.log('confirm asked:', await page.evaluate(() => window.__c));
  const d = page.locator('[role=alertdialog], [role=dialog]').last();
  if (await d.count()) { console.log('dialog:', await text(d)); await c.shot('stacks/12-delete', { locator: '[role=alertdialog], [role=dialog]' }); await d.getByRole('button', { name: /^Delete/ }).last().click(); await page.waitForTimeout(2500); }
  console.log('after:', await text(main));
}
await c.done();
