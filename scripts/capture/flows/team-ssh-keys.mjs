// Team and account → SSH keys: Personal settings → SSH keys. Adds a
// throwaway public key (SSH_PUB: a file from `ssh-keygen -t ed25519`), then
// deletes it.
import fs from 'node:fs';
import { open } from '../lib.mjs';

const PUB = process.env.SSH_PUB;
if (!PUB) throw new Error('set SSH_PUB to a throwaway .pub file');
const key = fs.readFileSync(PUB, 'utf8').trim();
const NAME = 'Docs laptop';

const c = await open();
const { page } = c;
const askedText = () => page.evaluate(() => window.__asked);
const dialog = () => page.locator('[role=dialog]').last();
const card = () => page.getByText('Your SSH keys', { exact: true });

console.log('1. Personal settings → SSH keys');
await c.goto('/');
await page.getByTestId('header-account-button').click();
await page.locator('[role=menu]').getByText('Personal settings').click();
await page.getByRole('tab', { name: 'SSH keys' }).click();
await page.getByText('Your SSH keys', { exact: true }).waitFor();
await page.waitForTimeout(1500);
// Setup: delete a key left by an earlier, failed run.
for (const left of await page.getByTestId('ssh-key-row').filter({ hasText: NAME }).all()) {
  console.log('    (setup) deleting a leftover key');
  await page.evaluate(() => { window.confirm = () => true; });
  await left.getByRole('button', { name: `Actions for SSH key ${NAME}` }).click();
  await page.getByRole('menuitem', { name: `Delete SSH key ${NAME}` }).click();
  await left.waitFor({ state: 'detached', timeout: 20000 });
}
await page.getByText('No SSH keys yet').waitFor();
await c.shot('team/ssh-1-empty', { around: [card(), page.getByText('Add a public key to open a shell on your apps.')], pad: 24 });

console.log('2. Add SSH key');
await page.getByRole('button', { name: 'Add SSH key' }).first().click();
await dialog().getByLabel('Name').waitFor();
await c.shot('team/ssh-2-dialog', { around: [dialog()], pad: 16 });
await dialog().getByLabel('Name').fill(NAME);
await dialog().getByLabel('Public key').fill('ssh-ed25519 not-a-key');
await dialog().getByRole('button', { name: 'Add key' }).click();
await dialog().locator('p.text-destructive').waitFor();
console.log('    invalid key:', await dialog().locator('p.text-destructive').innerText());
await c.shot('team/ssh-3-invalid', { around: [dialog()], pad: 16 });
await dialog().getByLabel('Public key').fill(key);
await c.shot('team/ssh-4-filled', { around: [dialog()], pad: 16 });
await dialog().getByRole('button', { name: 'Add key' }).click();
await page.getByText('SSH key added').waitFor();
const row = page.getByTestId('ssh-key-row').filter({ hasText: NAME });
await row.waitFor();
await page.waitForTimeout(1500);
await c.shot('team/ssh-5-added', { around: [card(), row], pad: 24 });

console.log('3. Delete it');
await row.getByRole('button', { name: `Actions for SSH key ${NAME}` }).click();
await page.getByRole('menuitem', { name: `Delete SSH key ${NAME}` }).waitFor();
await c.shot('team/ssh-6-menu', { around: [row, page.locator('[role=menu]')], pad: 16 });
// The browser's confirm() is answered in the page: other clients attached
// to the shared Chrome can dismiss a native dialog before this flow sees it.
await page.evaluate(() => { window.__asked = ''; window.confirm = (m) => { window.__asked = String(m); return true; }; });
await page.getByRole('menuitem', { name: `Delete SSH key ${NAME}` }).click();
await page.getByText('SSH key deleted').waitFor();
await page.getByText('No SSH keys yet').waitFor();
console.log('    confirm:', await askedText());

await c.done();
