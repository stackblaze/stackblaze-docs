// Team and account → Members and roles, Single sign-on: Settings → SSO &
// provisioning, as an organization without SSO sees it. Read only.
import { open } from '../lib.mjs';

const c = await open();
const { page } = c;

console.log('1. Settings → SSO & provisioning');
await c.goto('/');
await page.getByRole('button', { name: 'Settings' }).or(page.getByRole('link', { name: 'Settings' })).first().click();
await page.waitForURL(/\/settings\/general/);
await page.getByText('SSO & provisioning', { exact: true }).first().click();
await page.waitForURL(/\/settings\/sso/);
const gate = page.locator('[role=dialog]').filter({ hasText: 'Unlock single sign-on' }).last();
await gate.waitFor({ timeout: 20000 });
await gate.getByText('View plans').waitFor();
await c.shot('team/27-sso-locked', { around: [gate], pad: 16 });

await c.done();
