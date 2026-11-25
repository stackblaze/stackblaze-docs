// Designer view in detail: every card's right-click menu, hover spotlight,
// a collapsed group, and a ghost (staged, not yet deployed) card removed
// with Remove from canvas. STEP=explore | menus | collapse | ghost.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-gv35';
const STEP = process.env.STEP ?? 'explore';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
async function designer() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Designer' }).first().click({ timeout: 90000 }); await page.waitForTimeout(3500);
}
await designer();
const nodes = page.locator('.vue-flow__node');
const edges = page.locator('.vue-flow__edge');
console.log('nodes', await nodes.count(), 'edges', await edges.count());
for (let i = 0; i < await nodes.count(); i++) {
  const n = nodes.nth(i);
  console.log(`  node ${i} [${await n.getAttribute('data-id')}] ${(await text(n)).slice(0, 160)}`);
}
if (STEP === 'explore') await c.shot('canvas/d-0-overview');
if (STEP === 'menus') {
  await c.shot('canvas/d-1-designer', { around: '.vue-flow', pad: 0 });
  const want = (process.env.NODES ?? '').split(',').filter(Boolean);
  for (let i = 0; i < await nodes.count(); i++) {
    const n = nodes.nth(i);
    const id = await n.getAttribute('data-id');
    if (want.length && !want.includes(String(i))) continue;
    const box = await n.boundingBox(); if (!box) continue;
    await page.mouse.click(box.x + Math.min(60, box.width / 2), box.y + Math.min(30, box.height / 2), { button: 'right' });
    await page.waitForTimeout(1200);
    const menu = page.locator('[role=menu]').last();
    if (await menu.count()) {
      console.log(`  menu ${i} [${id}]:`, await text(menu));
      if (process.env.SHOT) await c.shot(`canvas/d-menu-${i}`, { around: [n, menu] });
    } else console.log(`  menu ${i} [${id}]: none`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  }
  if (process.env.HOVER) {
    const n = nodes.nth(Number(process.env.HOVER));
    const box = await n.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 20); await page.waitForTimeout(1200);
    await c.shot('canvas/d-2-hover', { around: '.vue-flow', pad: 0 });
    await page.mouse.move(5, 500);
  }
}
if (STEP === 'collapse') {
  const groups = page.getByRole('button', { name: 'Group actions' });
  console.log('groups', await groups.count());
  await groups.nth(Number(process.env.GROUP ?? 0)).click(); await page.waitForTimeout(1200);
  console.log('  group menu:', await text(page.locator('[role=menu]').last()));
  await page.locator('[role=menu]').last().getByText('Hide contents').click(); await page.waitForTimeout(2500);
  for (let i = 0; i < await nodes.count(); i++) console.log(`  node ${i}: ${(await text(nodes.nth(i))).slice(0, 160)}`);
  await c.shot('canvas/d-3-collapsed', { around: '.vue-flow', pad: 0 });
  // Put it back.
  await groups.nth(Number(process.env.GROUP ?? 0)).click(); await page.waitForTimeout(1200);
  console.log('  group menu (collapsed):', await text(page.locator('[role=menu]').last()));
  await page.locator('[role=menu]').last().getByText(/Show contents/).click(); await page.waitForTimeout(2500);
  console.log('  restored nodes', await nodes.count());
}
if (STEP === 'ghost') {
  if (!process.env.NOADD) {
  await page.getByRole('button', { name: /Service/ }).first().click(); await page.waitForTimeout(1200);
  await page.getByText('Docker image', { exact: false }).first().click(); await page.waitForTimeout(2000);
  const input = page.getByPlaceholder(/Search Docker Hub|paste/i).first();
  await input.fill('nginx:1.27'); await page.waitForTimeout(1500); await input.press('Enter'); await page.waitForTimeout(4000);
  }
  const ghost = page.locator('.vue-flow__node:not([data-id^=canvas-group])').filter({ hasText: /ready to deploy/i }).first();
  await ghost.waitFor({ timeout: 20000 });
  const box = await ghost.boundingBox();
  await page.mouse.click(box.x + 60, box.y + 25, { button: 'right' }); await page.waitForTimeout(1200);
  const menu = page.locator('[role=menu]').last();
  console.log('  ghost menu:', await text(menu));
  await c.shot('canvas/d-4-ghost-menu', { around: [ghost, menu] });
  await menu.getByText('Remove from canvas').click(); await page.waitForTimeout(2500);
  const confirm = page.locator('[role=alertdialog]');
  if (await confirm.count()) { console.log('  confirm:', await text(confirm.last())); await confirm.last().getByRole('button').last().click(); await page.waitForTimeout(2000); }
  console.log('  ghosts left', await nodes.filter({ hasText: /ready to deploy/i }).count());
}
await c.done();
