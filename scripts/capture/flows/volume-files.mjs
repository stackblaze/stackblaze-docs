// The volume file browser: open a volume from the canvas, browse, upload,
// create a folder, download, delete. STEP selects what to perform.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'my-first-project-h22a';
const STEP = process.env.STEP ?? 'explore';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
const controls = (l) => l.locator('button, [role=tab], [role=menuitem], input, a').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('title') || '').trim().slice(0, 40)}`).filter((x) => !/^A::$/.test(x)));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(4000);
if (STEP === 'explore') {
  const cards = await page.locator('button[aria-label^="Manage "]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  console.log('cards', JSON.stringify(cards));
  await page.getByRole('button', { name: /^Manage data/ }).first().click(); await page.waitForTimeout(3000);
  console.log('   url', new URL(page.url()).pathname + new URL(page.url()).search, 'dialogs', await page.locator('[role=dialog]').count());
  const sh = (await page.locator('[role=dialog]').count()) ? page.locator('[role=dialog]').last() : page.locator('main').last();
  console.log('1.', await text(sh));
  console.log('   controls', JSON.stringify(await controls(sh)));
  await c.shot('files/1-volume-card');
}
if (STEP === 'menu' || STEP === 'browse') {
  await page.getByRole('button', { name: /^Manage data/ }).first().click({ button: 'right' }); await page.waitForTimeout(1200);
  const m = page.locator('[role=menu]').last();
  console.log('menu:', await text(m));
  await c.shot('files/2-menu');
  if (STEP === 'browse') {
    const [tab] = await Promise.all([page.context().waitForEvent('page'), m.getByText('Browse files').click()]);
    await tab.waitForLoadState('load'); await tab.waitForTimeout(5000);
    await tab.evaluate(() => document.documentElement.classList.remove('dark'));
    console.log('url', new URL(tab.url()).pathname);
    console.log('page:', (await tab.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1500));
    console.log('controls', JSON.stringify(await controls(tab.locator('body'))));
    const old = c.page; c.page = tab;
    await tab.screenshot({ path: '/tmp/claude-1001/-Users-adam/791e7dd4-162b-45fc-bc64-746b4c84360e/scratchpad/files-tab.png' });
    await tab.close();
  }
}
if (STEP === 'files') {
  await c.goto(`/pipeline/${PROJECT}/dev/volume/data/files`); await page.waitForTimeout(4000);
  const body = page.locator('main').last();
  console.log('1.', await text(body));
  await c.shot('files/3-list');
  console.log('2. New folder');
  await page.getByRole('button', { name: 'New folder' }).click(); await page.waitForTimeout(1000);
  const d = page.locator('[role=dialog]').last();
  console.log('   dialog:', await text(d), JSON.stringify(await controls(d)));
  await c.shot('files/4-new-folder', { locator: '[role=dialog]' });
  await d.locator('input').first().fill('uploads');
  await d.getByRole('button', { name: /^(Create|Save|OK)/ }).first().click(); await page.waitForTimeout(2500);
  console.log('   after:', await text(body));
  console.log('3. Open the folder and upload');
  await page.getByText('uploads', { exact: true }).first().click(); await page.waitForTimeout(2500);
  console.log('   in folder:', await text(body));
  await page.locator('input[type=file]').first().setInputFiles(process.env.UPLOAD); await page.waitForTimeout(4000);
  console.log('   after upload:', await text(body));
  await c.shot('files/5-uploaded');
  console.log('4. File actions');
  await page.getByRole('button', { name: /^Actions for upload-demo.txt/ }).click(); await page.waitForTimeout(1000);
  const m = page.locator('[role=menu]').last();
  console.log('   menu:', await text(m));
  await c.shot('files/6-actions');
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  console.log('5. Open the file');
  await page.getByText('upload-demo.txt', { exact: true }).first().click(); await page.waitForTimeout(2500);
  console.log('   ', (await text(page.locator('body'))).slice(-600));
  console.log('   dialogs', await page.locator('[role=dialog]').count());
  await c.shot('files/7-open-file');
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
}
if (STEP === 'cleanup') {
  await c.goto(`/pipeline/${PROJECT}/dev/volume/data/files`); await page.waitForTimeout(4000);
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /^Actions for uploads/ }).click(); await page.waitForTimeout(800);
  const m = page.locator('[role=menu]').last();
  console.log('menu:', await text(m));
  await m.getByRole('menuitem').filter({ hasText: 'Delete' }).first().click(); await page.waitForTimeout(1500);
  const d = page.locator('[role=alertdialog], [role=dialog]').last();
  if (await d.count()) { console.log('confirm:', await text(d)); await c.shot('files/8-delete-confirm'); await d.getByRole('button', { name: /^Delete/ }).last().click(); await page.waitForTimeout(2500); }
  console.log('after:', await text(page.locator('main').last()));
  await c.shot('files/9-after-delete');
}
await c.done();
