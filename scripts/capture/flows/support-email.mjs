// Support (/support): the request list and the New request form (not sent).
// Personal settings → Email preferences: the Deploy emails switch.
import { open } from '../lib.mjs';
const STEP = process.env.STEP ?? 'explore';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
const ctl = (l) => l.locator('button, input, textarea, [role=combobox], [role=switch], select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.id || e.getAttribute('aria-label') || ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('aria-checked') || '').trim().slice(0, 40)}`));
if (STEP === 'explore') {
  await c.goto('/support'); await page.waitForTimeout(5000);
  const main = page.locator('main').last();
  await c.shot('support/1-list');
  await main.getByRole('button', { name: 'New request' }).first().click(); await page.waitForTimeout(2000);
  const d = page.locator('[role=dialog]').last();
  const area = (await d.count()) ? d : main;
  console.log('form:', await text(area));
  console.log('controls', JSON.stringify(await ctl(area)));
  await c.shot('support/2-new', (await d.count()) ? { locator: '[role=dialog]' } : {});
  for (const cb of await area.getByRole('combobox').all()) { await cb.click(); await page.waitForTimeout(700); console.log('   options:', await text(page.locator('[role=listbox], [role=menu]').last()).catch(() => '?')); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  await page.keyboard.press('Escape');
  await c.goto('/personal-settings'); await page.waitForTimeout(3000);
  await page.getByRole('tab', { name: 'Email preferences' }).or(page.getByText('Email preferences', { exact: true })).first().click(); await page.waitForTimeout(2500);
  const sh = page.locator('[data-settings-shell]');
  console.log('email prefs:', await text(sh));
  console.log('controls', JSON.stringify(await ctl(sh)));
  await c.shot('team/email-prefs');
}
await c.done();
