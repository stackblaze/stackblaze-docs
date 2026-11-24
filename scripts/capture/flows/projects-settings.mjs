// Project settings: every tab. General (display name set and cleared,
// environments, preview options shown but not saved, IaC on and off again,
// the Delete project dialog shown and cancelled), Ownership & access (the
// team menu, not saved) and Shared variables (a group created, then
// deleted). Uses the empty project and leaves it as it was.
// Needs the isolated dev CLI: CLI_BIN, CLI_HOME.
import { execFileSync } from 'node:child_process';
import { open, DASHBOARD } from '../lib.mjs';

const PROJECT = process.env.EMPTY_PROJECT ?? 'github-demo-cw8z';
const BIN = process.env.CLI_BIN;
const HOME = process.env.CLI_HOME;
if (!BIN || !HOME) throw new Error('set CLI_BIN and CLI_HOME (an isolated CLI install)');
const API = DASHBOARD.replace('dashboard', 'api').replace('.stackblaze.com', '.stackblaze.cloud');
const cli = (...args) => execFileSync(BIN, args, { env: { ...process.env, HOME, STACKBLAZE_API_URL: API, NO_COLOR: '1' }, encoding: 'utf8' });
const project = () => JSON.parse(cli('api', 'GET', `/api/pipelines/${PROJECT}`));

const before = project();
if ((before.envVarGroups || []).length) throw new Error('project already has shared variable groups');
if (before.iacEnabled) throw new Error('IaC is already on');
if (before.displayName) throw new Error('project already has a display name');

const c = await open();
const { page } = c;
// Log any browser dialog (e.g. leave-page prompts) and dismiss it.
page.on('dialog', (d) => { console.log(`    dialog (${d.type()}): ${d.message()}`); d.dismiss().catch(() => {}); });
const S = '[data-testid=project-settings]';
// Saves elsewhere (the display name, a canvas layout) update the project a
// little later; wait until it stops changing before loading a fresh copy to
// edit, so the save isn't refused as stale.
async function settle() {
  for (let v = project().resourceVersion, i = 0; i < 20; i++) {
    await page.waitForTimeout(4000);
    const n = project().resourceVersion;
    if (n === v) break;
    v = n;
  }
}
async function savedVia(button, card) {
  const put = page.waitForResponse((r) => r.url().includes(`/api/pipelines/${PROJECT}`) && r.request().method() === 'PUT', { timeout: 90000 });
  await page.getByTestId(button).click();
  const r = await put;
  console.log('    PUT', r.status());
  if (r.status() >= 300) throw new Error((await r.text()).slice(0, 300));
  await page.locator(card).getByText('Saved.').waitFor({ timeout: 10000 });
}
const center = (sel) => page.locator(sel).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));

// ---------- General ----------
console.log('1. General tab: Project details');
await c.goto(`/pipeline/${PROJECT}/settings/general`);
await page.getByTestId('project-display-name').waitFor();
await c.shot('projects/set-1-general', { clip: { x: 0, y: 0, width: 1440, height: 650 } });

console.log('2. Display name → Save, then clear it again');
await page.getByTestId('project-display-name').fill('Docs demo');
await page.getByTestId('save-display-name').click();
for (let i = 0; i < 20 && project().displayName !== 'Docs demo'; i++) await page.waitForTimeout(1500);
if (project().displayName !== 'Docs demo') throw new Error('display name not saved');
await page.waitForTimeout(1000);
await c.shot('projects/set-2-display-name', { clip: { x: 0, y: 0, width: 1440, height: 520 } });
await page.getByTestId('project-display-name').fill('');
await page.getByTestId('save-display-name').click();
for (let i = 0; i < 20 && project().displayName; i++) await page.waitForTimeout(1500);
if (project().displayName) throw new Error('display name not cleared');

console.log('3. Preview environments: switch on (not saved)');
await c.goto(`/pipeline/${PROJECT}/settings/general`);
await page.getByTestId('preview-switch').click();
await page.getByTestId('preview-mode').waitFor();
await center('#previews');
await c.shot('projects/set-3-previews', { locator: '#previews' });
await page.getByTestId('preview-mode').click();
await page.getByRole('listbox').waitFor();
console.log('    modes:', (await page.getByRole('listbox').innerText()).replace(/\n/g, ', '));
await c.shot('projects/set-4-preview-mode', { around: ['[data-testid=preview-mode]', '[role=listbox]'], pad: 12 });
await page.getByRole('option', { name: 'Only when asked for' }).click();
await page.waitForTimeout(400);
await c.shot('projects/set-5-preview-manual', { locator: '[data-testid=preview-mode-help]', pad: 8 });
console.log('    help:', await page.getByTestId('preview-mode-help').innerText());

console.log('4. Preview environments: Advanced (rows added, not saved)');
await page.getByTestId('preview-tab-advanced').click();
await page.getByTestId('preview-seed-add').click();
await page.getByRole('button', { name: 'Add variable rule' }).click();
await page.getByTestId('preview-env-mode-0').click();
await page.getByRole('listbox').waitFor();
console.log('    variable modes:', (await page.getByRole('listbox').innerText()).replace(/\n/g, ', '));
await page.keyboard.press('Escape');
await page.getByTestId('preview-env-app-0').click();
await page.getByRole('listbox').waitFor();
console.log('    variable apps:', (await page.getByRole('listbox').innerText()).replace(/\n/g, ', '));
await page.keyboard.press('Escape');
await center('#previews');
await c.shot('projects/set-6-preview-advanced', { locator: '#previews' });

console.log('5. Infrastructure as Code: on → Save, then off → Save');
await settle();
await c.goto(`/pipeline/${PROJECT}/settings/general`);
await page.getByTestId('iac-switch').click();
await center('#iac');
await savedVia('save-iac', '#iac');
await c.shot('projects/set-7-iac', { locator: '#iac' });
if (!project().iacEnabled) throw new Error('IaC not on');
await settle();
await c.goto(`/pipeline/${PROJECT}/settings/general`);
await page.getByTestId('iac-switch').click();
await savedVia('save-iac', '#iac');
if (project().iacEnabled) throw new Error('IaC not off again');

console.log('6. Danger zone → Delete project dialog (cancelled)');
await center('[data-testid=project-danger-zone]');
await c.shot('projects/set-8-danger', { locator: '[data-testid=project-danger-zone]' });
await page.getByTestId('danger-zone-action').click();
const del = page.getByRole('dialog').or(page.getByRole('alertdialog')).last();
await del.getByRole('button', { name: 'Delete project' }).waitFor();
if (!(await del.getByRole('button', { name: 'Delete project' }).isDisabled())) throw new Error('Delete should wait for the name');
await c.shot('projects/set-9-delete-dialog', { locator: '[role=dialog],[role=alertdialog]' });
await del.getByRole('button', { name: 'Cancel' }).click();
await page.waitForTimeout(800);

// ---------- Ownership & access ----------
console.log('7. Ownership & access');
await page.getByRole('tab', { name: 'Ownership & access' }).or(page.getByRole('button', { name: 'Ownership & access' })).first().click();
await page.waitForURL(/settings\/access/);
await page.getByTestId('save-main').waitFor();
await page.locator(`${S} [role=combobox]`).first().click();
await page.getByRole('listbox').waitFor();
console.log('    teams:', (await page.getByRole('listbox').innerText()).replace(/\n/g, ', '));
await c.shot('projects/set-10-access', { clip: { x: 0, y: 0, width: 1440, height: 560 } });
await page.keyboard.press('Escape');

// ---------- Shared variables ----------
console.log('8. Shared variables: empty');
await settle();
await c.goto(`/pipeline/${PROJECT}/settings/variables`);
await page.getByTestId('shared-vars-empty').waitFor();
await c.shot('projects/set-11-vars-empty', { clip: { x: 0, y: 0, width: 1440, height: 620 } });

console.log('9. Add group → name it, add a variable → Save changes');
await page.getByTestId('add-group').click();
await page.getByTestId('group-name').fill('logging');
const row = page.getByTestId('shared-var-row').first();
await row.locator('input').first().fill('LOG_LEVEL');
await row.getByRole('button', { name: /^Show/ }).first().click().catch(() => {});
await page.getByTestId('shared-var-value').first().fill('info');
await page.getByTestId('unsaved-bar').waitFor();
await c.shot('projects/set-12-vars-new', { clip: { x: 0, y: 0, width: 1440, height: 900 } });
await page.getByTestId('save-main').click();
await page.locator('[data-sonner-toast]').first().waitFor({ timeout: 30000 });
console.log('    toast:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | '));
for (let i = 0; i < 20 && !(project().envVarGroups || []).length; i++) await page.waitForTimeout(1500);
if (!(project().envVarGroups || []).length) throw new Error('group not saved');

console.log('10. Saved group, its menu');
await settle();
await c.goto(`/pipeline/${PROJECT}/settings/variables`);
await page.getByTestId('shared-var-group').waitFor();
await page.getByRole('button', { name: /Actions for group/ }).click();
await page.getByRole('menu').waitFor();
await c.shot('projects/set-13-vars-group', { around: [page.getByTestId('shared-var-group'), page.getByRole('menu')], pad: 12 });

console.log('11. Delete group → confirm → Save changes');
await page.getByRole('menuitem', { name: 'Delete group' }).click();
const conf = page.getByRole('alertdialog').or(page.getByRole('dialog')).last();
await conf.getByRole('button', { name: 'Delete group' }).waitFor();
await c.shot('projects/set-14-vars-delete', { locator: '[role=alertdialog],[role=dialog]' });
await conf.getByRole('button', { name: 'Delete group' }).click();
await page.getByTestId('save-main').click();
for (let i = 0; i < 20 && (project().envVarGroups || []).length; i++) await page.waitForTimeout(1500);
if ((project().envVarGroups || []).length) throw new Error('group not deleted');

await c.done();
