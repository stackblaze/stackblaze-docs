// Settings → Domains: the Add Custom Domain dialog (every message it shows),
// the DNS records step and Verify now — on a hostname we have no DNS for, so
// it never verifies — then the domain is removed again.
// Runs on github-demo-kpw0's nginx-unprivileged.
import { open } from '../lib.mjs';
import { helpers } from './_settings.mjs';

const c = await open();
const h = helpers(c);
const { page, dialog } = h;
const HOST = 'docs-demo.example.com';
const domains = () => h.section('domains');
const toasts = async () => (await page.locator('[data-sonner-toast]').allInnerTexts()).map((t) => t.replace(/\s+/g, ' '));
const domainsApi = () => page.evaluate(async (n) => {
  const r = await fetch(`/api/apps/github-demo-kpw0/dev/${n}/domains`);
  return { status: r.status, body: await r.text() };
}, 'nginx-unprivileged-mi0u');

console.log('1. Settings → Domains');
await h.openSettings();
await h.jump('Domains');
console.log('   ', (await domains().innerText()).replace(/\s+/g, ' '), '| api', JSON.stringify(await domainsApi()).slice(0, 300));
await c.shot('settings/domains', { locator: '[data-settings-section="domains"]' });

console.log('2. + Custom Domain: what the dialog says');
await domains().getByRole('button', { name: 'Custom Domain' }).click();
await dialog().waitFor();
const input = dialog().getByPlaceholder('app.example.com');
const footer = async () => (await dialog().innerText()).replace(/\s+/g, ' ');
console.log('   empty:', await footer(), '| Add disabled', await dialog().getByRole('button', { name: 'Add Domain' }).isDisabled());
await c.shot('settings/domain-add-empty', { locator: '[data-slot=dialog-content]' });
for (const v of ['not a hostname', 'localhost', 'my-app.stackblaze.app']) {
  await input.fill(v);
  await page.waitForTimeout(900);
  console.log(`   "${v}":`, await footer());
}
await input.fill('not a hostname');
await page.waitForTimeout(600);
await c.shot('settings/domain-add-invalid', { locator: '[data-slot=dialog-content]' });
await input.fill(`https://${HOST.toUpperCase()}/`);
await page.waitForTimeout(1200);
console.log('   URL pasted:', await footer());
await input.fill(HOST);
await page.waitForTimeout(1200);
console.log(`   "${HOST}":`, await footer());
await c.shot('settings/domain-add-available', { locator: '[data-slot=dialog-content]' });

console.log('3. Add Domain → Configure DNS Records');
await dialog().getByRole('button', { name: 'Add Domain' }).click();
await page.getByText('Configure DNS Records').waitFor({ timeout: 30000 });
await page.waitForTimeout(2500);
console.log('   dns:', await footer());
console.log('   toasts:', await toasts());
await c.shot('settings/domain-dns', { locator: '[data-slot=dialog-content]' });

console.log('4. Verify now (no DNS records exist)');
const verify = dialog().getByRole('button', { name: 'Verify now' });
if (await verify.count()) {
  await verify.click();
  await page.waitForTimeout(5000);
  console.log('   after verify:', await footer());
  console.log('   toasts:', await toasts());
  await c.shot('settings/domain-verify', { locator: '[data-slot=dialog-content]' });
} else console.log('   (no Verify now button)');
await dialog().getByRole('button', { name: 'Done' }).click();
await page.waitForTimeout(1000);
console.log('   list:', (await domains().innerText()).replace(/\s+/g, ' '));
console.log('   commit button:', await page.getByRole('button', { name: /^Commit \d+ changes?/ }).innerText().catch(() => 'none'));
console.log('   api:', JSON.stringify(await domainsApi()).slice(0, 600));
await c.shot('settings/domain-listed', { locator: '[data-settings-section="domains"]' });

console.log('5. Remove it');
const row = domains().locator('div.rounded-lg').filter({ hasText: HOST }).first();
await row.getByRole('button').last().click();
await page.waitForTimeout(2500);
console.log('   list:', (await domains().innerText()).replace(/\s+/g, ' '));
console.log('   toasts:', await toasts());
console.log('   commit button:', await page.getByRole('button', { name: /^Commit \d+ changes?/ }).innerText().catch(() => 'none'));
console.log('   api:', JSON.stringify(await domainsApi()).slice(0, 600));
await h.discard();
// Reload: nothing of the domain is left.
await h.openSettings();
await h.jump('Domains');
console.log('   after reload:', (await domains().innerText()).replace(/\s+/g, ' '));
console.log('   api:', JSON.stringify(await domainsApi()).slice(0, 600));

await c.done();
