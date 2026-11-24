// Templates: the list's filter menu and a template's own page (/new/template/:slug).
import { open } from '../lib.mjs';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2000);
await c.goto('/new/template/uptime-kuma'); await page.waitForTimeout(5000);
console.log('url', new URL(page.url()).pathname);
console.log('template page:', await text(page.locator('main').last()));
console.log('controls', JSON.stringify(await page.locator('main').last().locator('button, a, input, [role=combobox]').evaluateAll((els) => els.slice(0, 30).map((e) => `${e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || '').trim().slice(0, 40)}`))));
await c.shot('templates/8-template-page');
if (process.env.GO) {
  const main = page.locator('main').last();
  await page.locator('[aria-label="Project"]').first().click(); await page.waitForTimeout(1200);
  const opts = page.locator('[role=option], [role=menuitem]');
  console.log('project options:', (await opts.allInnerTexts()).join(' | ').slice(0, 400));
  await c.shot('templates/9-project-picker');
  await opts.filter({ hasText: 'github-demo-cw8z' }).first().click(); await page.waitForTimeout(1500);
  console.log('after pick:', await text(main));
  await c.shot('templates/10-review');
  await main.getByRole('button', { name: /^Deploy uptime-kuma/ }).click(); await page.waitForTimeout(8000);
  console.log('url', new URL(page.url()).pathname + new URL(page.url()).search);
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(10000); const t = await text(page.locator('main').first()); if ((t.match(/Running/g) || []).length >= 3) break; if (i % 5 === 0) console.log('   ', t.slice(0, 300)); }
  console.log('canvas:', (await text(page.locator('main').first())).slice(0, 600));
  await c.shot('templates/11-deployed');
}
await c.done();
