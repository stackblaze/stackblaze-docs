// Import a dump: after `stackblaze addons import backup.dump --wait` (run
// with the CLI, output on the page), check the rows in the SQL console of
// github-demo-gv35's PostgreSQL. CLEANUP=1 drops the imported tables.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-gv35';
const DB = process.env.DB ?? 'postgresql-7ytg';
const c = await open();
const { page } = c;
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByTestId('canvas-new-service').waitFor({ timeout: 60000 });
await page.waitForTimeout(2500);

// The card's db.… link opens the SQL console in a new tab.
const [cb] = await Promise.all([
  page.context().waitForEvent('page', { timeout: 30000 }),
  page.locator(`[data-testid^=app-card-cloudbeaver-][data-testid$="-${DB}"]`).or(page.getByText(/^db\..*stackblaze\.cloud$/)).first().click(),
]);
await cb.setViewportSize({ width: 1440, height: 900 });
await cb.getByText(new RegExp(`/${DB}$`)).first().waitFor({ timeout: 60000 });
await cb.waitForTimeout(2000);
if (await cb.getByText('Open SQL Editor').count()) await cb.getByText('Open SQL Editor').click();
await cb.locator('.cm-content').first().waitFor({ timeout: 30000 });
const pick = cb.getByText(/^(Select connection|github-demo.*)$/).first();
if (await pick.count()) {
  await pick.click();
  const item = cb.locator('[class*=menuItemText]').filter({ hasText: new RegExp(`${DB.slice(-10)}$`) }).first();
  await item.waitFor({ timeout: 10000 }).catch(() => {});
  if (await item.count() && await item.isEnabled()) await item.click(); else await cb.keyboard.press('Escape');
  await cb.waitForTimeout(1500);
}
async function run(sql) {
  const editor = cb.locator('.cm-content').first();
  await editor.click();
  await cb.keyboard.press('Control+A');
  await cb.keyboard.type(sql);
  await cb.keyboard.press('Control+Enter');
  await cb.getByText(/Executed - |Error|ERROR/).first().waitFor({ timeout: 60000 });
  await cb.waitForTimeout(1500);
}
if (process.env.CLEANUP) {
  await run('drop table if exists docs_import_orders, docs_import_customers, docs_import_products, docs_import_owned;');
  console.log((await cb.locator('body').innerText()).replace(/\s+/g, ' ').slice(-400));
} else {
  await run("select (select count(*) from docs_import_customers) as customers, (select count(*) from docs_import_orders) as orders;");
  const body = (await cb.locator('body').innerText()).replace(/\s+/g, ' ');
  console.log(body.slice(-300));
  await c.shotPage('import-dump/console-counts', cb, '/sql-console');
}
await cb.close();
await c.done();
