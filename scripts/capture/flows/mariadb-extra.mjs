// MariaDB beyond the common database flow: the instance kept for rollback
// after HA, plugin libraries (installed, then checked over SQL), and public
// access (connected to for real from an allowed IP, then turned off).
//   INSTANCE=<ha instance> OLD=<rollback instance> MYSQL2=<path to mysql2>
import { open } from '../lib.mjs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const PROJECT = process.env.DEMO_PROJECT ?? 'my-first-project-h22a';
const INSTANCE = process.env.INSTANCE;
const OLD = process.env.OLD;
const mysql = createRequire(import.meta.url)(`${process.env.MYSQL2}/promise`);
const PLUGIN = process.env.PLUGIN ?? 'ha_archive';
const c = await open();
const { page } = c;
page.on('dialog', (d) => d.accept());
const cardOf = (i) => page.locator(`[data-testid="app-card-addon-${i}"], [data-testid="app-card-canvas-group-${i}"]`).first();
async function settings(i) {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await cardOf(i).getByRole('button', { name: 'Manage MariaDB' }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.waitForTimeout(3000);
}
const section = (n) => page.locator(`[data-settings-section=${n}]`).first();

// Credentials for the test connection, read from a freshly loaded panel
// before any screenshot (the capture mask blanks passwords in the page).
await settings(INSTANCE);
await page.getByText('Connection URL', { exact: true }).click();
const url = new URL((await page.locator('text=/^mysql:\\/\\//').first().innerText()).trim());
if (/•/.test(decodeURIComponent(url.password))) throw new Error('read a masked password');

if (OLD) {
  console.log('1. The instance kept for rollback');
  await settings(OLD);
  await section('ha').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await c.shot('mariadb/16-rollback', { locator: '[data-settings-section=ha]' });
}

console.log(`2. Extensions → install ${PLUGIN}`);
await settings(INSTANCE);
const ext = section('extensions');
await ext.evaluate((el) => el.scrollIntoView({ block: 'start' }));
await ext.getByPlaceholder(/Filter/).fill(PLUGIN);
const row = ext.locator('li').filter({ hasText: PLUGIN }).first();
await row.waitFor();
await c.shot('mariadb/17-plugin-off', { locator: '[data-settings-section=extensions]' });
if (!/\bOn\b/.test(await row.innerText())) {
  await row.getByRole('switch').click();
  await row.getByText('On', { exact: true }).waitFor({ timeout: 120000 });
}
await c.shot('mariadb/18-plugin-on', { locator: '[data-settings-section=extensions]' });

c.checkpoint();
console.log('3. Public access: this machine only → on');
const myIp = execFileSync('curl', ['-s', '-4', 'https://api.ipify.org'], { encoding: 'utf8' }).trim();
if (!process.env.CAPTURE_REPLACE?.includes(myIp)) throw new Error('set CAPTURE_REPLACE="<this IP>=>203.0.113.10"');
const pub = page.getByTestId('db-public-access');
await pub.evaluate((el) => el.scrollIntoView({ block: 'start' }));
if (!(await pub.getByTestId('db-public-address').count())) {
  await pub.getByTestId('db-public-allow').fill(myIp);
  await pub.getByTestId('db-public-switch').click();
}
await pub.getByTestId('db-public-address').waitFor({ timeout: 120000 });
const address = (await pub.getByTestId('db-public-address').innerText()).trim();
await c.shot('mariadb/19-public-on', { locator: '[data-testid=db-public-access]' });

c.checkpoint();
console.log(`4. Connect over TLS to ${address}`);
const [host, port] = address.split(':');
const cfg = { host, port: Number(port), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), ssl: { rejectUnauthorized: false }, connectTimeout: 10000 };
let rows;
let lastErr = '';
// The address can take a few minutes to start accepting connections.
for (let i = 0; i < 50 && !rows; i++) {
  try {
    const conn = await mysql.createConnection(cfg);
    [rows] = await conn.query(`select version() v, database() d, (select plugin_status from information_schema.plugins where plugin_library = ?) p`, [`${PLUGIN}.so`]);
    await conn.end();
    console.log(`    connected after ${i} retries`);
  } catch (e) { lastErr = `${e.code ?? ''} ${String(e.message).slice(0, 120)}`; await page.waitForTimeout(6000); }
}
if (!rows) throw new Error(`could not connect over public access: ${lastErr}`);
console.log('    ', JSON.stringify(rows[0]));
if (rows[0].p !== 'ACTIVE') throw new Error(`${PLUGIN} is not active`);

console.log('5. Turn it off → no longer reachable');
await pub.getByTestId('db-public-switch').click();
await pub.getByText('Off', { exact: true }).waitFor({ timeout: 60000 });
await page.waitForTimeout(15000);
let reachable = true;
try { const conn = await mysql.createConnection(cfg); await conn.end(); } catch { reachable = false; }
console.log('    reachable after Off:', reachable);

await c.done();
