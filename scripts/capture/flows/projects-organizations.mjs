// Organizations: the org switcher, Settings → General (name, ID, default
// region: changed, checked in the New Project dialog, changed back), and the
// Create Organization dialog (shown, plan menu and coupon field opened,
// closed: no organization is created).
import { open } from '../lib.mjs';

const c = await open();
const { page } = c;
// Log any browser dialog (e.g. leave-page prompts) and dismiss it.
page.on('dialog', (d) => { console.log(`    dialog (${d.type()}): ${d.message()}`); d.dismiss().catch(() => {}); });
const tenantPref = () => page.evaluate(async () => {
  const r = await fetch('/api/tenants');
  const d = await r.json();
  const list = Array.isArray(d) ? d : d.items || d.tenants || [];
  return list.map((t) => t.preferredRegionSlug || '');
});

console.log('1. Org switcher');
await c.goto('/');
await page.getByTestId('org-switcher').click();
await page.getByRole('menu').waitFor();
console.log('    menu:', (await page.getByRole('menu').innerText()).replace(/\n/g, ', '));
await c.shot('projects/org-1-switcher', { around: ['[data-testid=org-switcher-home]', '[role=menu]'], pad: 12 });
await page.keyboard.press('Escape');
console.log('    name links to:', await page.getByTestId('org-switcher-home').getAttribute('href'));

console.log('2. Settings → General');
await c.goto('/settings/general');
const region = page.getByTestId('org-default-region');
await region.waitFor();
await c.shot('projects/org-2-general', { clip: { x: 0, y: 0, width: 1440, height: 900 } });
const options = await region.locator('option').allInnerTexts();
console.log('    regions:', options.join(', '));
const original = await region.inputValue();
const nameInput = page.locator('#tenant-name');
const orgName = await nameInput.inputValue();
await nameInput.fill('');
if (!(await page.getByTestId('save-org-details').isDisabled())) throw new Error('Save should be disabled with an empty name');
await nameInput.fill(orgName);
const other = (await region.locator('option').evaluateAll((os) => os.map((o) => o.value))).find((v) => v !== original);
if (!other) throw new Error('need a second region');

console.log(`3. Default region → ${other} → Save changes`);
await region.selectOption(other);
await page.getByTestId('save-org-details').click();
await page.waitForTimeout(2500);
await c.shot('projects/org-3-region', { around: ['label[for=tenant-region]', '[data-testid=save-org-details]'], pad: 16 });

try {
  console.log('4. New Project picks that region');
  await c.goto('/');
  await page.getByTestId('projects-new').click();
  const radio = page.getByTestId(`new-project-region-${other}`);
  await radio.waitFor();
  await page.waitForTimeout(800);
  if ((await radio.getAttribute('aria-checked')) !== 'true') throw new Error('New Project did not preselect the default region');
  await c.shot('projects/org-4-new-project-region', { locator: '[role=dialog]' });
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
} finally {
  console.log(`5. Default region back to ${original}`);
  await c.goto('/settings/general');
  await page.getByTestId('org-default-region').selectOption(original);
  await page.getByTestId('save-org-details').click();
  await page.waitForTimeout(2500);
  await c.goto('/settings/general');
  if ((await page.getByTestId('org-default-region').inputValue()) !== original) throw new Error('region not restored');
}

console.log('6. Danger zone');
const dz = page.getByTestId('danger-zone-action');
await dz.evaluate((el) => el.scrollIntoView({ block: 'center' }));
console.log('    Delete organization disabled:', await dz.isDisabled());
{
  const t = await page.getByText('Transfer ownership', { exact: true }).boundingBox();
  const b = await dz.boundingBox();
  const card = await page.getByTestId('org-details-card').boundingBox();
  await c.shot('projects/org-5-danger', { clip: { x: card.x - 8, y: t.y - 40, width: card.width + 16, height: b.y + b.height + 32 - (t.y - 40) } });
}

console.log('7. Create Organization (from the switcher)');
await c.goto('/');
await page.getByTestId('org-switcher').click();
await page.getByRole('menuitem', { name: 'Create Organization' }).click();
const dlg = page.getByRole('dialog').last();
await dlg.getByTestId('plan-picker-trigger').waitFor({ timeout: 20000 });
// The payment form is an embedded frame: wait until it has drawn.
await dlg.locator('iframe').first().waitFor({ timeout: 30000 });
await page.waitForFunction(() => !document.querySelector('[role=dialog] .animate-pulse'), null, { timeout: 30000 });
await page.waitForTimeout(3000);
await c.shot('projects/org-6-create', { locator: '[role=dialog]' });

console.log('8. Plan menu');
await dlg.getByTestId('plan-picker-trigger').click();
await page.waitForTimeout(800);
const plans = page.locator('[role=listbox],[role=menu]').last();
console.log('    plans:', (await plans.innerText()).replace(/\n+/g, ' / '));
await c.shot('projects/org-7-plans', { around: [dlg.getByTestId('plan-picker-trigger'), plans], pad: 12 });
await page.keyboard.press('Escape');

console.log('9. Have a coupon?');
await dlg.getByRole('button', { name: '+ Have a coupon?' }).click();
await dlg.getByPlaceholder('Promotion code').waitFor();
await c.shot('projects/org-8-coupon', { around: [dlg.getByPlaceholder('Promotion code'), dlg.getByTestId('ws-subscribe')], pad: 12 });

console.log('10. Close (no organization created)');
await dlg.getByRole('button', { name: 'Close' }).click();
await page.waitForTimeout(800);
console.log('    tenants:', (await tenantPref()).length);

await c.done();
