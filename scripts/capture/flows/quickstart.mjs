// Quick Start: create a project, deploy a public Docker image, open its URL.
// Performs every step the guide describes; each shot is taken right after
// the step it illustrates. Fails (and writes nothing) if any step can't be done.
import { open } from '../lib.mjs';

const PROJECT = process.env.CAPTURE_PROJECT ?? `my-first-project-${Date.now().toString(36).slice(-4)}`;

const c = await open();
const { page } = c;

console.log('1. Projects → New Project');
await c.goto('/');
await page.getByRole('button', { name: 'New Project' }).click();
await page.getByText('Create a New Project').waitFor();
await page.getByPlaceholder(/^Leave blank to auto-generate/).fill(PROJECT);
await c.shot('quickstart/1-new-project', { locator: '[role=dialog]' });

console.log('2. Create Project → Deploy your first app');
await page.getByRole('button', { name: 'Create Project' }).click();
await page.waitForURL(/\/pipeline\//, { timeout: 60000 });
await page.getByText('Deploy your first app').waitFor({ timeout: 60000 });
await c.shot('quickstart/2-first-app');

console.log('3. Docker image → search nginx');
await page.getByText('Docker image', { exact: true }).first().click();
const search = page.getByPlaceholder(/^Search Docker Hub or paste a reference/);
await search.waitFor();
await search.fill('nginx');
await page.getByText('Official build of Nginx.').waitFor({ timeout: 20000 });
await c.shot('quickstart/3-search-image', { locator: '[role=dialog]' });

console.log('4. Use → card on the canvas, Ready to deploy');
await page.locator('div', { has: page.getByText('Official build of Nginx.') })
  .getByRole('button', { name: 'Use' }).first().click();
const ready = page.getByText('Ready to deploy').first();
await ready.waitFor({ timeout: 30000 });
await page.waitForTimeout(800);
// The card and the toolbar above it: the rest of the canvas is empty.
await c.shot('quickstart/4-ready', { around: [page.getByText('Ready to deploy').first(), page.getByRole('button', { name: 'Service' })], pad: 24 });

console.log('5. Click the card → Review, then deploy');
// The click handler is on the card, not on its status line.
const box = await page.getByText('Application', { exact: true }).first().boundingBox();
await page.mouse.click(box.x + 60, box.y);
await page.getByText('Review, then deploy.').waitFor({ timeout: 15000 });
await page.getByText('nginx:latest').first().waitFor();
await c.shot('quickstart/5-review');

console.log('6. Deploy → Running');
await page.getByRole('button', { name: 'Deploy', exact: true }).click();
await page.getByText('Running', { exact: true }).first().waitFor({ timeout: 180000 });
const host = (await page.locator('text=/\\.stackblaze\\.app/').first().innerText()).trim();
await c.shot('quickstart/6-running', { around: [page.getByText('Running', { exact: true }).first(), page.getByRole('button', { name: 'Service' })], pad: 24 });

console.log(`7. Open https://${host}`);
const res = await fetch(`https://${host}`);
const body = await res.text();
if (res.status !== 200 || !body.includes('Welcome to nginx')) throw new Error(`App URL answered ${res.status}`);
const app = await page.context().newPage();
await app.setViewportSize({ width: 1100, height: 520 });
await app.goto(`https://${host}`);
await c.shotPage('quickstart/7-app', app, `https://${host}`);
await app.close();

await c.done();
console.log(JSON.stringify({ project: PROJECT, host }));
