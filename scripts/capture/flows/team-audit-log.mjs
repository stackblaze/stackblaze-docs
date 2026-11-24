// Team and account → Audit log: /audit-log, its time ranges, filters,
// search, columns and CSV export.
import { open } from '../lib.mjs';

const c = await open();
const { page } = c;
const popover = () => page.locator('[data-reka-popper-content-wrapper]').last();
const filterBtn = () => page.getByRole('button', { name: /filter/i }).first();
const title = () => page.getByText('Audit history', { exact: true });
const rows = page.getByTestId('audit-row');

console.log('1. Sidebar → Audit log');
await c.goto('/');
await page.getByText('Audit log', { exact: true }).first().click();
await page.waitForURL(/\/audit-log/);
await rows.first().waitFor({ timeout: 20000 });
await c.shot('team/audit-1-list', { clip: { x: 344, y: 60, width: 994, height: 780 } });

console.log('2. Time range presets');
await page.getByRole('button', { name: '7d', exact: true }).click();
await page.waitForURL(/range=7d/);
await rows.first().waitFor();
console.log('    7d url ok');
await page.getByRole('button', { name: 'Custom', exact: true }).click();
await page.locator('#audit-from').waitFor();
await page.locator('#audit-from').fill('2026-11-20T12:00');
await page.locator('#audit-to').fill('2026-11-19T12:00');
await page.getByText('The end must be after the start.').waitFor();
await c.shot('team/audit-2-custom-error', { around: [page.locator('#audit-from'), page.locator('#audit-to'), page.getByText('The end must be after the start.'), page.getByRole('button', { name: 'Custom', exact: true })], pad: 16 });
await page.locator('#audit-to').fill('2026-11-24T12:00');
await page.getByText('The end must be after the start.').waitFor({ state: 'detached' });
await page.getByRole('button', { name: '24h', exact: true }).click();
await page.locator('#audit-from').waitFor({ state: 'detached' });

console.log('3. Filters: severity, events to load');
await filterBtn().click();
await popover().getByText('Events to load').waitFor();
await popover().locator('#audit-severity').click();
await page.getByRole('option', { name: 'Critical' }).waitFor();
await c.shot('team/audit-3-severity', { around: [popover(), page.locator('[role=listbox]')], pad: 16 });
await page.keyboard.press('Escape');
await popover().locator('#audit-limit').click().catch(async () => { await filterBtn().click(); await popover().locator('#audit-limit').click(); });
await page.getByRole('option', { name: '1000' }).waitFor();
await c.shot('team/audit-4-limit', { around: [popover(), page.locator('[role=listbox]')], pad: 16 });
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');

console.log('4. Search');
await page.getByPlaceholder('Search by user, action, resource or app…').fill('github-demo-gv35');
await page.waitForTimeout(800);
await c.shot('team/audit-5-search', { clip: { x: 344, y: 60, width: 994, height: 640 } });

console.log('5. Export CSV');
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
const name = dl.suggestedFilename();
if (!/^audit-trail-\d{4}-\d{2}-\d{2}\.csv$/.test(name)) throw new Error(`unexpected file ${name}`);
console.log('    downloaded', name);
await dl.cancel().catch(() => {});

await c.done();
