// The service panel: variables (add → commit → deploy, then check the app
// actually sees it), logs, metrics, deployments, and the Settings sections.
// Runs against the nginx service the Quick Start flow deployed.
import { open, PANEL } from '../lib.mjs';

const PROJECT = process.env.CAPTURE_PROJECT ?? 'my-first-project-h22a';
const PHASE = 'dev';
const c = await open();
const { page } = c;

async function openService() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
  // Click the service's name on its card.
  await page.getByText('nginx', { exact: true }).first().click();
  await page.getByText('Environment Variables').or(page.getByRole('tab', { name: /Deployment/ })).first().waitFor({ timeout: 20000 });
}
const tab = (name) => page.locator('button,[role=tab],a').filter({ hasText: new RegExp(`^${name}`) }).first();
const sheet = () => page.locator('aside, [role=dialog], div').filter({ has: page.getByText('Environment Variables').or(tab('Deployment')) }).last();

console.log('1. Open the service');
await openService();
await c.shot('service/1-open', { clip: PANEL });

console.log('2. Variables → Add variable');
await tab('Variables').click();
await page.getByText('Environment Variables').waitFor();
const key = 'GREETING';
const value = `hello-${Date.now().toString(36).slice(-3)}`;
const keys = await page.getByPlaceholder('KEY').evaluateAll((els) => els.map((e) => e.value));
if (keys.includes(key)) {
  // Re-run: change the value, which stages the same one change.
  await page.getByPlaceholder('value').nth(keys.indexOf(key)).fill(value);
} else {
  await page.getByRole('button', { name: 'Add variable' }).click();
  await page.getByPlaceholder('KEY').last().fill(key);
  await page.getByPlaceholder('value').last().fill(value);
}
await page.getByRole('button', { name: /Commit 1 change/ }).waitFor({ timeout: 10000 });
await c.shot('variables/1-add', { clip: PANEL });

console.log('3. Commit → review dialog');
await page.getByRole('button', { name: /Commit 1 change/ }).click();
await page.getByText('1 change to apply').waitFor();
await page.getByPlaceholder('How these releases appear in the history').fill('Set GREETING');
await c.shot('variables/2-commit', { locator: '[role=dialog]' });

console.log('4. Deploy 1 change → running with the new variable');
await page.getByRole('button', { name: 'Deploy 1 change' }).click();
await page.getByText('1 change to apply').waitFor({ state: 'hidden', timeout: 60000 });
await page.waitForTimeout(3000);
await page.getByText('Running', { exact: true }).first().waitFor({ timeout: 240000 });
const api = await page.evaluate(async ([p, ph]) => {
  const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
  const app = (a.phases || []).find((x) => x.name === ph).apps[0];
  const d = await (await fetch(`/api/apps/${p}/${ph}/${app.name}`)).json();
  return { app: app.name, vars: (d.spec.envVars || []).map((v) => v.name) };
}, [PROJECT, PHASE]);
if (!api.vars.includes(key)) throw new Error(`variable not saved: ${JSON.stringify(api)}`);
console.log('   saved on', api.app, api.vars);

console.log('5. Deployment tab');
await openService();
await tab('Deployment').click();
await page.getByText('running', { exact: true }).first().waitFor({ timeout: 120000 });
await page.waitForTimeout(1500);
await c.shot('deployments/1-list', { clip: PANEL });

console.log('5b. Manual Deploy menu and a row menu');
await page.getByRole('button', { name: /Manual Deploy/ }).click();
await page.getByRole('menuitem').first().waitFor();
const manual = await page.getByRole('menuitem').allInnerTexts();
console.log('   Manual Deploy:', manual);
await c.shot('deployments/2-manual-deploy', { clip: PANEL });
await page.keyboard.press('Escape');
// The ⋯ menu of the previous (older) deploy row.
const rowMenus = page.locator('button[aria-haspopup="menu"]').filter({ hasNotText: /Manual Deploy/ });
await rowMenus.last().click();
await page.getByRole('menuitem').first().waitFor();
console.log('   Row menu:', await page.getByRole('menuitem').allInnerTexts());
await c.shot('deployments/3-row-menu', { clip: PANEL });
await page.keyboard.press('Escape');

console.log('6. Logs tab');
await tab('Logs').click();
await page.waitForTimeout(4000);
await c.shot('logs/1-app-logs', { clip: PANEL });

console.log('7. Metrics tab');
await tab('Metrics').click();
await page.waitForTimeout(6000);
await c.shot('metrics/1-app-metrics', { clip: PANEL });

console.log('8. Settings sections');
await tab('Settings').click();
await page.waitForTimeout(2500);
await c.shot('settings/0-overview', { clip: PANEL });
for (const s of ['access', 'domains', 'deploy', 'health', 'network', 'scale', 'storage']) {
  const sec = page.locator(`[data-settings-section="${s}"]`).first();
  if (!(await sec.count())) { console.log(`   (no section ${s})`); continue; }
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await c.shot(`settings/${s}`, { locator: `[data-settings-section="${s}"]` });
}

await c.done();
console.log(JSON.stringify(api));
