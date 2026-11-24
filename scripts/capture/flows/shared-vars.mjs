// Shared variables: create a group in Project settings → Shared variables,
// link it to nginx from Variables → Shared, deploy, check the app has it,
// then unlink it, deploy, and delete the group again.
// Runs in github-demo-gv35 (dev) and leaves it as it was.
import { open } from '../lib.mjs';

const PROJECT = process.env.CAPTURE_PROJECT ?? 'github-demo-gv35';
const PHASE = 'dev';
const APP = 'nginx';
const GROUP = 'docs-shared';
const c = await open();
const { page } = c;
// A page with staged changes asks before it unloads (beforeunload).
page.on('dialog', (d) => { console.log('   page dialog:', d.type(), d.message()); d.accept().catch(() => {}); });
const SHEET = { x: 566, y: 113, width: 851, height: 764 };
const flat = (s) => s.replace(/\s+/g, ' ').trim();

const appGroups = () => page.evaluate(async ([p, ph, a]) => {
  const ps = await (await fetch(`/api/pipelines/${p}/apps`)).json();
  const app = (ps.phases || []).find((x) => x.name === ph).apps.find((x) => x.name === a || x.displayName === a);
  const d = await (await fetch(`/api/apps/${p}/${ph}/${app.name}`)).json();
  return d.spec.envGroups || d.spec.envVarGroups || [];
}, [PROJECT, PHASE, APP]);

// Wait until nginx has rolled out: no Irreconcilable condition and only
// Running, non-terminating web instances (one revision).
async function waitRolledOut() {
  for (let i = 0; i < 90; i++) {
    const st = await page.evaluate(async ([p, ph, a]) => {
      const ps = await (await fetch(`/api/pipelines/${p}/apps`)).json();
      const app = (ps.phases || []).find((x) => x.name === ph).apps.find((x) => x.name === a || x.displayName === a);
      const d = await (await fetch(`/api/apps/${p}/${ph}/${app.name}`)).json();
      const irr = (d.status?.conditions || []).some((c) => c.type === 'Irreconcilable' && c.status === 'True');
      const pods = (await (await fetch(`/api/apps/${p}/${ph}/${app.name}/pods`)).json()).filter((x) => /-web-/.test(x.name));
      const revs = new Set(pods.map((x) => x.name.split('-web-')[1].split('-')[0]));
      return { irr, ok: pods.length > 0 && revs.size === 1 && pods.every((x) => x.status === 'Running' && !x.terminating) };
    }, [PROJECT, PHASE, APP]);
    if (st.irr) throw new Error(`${APP} is Irreconcilable`);
    if (st.ok && i > 2) return;
    await page.waitForTimeout(4000);
  }
  throw new Error(`${APP} did not roll out`);
}

async function openSettings() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
  await page.getByRole('button', { name: PROJECT }).first().click();
  await page.getByText('Project settings', { exact: true }).click();
  await page.getByText('Shared variables', { exact: true }).first().click();
  await page.getByTestId('add-group').waitFor({ timeout: 20000 });
  console.log('   url:', new URL(page.url()).pathname);
  await page.waitForTimeout(1500);
}
async function openVariablesShared() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
  await page.getByText(APP, { exact: true }).first().click();
  await page.getByRole('tab', { name: /^Variables/ }).click();
  await page.getByText('Environment Variables').waitFor();
  await page.getByRole('button', { name: /^Shared/ }).click();
  await page.getByText('Link project-wide groups').waitFor();
  await page.waitForTimeout(800);
}
async function commitAndDeploy(message) {
  await page.getByRole('button', { name: /Commit 1 change/ }).waitFor({ timeout: 15000 }).catch(async (e) => {
    await page.screenshot({ path: (process.env.DBG ?? '/tmp') + '/sv-fail.png' });
    throw e;
  });
  await page.getByRole('button', { name: /Commit 1 change/ }).click();
  const dlg = page.locator('[role=dialog]').filter({ hasText: '1 change to apply' }).last();
  await dlg.getByText('1 change to apply').waitFor();
  console.log('   commit dialog:', flat(await dlg.innerText()));
  await page.getByPlaceholder('How these releases appear in the history').fill(message);
  return dlg;
}

async function unlinkAndDeploy() {
console.log('8. Clean up: unlink, deploy');
  // Right after a deploy the panel can reload the service and put the box
  // back; retry until the untick is staged.
  for (let attempt = 1; ; attempt++) {
    await openVariablesShared();
    const box = page.locator('label').filter({ hasText: GROUP }).locator('input[type=checkbox]');
    if (await box.isChecked()) await box.click();
    await page.waitForTimeout(2500);
    if (!(await box.isChecked()) && (await page.getByRole('button', { name: /Commit 1 change/ }).count())) break;
    console.log(`   untick not staged (attempt ${attempt}), retrying`);
    if (attempt >= 8) throw new Error('could not stage the unlink');
    await page.waitForTimeout(15000);
  }
  const dlg2 = await commitAndDeploy('Unlink docs-shared');
  await dlg2.getByRole('button', { name: /Deploy 1 change/ }).click();
  await page.getByText('1 change to apply').waitFor({ state: 'hidden', timeout: 60000 });
  let g = [];
  for (let i = 0; i < 30 && (g = await appGroups()).includes(GROUP); i++) await page.waitForTimeout(2000);
  if (g.includes(GROUP)) throw new Error('group still linked');
  await page.waitForTimeout(3000);
  await waitRolledOut();
}

async function deleteGroup(shoot) {
  console.log('9. Clean up: Delete group → Save');
  // A deploy of a linking service writes the project again a little later;
  // a save in that window is refused ("This project changed since you
  // opened this page"). Reopen and try again.
  for (let attempt = 1; ; attempt++) {
    await openSettings();
    const g3 = page.locator('[data-testid=shared-var-group]').filter({ has: page.locator('[data-testid=group-name]') }).last();
    if ((await g3.locator('[data-testid=group-name]').inputValue()) !== GROUP) throw new Error('wrong group');
    await g3.getByRole('button', { name: /Actions for group/ }).click();
    await page.getByRole('menuitem', { name: 'Delete group' }).click();
    const conf = page.locator('[role=alertdialog],[role=dialog]').last();
    await conf.waitFor();
    console.log('   confirm:', flat(await conf.innerText()));
    if (shoot && attempt === 1) await c.shot('variables/shared-9-delete-group', { locator: '[role=alertdialog],[role=dialog]' });
    await conf.getByRole('button', { name: 'Delete group' }).click();
    await page.getByTestId('save-main').click();
    const ok = await page.locator('[data-sonner-toast]').filter({ hasText: /Shared variables saved/ }).first().waitFor({ timeout: 20000 }).then(() => true, () => false);
    if (ok) break;
    console.log('   save refused:', flat(await page.getByText('This project changed since you opened this page').count() ? 'project changed since opened' : 'no toast'));
    if (attempt >= 6) throw new Error('could not delete the group');
    await page.waitForTimeout(15000);
  }
  await page.getByTestId('unsaved-bar').waitFor({ state: 'hidden' });
  const left = await page.locator('[data-testid=group-name]').evaluateAll((els) => els.map((e) => e.value));
  console.log('   groups left:', left);
  if (left.includes(GROUP)) throw new Error('group not deleted');
}

// A run that stopped half-way leaves the group behind: clean it up first.
if ((await (async () => { await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`); return appGroups(); })()).includes(GROUP)) {
  console.log('0. Leftover link from an earlier run');
  await unlinkAndDeploy();
}
await openSettings();
if ((await page.locator('[data-testid=group-name]').evaluateAll((els) => els.map((e) => e.value))).includes(GROUP)) {
  console.log('0. Leftover group from an earlier run');
  await deleteGroup(false);
  // The project is written again shortly after a save; a page opened in
  // that window gets "This project changed since you opened this page".
  await page.waitForTimeout(20000);
}

console.log('1. Project settings → Shared variables (empty)');
await openSettings();
const existing = page.locator('[data-testid=group-name]');
if (await existing.count()) {
  const names = await existing.evaluateAll((els) => els.map((e) => e.value));
  if (names.includes(GROUP)) throw new Error(`${GROUP} already exists; clean up first`);
}
console.log('   page:', flat(await page.getByTestId('project-settings').innerText()).slice(0, 400));
await c.shot('variables/shared-1-empty', { locator: '[data-testid=project-settings]' });

console.log('2. Create a group');
await page.getByRole('button', { name: /Create a group|Add group/ }).first().click();
const name = page.locator('[data-testid=group-name]').last();
console.log('   default name:', await name.inputValue());
await name.fill(GROUP);
const group = page.locator('[data-testid=shared-var-group]').filter({ has: page.locator(`[data-testid=group-name]`) }).last();
await group.getByPlaceholder('KEY').last().fill('LOG_LEVEL');
await group.getByPlaceholder('value').last().fill('info');
await group.getByRole('button', { name: 'Add variable' }).click();
await group.getByPlaceholder('KEY').last().fill('FEATURE_BANNER');
await group.getByPlaceholder('value').last().fill('on');
await page.getByTestId('unsaved-bar').waitFor();
console.log('   unsaved bar:', flat(await page.getByTestId('unsaved-bar').innerText()));
await c.shot('variables/shared-2-group', { around: [group, page.getByTestId('unsaved-bar')], pad: 16 });

console.log('3. The group ⋯ menu');
await group.getByRole('button', { name: /Actions for group/ }).click();
await page.getByRole('menuitem').first().waitFor();
console.log('   menu:', await page.getByRole('menuitem').allInnerTexts());
await c.shot('variables/shared-3-menu', { around: [group.locator('header'), page.locator('[role=menu]')], pad: 16 });
await page.keyboard.press('Escape');

console.log('4. Save changes');
await page.getByTestId('save-main').click();
const saved = page.locator('[data-sonner-toast]').filter({ hasText: /Shared variables saved/ }).first();
await saved.waitFor({ timeout: 30000 }).catch(async (e) => {
  console.log('   toasts:', await page.locator('[data-sonner-toast]').allInnerTexts());
  await page.screenshot({ path: (process.env.DBG ?? '/tmp') + '/sv-save-fail.png' });
  throw e;
});
console.log('   toast:', flat(await saved.innerText()));
await page.getByTestId('unsaved-bar').waitFor({ state: 'hidden' });
await page.waitForTimeout(1000);
await c.shot('variables/shared-4-saved', { around: [group], pad: 16 });
console.log('   reveal button:', await page.getByTestId('reveal-values').count(), '| masked rows:', await page.getByTestId('shared-var-masked').count());

console.log('5. nginx → Variables → Shared: link the group');
await openVariablesShared();
await c.shot('variables/shared-5-pane', { clip: SHEET });
await page.locator('label').filter({ hasText: GROUP }).locator('input[type=checkbox]').check();
await page.getByText('Linked values').waitFor();
await page.getByRole('button', { name: /Commit 1 change/ }).waitFor();
await c.shot('variables/shared-6-linked', { clip: SHEET });

console.log('6. Commit → Deploy');
const dlg = await commitAndDeploy('Link docs-shared');
await c.shot('variables/shared-7-commit', { locator: '[role=dialog]:has-text("1 change to apply")' });
c.checkpoint();
await dlg.getByRole('button', { name: /Deploy 1 change/ }).click();
await page.getByText('1 change to apply').waitFor({ state: 'hidden', timeout: 60000 });
let g = [];
for (let i = 0; i < 30 && !(g = await appGroups()).includes(GROUP); i++) await page.waitForTimeout(2000);
console.log('   app envGroups:', g);
if (!g.includes(GROUP)) throw new Error('group not linked');
await page.waitForTimeout(3000);
await waitRolledOut();

// (Project settings' "Linked by" is not shown: it reads apps from the
// pipeline object, whose phases list no apps. Reported as a bug.)

await unlinkAndDeploy();
await deleteGroup(true);

await c.done();
