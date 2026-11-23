// Add a PostgreSQL database to the demo project's Dev environment, deploy it,
// read its connection details, and connect the nginx app to it.
import { open } from '../lib.mjs';

const PROJECT = process.env.DEMO_PROJECT ?? 'my-first-project-h22a';
const PHASE = 'dev';
const c = await open();
const { page } = c;
const canvasCrop = () => ({ around: [page.getByText('DATABASES'), page.getByTestId('canvas-new-service')], pad: 24, extraBottom: 160 });

console.log('0. Remove a database left by an earlier run (setup, not captured)');
await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
const cleaned = await page.evaluate(async ([p, ph]) => {
  const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
  const phase = (a.phases || []).find((x) => x.name === ph);
  const pg = (phase.sharedAddons || []).filter((x) => x.kind === 'Cluster').map((x) => x.instance);
  const out = [];
  for (const app of phase.apps) {
    const refs = app.sharedAddons || [];
    if (!refs.some((r) => pg.includes(r))) continue;
    await fetch(`/api/apps/${p}/${ph}/${app.name}/shared-addons`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sharedAddons: refs.filter((r) => !pg.includes(r)) }),
    });
    const d = await (await fetch(`/api/apps/${p}/${ph}/${app.name}`)).json();
    out.push({ disconnected: app.name, envAfter: (d.spec.envVars || []).map((v) => v.name) });
  }
  for (const i of pg) out.push({ deleted: i, status: (await fetch(`/api/pipelines/${p}/${ph}/shared-addons/${i}`, { method: 'DELETE' })).status });
  return out;
}, [PROJECT, PHASE]);
if (cleaned.length) { console.log('   ', JSON.stringify(cleaned)); await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`); }

console.log('1. + Service → Database or cache');
if (await page.getByText('DATABASES').count()) throw new Error('demo project still has a database');
await page.getByTestId('canvas-new-service').click();
await page.getByText('PostgreSQL, MariaDB, Valkey, and more').click();
await page.getByText('Reliable open-source relational database').waitFor();
await c.shot('postgresql/1-databases', { locator: '[role=dialog]' });

console.log('2. PostgreSQL → card, Ready to deploy');
await page.getByText('Reliable open-source relational database').click();
await page.getByText('Ready to deploy').waitFor({ timeout: 20000 });
await c.shot('postgresql/2-ready', canvasCrop());

console.log('3. Click the card → review');
await page.getByText('Database', { exact: true }).click();
await page.getByText('Deploys with the catalog defaults').waitFor();
await c.shot('postgresql/3-review');

console.log('4. Deploy → Running');
const running0 = await page.evaluate(() => document.body.innerText.split('\n').filter((l) => l.trim() === 'Running').length);
await page.getByRole('button', { name: 'Deploy', exact: true }).click();
await page.locator('text=/^db\\..*stackblaze\\.cloud$/').first().waitFor({ timeout: 300000 });
// The card's own status, not the "Deploying PostgreSQL…" toast (it lingers).
await page.waitForFunction((b) => document.body.innerText.split('\n').filter((l) => l.trim() === 'Running').length > b && !/Ready to deploy|Updating|Deploying\n/.test(document.body.innerText), running0, { timeout: 300000 });
await page.waitForTimeout(4000);
if (/Updating/.test(await page.locator('body').innerText())) throw new Error('database still updating');
await c.shot('postgresql/4-running', canvasCrop());

console.log('5. Open it → Settings → Access');
await page.getByText('PostgreSQL', { exact: true }).click();
await page.getByRole('tab', { name: 'Settings' }).click();
await page.getByText('Connect from apps').waitFor({ timeout: 90000 });
await page.getByText('Connect from apps').click();
await page.getByText('Environment snippet', { exact: true }).click();
await page.getByText('PGDATABASE=').first().waitFor();
await page.getByText('Connect from apps').scrollIntoViewIfNeeded();
await page.locator('[data-settings-section=access]').first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
await c.shot('postgresql/5-access');

console.log('6. Connections → connect nginx (staged)');
const conn = page.locator('[data-settings-section=connection]');
await conn.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await conn.getByRole('switch', { name: /to nginx$/ }).click();
await conn.getByText('staged').waitFor();
await c.shot('postgresql/6-connect', { locator: '[data-settings-section=connection]' });

console.log('7. Commit → Deploy 1 change');
await page.keyboard.press('Escape');
await page.getByRole('button', { name: /^Commit 1 change/ }).click();
await page.getByRole('button', { name: 'Deploy 1 change' }).waitFor();
await c.shot('postgresql/7-commit', { locator: '[role=dialog]' });
await page.getByRole('button', { name: 'Deploy 1 change' }).click();

console.log('8. Check nginx now has the connection variables');
let api;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(3000);
  api = await page.evaluate(async ([p, ph]) => {
    const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
    const app = (a.phases || []).find((x) => x.name === ph).apps.find((x) => x.name.startsWith('nginx'));
    const d = await (await fetch(`/api/apps/${p}/${ph}/${app.name}`)).json();
    return { app: app.name, shared: app.sharedAddons ?? [], env: (d.spec.envVars || []).map((v) => v.name) };
  }, [PROJECT, PHASE]);
  if (api.shared.length && api.env.includes('PGHOST')) break;
}
if (!api.shared.length || !api.env.includes('PGHOST')) throw new Error(`not connected: ${JSON.stringify(api)}`);
console.log('   ', JSON.stringify(api));

console.log('9. nginx → Variables');
await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
await page.getByText(api.app.replace(/-[a-z0-9]{4}$/, ''), { exact: true }).first().click();
await page.getByRole('tab', { name: 'Variables' }).click();
await page.getByText('Provided by add-on').first().waitFor({ timeout: 20000 });
await page.waitForTimeout(1500);
await c.shot('postgresql/8-variables');

await c.done();
