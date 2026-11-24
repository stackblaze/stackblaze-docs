// The project canvas: Apps and Designer views, search, zoom, card details,
// staging a change, the commit dialog and Discard all. EXPLORE logs text.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'import-demo-brkm';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
const controls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], input, select, a').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('title') || '').trim().slice(0, 40)}`));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.waitForTimeout(3000);
console.log('1. Apps view controls', JSON.stringify(await controls(page.locator('main').first())));
await c.shot('canvas/1-apps');

console.log('2. Designer');
await page.getByRole('button', { name: 'Designer' }).or(page.getByRole('tab', { name: 'Designer' })).first().click();
await page.waitForTimeout(3000);
console.log('   ', (await text(page.locator('main').first())).slice(0, 600));
console.log('   controls', JSON.stringify(await controls(page.locator('main').first())));
await c.shot('canvas/2-designer');
const menuText = async () => (await text(page.locator('[role=menu], [role=dialog], [role=listbox]').last())).slice(0, 600);
console.log('3. Group actions (…)');
await page.getByRole('button', { name: 'Group actions' }).click(); await page.waitForTimeout(1500);
console.log('   ', await menuText());
await c.shot('canvas/3-group-menu');
await page.keyboard.press('Escape'); await page.waitForTimeout(800);

console.log('4. Volume chip on the db card');
await page.getByRole('button', { name: /db-qmwu-1 · 1Gi/ }).click(); await page.waitForTimeout(1500);
console.log('   ', (await text(page.locator('body'))).split('Designer').pop().slice(0, 400));
await c.shot('canvas/4-volume');
await page.keyboard.press('Escape'); await page.waitForTimeout(800);

console.log('5. Search');
await page.getByPlaceholder('Search this environment…').fill('cache'); await page.waitForTimeout(1500);
console.log('   ', (await text(page.locator('main').first())).slice(0, 400));
await c.shot('canvas/5-search');
await page.getByPlaceholder('Search this environment…').fill(''); await page.waitForTimeout(800);

console.log('6. Apps view: instance chevron on web');
await page.getByRole('button', { name: 'Apps' }).first().click(); await page.waitForTimeout(2500);
const chev = page.locator('[data-testid^=app-card]').first().locator('button').filter({ hasText: /^\s*\d+\s*$/ }).first();
console.log('    chevrons', await chev.count());
if (await chev.count()) { await chev.click(); await page.waitForTimeout(1500); console.log('   ', (await text(page.locator('[data-testid^=app-card]').first().locator('xpath=..'))).slice(0, 400)); await c.shot('canvas/6-instances'); await page.keyboard.press('Escape'); }

console.log('7. Stage a change: add a variable to web');
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(2500);
await page.getByText('web', { exact: true }).first().click(); await page.waitForTimeout(2500);
await page.getByRole('tab', { name: /^Variables/ }).click(); await page.waitForTimeout(2000);
const sheet = page.locator('[role=dialog]').last();
console.log('    var controls', JSON.stringify((await controls(sheet)).slice(0, 40)));
await sheet.getByRole('button', { name: /Add variable/ }).first().click(); await page.waitForTimeout(800);
const keys = sheet.getByPlaceholder(/KEY/i); const vals = sheet.getByPlaceholder(/value/i);
await keys.last().fill('CANVAS_DEMO'); await vals.last().fill('staged'); await page.waitForTimeout(1500);
const save = sheet.getByRole('button', { name: /^(Save|Stage|Apply)/ });
if (await save.count()) await save.first().click();
await page.waitForTimeout(2000);
await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
console.log('   ', (await text(page.locator('body'))).split('Designer').shift().slice(-200));
await c.shot('canvas/7-staged');

console.log('8. Commit dialog');
await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
const dlg = page.locator('[role=dialog]').last();
console.log('   ', await text(dlg));
console.log('    controls', JSON.stringify(await controls(dlg)));
await dlg.getByPlaceholder(/./).first().fill('Add CANVAS_DEMO').catch(() => {});
await c.shot('canvas/8-commit', { locator: '[role=dialog]' });

console.log('9. Discard all');
await dlg.getByRole('button', { name: 'Discard all' }).click(); await page.waitForTimeout(1500);
const conf = page.locator('[role=alertdialog]');
if (await conf.count()) {
  console.log('    confirm:', await text(conf.last()));
  await c.shot('canvas/9-discard', { locator: '[role=alertdialog]' });
  await conf.last().getByRole('button', { name: /^Discard/ }).last().click();
  await page.waitForTimeout(2500);
} else console.log('    no confirmation');
console.log('    commit button left:', await page.getByRole('button', { name: /^Commit \d+ change/ }).count());
await c.shot('canvas/10-discarded');

const applied = async () => page.evaluate(async (P) => { const a = await (await fetch(`/api/pipelines/${P}/apps`)).json(); const app = a.phases.find((x) => x.name === 'dev').apps.find((x) => x.name.startsWith('web')); const d = await (await fetch(`/api/apps/${P}/dev/${app.name}`)).json(); return (d.spec.envVars || []).some((v) => v.name === 'CANVAS_DEMO'); }, PROJECT);
console.log('    applied after discard:', await applied());
if (process.env.COMMIT) {
  console.log('11. Stage again, commit with a message, deploy');
  await page.getByText('web', { exact: true }).first().click(); await page.waitForTimeout(2500);
  await page.getByRole('tab', { name: /^Variables/ }).click(); await page.waitForTimeout(2000);
  const sh = page.locator('[role=dialog]').last();
  await sh.getByRole('button', { name: /Add variable/ }).first().click(); await page.waitForTimeout(800);
  await sh.getByPlaceholder(/KEY/i).last().fill('CANVAS_DEMO'); await sh.getByPlaceholder(/value/i).last().fill('committed'); await page.waitForTimeout(1500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
  const dl = page.locator('[role=dialog]').last();
  await dl.getByPlaceholder('How these releases appear in the history').fill('Add CANVAS_DEMO');
  await c.shot('canvas/11-message', { locator: '[role=dialog]' });
  await dl.getByRole('button', { name: /^Deploy \d+ change/ }).click();
  for (let i = 0; i < 30 && !(await applied()); i++) await page.waitForTimeout(3000);
  console.log('    applied after deploy:', await applied());
  await page.waitForTimeout(8000);
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(2500);
  await page.getByText('web', { exact: true }).first().click(); await page.waitForTimeout(2500);
  await page.getByRole('tab', { name: 'Deployment' }).click(); await page.waitForTimeout(3000);
  const dep = page.locator('[role=dialog]').last();
  console.log('    deployment tab:', (await text(dep)).slice(0, 600));
  await c.shot('canvas/12-history');
}
await c.done();
