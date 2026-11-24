// The sandbox sheet: every control.  SECTIONS=comma list (see below).
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-bmme';
const SECTIONS = (process.env.SECTIONS ?? 'list').split(',');
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2500);
const controls = (l) => l.locator('button, a, [role=tab], [role=combobox], [role=switch], [role=radio], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? e.getAttribute('title') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 50)}${e.disabled ? ' [disabled]' : ''}${e.tagName === 'A' ? ' href=' + (e.getAttribute('href') || '').replace(/\?.*/, '').slice(0, 60) : ''}`));
async function sheet() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  const m = page.getByRole('button', { name: new RegExp(`^Manage ${process.env.CARD ?? 'docs-sandbox'}$`) }).first();
  await m.waitFor({ timeout: 120000 });
  await m.click({ timeout: 15000 }).catch(() => m.click({ force: true }));
  await page.waitForTimeout(3500);
  return page.locator('[role=dialog]').last();
}
let d = await sheet();
if (SECTIONS.includes('list')) {
  console.log('controls:', JSON.stringify(await controls(d)));
  await c.shot('sandbox/m-sheet');
}
if (SECTIONS.includes('shell')) {
  console.log('shell: Open a shell');
  for (let i = 0; i < 60 && (await d.getByTestId('sandbox-open-shell').isDisabled()); i++) {
    if (i % 6 === 0) console.log('    waiting:', (await text(d)).slice(0, 160));
    await page.waitForTimeout(10000); d = await sheet();
  }
  await d.getByRole('button', { name: 'Open a shell' }).click();
  await page.waitForTimeout(6000);
  const sh = page.locator('[role=dialog]').last();
  console.log('   ', (await text(sh)).slice(0, 500));
  console.log('    controls:', JSON.stringify(await controls(sh)));
  const connect = sh.getByRole('button', { name: /^Connect/ });
  if (await connect.count()) { await connect.first().click(); await page.waitForTimeout(6000); }
  await sh.locator('.xterm-helper-textarea').focus();
  await page.keyboard.type(process.env.CMD ?? 'cd /workspace && echo "hello from the sandbox" > hello.txt && ls -la && node -v && python3 --version && git --version\n', { delay: 35 });
  await page.waitForTimeout(4000);
  console.log('    term:', (await sh.locator('.xterm-rows').innerText()).split('\n').filter(Boolean).slice(-12).join(' | '));
  if (!process.env.CMD) await c.shot('sandbox/m-shell');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
  d = await sheet();
}
if (SECTIONS.includes('ssh')) {
  console.log('ssh: Show SSH setup');
  await d.getByRole('button', { name: 'Show SSH setup' }).click();
  await page.waitForTimeout(1500);
  console.log('   ', (await text(d)).split('Connect from your IDE').pop().slice(0, 900));
  await d.getByText('Connect from your IDE').scrollIntoViewIfNeeded();
  await c.shot('sandbox/m-ssh');
}
if (SECTIONS.includes('vscode')) {
  console.log('vscode: browser IDE');
  // Read the password before any shot (the mask rewrites the page), never print it.
  await d.locator('button[title="Show password"]').click();
  const pwEl = d.getByTestId('sandbox-ide-password');
  let pw = '';
  for (let i = 0; i < 20 && (!pw || /•/.test(pw)); i++) { await page.waitForTimeout(500); pw = (await pwEl.innerText()).trim(); }
  if (!pw || /•/.test(pw)) throw new Error('password not revealed');
  console.log('    password length', pw.length);
  await d.locator('button[title="Hide password"]').click();
  const host = (await d.getByRole('link', { name: /stackblaze\.app/ }).first().getAttribute('href'));
  const ide = await page.context().newPage();
  await ide.setViewportSize({ width: 1280, height: 800 });
  await ide.goto(host, { waitUntil: 'load' });
  await ide.waitForTimeout(3000);
  console.log('    login page:', (await ide.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 200));
  await c.shotPage('sandbox/m-vscode-login', ide, host);
  await ide.locator('input[type=password]').fill(pw);
  await ide.keyboard.press('Enter');
  await ide.waitForTimeout(15000);
  for (const t of ['Yes, I trust the authors', 'Trust']) { const b = ide.getByRole('button', { name: t }); if (await b.count()) { await b.first().click(); await ide.waitForTimeout(2000); } }
  console.log('    ide:', (await ide.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400));
  const f = ide.getByText('hello.txt').first();
  if (await f.count()) { await f.click(); await ide.waitForTimeout(3000); }
  await c.shotPage('sandbox/m-vscode', ide, host);
  await ide.close();
}
if (SECTIONS.includes('openide')) {
  console.log('openide: Open in VS Code button');
  const [tab] = await Promise.all([page.context().waitForEvent('page', { timeout: 20000 }), d.getByTestId('sandbox-open-ide').first().click()]);
  await tab.waitForLoadState('load'); await tab.waitForTimeout(12000);
  console.log('    tab:', new URL(tab.url()).host, (await tab.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 160));
  await tab.close();
}
if (SECTIONS.includes('checkpoint')) {
  console.log('checkpoint: take one');
  await d.getByRole('button', { name: 'Checkpoint', exact: true }).click();
  await page.waitForTimeout(1500);
  const dlg = page.getByRole('dialog').filter({ hasText: 'Label' }).last();
  console.log('   ', await text(dlg));
  await dlg.getByPlaceholder('e.g. deps installed').fill('hello file');
  await c.shot('sandbox/m-checkpoint-dialog', { locator: '[role=dialog]:has-text("Label")' });
  console.log('    buttons:', JSON.stringify(await controls(dlg)));
  await dlg.getByRole('button', { name: /^(Checkpoint|Create|Save)/ }).last().click();
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(5000);
    const t = await text(d);
    if (/Checkpoints 1/.test(t) && !/Creating|Pending|Taking|In progress/i.test(t.split('Checkpoints 1').pop())) break;
  }
  console.log('   ', (await text(d)).split('Checkpoints').pop().slice(0, 500));
  console.log('    list controls:', JSON.stringify(await controls(d.locator('text=Checkpoints').locator('xpath=ancestor::*[3]'))));
  await c.shot('sandbox/m-checkpoints');
}
if (SECTIONS.includes('fork')) {
  console.log('fork: wait for the checkpoint, then fork it');
  let fork = d.locator('[data-testid^=sandbox-fork-]').first();
  for (let i = 0; i < 40 && (await fork.isDisabled()); i++) { await page.waitForTimeout(15000); d = await sheet(); fork = d.locator('[data-testid^=sandbox-fork-]').first(); }
  console.log('    fork enabled:', !(await fork.isDisabled()));
  await fork.click();
  await page.waitForTimeout(1500);
  const dlg = page.getByRole('dialog').filter({ hasText: 'New sandbox name' }).last();
  console.log('   ', await text(dlg));
  await dlg.getByPlaceholder('auto-generated').fill('docs-fork');
  await c.shot('sandbox/m-fork-dialog', { locator: '[role=dialog]:has-text("New sandbox name")' });
  await page.getByTestId('sandbox-fork-confirm').click();
  await page.waitForTimeout(8000);
  console.log('    after:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 600));
  await c.shot('sandbox/m-forked');
}
if (SECTIONS.includes('waitrun')) {
  for (let i = 0; i < 40; i++) { const t = await text(d); if (/^\S+ .*? Running /.test(t) && !/Booting|Waiting for/.test(t)) break; await page.waitForTimeout(10000); d = await sheet(); }
  console.log('    state:', (await text(d)).slice(0, 200));
}
if (SECTIONS.includes('sleep')) {
  console.log('sleep: Sleep, then wake');
  await d.getByRole('button', { name: 'Sleep' }).click();
  await page.waitForTimeout(1500);
  const conf = page.getByRole('alertdialog').or(page.getByRole('dialog').filter({ hasText: /sleep/i })).last();
  if (await conf.count()) console.log('    confirm?', (await text(conf)).slice(0, 300));
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(6000); const t = await text(d); if (/Asleep|Sleeping/.test(t)) break; }
  console.log('   ', (await text(d)).slice(0, 400));
  console.log('    controls:', JSON.stringify((await controls(d)).slice(0, 6)));
  await c.shot('sandbox/m-asleep');
}
if (SECTIONS.includes('wake')) {
  const wake = d.locator('button[title="Boot the sandbox VM again"]');
  console.log('wake:', (await wake.innerText()).trim());
  await wake.click();
  await page.waitForTimeout(4000);
  await c.shot('sandbox/m-waking');
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(8000); d = await sheet(); const t = await text(d); if (/Running/.test(t.slice(0, 200)) && !/Booting|Waiting|Asleep/.test(t.slice(0, 200))) break; }
  console.log('    woke:', (await text(d)).slice(0, 200));
}
if (SECTIONS.includes('resize')) {
  console.log('resize: Small → Medium');
  await d.getByRole('radio', { name: /^Medium/ }).click();
  await page.waitForTimeout(1500);
  const conf = page.getByRole('dialog').filter({ hasText: /restart|Medium|machine/i }).last();
  console.log('    after click:', (await text(page.getByRole('dialog').last())).slice(0, 400));
  await c.shot('sandbox/m-resize');
  const btn = page.getByRole('dialog').last().getByRole('button', { name: /^(Restart|Resize|Change|Apply|Save)/ });
  if (await btn.count()) { console.log('    confirm button:', await btn.first().innerText()); await btn.first().click(); }
  for (let i = 0; i < 50; i++) { await page.waitForTimeout(8000); d = await sheet(); const t = await text(d); if (/2 vCPU · 4 GiB · 20 GiB disk · always on/.test(t) && /Running/.test(t.slice(0, 120))) break; if (i % 5 === 0) console.log('    ...', t.slice(0, 160)); }
  console.log('    now:', (await text(d)).slice(0, 200));
  await c.shot('sandbox/m-resized');
}
if (SECTIONS.includes('delcheckpoint')) {
  console.log('delcheckpoint');
  await d.locator('button[title="Delete checkpoint"]').first().click();
  await page.waitForTimeout(1200);
  console.log('   ', await text(page.getByRole('dialog').filter({ hasText: 'Delete checkpoint?' }).last()));
  await c.shot('sandbox/m-delete-checkpoint', { locator: '[role=dialog]:has-text("Delete checkpoint?")' });
  await page.getByTestId('sandbox-checkpoint-delete-confirm').click();
  await page.waitForTimeout(8000); d = await sheet();
  console.log('    after:', (await text(d)).split('Checkpoints').pop().slice(0, 150));
}
if (SECTIONS.includes('delete')) {
  console.log('delete sandbox', process.env.CARD);
  await d.getByRole('button', { name: 'Delete sandbox' }).click();
  await page.waitForTimeout(1200);
  console.log('   ', await text(page.getByRole('dialog').filter({ hasText: 'Delete sandbox?' }).last()));
  await c.shot('sandbox/m-delete', { locator: '[role=dialog]:has-text("Delete sandbox?")' });
  const resp = page.waitForResponse((r) => r.request().method() === 'DELETE' && /\/api\/sandboxes\//.test(r.url()), { timeout: 60000 });
  await page.getByTestId('sandbox-delete-confirm').click();
  const r = await resp.catch((e) => null);
  console.log('    DELETE', r ? `${r.status()} ${(await r.text()).slice(0, 300)}` : 'no response');
  await page.waitForTimeout(2000);
  console.log('    toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  await page.waitForTimeout(8000);
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(8000);
  console.log('    canvas:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 300));
}
if (SECTIONS.includes('copypw')) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url()).origin });
  await d.locator('button[title="Copy password"]').click();
  await page.waitForTimeout(1000);
  const n = await page.evaluate(async () => (await navigator.clipboard.readText()).length);
  console.log('copypw: clipboard length', n);
  await page.evaluate(() => navigator.clipboard.writeText(''));
}
await c.done();
