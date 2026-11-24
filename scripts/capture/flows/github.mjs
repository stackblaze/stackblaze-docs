// Deploy from GitHub with the StackBlaze GitHub App: pick a repository,
// review, deploy, watch it build and open it. The repository list is always
// filtered to the demo repo first, so no other repository is ever on screen.
import { open } from '../lib.mjs';

const REPO = process.env.REPO ?? 'stackblaze/react-vite-starter';
const NAME = REPO.split('/')[1];
const PROJECT = process.env.PROJECT ?? `github-demo-${Date.now().toString(36).slice(-4)}`;
const c = await open();
const { page } = c;
const canvas = () => c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);

if (!process.env.PROJECT) {
  console.log('0. New project (setup, not captured)');
  await c.goto('/');
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder(/^Leave blank to auto-generate/).fill(PROJECT);
  await page.getByRole('button', { name: 'Create Project' }).click();
  await page.getByText('Deploy your first app').waitFor({ timeout: 60000 });
} else {
  await canvas();
}

console.log('1. + Service → GitHub repository');
await page.getByTestId('canvas-new-service').click();
await page.getByText('Build and deploy from a repo').click();
const search = page.getByPlaceholder(/^Search repositories/);
await search.waitFor({ timeout: 30000 });
// Filter BEFORE any shot: only the demo repository may be visible.
await search.fill(NAME);
await page.getByText(REPO, { exact: true }).waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
const visible = await page.locator('[role=dialog]').getByText(/^[\w.-]+\/[\w.-]+$/).allInnerTexts();
if (visible.some((r) => r !== REPO)) throw new Error(`other repositories visible: ${visible}`);
await c.shot('github/1-pick', { locator: '[role=dialog]' });

console.log('2. Select → Ready to deploy');
await page.locator('[role=dialog]').getByRole('button', { name: 'Select' }).click();
await page.getByText('Ready to deploy').waitFor({ timeout: 30000 });
await page.waitForTimeout(1000);
await c.shot('github/2-ready');

console.log('3. Click the card → review');
// Picking the repo saves it to the project in the background; until that
// finishes, clicking the card says "Still adding it to the canvas…".
const toasts = () => page.locator('[data-sonner-toast]').allInnerTexts();
for (let i = 0; i < 24; i++) {
  await page.getByText('Application', { exact: true }).click();
  await page.waitForTimeout(5000);
  if (await page.getByRole('button', { name: /^Deploy/ }).count()) break;
  const t = (await toasts()).join(' | ').replace(/\s+/g, ' ');
  if (t) console.log('    toast:', t.slice(0, 300));
}
await page.getByRole('button', { name: /^Deploy/ }).first().waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
console.log('    review:', (await page.locator('body').innerText()).split('Ready to deploy').pop().replace(/\s+/g, ' ').slice(0, 900));
await c.shot('github/3-review');
c.checkpoint();

console.log('4. Deploy → build → Running');
await page.getByRole('button', { name: /^Deploy/ }).first().click();
await page.waitForTimeout(20000);
await canvas();
await c.shot('github/4-building');
let host;
for (const until = Date.now() + 20 * 60000; Date.now() < until; ) {
  await page.waitForTimeout(20000);
  await canvas();
  const body = await page.locator('body').innerText();
  host = body.match(new RegExp(`${NAME}-[a-z0-9]{4}\\.[\\w.-]+\\.stackblaze\\.app`))?.[0];
  if (host && /Running/.test(body) && !/Building|Deploying|Updating/.test(body)) break;
  if (/Failed|Crashed|Error/.test(body)) { console.log('    state:', body.slice(0, 400)); break; }
}
await c.shot('github/5-running');
c.checkpoint();
if (!host) throw new Error('no app URL');

console.log(`5. Open https://${host}`);
const app = await page.context().newPage();
await app.setViewportSize({ width: 1100, height: 640 });
const res = await app.goto(`https://${host}`, { waitUntil: 'load' });
await app.waitForTimeout(3000);
console.log('    status', res.status(), 'title', await app.title());
if (res.status() !== 200) throw new Error(`app returned ${res.status()}`);
await c.shotPage('github/6-app', app, `https://${host}`);

await c.done();
console.log(JSON.stringify({ project: PROJECT, host }));
