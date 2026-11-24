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
