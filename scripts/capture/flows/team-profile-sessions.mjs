// Personal settings → General: Profile (set a name, then clear it) and the
// Sessions list (shown only; nothing is signed out).
import { open } from '../lib.mjs';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 900);
await c.goto('/personal-settings'); await page.waitForTimeout(4000);
const sh = page.locator('[data-settings-shell]');
const first = sh.getByLabel('First name').or(sh.locator('input').nth(0)).first();
const last = sh.getByLabel('Last name').or(sh.locator('input').nth(1)).first();
console.log('before:', JSON.stringify([await first.inputValue(), await last.inputValue()]));
await first.fill('Docs'); await last.fill('Tester');
await c.shot('team/profile', { locator: '[data-settings-shell]' });
await sh.getByRole('button', { name: 'Save changes' }).first().click(); await page.waitForTimeout(2500);
console.log('toast:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | '));
await page.reload(); await page.waitForTimeout(4000);
console.log('after reload:', JSON.stringify([await first.inputValue(), await last.inputValue()]));
// Sessions table: blank the session ids before the shot.
await page.evaluate(() => document.querySelectorAll('td, span, div').forEach((n) => { if (n.childElementCount === 0 && /^(cli_)?c[a-z0-9]{20,}$/.test(n.textContent.trim())) n.textContent = '••••••••'; if (n.childElementCount === 0 && /^\d{1,3}(\.\d{1,3}){3}$/.test(n.textContent.trim())) n.textContent = '203.0.113.10'; }));
const sessions = sh.getByText('Sessions', { exact: true }).first().locator('xpath=ancestor::*[.//table][1]');
console.log('sessions:', (await text(sessions)).slice(0, 400));
await c.shot('team/sessions', { locator: (await sessions.count()) ? undefined : undefined });
// Put the name back.
await first.fill(''); await last.fill(''); await sh.getByRole('button', { name: 'Save changes' }).first().click(); await page.waitForTimeout(2500);
await page.reload(); await page.waitForTimeout(3000);
console.log('restored:', JSON.stringify([await first.inputValue(), await last.inputValue()]));
await c.done();
