// The service sheet's Terminal tab: Connect, run `ls`, Disconnect.
// Runs against nginx-unprivileged in github-demo-kpw0.
import { open } from '../lib.mjs';

// The service sheet as it sits on the Apps view (right half of the canvas).
const SHEET = { x: 566, y: 113, width: 851, height: 764 };

const PROJECT = process.env.CAPTURE_PROJECT ?? 'github-demo-kpw0';
const PHASE = 'dev';
const APP = 'nginx-unprivileged';
const c = await open();
const { page } = c;

await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
await page.getByText(APP, { exact: true }).first().click();
await page.getByRole('tab', { name: /^Terminal/ }).waitFor({ timeout: 20000 });

console.log('1. Terminal tab, before Connect');
await page.getByRole('tab', { name: /^Terminal/ }).click();
await page.getByText('Press Connect to open the shell.').waitFor({ timeout: 30000 }).catch(async (e) => { await page.screenshot({ path: process.env.DBG + '/term-fail.png' }); throw e; });
await page.getByText('Ready', { exact: true }).waitFor();
await c.shot('terminal/1-ready', { clip: SHEET });

console.log('2. Connect');
await page.getByRole('button', { name: 'Connect' }).click();
for (let i = 0; i < 30; i++) {
  const st = (await page.locator('[role=status]').first().innerText()).trim();
  if (/^Connected/.test(st)) break;
  if (/Failed/.test(st) || i === 29) {
    await page.screenshot({ path: (process.env.DBG ?? '/tmp') + '/term-fail.png' });
    throw new Error(`terminal: ${st}`);
  }
  await page.waitForTimeout(1000);
}
await page.waitForTimeout(2500);

console.log('3. Run ls');
await page.locator('.xterm-helper-textarea').focus();
await page.keyboard.type('ls /');
await page.keyboard.press('Enter');
await page.waitForTimeout(2500);
const screen = await page.locator('.xterm-rows').innerText();
console.log(screen.split('\n').filter((l) => l.trim()).slice(-8).join('\n'));
if (!/\bbin\b/.test(screen) || !/\betc\b/.test(screen)) throw new Error('ls output not seen');
await c.shot('terminal/2-ls', { clip: SHEET });

console.log('4. Disconnect');
await page.getByRole('button', { name: 'Disconnect' }).click();
await page.getByRole('button', { name: 'Connect' }).waitFor({ timeout: 15000 });
console.log('   status:', await page.locator('[role=status]').first().innerText());

await c.done();
