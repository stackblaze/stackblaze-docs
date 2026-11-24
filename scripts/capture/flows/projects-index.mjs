// Projects overview: the project list, the header (organization / project /
// environment), the canvas of one environment, and every field of the
// Create a New Project dialog. Nothing is created: the dialog is cancelled.
import { open } from '../lib.mjs';

const EMPTY = process.env.EMPTY_PROJECT ?? 'github-demo-cw8z';
const FULL = process.env.FULL_PROJECT ?? 'github-demo-gv35';
const c = await open();
const { page } = c;
const dialog = () => page.getByRole('dialog').last();

console.log('1. Projects list');
await c.goto('/');
await page.getByTestId('projects-new').waitFor();
await c.shot('projects/1-list', { clip: { x: 0, y: 0, width: 1440, height: 540 } });

console.log('2. List view');
await page.getByRole('button', { name: 'List view' }).click();
await page.waitForTimeout(800);
await c.shot('projects/2-list-view', { clip: { x: 240, y: 0, width: 1200, height: 420 } });
await page.getByRole('button', { name: 'Grid view' }).click();

console.log('3. An environment: the header and the canvas');
await c.goto(`/pipeline/${FULL}/apps?phase=dev`);
await page.getByTestId('phase-switcher').waitFor();
await page.waitForTimeout(1500);
await c.shot('projects/3-canvas', { clip: { x: 0, y: 0, width: 1440, height: 480 } });

console.log('4. New Project dialog');
await c.goto('/');
await page.getByTestId('projects-new').click();
await dialog().getByRole('radio').first().waitFor();
const radios = await dialog().getByRole('radio').allInnerTexts();
console.log('    regions:', radios.join(', '));
await c.shot('projects/4-new-dialog', { locator: '[role=dialog]' });

console.log('5. Owning team menu');
await page.getByTestId('new-project-team').click();
await page.getByRole('listbox').waitFor();
console.log('    teams:', (await page.getByRole('listbox').innerText()).replace(/\n/g, ', '));
await c.shot('projects/5-new-team', { around: ['[role=dialog]', '[role=listbox]'], pad: 0 });
await page.keyboard.press('Escape');

console.log('6. Advanced Settings: environments');
await page.getByTestId('new-project-advanced').click();
await page.getByTestId('new-project-phase-review').waitFor();
for (const [n, on] of [['review', false], ['dev', true], ['stage', true], ['production', true]]) {
  if ((await page.getByTestId(`new-project-phase-${n}`).isChecked()) !== on) throw new Error(`default for ${n} is not ${on}`);
}
await c.shot('projects/6-new-advanced', { locator: '[role=dialog]' });

console.log('7. A name that is taken');
await page.getByTestId('new-project-name').fill(EMPTY);
await page.getByTestId('new-project-name-taken').waitFor({ timeout: 15000 });
if (!(await page.getByTestId('new-project-create').isDisabled())) throw new Error('Create Project should be disabled');
await c.shot('projects/7-new-taken', { around: ['#new-project-name', '[data-testid=new-project-name-taken]'], pad: 24 });

console.log('8. No environment ticked → Create Project stays disabled');
await page.getByTestId('new-project-name').fill('');
for (const n of ['dev', 'stage', 'production']) await page.getByTestId(`new-project-phase-${n}`).setChecked(false);
if (!(await page.getByTestId('new-project-create').isDisabled())) throw new Error('Create Project should be disabled with no environment');

console.log('9. Cancel (nothing is created)');
await dialog().getByRole('button', { name: 'Cancel' }).click();
await page.getByRole('dialog').waitFor({ state: 'detached' });

await c.done();
