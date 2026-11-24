// + Service → AI agent: every screen, step by step.
import { open } from '../lib.mjs';
const PROJECT = 'github-demo-cw8z';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
const ctrls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=radio], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 50)}`));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
console.log('1. + Service → AI agent');
await page.getByTestId('canvas-new-service').click();
await page.getByText('Chatbot or support agent with your instructions').click();
await page.waitForTimeout(4000);
console.log('    url:', page.url());
const d = (await page.locator('[role=dialog]').count()) ? page.locator('[role=dialog]').last() : page.locator('main').first();
console.log('   ', await text(d));
console.log('    controls:', JSON.stringify(await ctrls(d)));
await c.shot('ai-agent/1-open');
const menuText = async () => text(page.locator('[role=menu], [role=listbox], [data-reka-popper-content-wrapper]').last());
const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(800); };
console.log('2. Start from: each template');
for (const t of ['Customer support', 'FAQ bot', 'Internal helpdesk', 'Webhook triage', 'Daily report', 'Blank']) {
  await d.getByRole('radio', { name: t, exact: true }).click();
  await page.waitForTimeout(1200);
  const ins = await d.locator('textarea').inputValue();
  console.log(`  [${t}] tools=${await d.getByRole('button', { name: /read|grep|http|tools|none/i }).last().innerText().catch(() => '?')} :: ${ins.replace(/\s+/g, ' ').slice(0, 220)}`);
  console.log(`      ${(await text(d)).split('Instructions').pop().slice(0, 260)}`);
  if (t === 'Customer support') await c.shot('ai-agent/2-support');
}
console.log('3. Model provider');
await d.getByRole('combobox').first().click();
await page.waitForTimeout(1500);
console.log('   ', await menuText());
await c.shot('ai-agent/3-providers');
await esc();
console.log('4. Tools');
await d.getByRole('button', { name: 'read, grep, glob' }).click();
await page.waitForTimeout(1500);
console.log('   ', await menuText());
await c.shot('ai-agent/4-tools');
await esc();
if (process.env.DEPLOY) {
  // DEPLOY=<AI model name in this environment>: the agent talks to it through
  // "Another endpoint" (its base URL and key; the key is never printed).
  const MODEL = process.env.DEPLOY;
  const m = await page.evaluate(async ([P, N]) => {
    const list = await (await fetch(`/api/ai-models/${P}/dev`)).json();
    const row = list.find((x) => x.name === N);
    const key = (await (await fetch(`/api/ai-models/${P}/dev/${N}/key`)).json()).key;
    return { baseUrl: row.baseUrl, model: row.model ?? row.modelId ?? row.hfId, key };
  }, [PROJECT, MODEL]);
  console.log('5. FAQ bot → Another endpoint → Deploy  model id:', m.model);
  await d.getByRole('radio', { name: 'FAQ bot', exact: true }).click();
  await d.getByTestId('ai-agent-model').click();
  await page.getByTestId('ai-agent-other-custom').click();
  await page.waitForTimeout(1000);
  await d.getByTestId('ai-agent-new-litellm-url').fill(m.baseUrl);
  await d.getByTestId('ai-agent-new-litellm-key').fill(m.key);
  await d.getByTestId('ai-agent-new-litellm-models').fill(m.model);
  await page.waitForTimeout(1000);
  console.log('   ', (await text(d)).split('Instructions').pop().replace(/sbai_\w+/g, 'sbai_<key>').slice(0, 700));
  await c.shot('ai-agent/5-endpoint');
  await d.getByRole('button', { name: 'Deploy', exact: true }).click();
  await page.waitForTimeout(15000);
  console.log('    after deploy:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 1200));
  await c.shot('ai-agent/6-deploying');
}
if (process.env.GATEWAY) {
  // GATEWAY=<model id>: the AI Gateway already here serves it; no key needed.
  console.log('6. FAQ bot → the gateway already here → Deploy');
  await d.getByRole('radio', { name: 'FAQ bot', exact: true }).click();
  await d.getByTestId('ai-agent-model').click();
  await page.waitForTimeout(1500);
  console.log('    providers:', await menuText());
  await c.shot('ai-agent/6-providers-gateway');
  await page.locator('[role=listbox]').last().getByText(process.env.GATEWAY, { exact: true }).first().click();
  await page.waitForTimeout(1500);
  console.log('   ', (await text(d)).split('Instructions').pop().slice(0, 500));
  await c.shot('ai-agent/7-on-gateway');
  await d.getByRole('button', { name: 'Deploy', exact: true }).click();
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(15000);
    const t = (await text(page.locator('body'))).split('Designer').pop();
    console.log(`    ${i}: ${t.slice(0, 300)}`);
    if (!(await page.getByText('New AI agent').count())) break;
  }
  await c.shot('ai-agent/8-created');
}
await c.done();
