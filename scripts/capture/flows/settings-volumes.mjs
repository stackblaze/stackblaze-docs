// Settings → Storage: add a volume, deploy it and write a file to it; see
// what an in-use volume lets you change; the mount-path errors; remove it.
// Runs on github-demo-kpw0's nginx-unprivileged.
import { open } from '../lib.mjs';
import { helpers } from './_settings.mjs';

const c = await open();
const h = helpers(c);
const { page } = h;
const storage = () => h.section('storage');
let s;

if (!process.env.SKIP_ADD) {
console.log('1. Settings → Storage');
await h.openSettings();
await h.jump('Storage');
console.log('   ', (await storage().innerText()).replace(/\s+/g, ' '));
await c.shot('settings/storage', { locator: '[data-settings-section="storage"]' });

console.log('2. Add volume → defaults');
await storage().getByRole('button', { name: 'Add volume' }).click();
await page.waitForTimeout(600);
console.log('   name', await page.locator('#vol-name-0').inputValue(), '| size', await page.locator('#vol-size-0').innerText(), '| mount', await page.locator('#vol-mp-0').inputValue());
await page.locator('#vol-size-0').click();
await page.getByRole('option').first().waitFor();
console.log('   sizes:', await page.getByRole('option').allInnerTexts());
await c.shot('settings/volume-sizes', { around: [storage().locator('#vol-size-0'), page.getByRole('option').first(), page.getByRole('option').last()], pad: 12 });
await page.keyboard.press('Escape');

console.log('3. Mount-path errors (two volumes on one path, an empty path)');
await storage().getByRole('button', { name: 'Add volume' }).click();
await page.waitForTimeout(400);
console.log('   second volume default mount', await page.locator('#vol-mp-1').inputValue());
await page.locator('#vol-mp-1').fill(await page.locator('#vol-mp-0').inputValue());
await page.waitForTimeout(400);
console.log('   banner:', (await storage().locator('.text-destructive').first().innerText().catch(() => '')).replace(/\s+/g, ' '));
await c.shot('settings/volume-duplicate', { locator: '[data-settings-section="storage"]' });
await page.locator('#vol-mp-1').fill('');
await page.waitForTimeout(400);
console.log('   banner:', (await storage().locator('.text-destructive').first().innerText().catch(() => '')).replace(/\s+/g, ' '));
// Commit with an error: what the toolbar does.
const commitBtn = page.getByRole('button', { name: /^Commit \d+ changes?/ });
console.log('   commit button:', await commitBtn.innerText().catch(() => 'none'), 'disabled', await commitBtn.isDisabled().catch(() => null));
await storage().getByRole('button', { name: /Remove/ }).nth(1).click();
await page.waitForTimeout(400);

console.log('4. Volume "data", 5 GB, /data → deploy');
await page.locator('#vol-name-0').fill('data');
await page.locator('#vol-mp-0').fill('/data');
await page.waitForTimeout(300);
await c.shot('settings/volume-add', { locator: '[data-settings-section="storage"]' });
await h.commitDeploy('Add a data volume', 'settings/volume-commit');
await h.waitRunning();
s = await h.spec();
console.log('   saved:', JSON.stringify(s.extraVolumes));
c.checkpoint();
if (process.env.STOP_AFTER_ADD) { await c.done(); process.exit(0); }

}
console.log('5. In use: name and size are locked');
await h.openSettings();
await h.jump('Storage');
console.log('   ', (await storage().innerText()).replace(/\s+/g, ' '));
console.log('   name disabled', await page.locator('#vol-name-0').isDisabled(), '| size disabled', await page.locator('#vol-size-0').isDisabled(), '| mount disabled', await page.locator('#vol-mp-0').isDisabled());
await c.shot('settings/volume-in-use', { locator: '[data-settings-section="storage"]' });


console.log('5b. Grow it: 5 GB → 10 GB');
await page.locator('#vol-size-0').click();
await page.getByRole('option').first().waitFor();
console.log('   grow sizes:', await page.getByRole('option').allInnerTexts());
await c.shot('settings/volume-grow-sizes', { around: [storage().locator('#vol-size-0'), page.getByRole('option').first(), page.getByRole('option').nth(4)], pad: 12 });
await page.getByRole('option', { name: '10 GB', exact: true }).click();
await page.waitForTimeout(400);
await c.shot('settings/volume-grow', { locator: '[data-settings-section="storage"]' });
{
  const commit = page.getByRole('button', { name: /^Commit \d+ changes?/ });
  await commit.click();
  await page.getByText(/change(s)? to apply/).first().waitFor();
  await page.getByPlaceholder('How these releases appear in the history').fill('Grow the data volume to 10 GB');
  console.log('   commit dialog:', (await h.dialog().innerText()).replace(/\s+/g, ' ').slice(0, 400));
  await c.shot('settings/volume-grow-commit', { locator: '[data-slot=dialog-content]' });
  await h.dialog().getByRole('button', { name: /^Deploy \d+ changes?/ }).click();
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: /Growing volume|not grown yet/ }).first();
  await toast.waitFor({ timeout: 60000 });
  console.log('   toast:', (await toast.innerText()).replace(/\s+/g, ' '));
  await c.shot('settings/volume-grow-toast', { locator: toast });
  await page.getByText(/change(s)? to apply/).first().waitFor({ state: 'hidden', timeout: 120000 });
}
const line = page.locator('[data-volume-size-note="data"]');
for (let i = 0; i < 40; i++) {
  const t = (await line.innerText().catch(() => '')).replace(/\s+/g, ' ');
  console.log('   note:', t);
  if (/Growing to|filesystem grows next/.test(t)) { await c.shot('settings/volume-growing', { locator: '[data-settings-section="storage"]' }).catch(() => {}); }
  if (!/Growing to|filesystem grows next/.test(t) && i > 2) break;
  await page.waitForTimeout(5000);
}
s = await h.spec();
console.log('   saved:', JSON.stringify(s.extraVolumes));
await h.openSettings();
await h.jump('Storage');
console.log('   after:', (await storage().innerText()).replace(/\s+/g, ' '));
await c.shot('settings/volume-grown', { locator: '[data-settings-section="storage"]' });
c.checkpoint();

console.log('6. Remove → confirm → deploy');
page.once('dialog', async (d) => { console.log('   confirm:', d.message()); await d.accept(); });
await storage().getByRole('button', { name: /Remove/ }).first().click();
await page.waitForTimeout(500);
await h.commitDeploy('Remove the data volume', 'settings/volume-remove-commit');
await h.waitRunning();
s = await h.spec();
console.log('   saved:', JSON.stringify(s.extraVolumes));
c.checkpoint();

await c.done();
