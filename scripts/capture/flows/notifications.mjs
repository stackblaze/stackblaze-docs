// Organization settings → Notifications: create a webhook channel for one
// project, check the endpoint receives an event, then delete it.
import { open } from '../lib.mjs';
const STEP = process.env.STEP ?? 'explore';
const ENDPOINT = process.env.ENDPOINT;
const c = await open(); const { page } = c;
const shell = page.locator('[data-settings-shell]');
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2000);
const controls = (l) => l.locator('button, [role=combobox], [role=checkbox], [role=switch], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.id || e.getAttribute('aria-label') || ''}:${(e.innerText || e.getAttribute('placeholder') || e.value || '').trim().slice(0, 40)}`));
await c.goto('/settings/notifications'); await page.waitForTimeout(4000);
if (STEP === 'explore') {
  console.log('1.', await text(shell));
  await c.shot('notifications/1-empty');
  await shell.getByRole('button', { name: 'Create notification' }).first().click(); await page.waitForTimeout(2000);
  const d = page.locator('[role=dialog]').last();
  console.log('2.', await text(d));
  console.log('   controls', JSON.stringify(await controls(d)));
  await c.shot('notifications/2-dialog', { locator: '[role=dialog]' });
  for (const cb of await d.getByRole('combobox').all()) {
    await cb.click(); await page.waitForTimeout(800);
    console.log('   options:', await text(page.locator('[role=listbox], [role=menu]').last()).catch(() => '?'));
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  }
}
if (STEP === 'create') {
  await shell.getByRole('button', { name: 'Create notification' }).first().click(); await page.waitForTimeout(2000);
  const d = page.locator('[role=dialog]').last();
  await d.locator('#create-name').fill('docs-webhook');
  await d.getByRole('combobox').first().click(); await page.waitForTimeout(600);
  await page.locator('[role=option]').filter({ hasText: /^Webhook$/ }).click(); await page.waitForTimeout(800);
  console.log('   webhook fields:', JSON.stringify(await controls(d)));
  const urlIn = d.locator('input').nth(1);
  await urlIn.fill(ENDPOINT + '/notify');
  await d.getByRole('button', { name: 'All projects' }).click(); await page.waitForTimeout(300);
  console.log('   after All toggle:', (await text(d)).match(/Projects.{0,80}/)?.[0]);
  await d.getByRole('button', { name: 'my-first-project-h22a' }).click();
  await d.getByRole('button', { name: 'App restarted' }).click();
  await d.getByRole('button', { name: 'App updated' }).click();
  await page.waitForTimeout(500);
  console.log('3.', await text(d));
  await c.shot('notifications/3-filled', { locator: '[role=dialog]' });
  await d.getByRole('button', { name: /^Create$/ }).click(); await page.waitForTimeout(3000);
  console.log('4.', await text(shell));
  await c.shot('notifications/4-listed');
}
if (STEP === 'menu' || STEP === 'delete') {
  const btn = shell.getByRole('button', { name: /^Actions for / }).first();
  console.log('   row buttons', JSON.stringify(await shell.locator('button').evaluateAll(es => es.map(e => e.getAttribute('aria-label') || e.innerText.trim()).filter(Boolean))));
  await btn.click(); await page.waitForTimeout(800);
  const m = page.locator('[role=menu]').last();
  console.log('   menu:', await text(m));
  await c.shot('notifications/5-menu');
  if (STEP === 'delete') {
    await page.evaluate(() => { window.confirm = (msg) => { window.__confirmed = msg; return true; }; });
    await m.getByRole('menuitem').filter({ hasText: /Delete/ }).first().click(); await page.waitForTimeout(1500);
    console.log('   confirm asked:', await page.evaluate(() => window.__confirmed));
    const a = page.locator('[role=alertdialog], [role=dialog]').last();
    if (await a.count()) {
      console.log('   confirm:', await text(a));
      await c.shot('notifications/6-delete', { locator: '[role=alertdialog], [role=dialog]' });
      await a.getByRole('button', { name: /^Delete/ }).last().click(); await page.waitForTimeout(2500);
    }
    console.log('   after:', await text(shell));
  }
}
await c.done();
