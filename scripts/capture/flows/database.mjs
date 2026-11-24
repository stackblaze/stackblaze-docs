// One database kind, every option on its screens: add → review → deploy →
// panel tabs → plan limits → access (connection details) → connect an app
// (checks the variables it injects) → storage expand → HA.
//   KIND=valkey|mariadb node scripts/capture/flows/database.mjs
// SECTIONS=add,connect,tabs,storage,ha picks parts (default: all). The demo
// project's database of this kind is removed first when running "add".
import { open } from '../lib.mjs';

const KINDS = {
  valkey: { title: 'Valkey', blurb: 'Fast in-memory key/value store', manage: 'Manage Valkey', kind: /^(Redis|RedisFailover|Valkey)/ },
  mariadb: { title: 'MariaDB', blurb: 'MySQL-compatible relational database', manage: 'Manage MariaDB', kind: /^(MariaDB|Mariadb)/ },
};
const K = KINDS[process.env.KIND];
if (!K) throw new Error(`KIND must be one of ${Object.keys(KINDS)}`);
const ID = process.env.KIND;
const PROJECT = process.env.DEMO_PROJECT ?? 'my-first-project-h22a';
const PHASE = 'dev';
const SECTIONS = (process.env.SECTIONS ?? 'add,connect,tabs,storage,ha').split(',');
const c = await open();
const { page } = c;
const canvas = () => c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
const crop = () => ({ around: [page.getByText('DATABASES'), page.getByTestId('canvas-new-service')], pad: 24, extraBottom: 220 });
const CARDS = '[data-testid^=app-card-addon-], [data-testid^=app-card-canvas-group-]';
const card = () => (process.env.INSTANCE
  ? page.locator(`[data-testid="app-card-addon-${process.env.INSTANCE}"], [data-testid="app-card-canvas-group-${process.env.INSTANCE}"]`)
  : page.locator(CARDS).filter({ has: page.getByRole('button', { name: K.manage }) })).first();
async function openDb(tab) {
  await canvas();
  await card().getByRole('button', { name: K.manage }).click();
  await page.getByRole('tab', { name: tab }).click();
  await page.waitForTimeout(2000);
}
const api = (fn, args) => page.evaluate(fn, args);
const phaseInfo = () => api(async ([p, ph]) => {
  const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
  return (a.phases || []).find((x) => x.name === ph);
}, [PROJECT, PHASE]);
const section = (n) => page.locator(`[data-settings-section=${n}]`).first();

await canvas();
// Instances of this kind (from the card test ids).
const mine = async () => (await page.locator(CARDS).filter({ has: page.getByRole('button', { name: K.manage }) }).evaluateAll((els) => els.map((e) => e.dataset.testid.replace(/^app-card-(addon|canvas-group)-/, ''))));

if (SECTIONS.includes('add')) {
  console.log('0. Remove this kind left by an earlier run (setup, not captured)');
  for (const inst of await mine()) {
    const out = await api(async ([p, ph, i]) => {
      const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
      for (const app of (a.phases || []).find((x) => x.name === ph).apps) {
        const refs = app.sharedAddons || [];
        if (refs.includes(i)) await fetch(`/api/apps/${p}/${ph}/${app.name}/shared-addons`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sharedAddons: refs.filter((r) => r !== i) }) });
      }
      return (await fetch(`/api/pipelines/${p}/${ph}/shared-addons/${i}`, { method: 'DELETE' })).status;
    }, [PROJECT, PHASE, inst]);
    console.log(`    removed ${inst}: ${out}`);
  }
  await canvas();

  console.log(`1. + Service → Database or cache → ${K.title}`);
  await page.getByTestId('canvas-new-service').click();
  await page.getByText('PostgreSQL, MariaDB, Valkey, and more').click();
  await page.getByText(K.blurb).click();
  await page.getByText('Ready to deploy').waitFor({ timeout: 20000 });
  await c.shot(`${ID}/1-ready`, crop());

  console.log('2. Review → Deploy → Running');
  await page.getByText('Database', { exact: true }).click();
  await page.getByText('Deploys with the catalog defaults').waitFor();
  await c.shot(`${ID}/2-review`);
  await page.getByRole('button', { name: 'Deploy', exact: true }).click();
  const until = Date.now() + 10 * 60000;
  while (Date.now() < until) {
    await page.waitForTimeout(15000);
    await canvas();
    const t = await card().innerText().catch(() => '');
    if (/Running/.test(t)) break;
  }
  if (!/Running/.test(await card().innerText())) throw new Error('not running');
  await page.waitForTimeout(2000);
  await c.shot(`${ID}/3-running`, crop());
  c.checkpoint();
}

await card().waitFor({ timeout: 30000 }).catch(() => {});
const INSTANCE = process.env.INSTANCE ?? (await mine())[0];
if (!INSTANCE) throw new Error(`no ${K.title} in the demo project`);
console.log('instance', INSTANCE);

if (SECTIONS.includes('connect')) {
  console.log('3. Settings: plan limits, access');
  await openDb('Settings');
  await c.shot(`${ID}/4-limits`, { locator: '[data-settings-section=limits]' });
  await page.getByText('Connect from apps').click();
  await page.getByText('Environment snippet', { exact: true }).click();
  await page.waitForTimeout(1000);
  await section('access').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await c.shot(`${ID}/5-access`);
  console.log('    snippet vars:', (await page.locator('text=/^[A-Z_]+=/').allInnerTexts()).join(' ').split(/\s+/).map((l) => l.split('=')[0]).filter(Boolean).join(', '));

  console.log('4. Connections → nginx → commit → variables');
  const conn = section('connection');
  await conn.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await conn.getByRole('switch', { name: /to nginx$/ }).click();
  await conn.getByText('staged').waitFor();
  await c.shot(`${ID}/6-connect`, { locator: '[data-settings-section=connection]' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Commit 1 change/ }).click();
  await page.getByRole('button', { name: 'Deploy 1 change' }).click();
  let env = [];
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(3000);
    env = await api(async ([p, ph]) => {
      const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
      const app = (a.phases || []).find((x) => x.name === ph).apps.find((x) => x.name.startsWith('nginx'));
      const d = await (await fetch(`/api/apps/${p}/${ph}/${app.name}`)).json();
      return { refs: app.sharedAddons || [], env: (d.spec.envVars || []).map((v) => v.name) };
    }, [PROJECT, PHASE]);
    if (env.refs.includes(INSTANCE)) break;
  }
  if (!env.refs.includes(INSTANCE)) throw new Error('nginx not connected');
  console.log('    nginx variables:', env.env.join(', '));
  await canvas();
  await page.getByText('nginx', { exact: true }).first().click();
  await page.getByRole('tab', { name: 'Variables' }).click();
  await page.getByText('Provided by add-on').first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await c.shot(`${ID}/7-variables`);
  c.checkpoint();
}

if (SECTIONS.includes('tabs')) {
  console.log('5. Deployment, Logs, Metrics');
  await openDb('Deployment');
  await c.shot(`${ID}/8-deployment`);
  await openDb('Logs');
  await page.waitForTimeout(3000);
  await c.shot(`${ID}/9-logs`);
  await openDb('Metrics');
  await page.waitForTimeout(4000);
  await c.shot(`${ID}/10-metrics`);
  const mtext = await page.locator('body').innerText().catch(() => '');
  console.log('    metrics:', mtext.split('\n').filter((l) => /^[A-Z][a-z][^.]{2,40}$/.test(l.trim())).slice(-30).join(' | '));
  c.checkpoint();
}

if (SECTIONS.includes('storage')) {
  console.log('6. Storage → expand');
  await openDb('Settings');
  const st = section('storage');
  await st.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await c.shot(`${ID}/11-storage`, { locator: '[data-settings-section=storage]' });
  await st.getByText('Choose a new size').click();
  const opts = page.getByRole('option');
  await opts.first().waitFor();
  console.log('    sizes:', (await opts.allInnerTexts()).join(', '));
  const size = (await opts.first().innerText()).trim();
  await opts.first().click();
  await st.getByRole('button', { name: 'Expand', exact: true }).click();
  let txt = '';
  for (const until = Date.now() + 10 * 60000; Date.now() < until; ) {
    await page.waitForTimeout(20000);
    await openDb('Settings');
    txt = await section('storage').innerText();
    if (txt.includes(size.replace(' Gi', '.0 GiB'))) break;
  }
  console.log('    after:', txt.split('\n').filter((l) => /GiB|MiB|KiB/.test(l)).join(' '));
  await section('storage').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await c.shot(`${ID}/12-storage-expanded`, { locator: '[data-settings-section=storage]' });
  c.checkpoint();
}

if (SECTIONS.includes('ha')) {
  console.log('7. HA → Enable HA');
  await openDb('Settings');
  const ha = section('ha');
  await ha.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await c.shot(`${ID}/13-ha-off`, { locator: '[data-settings-section=ha]' });
  await ha.getByRole('button', { name: 'Enable HA' }).click();
  await page.getByText('Enable high availability?').waitFor();
  const dlg = '[role=dialog]:has-text("Enable high availability?"), [role=alertdialog]:has-text("Enable high availability?")';
  console.log('    asks:', (await page.locator(dlg).last().innerText().catch(() => '')).replace(/\s+/g, ' '));
  await c.shot(`${ID}/14-ha-confirm`, { locator: dlg });
  await page.getByRole('button', { name: 'Enable HA' }).last().click();
  let text = '';
  for (const until = Date.now() + 15 * 60000; Date.now() < until; ) {
    await page.waitForTimeout(20000);
    await openDb('Settings');
    text = await section('ha').innerText();
    if (!/Single primary/.test(text) && /Healthy|ready|running/i.test(text) && !/progress|creating|syncing|pending/i.test(text)) break;
  }
  console.log('    ', text.replace(/\n+/g, ' | '));
  await section('ha').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await c.shot(`${ID}/15-ha-on`, { locator: '[data-settings-section=ha]' });
}

if (SECTIONS.includes('vars')) {
  console.log('vars: nginx → Variables (the add-on\'s injected names)');
  await canvas();
  await page.getByText('nginx', { exact: true }).first().click();
  await page.getByRole('tab', { name: 'Variables' }).click();
  await page.getByText('Provided by add-on').first().waitFor({ timeout: 30000 });
  // Scroll to the add-on's variables (the last injected ones, e.g. REDIS_HOST).
  const target = process.env.VAR ?? 'REDIS_HOST';
  const found = await page.evaluate((name) => {
    const el = [...document.querySelectorAll('input')].find((i) => i.value === name);
    el?.scrollIntoView({ block: 'center' });
    return !!el;
  }, target);
  if (!found) throw new Error(`no ${target} variable on nginx`);
  await page.waitForTimeout(1200);
  await c.shot(`${ID}/7-variables`);
}

if (SECTIONS.includes('hastatus')) {
  console.log('hastatus: wait for HA to finish, then capture');
  let text = '';
  for (const until = Date.now() + 25 * 60000; Date.now() < until; ) {
    await openDb('Settings');
    text = await section('ha').innerText();
    if (/Healthy/.test(text) && !/Promoting|NotReady|progress/i.test(text)) break;
    await page.waitForTimeout(30000);
  }
  console.log('    ', text.replace(/\n+/g, ' | '));
  await section('ha').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await c.shot(`${ID}/15-ha-on`, { locator: '[data-settings-section=ha]' });
}

await c.done();
