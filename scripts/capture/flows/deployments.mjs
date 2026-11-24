// Service → Deployment tab: every control (row menus, Manual Deploy menu,
// rollback, redeploy, cancel, logs). STEP selects what to perform.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'import-demo-brkm';
const APP = process.env.APP ?? 'web';
const STEP = process.env.STEP ?? 'explore';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
const controls = (l) => l.locator('button, [role=tab], [role=menuitem], [role=combobox], input, select, a').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('title') || '').trim().slice(0, 40)}`));
async function openTab() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(2500);
  await page.getByText(APP, { exact: true }).first().click(); await page.waitForTimeout(2500);
  await page.getByRole('tab', { name: 'Deployment' }).click(); await page.waitForTimeout(3000);
  return page.locator('[role=dialog]').last();
}
const sheet = await openTab();
if (STEP === 'explore') {
  console.log('1.', await text(sheet));
  console.log('   controls', JSON.stringify(await controls(sheet)));
  await c.shot('deployments/1-tab');
  console.log('2. Manual Deploy menu');
  await sheet.getByRole('button', { name: /Manual Deploy/ }).click(); await page.waitForTimeout(1500);
  console.log('   ', await text(page.locator('[role=menu]').last()));
  await c.shot('deployments/2-manual-menu');
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  console.log('3. Row menus');
  const more = sheet.locator('button:not([aria-label])').filter({ hasText: /^\s*$/ });
  console.log('    row menu buttons', await more.count());
  for (let i = 0; i < Math.min(await more.count(), 2); i++) {
    await more.nth(i).click(); await page.waitForTimeout(1200);
    console.log(`    row ${i}:`, await text(page.locator('[role=menu]').last()));
    await c.shot(`deployments/3-row-menu-${i}`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  }
}
const rowMenu = async (i) => { await sheet.locator('button:not([aria-label])').filter({ hasText: /^\s*$/ }).nth(i).click(); await page.waitForTimeout(1200); return page.locator('[role=menu]').last(); };
const envHas = () => page.evaluate(async ([P, A]) => { const a = await (await fetch(`/api/pipelines/${P}/apps`)).json(); const app = a.phases.find((x) => x.name === 'dev').apps.find((x) => x.name.startsWith(A)); const d = await (await fetch(`/api/apps/${P}/dev/${app.name}`)).json(); return (d.spec.envVars || []).some((v) => v.name === 'CANVAS_DEMO'); }, [PROJECT, APP]);
if (STEP === 'inspect') {
  const m = await rowMenu(0); await m.getByText('Inspect Deployment').click(); await page.waitForTimeout(3000);
  console.log('    url', new URL(page.url()).pathname);
  console.log('   ', (await text(page.locator('[role=dialog]').last().or(page.locator('main')).first())).slice(0, 1200));
  await c.shot('deployments/4-inspect');
}
if (STEP === 'redeploy-old') {
  console.log('    CANVAS_DEMO before', await envHas());
  const m = await rowMenu(1); await m.getByText('Redeploy').click(); await page.waitForTimeout(1500);
  const dlg = page.locator('[role=alertdialog], [role=dialog]').last();
  console.log('   ', await text(dlg));
  await c.shot('deployments/5-redeploy-confirm');
  const ok = page.locator('[role=alertdialog]').getByRole('button', { name: /Redeploy|Confirm|Roll ?back/ });
  if (await ok.count()) await ok.last().click();
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(5000); if (!(await envHas())) break; }
  console.log('    CANVAS_DEMO after', await envHas());
  await page.waitForTimeout(20000);
  const s2 = await openTab();
  console.log('   ', (await text(s2)).slice(0, 900));
  await c.shot('deployments/6-after-redeploy');
}
if (STEP === 'restart' || STEP === 'latest') {
  await sheet.getByRole('button', { name: /Manual Deploy/ }).click(); await page.waitForTimeout(1200);
  await page.locator('[role=menu]').last().getByText(STEP === 'restart' ? 'Restart service' : 'Deploy latest reference').click(); await page.waitForTimeout(1500);
  const dlg = page.locator('[role=alertdialog]');
  if (await dlg.count()) { console.log('    confirm:', await text(dlg.last())); await c.shot(`deployments/7-${STEP}-confirm`); await dlg.last().getByRole('button').last().click(); }
  await page.waitForTimeout(30000);
  const s2 = await openTab();
  console.log('   ', (await text(s2)).slice(0, 900));
  await c.shot(`deployments/8-${STEP}-done`);
}
if (STEP === 'remove-var') {
  await page.getByRole('tab', { name: /^Variables/ }).click(); await page.waitForTimeout(2000);
  const sh = page.locator('[role=dialog]').last();
  const keys = sh.getByPlaceholder('KEY');
  const n = await keys.count(); let idx = -1;
  for (let i = 0; i < n; i++) if ((await keys.nth(i).inputValue()) === 'CANVAS_DEMO') idx = i;
  console.log('    CANVAS_DEMO row', idx);
  await sh.getByRole('button', { name: 'Remove' }).nth(idx).click(); await page.waitForTimeout(1500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
  const dl = page.locator('[role=dialog]').last();
  await dl.getByPlaceholder('How these releases appear in the history').fill('Remove CANVAS_DEMO');
  await dl.getByRole('button', { name: /^Deploy \d+ change/ }).click();
  for (let i = 0; i < 30 && (await envHas()); i++) await page.waitForTimeout(3000);
  console.log('    CANVAS_DEMO after', await envHas());
  await page.waitForTimeout(30000);
  const s2 = await openTab();
  console.log('   ', (await text(s2)).slice(0, 900));
  const btns = s2.locator('button:not([aria-label])').filter({ hasText: /^\s*$/ });
  for (let i = 0; i < await btns.count(); i++) { await btns.nth(i).click(); await page.waitForTimeout(1200); console.log(`    row ${i}:`, await text(page.locator('[role=menu]').last())); await c.shot(`deployments/9-row-menu-${i}`); await page.keyboard.press('Escape'); await page.waitForTimeout(600); }
}
if (STEP === 'rollback-review') {
  const m = await rowMenu(Number(process.env.ROW ?? 2)); await m.getByText('Rollback Config').click(); await page.waitForTimeout(3000);
  const dl = page.getByRole('dialog').filter({ hasText: /^Rollback to/ }).last();
  console.log('   ', await text(dl));
  console.log('   inputs', JSON.stringify(await dl.locator('input, textarea').evaluateAll(es => es.map(e => e.getAttribute('placeholder')))));
  await c.shot('deployments/10-rollback-review');
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
}
if (STEP === 'add-var') {
  await page.getByRole('tab', { name: /^Variables/ }).click(); await page.waitForTimeout(2000);
  const sh = page.locator('[role=dialog]').last();
  await sh.getByRole('button', { name: /Add variable/ }).first().click(); await page.waitForTimeout(800);
  await sh.getByPlaceholder('KEY').last().fill('CANVAS_DEMO'); await sh.getByPlaceholder(/value/i).last().fill('on'); await page.waitForTimeout(1500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
  const dl = page.locator('[role=dialog]').last();
  console.log('   commit:', await text(dl));
  await dl.getByPlaceholder('How these releases appear in the history').fill('Add CANVAS_DEMO');
  await c.shot('deployments/0-commit-message', { locator: '[role=dialog]' });
  await dl.getByRole('button', { name: /^Deploy \d+ change/ }).click();
  for (let i = 0; i < 30 && !(await envHas()); i++) await page.waitForTimeout(3000);
  console.log('    CANVAS_DEMO after', await envHas());
  await page.waitForTimeout(40000);
  const s2 = await openTab();
  console.log('   ', (await text(s2)).slice(0, 700));
}
if (STEP === 'rollback-config') {
  const m = await rowMenu(Number(process.env.ROW ?? 1)); await m.getByText('Rollback Config').click(); await page.waitForTimeout(3000);
  const dl = page.locator('[role=dialog]').last();
  console.log('   ', await text(dl));
  await c.shot('deployments/10-rollback-review', { locator: '[role=dialog]' });
  await dl.getByRole('button', { name: /^Rollback$/ }).click();
  for (let i = 0; i < 30 && !(await envHas()); i++) await page.waitForTimeout(3000);
  console.log('    CANVAS_DEMO after rollback', await envHas());
  await page.waitForTimeout(30000);
  const s2 = await openTab();
  console.log('   ', (await text(s2)).slice(0, 900));
  await c.shot('deployments/11-after-rollback');
}
await c.done();
