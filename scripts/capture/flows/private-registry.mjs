// Settings → Private registry, performed end to end on dev with a throwaway,
// password-protected registry (a `registry:2` app in the project) holding
// one pushed image:
//   STEP=fail    Settings → Private registry (empty), then + Service → Docker
//                image with the private image: the picker's "Private image?"
//                link, Deploy, and the "Couldn't pull the image" card.
//   STEP=failshot  The failure card on the Deployment tab; its link opens
//                Settings → Private registry in a new tab.
//   STEP=login   Add registry login: the form, its checks, Save → Password:
//                Set, Edit (password blank), a host change asking for the
//                password again.
//   STEP=redeploy  Manual Deploy → Deploy latest reference → Running.
//   STEP=remove  Remove → its confirm dialog → the empty state again.
//   STEP=after   With the login removed, Deploy latest reference again: the
//                new pod can't pull, the card shows Failed.
// Run in that order. The registry app and the pushed image are prepared
// outside this flow (see the page's report); the app `hello` is deleted after.
// The password is read from REGISTRY_PASSWORD_FILE and only typed into the
// password box (masked by the capture lib); it is never printed.
import fs from 'node:fs';
import { open } from '../lib.mjs';

const STEP = process.env.STEP ?? 'fail';
const PROJECT = process.env.PROJECT ?? 'github-demo-gv35';
const PHASE = 'dev';
const HOST = process.env.REGISTRY_HOST; // the registry app's stackblaze.app host
const USER = process.env.REGISTRY_USER ?? 'docs';
const IMAGE = `${HOST}/docs/hello:1`;
if (!HOST) throw new Error('set REGISTRY_HOST');

const c = await open();
const { page } = c;
// Close the Ask Agent side panel (in this capture context only), so shots
// show the page alone.
const goto0 = c.goto.bind(c);
c.goto = async (p) => {
  await goto0(p);
  const close = page.getByRole('button', { name: 'Close assistant panel' });
  if (await close.isVisible().catch(() => false)) { await close.click(); await page.waitForTimeout(800); }
};
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
const card = () => page.getByTestId('registry-login-card');

async function openRegistrySettings() {
  await c.goto('/');
  await page.getByRole('button', { name: 'Settings' }).or(page.getByRole('link', { name: 'Settings' })).first().click();
  await page.waitForURL(/\/settings\/general/);
  await page.getByText('Private registry', { exact: true }).first().click();
  await page.waitForURL(/\/settings\/registry/);
  await card().waitFor();
  await page.getByText('Loading…').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
}
const header = () => page.getByRole('heading', { name: 'Private registry' }).first();

if (STEP === 'fail') {
  console.log('1. Settings → Private registry (no login yet)');
  await openRegistrySettings();
  console.log('   ', await text(card()));
  await page.getByTestId('registry-login-empty').waitFor();
  await c.shot('registry/1-empty', { around: [header(), card()], pad: 24 });

  console.log('2. + Service → Docker image');
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
  await page.getByTestId('canvas-new-service').click();
  await page.getByText('Run a public or private image').click();
  await page.waitForTimeout(2500);
  const d = page.locator('[role=dialog]').last();
  console.log('   ', await text(d));
  const input = d.getByPlaceholder(/^Search Docker Hub or paste a reference/);
  await input.fill(IMAGE);
  await page.waitForTimeout(2500);
  console.log('    after paste:', await text(d));
  await input.press('Enter');
  await page.waitForTimeout(4000);
  // The staged card (hub-hello). An unattached volume card in this project
  // is drawn on the same spot, so the click goes to the node itself.
  for (let i = 0; i < 10; i++) {
    if (await page.getByRole('button', { name: /^Deploy/ }).count()) break;
    await page.locator('[data-id=hub-hello]').dispatchEvent('click');
    await page.waitForTimeout(3000);
  }
  const sheet = page.locator('[role=dialog]').last();
  console.log('3. review:', await text(sheet));
  console.log('    hints in review:', await sheet.getByTestId('private-registry-hint').count());
  const hint = sheet.getByTestId('private-registry-hint').first();
  await hint.waitFor();
  console.log('    hint:', await hint.innerText(), '→', await hint.getAttribute('href'), await hint.getAttribute('target'));
  await c.shot('registry/2-review-hint', { locator: '[role=dialog]' });
  await sheet.getByRole('button', { name: 'Runtime' }).click();
  await page.waitForTimeout(1200);
  const port = sheet.getByLabel(/^Port/).first();
  console.log('    runtime:', (await text(sheet)).split('Runtime')[1]?.slice(0, 300), 'port value', await port.inputValue().catch(() => '?'));
  if ((await port.inputValue().catch(() => '')) !== '80') await port.fill('80');
  if (process.env.NO_DEPLOY) { await c.done(); process.exit(0); }
  console.log('4. Deploy');
  await sheet.getByRole('button', { name: /^Deploy/ }).first().click();
  await page.waitForTimeout(15000);
  c.checkpoint();
  console.log('5. wait for the pull to fail');
  let body = '';
  for (let i = 0; i < 30; i++) {
    await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
    body = await text(page.locator('[data-id^=hub-hello]').first()).catch(() => '');
    console.log('    card:', body);
    if (/fail|error|pull|crash/i.test(body)) break;
    await page.waitForTimeout(8000);
  }
}

async function openApp(tab) {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
  const node = page.locator('[data-id^=hub-hello]').first();
  await node.waitFor({ timeout: 60000 });
  await node.dispatchEvent('click');
  await page.waitForTimeout(2500);
  if (tab) {
    await page.locator('button,[role=tab],a').filter({ hasText: new RegExp(`^${tab}`) }).first().click();
    await page.waitForTimeout(3000);
  }
}

async function shotFailure(id) {
  await openApp('Deployment');
  const note = page.getByText('Couldn’t pull the image').first();
  await note.waitFor({ timeout: 30000 });
  const entry = page.getByText(/^Deploy failed/).first();
  const box = note.locator('xpath=ancestor::div[contains(@class,"border")][1]');
  await c.shot(id, { around: [entry, box, page.getByText('First Deploy').first(), page.getByRole('button', { name: 'Diagnose' }).first()], pad: 20 });
}

if (STEP === 'failshot') {
  await shotFailure('registry/3-pull-failed');
  const [tab] = await Promise.all([
    page.context().waitForEvent('page'),
    page.getByTestId('private-registry-hint').first().click(),
  ]);
  await tab.waitForLoadState('load');
  console.log('    link opened a new tab at', new URL(tab.url()).pathname);
  await tab.close();
  await page.getByRole('button', { name: /Manual Deploy/ }).click();
  await page.waitForTimeout(1200);
  console.log('manual deploy menu:', await text(page.locator('[role=menu]').last()));
  await page.keyboard.press('Escape');
  await page.locator('button,[role=tab],a').filter({ hasText: /^Logs/ }).first().click();
  await page.waitForTimeout(5000);
  console.log('logs:', (await text(page.locator('[data-slot=sheet-content]').last())).slice(0, 600));
  console.log('hints in logs:', await page.getByTestId('private-registry-hint').count());
}

if (STEP === 'login') {
  const pw = fs.readFileSync(process.env.REGISTRY_PASSWORD_FILE, 'utf8').trim();
  console.log('6. Add registry login → the form');
  await openRegistrySettings();
  await page.getByTestId('registry-login-add').click();
  const form = page.getByTestId('registry-login-form');
  await form.waitFor();
  console.log('   ', await text(card()));
  console.log('    password type', await page.getByTestId('registry-password').getAttribute('type'), 'placeholder', JSON.stringify(await page.getByTestId('registry-password').getAttribute('placeholder')));
  await c.shot('registry/4-form', { around: [header(), card()], pad: 24 });

  console.log('7. Save login with nothing filled in');
  await page.getByTestId('registry-login-save').click();
  await page.waitForTimeout(800);
  console.log('   ', await text(card()));
  await c.shot('registry/5-form-errors', { locator: '[data-testid=registry-login-card]' });

  console.log('7b. A host that is not a host name, a user name with a colon');
  await page.getByTestId('registry-host').fill('not a host');
  await page.getByTestId('registry-username').fill('a:b');
  await page.waitForTimeout(500);
  console.log('   ', await text(card()));

  console.log('8. Fill in and save');
  await page.getByTestId('registry-host').fill(HOST);
  await page.getByTestId('registry-username').fill(USER);
  await page.getByTestId('registry-password').fill(pw);
  await c.shot('registry/6-form-filled', { locator: '[data-testid=registry-login-card]' });
  await page.getByTestId('registry-login-save').click();
  await page.getByTestId('registry-login-summary').waitFor({ timeout: 20000 });
  const toast = page.locator('[data-sonner-toast]').first();
  await toast.waitFor({ timeout: 5000 }).catch(() => {});
  console.log('    toast:', await toast.innerText().catch(() => '(none)'));
  console.log('   ', await text(card()));
  await c.shot('registry/7-saved', { around: [header(), card()], pad: 24 });
  c.checkpoint();

  console.log('9. Edit: the password box starts empty');
  await page.getByTestId('registry-login-edit').click();
  await form.waitFor();
  console.log('    host', await page.getByTestId('registry-host').inputValue(), 'pw empty', (await page.getByTestId('registry-password').inputValue()) === '', 'placeholder', await page.getByTestId('registry-password').getAttribute('placeholder'));
  await c.shot('registry/8-edit', { locator: '[data-testid=registry-login-card]' });

  console.log('10. Change the host: the password is asked for again');
  await page.getByTestId('registry-host').fill('registry.example.com:5000');
  await page.waitForTimeout(400);
  console.log('    placeholder now', JSON.stringify(await page.getByTestId('registry-password').getAttribute('placeholder')));
  await page.getByTestId('registry-login-save').click();
  await page.waitForTimeout(800);
  console.log('   ', await text(card()));
  await c.shot('registry/9-host-changed', { locator: '[data-testid=registry-login-card]' });
  console.log('11. Cancel');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByTestId('registry-login-summary').waitFor();
  console.log('   ', await text(card()));
}

if (STEP === 'redeploy') {
  console.log('12. Manual Deploy → Deploy latest reference');
  await openApp('Deployment');
  await page.getByRole('button', { name: /Manual Deploy/ }).click();
  await page.waitForTimeout(1000);
  await c.shot('registry/10-manual-deploy', { around: ['button:has-text("Manual Deploy")', page.locator('[role=menu]').last()], pad: 16 });
  await page.getByRole('menuitem', { name: /Deploy latest reference/ }).click();
  await page.waitForTimeout(2000);
  const dlg = page.locator('[role=alertdialog], [data-slot=dialog-content]').last();
  if (await dlg.count()) console.log('    dialog:', await text(dlg));
  let body = '';
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(10000);
    await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
    body = await text(page.locator('[data-id^=hub-hello]').first()).catch(() => '');
    console.log('    card:', body);
    if (/Running/.test(body)) break;
  }
  const node = page.locator('[data-id^=hub-hello]').first();
  await c.shot('registry/11-running', { locator: '[data-id^=hub-hello]' });
  await openApp('Deployment');
  console.log('   ', (await text(page.locator('[data-slot=sheet-content]').last())).slice(0, 500));
  await c.shot('registry/12-deployed', { around: [page.getByText(/^Deploy running/).first(), page.getByText('Redeploy', { exact: true }).first(), page.getByText(/^Deploy failed/).first()], pad: 24 });
}

if (STEP === 'remove') {
  console.log('13. Remove → confirm');
  await openRegistrySettings();
  await page.getByTestId('registry-login-remove').click();
  const dlg = page.locator('[role=alertdialog], [data-slot=dialog-content], [data-slot=alert-dialog-content]').last();
  await dlg.waitFor();
  console.log('   ', await text(dlg));
  await c.shot('registry/13-remove-confirm', { locator: '[role=alertdialog], [data-slot=dialog-content], [data-slot=alert-dialog-content]' });
  await dlg.getByRole('button', { name: 'Remove', exact: true }).click();
  await page.getByTestId('registry-login-empty').waitFor({ timeout: 20000 });
  const toast = page.locator('[data-sonner-toast]').first();
  console.log('    toast:', await toast.innerText().catch(() => '(none)'));
  console.log('   ', await text(card()));
}

if (STEP === 'after') {
  // After Remove: the app that already pulled the image, then a redeploy.
  await openApp('Deployment');
  console.log('    before:', (await text(page.locator('[data-slot=sheet-content]').last())).slice(0, 300));
  await page.getByRole('button', { name: /Manual Deploy/ }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('menuitem', { name: process.env.ACTION ?? /Deploy latest reference/ }).click();
  let body = '';
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(10000);
    await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
    body = await text(page.locator('[data-id^=hub-hello]').first()).catch(() => '');
    console.log('    card:', body);
    if (i > 6 && /Failed/.test(body)) break;
  }
  await openApp('Deployment');
  console.log('    after:', (await text(page.locator('[data-slot=sheet-content]').last())).slice(0, 700));
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
  await c.shot('registry/14-after-remove', { locator: '[data-id^=hub-hello]' });
}

if (STEP === 'inspect') {
  await openApp(process.env.TAB);
  const sh = page.locator('[data-slot=sheet-content]').last();
  console.log(await text(sh));
  console.log('hints:', await page.getByTestId('private-registry-hint').count());
}

await c.done();
