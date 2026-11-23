// Everything else on a running PostgreSQL database (made by postgresql.mjs):
// the card, Deployment / Logs / Metrics, Plan limits, Extensions, Public
// access (connected to for real with psql), the CloudBeaver console,
// Storage and HA. SECTIONS=card,tabs,limits,ext,public,console,storage,ha
// picks which to run (default: all); each verifies what it documents.
import { open } from '../lib.mjs';
import { execFileSync } from 'node:child_process';

const PROJECT = process.env.DEMO_PROJECT ?? 'my-first-project-h22a';
const PHASE = 'dev';
const ALL = ['card', 'tabs', 'redeploy', 'limits', 'ext', 'public', 'console', 'storage', 'ha'];
const SECTIONS = (process.env.SECTIONS ?? ALL.join(',')).split(',');
const c = await open();
const { page } = c;
page.on('dialog', (d) => d.accept()); // window.confirm ("Turn off public access?")

const canvas = () => c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
const card = () => ({ around: [page.getByText('DATABASES'), page.getByTestId('canvas-new-service')], pad: 24, extraBottom: 200 });
async function openDb(tab) {
  await canvas();
  await page.getByRole('button', { name: 'Manage PostgreSQL' }).click();
  await page.getByRole('tab', { name: tab }).click();
  await page.waitForTimeout(1500);
}
const section = (name) => page.locator(`[data-settings-section=${name}]`).first();
const toTop = (loc) => loc.evaluate((el) => el.scrollIntoView({ block: 'start' }));
function psql(url, sql) {
  return execFileSync('psql', [url, '-At', '-c', sql], { encoding: 'utf8', timeout: 30000, env: { ...process.env, PGCONNECT_TIMEOUT: '10' } }).trim();
}
async function internalUrl() {
  await openDb('Settings');
  await page.getByText('Connection URL', { exact: true }).click();
  const url = (await page.locator('text=/^postgresql:\\/\\//').first().innerText()).trim();
  await page.getByText('Connection URL', { exact: true }).click();
  return url;
}

if (SECTIONS.includes('card')) {
  console.log('card: instances toggle');
  await canvas();
  await page.locator('[data-testid^=app-card-services-toggle-addon-postgresql]').click();
  await page.locator('text=/^postgresql-[a-z0-9]{4}-1$/').waitFor();
  await c.shot('postgresql/m-card-volume', card());
}

if (SECTIONS.includes('tabs')) {
  console.log('tabs: Deployment');
  await openDb('Deployment');
  await page.getByText('Instance history and restarts for this add-on.').waitFor();
  await c.shot('postgresql/m-deployment');

  console.log('tabs: Logs + its menus');
  await openDb('Logs');
  await page.locator('text=/\\[postgresql-/').first().waitFor({ timeout: 30000 });
  await c.shot('postgresql/m-logs');
  await page.getByText('Live tail', { exact: true }).click();
  await page.getByText('Last 15 minutes').waitFor();
  await c.shot('postgresql/m-logs-range');
  await page.keyboard.press('Escape');
  await page.getByText('App logs', { exact: true }).click();
  await page.getByText('System events').waitFor();
  await c.shot('postgresql/m-logs-source');
  await page.keyboard.press('Escape');

  console.log('tabs: Metrics');
  await openDb('Metrics');
  await page.getByText('open sessions').waitFor({ timeout: 30000 });
  await page.waitForTimeout(2500);
  await c.shot('postgresql/m-metrics');
  await toTop(page.getByText('Workload', { exact: true }));
  await page.waitForTimeout(800);
  await c.shot('postgresql/m-metrics-workload');
  await toTop(page.getByText('Health', { exact: true }));
  await page.waitForTimeout(800);
  await c.shot('postgresql/m-metrics-health');
}

if (SECTIONS.includes('redeploy')) {
  console.log('redeploy: row menu → Inspect Deployment, then Redeploy');
  await openDb('Deployment');
  const deploys = () => page.getByText('Instance history and restarts for this add-on.').locator('xpath=ancestor::*[.//button[@aria-haspopup="menu"]][1]').locator('button[aria-haspopup=menu]');
  const menu = () => deploys().first();
  await menu().click();
  await page.getByRole('menuitem', { name: 'Inspect Deployment' }).waitFor();
  await c.shot('postgresql/m-deploy-menu', { around: [page.getByText('Instance history and restarts for this add-on.'), page.getByRole('menu')], pad: 16 });
  await page.getByRole('menuitem', { name: 'Inspect Deployment' }).click();
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(4000);
  await c.shot('postgresql/m-deploy-inspect');
  await page.keyboard.press('Escape');
  const rowsBefore = await deploys().count();
  await menu().click();
  await page.getByRole('menuitem', { name: 'Redeploy' }).click();
  await page.getByText('restart the add-on with the exact same configuration').waitFor();
  await c.shot('postgresql/m-deploy-redeploy-confirm', { locator: '[role=alertdialog], [role=dialog]' });
  await page.getByRole('button', { name: 'Redeploy', exact: true }).click();
  await page.getByText('Redeploy triggered').waitFor({ timeout: 30000 });
  const until = Date.now() + 5 * 60000;
  let rows = rowsBefore;
  while (Date.now() < until) {
    await page.waitForTimeout(15000);
    await openDb('Deployment');
    rows = await deploys().count();
    const t = await page.getByText('Instance history and restarts for this add-on.').locator('xpath=ancestor::*[.//button[@aria-haspopup="menu"]][1]').innerText();
    if (rows > rowsBefore && /Deploy running/.test(t)) break;
  }
  console.log(`    deploy rows ${rowsBefore} → ${rows}`);
  await page.waitForTimeout(1500);
  await c.shot('postgresql/m-deploy-after-redeploy');
}

if (SECTIONS.includes('limits')) {
  console.log('limits: Plan limits');
  await openDb('Settings');
  await c.shot('postgresql/m-limits', { locator: '[data-settings-section=limits]' });
}

if (SECTIONS.includes('ext')) {
  console.log('ext: enable pg_trgm on database "app"');
  await openDb('Settings');
  const ext = section('extensions');
  await toTop(ext);
  await ext.getByPlaceholder('Filter by name…').fill('pg_trgm');
  const row = ext.locator('li', { has: page.getByText('pg_trgm', { exact: true }) });
  if ((await row.getByText(/^(On|Off)$/).innerText()) === 'Off') {
    await row.getByRole('switch').click();
    await row.getByText('On', { exact: true }).waitFor({ timeout: 60000 });
  }
  await c.shot('postgresql/m-ext-on', { locator: '[data-settings-section=extensions]' });

  console.log('ext: pg_stat_statements (needs restart): dialog → Restart & enable');
  await ext.getByPlaceholder('Filter by name…').fill('pg_stat_statements');
  const pss = ext.locator('li', { has: page.getByText('pg_stat_statements', { exact: true }) });
  if ((await pss.getByText(/^(On|Off)$/).innerText()) === 'On') throw new Error('pg_stat_statements is already on; turn it off first to capture the dialog');
  await c.shot('postgresql/m-ext-restart-row', { locator: '[data-settings-section=extensions]' });
  await pss.getByRole('switch').click();
  await page.getByText('This triggers a rolling restart').waitFor();
  await c.shot('postgresql/m-ext-restart-dialog', { locator: 'div.max-w-md.shadow-xl' });
  await page.getByRole('button', { name: 'Restart & enable' }).click();
  await pss.getByText('On', { exact: true }).waitFor({ timeout: 600000 });
  await c.shot('postgresql/m-ext-restart-on', { locator: '[data-settings-section=extensions]' });
}

if (SECTIONS.includes('public')) {
  const myIp = execFileSync('curl', ['-s', '-4', 'https://api.ipify.org'], { encoding: 'utf8' }).trim();
  if (!process.env.CAPTURE_REPLACE?.includes(myIp)) throw new Error('set CAPTURE_REPLACE="<this IP>=>203.0.113.10" so the IP is not published');
  const url = await internalUrl();
  console.log('public: allow only this machine, turn on');
  await openDb('Settings');
  const pub = page.getByTestId('db-public-access');
  await toTop(pub);
  await pub.getByTestId('db-public-allow').fill(myIp);
  await c.shot('postgresql/m-public-off', { locator: '[data-testid=db-public-access]' });
  await pub.getByTestId('db-public-switch').click();
  await pub.getByTestId('db-public-address').waitFor({ timeout: 120000 });
  const address = (await pub.getByTestId('db-public-address').innerText()).trim();
  await c.shot('postgresql/m-public-on', { locator: '[data-testid=db-public-access]' });

  console.log(`public: connect with psql to ${address}`);
  const u = new URL(url);
  const pubUrl = `postgresql://${u.username}:${u.password}@${address}${u.pathname}?sslmode=require`;
  let out = '';
  for (let i = 0; i < 20 && !out; i++) {
    try { out = psql(pubUrl, "select current_database() || ' ' || split_part(version(), ' ', 2) || ' ' || (select string_agg(extname, ',' order by extname) from pg_extension)"); }
    catch (e) { await page.waitForTimeout(6000); }
  }
  if (!out) throw new Error('could not connect over public access');
  console.log('    psql:', out);

  console.log('public: turn off, check it no longer connects');
  await pub.getByTestId('db-public-switch').click();
  await pub.getByText('Off', { exact: true }).waitFor({ timeout: 60000 });
  await page.waitForTimeout(15000);
  let stillOpen = true;
  try { psql(pubUrl, 'select 1'); } catch { stillOpen = false; }
  console.log('    reachable after Off:', stillOpen);
}

if (SECTIONS.includes('console')) {
  console.log('console: CloudBeaver, run a query');
  await canvas();
  const [cb] = await Promise.all([
    page.context().waitForEvent('page', { timeout: 30000 }),
    page.locator('[data-testid^=app-card-cloudbeaver-addon-postgresql]').click(),
  ]);
  await cb.setViewportSize({ width: 1440, height: 900 });
  await cb.getByText(/^my-first-project-h22a\/dev\/postgresql-/).first().waitFor({ timeout: 60000 });
  await cb.waitForTimeout(3000);
  await c.shotPage('postgresql/m-console', cb, 'CloudBeaver (database link on the card)');
  // CloudBeaver remembers open editor tabs; open one only if none is open.
  if (await cb.getByText('Open SQL Editor').count()) await cb.getByText('Open SQL Editor').click();
  const editor = cb.locator('.cm-content').first();
  await editor.waitFor({ timeout: 30000 });
  if (await cb.getByText('Select connection').count()) {
    await cb.getByText('Select connection').click();
    await cb.getByText(/^my-first-project-h22a\/dev\/postgresql-/).last().click();
    await cb.waitForTimeout(2000);
  }
  await editor.click();
  await cb.keyboard.press('Control+A');
  await cb.keyboard.type('select current_database(), version();');
  await cb.keyboard.press('Control+Enter');
  await cb.getByText(/PostgreSQL 1\d/).first().waitFor({ timeout: 60000 });
  await cb.waitForTimeout(1500);
  await c.shotPage('postgresql/m-console-query', cb, 'CloudBeaver SQL editor');
  await cb.close();
}

if (SECTIONS.includes('storage')) {
  console.log('storage: expand');
  await openDb('Settings');
  const st = section('storage');
  await st.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await c.shot('postgresql/m-storage', { locator: '[data-settings-section=storage]' });
  await st.getByText('Choose a new size').click();
  const opts = page.getByRole('option');
  await opts.first().waitFor();
  console.log('    sizes:', (await opts.allInnerTexts()).join(', '));
  await c.shot('postgresql/m-storage-sizes', { around: [st, opts.last()], pad: 8 });
  const size = (await opts.first().innerText()).trim();
  await opts.first().click();
  await st.getByRole('button', { name: 'Expand', exact: true }).click();
  await page.getByText(/Storage expan/).first().waitFor({ timeout: 60000 });
  console.log('   ', await page.getByText(/Storage expan/).first().innerText());
  // The volume should report the new size once the resize finishes.
  const until = Date.now() + 10 * 60000;
  let txt = '';
  while (Date.now() < until) {
    await openDb('Settings');
    txt = await section('storage').innerText();
    if (txt.includes(size.replace(' Gi', '.0 GiB'))) break;
    await page.waitForTimeout(20000);
  }
  console.log('    after:', txt.split('\n').filter((l) => /GiB|MiB/.test(l)).join(' '));
  await section('storage').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await c.shot('postgresql/m-storage-expanded', { locator: '[data-settings-section=storage]' });
}

if (SECTIONS.includes('ha')) {
  console.log('ha: Enable HA (one-way)');
  await openDb('Settings');
  const ha = section('ha');
  await toTop(ha);
  await c.shot('postgresql/m-ha-off', { locator: '[data-settings-section=ha]' });
  await ha.getByRole('button', { name: 'Enable HA' }).click();
  await page.getByText('Enable high availability?').waitFor();
  await c.shot('postgresql/m-ha-confirm', { locator: '[role=alertdialog], [role=dialog]' });
  await page.getByRole('button', { name: 'Enable HA' }).last().click();
  await page.waitForTimeout(5000);
  const until = Date.now() + 15 * 60000;
  let text = '';
  while (Date.now() < until) {
    await openDb('Settings');
    await toTop(section('ha'));
    text = await section('ha').innerText();
    if (!/Single primary|Enable HA/.test(text) && !/progress|creating|syncing/i.test(text)) break;
    await page.waitForTimeout(20000);
  }
  console.log('   ', text.replace(/\n+/g, ' | '));
  await c.shot('postgresql/m-ha-on', { locator: '[data-settings-section=ha]' });
}

await c.done();
