// MariaDB's SQL console: open it from the card's database address and run
// one query. my-first-project-h22a / dev / mariadb (mariadb-92xp).
import { open } from '../lib.mjs';
import { openConsole } from './_cloudbeaver.mjs';
const INSTANCE = process.env.INSTANCE ?? 'mariadb-92xp';
const c = await open(); const { page } = c;
await c.goto('/pipeline/my-first-project-h22a/apps?phase=dev'); await page.waitForTimeout(4000);
const apps = page.getByRole('button', { name: 'Apps', exact: true }).first(); await apps.waitFor({ timeout: 60000 }).catch(() => {}); await apps.click().catch(() => {}); await page.waitForTimeout(2500);
console.log('console links', JSON.stringify(await page.locator('[data-testid^=app-card-cloudbeaver-]').evaluateAll((e) => e.map((x) => x.getAttribute('data-testid')))));
const con = await openConsole(page, INSTANCE);
await c.shotPage('mariadb/console', con.cb, 'SQL console (database link on the card)');
const out = await con.run('SELECT VERSION() AS version, DATABASE() AS db;');
console.log('result:', out.replace(/\s+/g, ' ').slice(0, 400));
await c.shotPage('mariadb/console-query', con.cb, 'SQL console editor');
await con.close();
await c.done();
