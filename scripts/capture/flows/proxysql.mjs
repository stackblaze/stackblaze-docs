// + Service → Add-on → ProxySQL in front of MariaDB: add, review, deploy,
// connect an app, every tab of its panel. STEP selects what to perform.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'my-first-project-h22a';
const STEP = process.env.STEP ?? 'add';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2000);
const controls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=checkbox], input, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.value || '').trim().slice(0, 40)}`));
const top = () => page.locator('[role=menu], [role=dialog], [role=listbox]').last();
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(4000);
if (STEP === 'add') {
  await page.getByRole('button', { name: /^\s*(\+ )?Service\s*$/ }).first().click(); await page.waitForTimeout(1500);
  await top().getByText('Kafka, email').first().click(); await page.waitForTimeout(1500);
  console.log('1.', await text(top()));
  await c.shot('proxysql/1-menu');
  await top().getByText(/^ProxySQL$/).first().click(); await page.waitForTimeout(3000);
  const main = page.locator('main').first();
  console.log('2.', (await text(main)).slice(0, 1500));
  console.log('   dialogs', await page.locator('[role=dialog]').count());
  console.log('   controls', JSON.stringify((await controls(main)).filter(x => !/^A:/.test(x)).slice(-40)));
  await c.shot('proxysql/2-review');
  await page.getByRole('button', { name: /^Manage ProxySQL/ }).click(); await page.waitForTimeout(2500);
  const sh = page.locator('[role=dialog]').last();
  console.log('3.', await text(sh));
  console.log('   controls', JSON.stringify(await controls(sh)));
  await c.shot('proxysql/3-card');
  const pick = sh.getByRole('combobox').first();
  if (await pick.count()) {
    await pick.click(); await page.waitForTimeout(800);
    const opts = page.locator('[role=option]');
    console.log('   mariadb options', JSON.stringify(await opts.allInnerTexts()));
    await c.shot('proxysql/3b-choose');
    await opts.first().click(); await page.waitForTimeout(800);
    console.log('   after pick:', await text(sh));
    await c.shot('proxysql/3c-chosen');
  }
  if (process.env.DEPLOY) {
    await sh.getByRole('button', { name: /^Deploy$/ }).first().click(); await page.waitForTimeout(5000);
    console.log('4.', (await text(page.locator('body'))).slice(0, 600));
    for (let i = 0; i < 40; i++) { await page.waitForTimeout(6000); const t = await page.getByRole('button', { name: /^Manage ProxySQL/ }).locator('xpath=..').innerText().catch(() => ''); if (/Running/.test(t)) { console.log('   running after', (i + 1) * 6, 's'); break; } if (i % 5 === 0) console.log('   ', t.replace(/\s+/g, ' ').slice(0, 120)); }
    await c.shot('proxysql/4-running');
  }
}
if (STEP === 'inspect') {
  await page.getByRole('button', { name: /^Manage ProxySQL/ }).click(); await page.waitForTimeout(3000);
  const sh = page.locator('[role=dialog]').last();
  const tabs = await sh.getByRole('tab').allInnerTexts();
  console.log('tabs', JSON.stringify(tabs));
  for (const t of tabs) {
    await sh.getByRole('tab', { name: t }).click(); await page.waitForTimeout(3000);
    console.log(`== ${t}:`, await text(sh));
    console.log('   controls', JSON.stringify((await controls(sh)).slice(0, 50)));
    await c.shot(`proxysql/tab-${t.toLowerCase().replace(/[^a-z]+/g, '-')}`);
  }
}
if (STEP === 'connect') {
  await page.getByRole('button', { name: /^Manage ProxySQL/ }).click(); await page.waitForTimeout(3000);
  const sh = page.locator('[role=dialog]').last();
  await sh.getByRole('tab', { name: 'Settings' }).click(); await page.waitForTimeout(4000);
  await c.shot('proxysql/5-settings', { locator: '[role=dialog]' });
  await sh.locator('[aria-label="Connect proxysql to nginx"]').click(); await page.waitForTimeout(1500);
  console.log('   after toggle:', (await text(sh)).match(/Connections.{0,200}/)?.[0]);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
  const dl = page.locator('[role=dialog]').last();
  console.log('   commit:', await text(dl));
  await c.shot('proxysql/6-commit', { locator: '[role=dialog]' });
  await dl.getByRole('button', { name: /^Deploy \d+ change/ }).click(); await page.waitForTimeout(60000);
  console.log('   done');
}
await c.done();
