// A deployed AI model: wait for it, then every tab of its sheet.
//   MODEL=<name>  SECTIONS=wait,tabs,...
import { open } from '../lib.mjs';
const PROJECT = 'github-demo-cw8z';
const MODEL = process.env.MODEL;
const SECTIONS = (process.env.SECTIONS ?? 'wait,tabs').split(',');
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
const ctrls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=radio], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 50)}`));
const sheet = () => page.locator('[role=dialog]').last();
const cardBtn = () => page.locator(`button[aria-label="Manage ${MODEL}"]`).first();
async function canvas() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await cardBtn().waitFor({ timeout: 90000 });
  await page.waitForTimeout(1500);
}
async function openSheet() {
  await canvas();
  await page.locator(`button[aria-label="Manage ${MODEL}"]`).first().click();
  await page.waitForTimeout(3000);
}
const tab = async (n) => { await sheet().getByRole('tab', { name: n, exact: true }).click(); await page.waitForTimeout(3000); };

if (!SECTIONS.includes("wait")) await openSheet();
if (SECTIONS.includes('wait')) {
  console.log('wait for the model');
  for (let i = 0; i < 40; i++) {
    await canvas();
    const card = await text(cardBtn().locator('xpath=ancestor::*[contains(., "AI model")][1]'));
    console.log(`    ${i}: ${card}`);
    if (i === 2) await c.shot('ai-model/11-card-preparing');
    if (!/Preparing|Deploying|Starting|Loading|Pending|Queued|Downloading/i.test(card)) break;
    await page.waitForTimeout(30000);
  }
}
if (SECTIONS.includes('live')) {
  console.log('wait until live (Deployment tab)');
  await openSheet();
  for (let i = 0; i < 50; i++) {
    await tab('Deployment');
    const t = await text(sheet());
    console.log(`    ${i}: ${t.split('Manual Deploy').pop().slice(0, 200)}`);
    if (!/preparing|rolling out|Renting a GPU|loading/i.test(t)) break;
    await page.waitForTimeout(30000);
    await tab('Logs');
  }
  await c.shot('ai-model/m-deployment-live');
  await tab('Logs');
  console.log('    logs:', (await text(sheet())).split('Refresh').pop().slice(-900));
  await c.shot('ai-model/m-logs-live');
  await canvas();

  await c.shot('ai-model/m-card-live');
}
if (SECTIONS.includes('tabs')) {
  await openSheet();
  for (const t of ['Deployment', 'Logs', 'Metrics', 'Settings']) {
    console.log(`tab ${t}`);
    await tab(t);
    console.log('   ', await text(sheet()));
    console.log('    controls:', JSON.stringify(await ctrls(sheet())));
    await c.shot(`ai-model/m-${t.toLowerCase()}`);
  }
}
if (SECTIONS.includes('use')) {
  await openSheet();
  await tab('Settings');
  // The key comes from the API, never from the page, and is never printed.
  const key = await page.evaluate(async ([P, N]) => (await (await fetch(`/api/ai-models/${P}/dev/${N}/key`)).json()).key, [PROJECT, MODEL]);
  const baseUrl = (await sheet().getByTestId('ai-model-url').innerText()).trim();
  for (const lang of ['JavaScript', 'curl']) {
    await sheet().getByRole('button', { name: lang, exact: true }).click();
    await page.waitForTimeout(800);
    await c.shot(`ai-model/m-snippet-${lang.toLowerCase()}`);
  }
  console.log('request:', baseUrl.replace(/inference\/[^/]+/, 'inference/<id>'));
  const t0 = Date.now();
  const r = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'Qwen/Qwen3-4B', messages: [{ role: 'user', content: 'Say hello in five words. /no_think' }], max_tokens: 60 }) });
  const j = await r.json().catch(() => ({}));
  console.log('    status', r.status, `${((Date.now() - t0) / 1000).toFixed(1)}s`, JSON.stringify(j.choices?.[0]?.message?.content ?? j).slice(0, 300));
  await page.waitForTimeout(60000);
  await tab('Metrics');
  await c.shot('ai-model/m-metrics-after');
  await tab('Settings');
  console.log('sleep after menu');
  await sheet().getByRole('combobox').filter({ hasText: /minutes|hour|Never/ }).first().click();
  await page.waitForTimeout(1200);
  console.log('   ', await text(page.locator('[role=listbox]').last()));
  await c.shot('ai-model/m-sleep-after');
  await page.keyboard.press('Escape');
  console.log('open chat');
  const before = page.context().pages().length;
  await sheet().getByTestId('ai-model-open-chat').click();
  await page.waitForTimeout(12000);
  const chat = page.context().pages().slice(before)[0];
  if (chat) {
    await chat.waitForLoadState('load').catch(() => {});
    await chat.waitForTimeout(5000);
    console.log('    chat url:', new URL(chat.url()).origin, 'title', await chat.title());
    console.log('    chat text:', (await chat.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 600));
    await c.shotPage('ai-model/m-chat', chat, chat.url());
    await chat.close();
  }
  console.log('manual deploy menu');
  await tab('Deployment');
  await sheet().getByTestId('ai-model-manual-deploy').click();
  await page.waitForTimeout(1000);
  console.log('   ', await text(page.locator('[role=menu]').last()));
  await c.shot('ai-model/m-manual-menu');
  await page.keyboard.press('Escape');
}
await c.done();
