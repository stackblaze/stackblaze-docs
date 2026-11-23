// Deploy a template (uptime-kuma: an app plus a MariaDB database) into a new
// project, wait for both to run, and open the app.
import { open } from '../lib.mjs';

const PROJECT = `templates-demo-${Date.now().toString(36).slice(-4)}`;
const c = await open();
const { page } = c;

console.log('0. New project (setup, not captured)');
await c.goto('/');
await page.getByRole('button', { name: 'New Project' }).click();
await page.getByPlaceholder(/^Leave blank to auto-generate/).fill(PROJECT);
await page.getByRole('button', { name: 'Create Project' }).click();
await page.getByText('Deploy your first app').waitFor({ timeout: 60000 });

console.log('1. + Service → Template');
await page.getByTestId('canvas-new-service').click();
await page.getByPlaceholder(/^Search services, templates, add-ons/).waitFor();
await c.shot('templates/1-add-menu', { locator: '[role=dialog]' });
await page.getByText('One-click apps from the catalog').click();
await page.getByPlaceholder(/^Search templates/).waitFor();
await page.waitForTimeout(1500);
await c.shot('templates/2-list', { locator: '[role=dialog]' });

console.log('2. Search uptime');
await page.getByPlaceholder(/^Search templates/).fill('uptime');
await page.getByText('Self-hosted uptime monitoring').waitFor();
await c.shot('templates/3-search', { locator: '[role=dialog]' });

console.log('3. Pick it → deploying');
await page.getByText('Self-hosted uptime monitoring').click();
await page.getByText('Deploying', { exact: true }).first().waitFor({ timeout: 60000 });
await page.waitForTimeout(1500);
await c.shot('templates/4-deploying', { around: [page.getByText('DATABASES'), page.getByTestId('canvas-new-service')], pad: 24, extraBottom: 160 });

console.log('4. Running');
await page.waitForFunction(() => document.body.innerText.split('Running').length - 1 >= 2 && !document.body.innerText.includes('Deploying'), null, { timeout: 300000 });
const host = (await page.locator('text=/uptime-kuma.*\\.stackblaze\\.app/').first().innerText()).trim();
await c.shot('templates/5-running', { around: [page.getByText('DATABASES'), page.getByTestId('canvas-new-service')], pad: 24, extraBottom: 160 });

console.log(`5. Open https://${host}`);
const app = await page.context().newPage();
await app.setViewportSize({ width: 1100, height: 640 });
await app.goto(`https://${host}`, { waitUntil: 'load' });
await app.waitForTimeout(3000);
if (!(await app.title()).includes('Uptime Kuma')) throw new Error(`unexpected title ${await app.title()}`);
await c.shotPage('templates/6-app', app, `https://${host}`);

await c.done();
console.log(JSON.stringify({ project: PROJECT, host }));
