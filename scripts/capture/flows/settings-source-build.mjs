// Settings → Source and Build on a git service (github-demo-587h's
// react-vite-starter, deployed from a public repository URL).
import { open } from '../lib.mjs';
import { helpers } from './_settings.mjs';
const STEP = process.env.STEP ?? 'explore';
const c = await open();
const h = helpers(c, 'github-demo-587h', 'react-vite-starter');
const { page } = h;
const ctl = (l) => l.locator('button, [role=combobox], [role=switch], input, select, textarea').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.id || e.getAttribute('aria-label') || ''}:${(e.innerText || e.value || e.getAttribute('placeholder') || '').trim().slice(0, 50)}`));
await h.openSettings();
console.log('rail:', await page.locator('nav[aria-label="Settings sections"]').innerText().catch(() => '?'));
if (STEP === 'explore') {
  for (const s of ['Source', 'Build', 'Deploy']) {
    await h.jump(s);
    const sec = h.section(s.toLowerCase());
    console.log(`== ${s}:`, (await sec.innerText()).replace(/\s+/g, ' ').slice(0, 1500));
    console.log('   controls', JSON.stringify(await ctl(sec)));
    await c.shot(`settings/${s.toLowerCase()}-git`, { locator: `[data-settings-section="${s.toLowerCase()}"]` });
  }
  const sel = h.section('build').locator('select, [role=combobox]').first();
  if (await sel.count()) { await sel.click().catch(() => {}); await page.waitForTimeout(700); console.log('   build options:', (await page.locator('[role=listbox], [role=menu]').last().innerText().catch(() => '')).replace(/\s+/g, ' ')); await page.keyboard.press('Escape'); }
}
if (STEP === 'options') {
  for (const [sec, idx, id] of [['source', 0, 'source-account'], ['source', 1, 'source-repo'], ['build', 0, 'build-method'], ['build', 1, 'build-path']]) {
    await h.jump(sec[0].toUpperCase() + sec.slice(1));
    const btn = h.section(sec).locator('button').nth(idx);
    await btn.click(); await page.waitForTimeout(1500);
    const pop = page.locator('[role=dialog], [role=menu], [role=listbox], [data-reka-popper-content-wrapper]').last();
    console.log(`== ${id}:`, (await pop.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 900));
    await c.shot(`settings/${id}`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  }
}
if (STEP === 'build-cmd' || STEP === 'build-cmd-off') {
  await h.jump('Deploy');
  const f = page.locator('#app-build-command');
  await f.fill(STEP === 'build-cmd' ? process.env.CMD : '');
  await page.waitForTimeout(500);
  if (STEP === 'build-cmd') await c.shot('settings/build-command', { locator: '[data-settings-section="deploy"]' });
  await h.commitDeploy(STEP === 'build-cmd' ? 'Custom build command' : 'Default build command', STEP === 'build-cmd' ? 'settings/build-command-commit' : undefined);
  const s1 = await h.spec();
  console.log('saved buildCommand:', JSON.stringify(s1.buildCommand ?? s1.buildpack?.build?.command ?? null));
}
await c.done();
