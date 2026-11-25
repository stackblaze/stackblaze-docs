// Data overview: the engines + Service offers (Database or cache, Add-on),
// read-only in github-demo-cw8z dev (nothing is added).
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByTestId('canvas-new-service').waitFor({ timeout: 60000 });
await page.waitForTimeout(2500);
await page.getByTestId('canvas-new-service').click();
await page.waitForTimeout(1200);
console.log('MENU:', await text(page.locator('[role=dialog]').last()));
await page.getByText('PostgreSQL, MariaDB, Valkey, and more').click();
await page.waitForTimeout(2500);
console.log('DATABASES:', await text(page.locator('[role=dialog]').last()));
// Dev also lists engines that are off on production; crop to the
// PostgreSQL, TimescaleDB and Valkey rows (all on production).
const row = (t) => page.locator('[role=dialog]').last().getByText(t, { exact: true }).locator('xpath=ancestor::*[self::button or @role="option"][1]');
await c.shot('data/databases-menu', { around: [row('PostgreSQL'), row('Valkey')], pad: 6 });
await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
await page.getByTestId('canvas-new-service').click();
await page.waitForTimeout(1200);
await page.getByText('Kafka, email, and more').click();
await page.waitForTimeout(2500);
console.log('ADDONS:', await text(page.locator('[role=dialog]').last()));
await c.shot('data/addons-menu', { locator: '[role=dialog] >> nth=-1' });
await page.keyboard.press('Escape');
await c.done();
