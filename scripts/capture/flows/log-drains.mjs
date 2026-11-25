// Organization settings → Log drains: add an HTTP drain for one app, check
// the endpoint receives its logs, edit it, then remove it.
import { open } from '../lib.mjs';
const ENDPOINT = process.env.ENDPOINT; // receiver URL
const APP = process.env.APP ?? 'nginx · my-first-project-h22a / dev';
const STEP = process.env.STEP ?? 'add';
const c = await open(); const { page } = c;
const shell = page.locator('[data-settings-shell]');
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
// Arrive the way people do: Settings, then Log drains in the menu.
await c.goto('/settings/notifications'); await page.waitForTimeout(3000);
await page.locator('button').filter({ hasText: /^\s*Log drains\s*$/ }).first().click(); await page.waitForTimeout(6000);
if (STEP === 'add') {
  console.log('1.', await text(shell));
  await c.shot('log-drains/1-empty');
  await shell.getByRole('button', { name: 'Add drain' }).first().click(); await page.waitForTimeout(1500);
  const dlg = page.locator('[role=dialog]').last();
  for (let i = 0; i < 20 && (await dlg.getByText('No apps yet').count()); i++) await page.waitForTimeout(1000);
  console.log('2.', await text(dlg));
  await c.shot('log-drains/2-dialog', { locator: '[role=dialog]' });
  // Minimum level options
  await dlg.getByRole('combobox').first().click(); await page.waitForTimeout(800);
  console.log('   levels:', await text(page.locator('[role=listbox]').last()));
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  // Destination: placeholder per type (not shot — names third-party products)
  const dest = dlg.getByRole('combobox').nth(1);
  for (const t of ['HTTP', 'Syslog']) {
    await dest.click(); await page.waitForTimeout(600);
    await page.locator('[role=option]').filter({ hasText: new RegExp(`^${t}$`) }).click(); await page.waitForTimeout(500);
    console.log(`   ${t} endpoint placeholder:`, await dlg.getByPlaceholder(/.+/).nth(2).getAttribute('placeholder'));
  }
  await dest.click(); await page.waitForTimeout(600);
  await page.locator('[role=option]').filter({ hasText: /^HTTP$/ }).click(); await page.waitForTimeout(500);
  await dlg.locator('#drain-name').fill('receiver-logs');
  await dlg.getByPlaceholder('Filter apps…').fill('nginx'); await page.waitForTimeout(600);
  const row = dlg.locator('label').filter({ hasText: APP });
  console.log('   app rows', await dlg.locator('label').filter({ hasText: ' / ' }).evaluateAll(es => es.map(e => e.innerText.trim())));
  await row.first().locator('button, [role=checkbox]').first().click(); await page.waitForTimeout(400);
  await dlg.getByPlaceholder(/https?:|endpoint/i).first().fill(ENDPOINT + '/drain');
  console.log('3.', await text(dlg));
  await c.shot('log-drains/3-filled', { locator: '[role=dialog]' });
  await dlg.getByRole('button', { name: 'Save drain' }).click(); await page.waitForTimeout(3000);
  console.log('4.', await text(shell));
  await c.shot('log-drains/4-listed');
}
if (STEP === 'manage') {
  await shell.getByRole('button', { name: /^Actions for / }).first().click(); await page.waitForTimeout(800);
  console.log('menu:', await text(page.locator('[role=menu]').last()));
  await c.shot('log-drains/5-menu');
  await page.keyboard.press('Escape');
}
if (STEP === 'edit') {
  await shell.getByRole('button', { name: /^Actions for / }).first().click(); await page.waitForTimeout(800);
  await page.locator('[role=menuitem]').filter({ hasText: /Edit/ }).click(); await page.waitForTimeout(1500);
  const dlg = page.locator('[role=dialog]').last();
  for (const label of [process.env.APP_OFF, process.env.APP_ON].filter(Boolean)) {
    await dlg.getByPlaceholder('Filter apps…').fill(label.split(' · ')[0]); await page.waitForTimeout(500);
    await dlg.locator('label').filter({ hasText: label }).first().locator('button, [role=checkbox]').first().click(); await page.waitForTimeout(300);
  }
  await dlg.getByPlaceholder('Filter apps…').fill(''); await page.waitForTimeout(300);
  console.log('edit:', await text(dlg));
  await c.shot('log-drains/5-edit', { locator: '[role=dialog]' });
  await dlg.getByRole('button', { name: 'Save drain' }).click(); await page.waitForTimeout(3000);
  console.log('after:', await text(shell));
}
if (STEP === 'remove') {
  await shell.getByRole('button', { name: /^Actions for / }).first().click(); await page.waitForTimeout(800);
  await page.locator('[role=menuitem]').filter({ hasText: /Remove|Delete/ }).click(); await page.waitForTimeout(1000);
  const al = page.locator('[role=alertdialog], [role=dialog]').last();
  console.log('confirm:', await text(al));
  await c.shot('log-drains/6-remove', { locator: '[role=alertdialog], [role=dialog]' });
  c.checkpoint();
  await al.getByRole('button', { name: /^Remove$/ }).click(); await page.waitForTimeout(4000);
  console.log('after:', await text(shell));
}
await c.done();
