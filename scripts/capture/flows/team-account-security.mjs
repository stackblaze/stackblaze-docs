// Team and account → Account security: Personal settings → Authentication.
// READ ONLY: opens the Reset, Generate new and Add passkey dialogs to show
// them and cancels each; never submits anything.
import { open } from '../lib.mjs';

const c = await open();
const { page } = c;
const dialog = () => page.locator('[role=dialog]').last();
const cancel = async () => {
  await dialog().getByRole('button', { name: 'Cancel' }).click();
  await dialog().waitFor({ state: 'detached' }).catch(() => {});
  await page.waitForTimeout(400);
};

console.log('1. Personal settings → Authentication');
await c.goto('/');
await page.getByTestId('header-account-button').click();
await page.locator('[role=menu]').getByText('Personal settings').click();
await page.getByRole('tab', { name: 'Authentication' }).click();
await page.getByTestId('twofa-card').waitFor();
await page.getByTestId('twofa-recovery-left').waitFor();
await c.shot('team/security-1-2fa', { locator: '[data-testid=twofa-card]' });
await c.shot('team/security-2-methods', { locator: '[data-testid=signin-methods-card]' });

console.log('2. Reset (authenticator app) → dialog, Cancel');
await page.getByTestId('twofa-totp-row').getByRole('button', { name: 'Reset' }).click();
await dialog().getByText('Reset two-factor authentication').waitFor();
await c.shot('team/security-3-reset', { around: [dialog()], pad: 16 });
await cancel();

console.log('3. Recovery codes: Generate new → dialog, Cancel');
await page.getByTestId('twofa-recovery-new').click();
await dialog().getByText('Generate new recovery codes').waitFor();
await c.shot('team/security-4-recovery', { around: [dialog()], pad: 16 });
await cancel();

console.log('4. Change password, Change email');
await page.getByTestId('password-card').scrollIntoViewIfNeeded();
await c.shot('team/security-5-password', { locator: '[data-testid=password-card]' });
await page.getByTestId('email-card').scrollIntoViewIfNeeded();
await c.shot('team/security-6-email', { locator: '[data-testid=email-card]' });

console.log('5. Passkeys: Manage scrolls to the list; Add passkey → dialog, Cancel');
await page.getByTestId('twofa-passkeys-row').scrollIntoViewIfNeeded();
await page.getByTestId('twofa-passkeys-row').getByRole('button', { name: 'Manage' }).click();
await page.waitForTimeout(1200);
await c.shot('team/security-7-passkeys', { locator: '[data-testid=passkeys-section]' });
await page.getByTestId('passkeys-section').getByRole('button', { name: 'Add passkey' }).click();
await dialog().getByText('Add a passkey').waitFor();
await c.shot('team/security-8-add-passkey', { around: [dialog()], pad: 16 });
await cancel();

await c.done();
