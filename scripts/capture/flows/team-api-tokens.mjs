// Team and account → API tokens: Personal settings → API tokens. Creates a
// token, shows the expiry choices, then revokes it. The token value is never
// printed and is replaced in the page before every shot.
import { open } from '../lib.mjs';

const NAME = 'docs-demo-token';
const c = await open();
const { page } = c;
const askedText = () => page.evaluate(() => window.__asked);
const dialog = () => page.locator('[role=dialog]').last();

// Replace any token value (sb_<kind>_…) in the page, text and inputs alike.
async function maskTokens() {
  await page.evaluate(() => {
    const re = /\b(sb_[a-z]+_)[A-Za-z0-9_\-]{4,}…?/g;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (re.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(re, '$1••••••••••••••••••••••••');
    for (const el of document.querySelectorAll('input, textarea')) if (re.test(el.value)) el.value = el.value.replace(re, '$1••••••••••••••••••••••••');
  });
}
async function shot(id, opts) {
  await maskTokens();
  const leak = await page.evaluate(() => /\bsb_[a-z]+_[A-Za-z0-9]{4,}/.test(document.body.innerText));
  if (leak) throw new Error('a token value is still on screen');
  await c.shot(id, opts);
}

console.log('1. Account menu → API tokens');
await c.goto('/');
await page.getByTestId('header-account-button').click();
const menu = page.locator('[role=menu]');
await menu.getByText('API tokens').waitFor();
await shot('team/tokens-1-account-menu', { around: [page.getByTestId('header-account-button'), menu], pad: 12 });
await menu.getByText('API tokens').click();
await page.getByTestId('token-open-create').waitFor();
await page.getByTestId('token-row').first().waitFor();
// Setup: revoke a token left by an earlier, failed run.
for (const left of await page.getByTestId('token-row').filter({ hasText: NAME }).all()) {
  console.log('    (setup) revoking a leftover token');
  await page.evaluate(() => { window.confirm = () => true; });
  await left.getByRole('button', { name: `Actions for token ${NAME}` }).click();
  await page.getByRole('menuitem', { name: 'Revoke token' }).click();
  await left.waitFor({ state: 'detached', timeout: 20000 });
}

console.log('2. Create token: name and expiry');
// Filter the list to this token's name first, so other tokens stay out of the shots.
await page.getByPlaceholder('Search tokens…').fill(NAME);
await page.getByTestId('token-open-create').click();
const dlg = page.getByTestId('token-create-dialog');
await dlg.waitFor();
await shot('team/tokens-2-create', { around: [dlg], pad: 16 });
await dlg.getByRole('button', { name: 'Custom' }).click();
await dlg.getByLabel('Expiry date').waitFor();
await shot('team/tokens-3-custom', { around: [dlg], pad: 16 });
await dlg.getByLabel('Name').fill(NAME);
await dlg.getByRole('button', { name: '30 days' }).click();
await dlg.getByLabel('Expiry date').waitFor({ state: 'detached' });
await shot('team/tokens-4-filled', { around: [dlg], pad: 16 });

console.log('3. Create → shown once');
await page.getByTestId('token-create-submit').click();
const reveal = page.getByTestId('token-reveal-dialog');
await reveal.waitFor({ timeout: 20000 });
await page.waitForTimeout(500);
await shot('team/tokens-5-created', { around: [reveal], pad: 16 });
await reveal.getByRole('button', { name: 'Done' }).click();
await reveal.waitFor({ state: 'detached' });

console.log('4. The new token in the list');
const row = page.getByTestId('token-row').filter({ hasText: NAME });
await row.waitFor();
await page.waitForTimeout(500);
await shot('team/tokens-6-row', { around: [page.getByText('Your tokens', { exact: true }), row], pad: 24 });
await row.getByRole('button', { name: `Hide token ${NAME}` }).click().catch(() => {});
await row.getByRole('button', { name: `Show token ${NAME}` }).waitFor();
await row.getByRole('button', { name: `Actions for token ${NAME}` }).click();
await page.getByRole('menuitem', { name: 'Revoke token' }).waitFor();
await shot('team/tokens-7-menu', { around: [row, page.locator('[role=menu]')], pad: 16 });

console.log('5. Revoke it');
// The browser's confirm() is answered in the page: other clients attached
// to the shared Chrome can dismiss a native dialog before this flow sees it.
await page.evaluate(() => { window.__asked = ''; window.confirm = (m) => { window.__asked = String(m); return true; }; });
await page.getByRole('menuitem', { name: 'Revoke token' }).click();
await row.waitFor({ state: 'detached', timeout: 20000 });
const asked = await askedText();
if (asked !== `Revoke token "${NAME}"? Any service using it will lose access.`) throw new Error(`unexpected confirm: ${asked}`);
console.log('    confirm:', await askedText());
await page.getByText('No matching tokens').waitFor();

await c.done();
