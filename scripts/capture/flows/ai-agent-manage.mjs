// A deployed AI agent: wait for it, then every tab and section of its sheet.
import { open } from '../lib.mjs';
const PROJECT = 'github-demo-cw8z';
const SECTIONS = (process.env.SECTIONS ?? 'wait,tabs').split(',');
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 4000);
const ctrls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=radio], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 40)}`));
const canvas = async () => { await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.locator('button[aria-label^="Manage "]').first().waitFor({ timeout: 90000 }); await page.waitForTimeout(2500); };
const cards = () => page.locator('button[aria-label^="Manage "]').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label').slice(7)));
const sheet = () => page.locator('[role=dialog]').last();
await canvas();
if (SECTIONS.includes('wait')) {
  for (let i = 0; i < 30; i++) {
    const body = (await text(page.locator('body'))).split('Designer').pop();
    console.log(`  ${i}: cards=${JSON.stringify(await cards())} :: ${body.slice(0, 400)}`);
    if (i === 1) await c.shot('ai-agent/7-canvas-starting');
    if (!/Deploying|Building|Starting|Pending|Staged|Updating/i.test(body) && (await cards()).length > 1) break;
    await page.waitForTimeout(30000);
    await canvas();
  }
  await c.shot('ai-agent/8-canvas');
}
const AGENT = process.env.AGENT ?? (await cards()).find((n) => n !== 'model-40im5e' && !/gateway|litellm|postgres/i.test(n));
console.log('agent:', AGENT, 'all:', JSON.stringify(await cards()));
const ONLY = process.env.TABS?.split(',');
if (SECTIONS.includes('tabs') && AGENT) {
  await page.locator(`button[aria-label="Manage ${AGENT}"]`).first().click();
  await page.waitForTimeout(4000);
  const tabs = await sheet().getByRole('tab').allInnerTexts();
  console.log('tabs:', JSON.stringify(tabs));
  for (const t of tabs.filter((x) => !ONLY || ONLY.some((o) => x.startsWith(o)))) {
    await sheet().getByRole('tab', { name: new RegExp(`^${t.trim().split(' ')[0]}`) }).click();
    await page.waitForTimeout(3500);
    console.log(`== tab ${t.trim()}`);
    console.log('   ', (await text(sheet())).replace(/sbai_\w+|sk-[\w-]+/g, '<key>'));
    console.log('    controls:', JSON.stringify(await ctrls(sheet())));
    await c.shot(`ai-agent/t-${t.trim().split(' ')[0].toLowerCase()}`);
    if (t.startsWith('Agent')) {
      for (const sub of ['General', 'Knowledge', 'Skills', 'Integrations', 'Triggers', 'Evals', 'Optimizations', 'Sessions']) {
        await sheet().getByRole('button', { name: sub, exact: true }).click();
        await page.waitForTimeout(3000);
        console.log(`  -- ${sub}:`, (await text(sheet())).split('Sessions').slice(1).join('Sessions').replace(/sbai_\w+|sk-[\w-]+/g, '<key>').slice(0, 2500));
        console.log('     controls:', JSON.stringify((await ctrls(sheet())).slice(19)));
        await c.shot(`ai-agent/a-${sub.toLowerCase()}`);
      }
    }
  }
}
await c.done();
