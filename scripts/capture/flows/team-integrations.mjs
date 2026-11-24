// Team and account → Integrations: Settings → Integrations (GitHub, Hugging
// Face). Read only: shows the state and the Hugging Face ⋯ menu; connects
// and disconnects nothing. The personal GitHub account chip is removed
// before the shot (only the organization's account stays).
import { open } from '../lib.mjs';

const HIDE = (process.env.CAPTURE_HIDE_GH ?? '').split(',').filter(Boolean);
if (!HIDE.length) throw new Error('set CAPTURE_HIDE_GH to the GitHub login(s) to keep out of the shot');

const c = await open();
const { page } = c;

console.log('1. Settings → Integrations');
await c.goto('/');
await page.getByRole('button', { name: 'Settings' }).or(page.getByRole('link', { name: 'Settings' })).first().click();
await page.waitForURL(/\/settings\/general/);
await page.getByText('Integrations', { exact: true }).first().click();
await page.waitForURL(/\/settings\/integrations/);
const gh = page.getByTestId('integration-github');
const hf = page.getByTestId('integration-hf');
await gh.waitFor();
await page.getByTestId('integration-github-owner').first().waitFor({ timeout: 20000 });
await page.getByTestId('hf-connected').waitFor({ timeout: 20000 });
await page.evaluate((hide) => {
  for (const a of document.querySelectorAll('[data-testid=integration-github-owner]')) if (hide.includes(a.textContent.trim())) a.remove();
}, HIDE);
const table = page.locator('table').filter({ has: gh });
await c.shot('team/integrations-1', { around: [page.getByRole('heading', { name: 'Integrations' }).first(), table], pad: 24 });

console.log('2. Hugging Face ⋯ menu (not clicked through)');
await page.getByTestId('hf-menu').click();
await page.getByTestId('hf-disconnect').waitFor();
await c.shot('team/integrations-2-hf-menu', { around: [hf, page.locator('[role=menu]')], pad: 12 });
await page.keyboard.press('Escape');

await c.done();
