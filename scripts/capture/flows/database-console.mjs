// The database console (CloudBeaver): open it from a database card, browse the
// navigator, run a script and a query, explain it, edit a row, export a result
// set, and the message when the console's session is missing.
//
// Runs on a temporary PostgreSQL created for this page (github-demo-cw8z /
// stage / postgresql-f7jq by default) and deleted afterwards. Never point it
// at a database with real data: it drops and recreates `customers` and
// `orders`.
import { open } from '../lib.mjs';

const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const PHASE = process.env.PHASE ?? 'stage';
const INSTANCE = process.env.INSTANCE ?? 'postgresql-f7jq';
const CONN = `${PROJECT}/${PHASE}/${INSTANCE}`;
const c = await open();
const { page } = c;

// The console is another site: the lib's shot() masking only runs on the
// dashboard page, so apply the same CAPTURE_MASK replacement here first.
const MASK = (process.env.CAPTURE_MASK ?? '').split(',').filter(Boolean);
async function shot(cb, id, what) {
  await cb.evaluate((words) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      let t = n.nodeValue;
      for (const w of words) if (t.includes(w)) t = t.split(w).join('you@example.com');
      if (t !== n.nodeValue) n.nodeValue = t;
    }
    for (const el of document.querySelectorAll('[title]')) {
      let t = el.getAttribute('title');
      for (const w of words) if (t.includes(w)) t = t.split(w).join('you@example.com');
      el.setAttribute('title', t);
    }
  }, MASK);
  await cb.waitForTimeout(400);
  await c.shotPage(id, cb, what);
}
const title = (cb, t) => cb.locator(`[title="${t}"]`).first();

console.log('1. The database card links to its console');
await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
await page.getByTestId('canvas-new-service').waitFor({ timeout: 90000 });
await page.getByRole('button', { name: 'Apps', exact: true }).first().click().catch(() => {});
const link = page.locator(`[data-testid^=app-card-cloudbeaver-][data-testid$="-${INSTANCE}"]`).first();
await link.waitFor({ timeout: 90000 });
await page.waitForTimeout(2000);
await c.shot('console/1-card', { around: [link, page.getByText('PostgreSQL', { exact: true }).first()], pad: 40, extraBottom: 40 });

console.log('1b. The card menu has Open SQL console too');
await page.getByText('PostgreSQL', { exact: true }).first().click({ button: 'right' });
const cardMenu = page.locator('[role=menu]').last();
await cardMenu.getByText('Open SQL console').waitFor();
await c.shot('console/1-card-menu', { locator: '[role=menu]' });
const [viaMenu] = await Promise.all([page.context().waitForEvent('page', { timeout: 90000 }), cardMenu.getByText('Open SQL console').click()]);
await viaMenu.getByText(CONN).first().waitFor({ timeout: 90000 });
console.log('   Open SQL console opened', new URL(viaMenu.url()).host);
await viaMenu.close();

console.log('2. Click it → the console opens in a new tab');
const [cb] = await Promise.all([page.context().waitForEvent('page', { timeout: 90000 }), link.click()]);
await cb.setViewportSize({ width: 1440, height: 900 });
await cb.getByText(CONN).first().waitFor({ timeout: 90000 });
await cb.getByText('Open SQL Editor').first().waitFor();
await cb.waitForTimeout(2000);
await shot(cb, 'console/2-start', 'Database console: Start page');

console.log('3. The connection menu');
await cb.getByText(CONN).first().click({ button: 'right' });
await cb.getByRole('menuitem', { name: 'Connection info' }).waitFor();
await cb.getByText('Connection view').hover();
await cb.getByText('Show system objects').waitFor();
await shot(cb, 'console/3-connection-menu', 'Connection menu');
await cb.keyboard.press('Escape'); await cb.keyboard.press('Escape');

console.log('4. Connection info (read-only for a Shared connection)');
await cb.getByText(CONN).first().click({ button: 'right' });
await cb.getByRole('menuitem', { name: 'Connection info' }).click();
await cb.getByText('Connection name').waitFor();
await cb.waitForTimeout(1000);
await shot(cb, 'console/4-connection-info', 'Connection info');
await cb.getByRole('button', { name: /cancel/i }).first().click();
await cb.waitForTimeout(800);

console.log('5. Open a SQL editor on the app database and run a script');
await title(cb, 'Expand').click();
await title(cb, 'app').waitFor({ timeout: 60000 });
await title(cb, 'app').click({ button: 'right' });
await cb.getByRole('menuitem', { name: /SQL Editor/ }).first().click();
const editor = cb.locator('.cm-content').first();
await editor.waitFor({ timeout: 30000 });
await editor.click();
const script = [
  'DROP TABLE IF EXISTS orders, customers;',
  'CREATE TABLE customers (id serial PRIMARY KEY, name text NOT NULL, country text NOT NULL);',
  'CREATE TABLE orders (id serial PRIMARY KEY, customer_id int REFERENCES customers(id), total numeric(10,2) NOT NULL, created_at date NOT NULL);',
  "INSERT INTO customers (name, country) SELECT 'Customer ' || g, (ARRAY['CA','US','FR','DE'])[1 + g % 4] FROM generate_series(1, 20) g;",
  "INSERT INTO orders (customer_id, total, created_at) SELECT 1 + g % 20, 10 + (g * 37) % 490, date '2026-10-01' + g % 50 FROM generate_series(1, 120) g;",
].join('\n');
await cb.keyboard.press('Control+A');
await cb.keyboard.insertText(script);
await cb.keyboard.press('Alt+X');
await cb.getByText(/Executed queries: 5 \/ 5/).waitFor({ timeout: 60000 });
await cb.waitForTimeout(1000);
await shot(cb, 'console/5-script', 'Execute SQL Script: Statistics');

console.log('6. The navigator shows the new tables');
await title(cb, 'Refresh').click().catch(() => {});
await cb.waitForTimeout(2000);
// A node's expander: the nearest element around its label that holds one.
const expander = (name) => cb.locator(`[title="${name}"]`).first().locator('xpath=ancestor::*[.//*[@title="Expand" or @title="Collapse"]][1]').locator('[title="Expand"], [title="Collapse"]').first();
await expander('app').click();
await title(cb, 'public').waitFor({ timeout: 30000 });
await expander('public').click();
await title(cb, 'customers').waitFor({ timeout: 30000 });
await cb.waitForTimeout(1000);
await shot(cb, 'console/6-navigator', 'Navigator: app → public → customers, orders');

console.log('7. Navigator settings');
await cb.locator('[title="Settings"]:visible').first().click();
await cb.getByText('Show table elements').waitFor();
await shot(cb, 'console/7-navigator-settings', 'Navigator settings');
await cb.locator('[title="Settings"]:visible').first().click();
await cb.waitForTimeout(800);

console.log('8. Run a query → result grid');
await editor.click();
await cb.keyboard.press('Control+A');
await cb.keyboard.insertText('SELECT c.name, c.country, count(o.id) AS orders, sum(o.total) AS total\nFROM customers c JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id ORDER BY total DESC;');
await cb.keyboard.press('Control+Enter');
await cb.getByText(/Executed - /).first().waitFor({ timeout: 60000 });
await cb.waitForTimeout(1500);
await shot(cb, 'console/8-result', 'Execute SQL Statement: Result');

console.log('9. Explain execution plan');
await title(cb, 'Explain execution plan (SHIFT + CTRL + E)').click();
await cb.getByText('Execution plan - 1').waitFor({ timeout: 60000 });
await cb.getByText('NODE TYPE').first().waitFor();
await cb.waitForTimeout(1500);
await shot(cb, 'console/9-explain', 'Explain execution plan');

console.log('10. Edit a row and save it');
await editor.click();
await cb.keyboard.press('Control+A');
await cb.keyboard.insertText('SELECT * FROM customers ORDER BY id;');
await cb.keyboard.press('Control+Enter');
await cb.getByText('Customer 1', { exact: true }).first().waitFor({ timeout: 60000 });
await cb.waitForTimeout(1500);
await cb.getByText('Customer 1', { exact: true }).first().dblclick();
await cb.waitForTimeout(800);
await cb.keyboard.press('Control+A');
await cb.keyboard.type('Northwind Café');
await cb.keyboard.press('Enter');
await cb.waitForTimeout(1000);
await shot(cb, 'console/10-edited', 'Result grid: a changed cell, SAVE enabled');
await title(cb, 'Save (CTRL + SHIFT + S)').click();
await cb.waitForTimeout(3000);
await editor.click();
await cb.keyboard.press('Control+A');
await cb.keyboard.insertText('SELECT * FROM customers WHERE id = 1;');
await cb.keyboard.press('Control+Enter');
await cb.getByText('Northwind Café', { exact: true }).first().waitFor({ timeout: 60000 });
console.log('   saved: row 1 reads "Northwind Café"');

console.log('11. Export a result set');
await editor.click();
await cb.keyboard.press('Control+A');
await cb.keyboard.insertText('SELECT * FROM customers ORDER BY id;');
await cb.keyboard.press('Control+Enter');
await cb.waitForTimeout(3000);
await title(cb, 'Export result set as a file').click();
await cb.getByText('Export to CSV file(s)').waitFor();
await cb.waitForTimeout(800);
await shot(cb, 'console/11-export-formats', 'Export data: formats');
await cb.getByText('Export to CSV file(s)').click();
await cb.getByText('Export configuration (CSV)').waitFor();
await cb.waitForTimeout(800);
await shot(cb, 'console/12-export-format', 'Export configuration (CSV): FORMAT');
await cb.getByRole('button', { name: /^next$/i }).click();
await cb.getByText('Insert BOM').waitFor();
await shot(cb, 'console/13-export-output', 'Export configuration (CSV): OUTPUT');
await cb.getByRole('button', { name: /^export$/i }).last().click();
await cb.getByText('File is ready to download').waitFor({ timeout: 60000 });
await cb.waitForTimeout(800);
await shot(cb, 'console/14-export-ready', 'File is ready to download');
const download = cb.waitForEvent('download', { timeout: 60000 });
await cb.getByText(/^download$/i).last().click();
const file = await download;
const consoleOrigin = new URL(cb.url()).origin;
console.log('   downloaded', file.suggestedFilename());
await cb.close();

console.log('15. The console address without a session');
const fresh = await page.context().browser().newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
const bare = await fresh.newPage();
await bare.goto(consoleOrigin + '/', { waitUntil: 'load' });
await bare.getByText(/session missing or expired/).waitFor({ timeout: 30000 });
await shot(bare, 'console/15-no-session', 'Console address opened directly');
await fresh.close();

// Save the manifest and close only the context this flow opened (lib's
// done() would also call browser.close()).
c.checkpoint();
await page.context().close();
process.exit(0);
