// Billing → Usage (/usage): the stat cards, the usage breakdown with each
// resource's rate, the plan limits and Raise limits (opened and closed; no
// plan is changed). Nothing is saved: the flow fails if it sends a write.
import { open } from '../lib.mjs';

process.on('uncaughtException', (e) => {
  if (/No dialog is showing/.test(e?.message ?? '')) return;
  console.error(e);
  process.exit(1);
});

const c = await open();
const { page } = c;
const writes = [];
page.on('request', (r) => {
  const u = r.url();
  if (r.method() !== 'GET' && u.includes('/api/') && !u.includes('/api/chat/warmup')) writes.push(`${r.method()} ${new URL(u).pathname}`);
});

console.log('1. Usage: the stat cards');
await c.goto('/');
// The Administration group in the sidebar can be collapsed.
const navItem = page.getByText('Usage', { exact: true }).first();
if (!(await navItem.isVisible().catch(() => false))) await page.getByTestId('nav-group-administration').click();
await navItem.click();
await page.waitForURL(/\/usage/);
await page.getByTestId('usage-breakdown').waitFor({ timeout: 30000 });
await page.locator('[data-testid=plan-limits-card] [data-testid^=limit-]').first().waitFor({ timeout: 30000 });
await page.waitForTimeout(800);
for (const id of ['stat-spent', 'stat-projected', 'stat-credit', 'stat-limit']) {
  console.log(`    ${id}:`, (await page.getByTestId(id).innerText()).replace(/\s+/g, ' '));
}
await c.shot('billing/usage-1-stats', { around: [page.getByRole('heading', { name: 'Usage' }).first(), page.getByTestId('usage-stats')], pad: 16 });

console.log('2. Usage breakdown: every resource line and its rate');
const bd = page.getByTestId('usage-breakdown');
await bd.scrollIntoViewIfNeeded();
for (const row of await bd.locator('[data-testid^=usage-row-]').all()) {
  console.log('    ', (await row.innerText()).replace(/\s+/g, ' '));
}
// Taller than the viewport: grow it for this one shot.
await page.setViewportSize({ width: 1440, height: 1300 });
await page.waitForTimeout(600);
await bd.scrollIntoViewIfNeeded();
{
  const b = await bd.boundingBox();
  await c.shot('billing/usage-2-breakdown', { clip: { x: b.x - 8, y: b.y - 8, width: b.width + 16, height: b.height + 16 } });
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(500);

console.log('3. Plan limits → Raise limits (opened, then closed)');
const limits = page.getByTestId('plan-limits-card');
await limits.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await c.shot('billing/usage-3-limits', { around: [limits], pad: 8 });
await page.getByTestId('raise-limits').click();
const dlg = page.locator('[role=dialog]').last();
await page.getByTestId('upgrade-picker-pane').waitFor();
await dlg.getByText("What's included:").waitFor();
console.log('    opens on:', (await page.getByTestId('plan-picker-headline').innerText()).trim());
await dlg.getByRole('button', { name: 'Close' }).click();
await dlg.waitFor({ state: 'detached' });

if (writes.length) throw new Error(`the flow sent writes: ${writes.join(', ')}`);
await c.done();
