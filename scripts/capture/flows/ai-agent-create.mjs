// + Service → AI agent → New AI agent: every template, every model choice,
// the fields each one asks for, their errors, and the tools.
// SECTIONS=look (no deploy) | deploy (TEMPLATE=<label>, MODEL=<ai model name>|endpoint)
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const SECTIONS = (process.env.SECTIONS ?? 'look').split(',');
const c = await open();
const { page } = c;
const SECRET_RE = /\b(sbai|sbak|sbwh|sbag|sk|whsec)_?[A-Za-z0-9_-]{12,}/g;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').replace(SECRET_RE, '<secret>').slice(0, 3000);
const ctrls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=radio], [role=checkbox], input, textarea, select').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('data-testid') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 50)}`));
const menu = () => page.locator('[role=listbox], [role=menu]').last();
const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(700); };
const toasts = async () => (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ');
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByTestId('canvas-new-service').click();
await page.waitForTimeout(2000);
if (SECTIONS.includes('look')) {
  const pal = page.locator('[role=dialog], [role=menu]').last();
  console.log('palette:', await text(pal));
  const item = page.getByText('Chatbot or support agent with your instructions');
  await c.shot('ai-agent/cr-palette', { around: [item.locator('xpath=ancestor::*[self::button or @role="menuitem" or self::a][1]')], pad: 60 });
}
await page.getByText('Chatbot or support agent with your instructions').click();
await page.waitForTimeout(4000);
const d = page.locator('[role=dialog]').last();
if (SECTIONS.includes('look')) {
  console.log('panel:', await text(d));
  console.log('controls:', JSON.stringify(await ctrls(d)));
  console.log('model at open:', await d.getByTestId('ai-agent-model').innerText());
  await c.shot('ai-agent/cr-open', { locator: '[role=dialog]' });
  for (const t of process.env.MODELS ? [] : ['Customer support', 'FAQ bot', 'Internal helpdesk', 'Webhook triage', 'Daily report', 'Blank']) {
    await d.getByRole('radio', { name: t, exact: true }).click();
    await page.waitForTimeout(1200);
    const ins = await d.getByTestId('ai-agent-instructions').inputValue();
    console.log(`\n[${t}] tools=${await d.getByTestId('ai-agent-tools').innerText()}`);
    console.log('   instructions:', JSON.stringify(ins));
    console.log('   form:', (await text(d)).split('Daily report').pop().slice(0, 600));
    if (t === 'Customer support') {
      await c.shot('ai-agent/cr-tpl-support', { locator: '[role=dialog]' });
      // The site field's checks: Deploy with it empty / with a path.
      const site = d.getByTestId('ai-agent-site');
      for (const v of ['', 'acme.com', 'https://acme.com/shop']) {
        await site.fill(v);
        await d.getByRole('button', { name: 'Deploy', exact: true }).click();
        await page.waitForTimeout(1000);
        console.log(`   site "${v}":`, (await text(d)).match(/Your site.*?(Visitors|Instructions)/)?.[0]);
      }
      await site.fill('');
    }
    if (t === 'Webhook triage') await c.shot('ai-agent/cr-tpl-webhook', { locator: '[role=dialog]' });
    if (t === 'Daily report') await c.shot('ai-agent/cr-tpl-daily', { locator: '[role=dialog]' });
  }
  console.log('\n== Model list');
  await d.getByTestId('ai-agent-model').click();
  await page.waitForTimeout(1500);
  console.log('   ', await text(menu()));
  await c.shot('ai-agent/cr-models', { around: [menu(), d.getByTestId('ai-agent-model')] });
  const opts = await menu().getByRole('option').allInnerTexts();
  await esc();
  for (const o of opts.filter((x) => !process.env.MODELS || process.env.MODELS.split(',').some((m) => x.startsWith(m)))) {
    await d.getByTestId('ai-agent-model').click();
    await page.waitForTimeout(800);
    await menu().getByRole('option').filter({ hasText: o.trim().split('\n')[0] }).first().click();
    await page.waitForTimeout(1200);
    const part = (await text(d)).split('Model').slice(1).join('Model').split('Tools')[0];
    console.log(`\n[model ${o.trim().replace(/\s+/g, ' ')}] ${part}`);
    // A local AI model needs nothing more: Deploy would create the agent.
    if (!/local model/.test(o)) await d.getByRole('button', { name: 'Deploy', exact: true }).click();
    await page.waitForTimeout(1200);
    console.log('   errors on Deploy:', (await text(d)).split('Model').slice(1).join('Model').split('Tools')[0]);
    const id = o.trim().split(/\s+/)[0].toLowerCase();
    if (/Anthropic|OpenAI|DeepSeek|Another|docs-qwen/.test(o)) await c.shot(`ai-agent/cr-model-${id}`, { locator: '[role=dialog]' });
    if (/Anthropic/.test(o)) {
      for (const k of ['sk-wrong', 'sk-ant- spaced']) {
        await d.getByTestId('ai-agent-new-litellm-key').fill(k);
        await page.waitForTimeout(500);
        console.log(`   key "${k}":`, (await text(d)).split('Anthropic API key').pop().split('Tools')[0]);
      }
      await d.getByTestId('ai-agent-new-litellm-key').fill('');
    }
    if (/Another endpoint/.test(o)) {
      await d.getByTestId('ai-agent-new-litellm-url').fill('gpu.example');
      await page.waitForTimeout(500);
      console.log('   url "gpu.example":', (await text(d)).split('Base URL').pop().split('API key')[0]);
      await d.getByTestId('ai-agent-new-litellm-url').fill('');
    }
  }
  console.log('\n== Tools');
  await d.getByTestId('ai-agent-tools').click();
  await page.waitForTimeout(1000);
  console.log('   ', await text(menu()));
  await c.shot('ai-agent/cr-tools', { around: [menu(), d.getByTestId('ai-agent-tools')] });
  // All tools off (the menu stays open between picks).
  // Each pick closes the menu.
  for (const t of ['read', 'grep', 'glob']) {
    if (!(await page.getByTestId(`ai-agent-tool-${t}`).isVisible())) { await d.getByTestId('ai-agent-tools').click(); await page.waitForTimeout(700); }
    await page.getByTestId(`ai-agent-tool-${t}`).click();
    await page.waitForTimeout(500);
  }
  if (await page.getByTestId('ai-agent-tool-read').isVisible()) await esc();
  console.log('   no tools:', await d.getByTestId('ai-agent-tools').innerText());
  // Instructions over the limit
  await d.getByTestId('ai-agent-instructions').fill('x'.repeat(20001));
  await d.getByRole('button', { name: 'Deploy', exact: true }).click();
  await page.waitForTimeout(1000);
  console.log('   20001 chars:', (await text(d)).split('Instructions').pop().slice(0, 200));
  await d.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.waitForTimeout(1000);
  console.log('after Cancel, dialogs:', await page.locator('[role=dialog]').count());
}
if (SECTIONS.includes('deploy')) {
  // TEMPLATE=<label>; MODEL=endpoint (the AI model's URL and key through
  // "Another endpoint": deploys an AI Gateway), <ai model name> (direct), or
  // gateway:<model id> (an AI Gateway already here). SITE= for templates with the widget.
  const T = process.env.TEMPLATE ?? 'Webhook triage';
  const MODEL = process.env.MODEL ?? 'endpoint';
  const P = process.env.PFX ?? 'ai-agent/dp';
  await d.getByRole('radio', { name: T, exact: true }).click();
  await page.waitForTimeout(1000);
  if (process.env.SITE) await d.getByTestId('ai-agent-site').fill(process.env.SITE);
  if (process.env.INSTRUCTIONS) await d.getByTestId('ai-agent-instructions').fill(process.env.INSTRUCTIONS);
  await d.getByTestId('ai-agent-model').click();
  await page.waitForTimeout(1200);
  console.log('model list:', await text(menu()));
  if (MODEL.startsWith('gateway:')) await c.shot(`${P}-models`, { around: [menu(), d.getByTestId('ai-agent-model')] });
  if (MODEL === 'endpoint') {
    await page.getByTestId('ai-agent-other-custom').click();
    await page.waitForTimeout(800);
    const m = await page.evaluate(async ([P, N]) => {
      const list = await (await fetch(`/api/ai-models/${P}/dev`)).json();
      const row = list.find((x) => x.name === N);
      const key = (await (await fetch(`/api/ai-models/${P}/dev/${N}/key`)).json()).key;
      return { baseUrl: row.baseUrl, model: row.model ?? row.modelId ?? row.hfId, key };
    }, [PROJECT, process.env.AI_MODEL ?? 'docs-qwen']);
    await d.getByTestId('ai-agent-new-litellm-url').fill(m.baseUrl);
    await d.getByTestId('ai-agent-new-litellm-key').fill(m.key);
    await d.getByTestId('ai-agent-new-litellm-models').fill(m.model);
  } else if (MODEL.startsWith('gateway:')) {
    await menu().getByRole('option').filter({ hasText: MODEL.slice(8) }).first().click();
  } else {
    await menu().getByRole('option').filter({ hasText: MODEL }).first().click();
  }
  await page.waitForTimeout(1000);
  console.log('form:', (await text(d)).split('Instructions').pop());
  await c.shot(`${P}-filled`, { locator: '[role=dialog]' });
  await d.getByRole('button', { name: 'Deploy', exact: true }).click();
  let shotStep = false;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(5000);
    const step = await page.getByTestId('ai-agent-new-litellm-step').innerText().catch(() => '');
    const hook = page.getByTestId('ai-agent-created-webhook');
    console.log(`  ${i}: step="${step}" toasts=${await toasts()}`);
    if (step && !shotStep && i > 2) { await c.shot(`${P}-gateway-step`, { locator: '[role=dialog]' }); shotStep = true; }
    if (await hook.count()) {
      // Shown once: keep it for the webhook calls (never printed), then hide it.
      const codes = await hook.locator('code').allInnerTexts();
      if (process.env.SECRETS_DIR) {
        const fs = await import('node:fs');
        fs.writeFileSync(`${process.env.SECRETS_DIR}/hook.json`, JSON.stringify({ url: codes[0], secret: codes[1] }));
      }
      await hook.evaluate((el) => { const cs = el.querySelectorAll('code'); if (cs[1]) cs[1].textContent = '••••••••••••••••••••••••'; });
      console.log('created webhook:', (await text(hook)).replace(codes[1] ?? '@@', '<secret>'));
      await c.shot(`${P}-webhook`, { locator: '[role=dialog]' });
      await d.getByRole('button', { name: 'Done', exact: true }).click();
      break;
    }
    if (!(await page.getByText('New AI agent').count())) break;
  }
  await page.waitForTimeout(3000);
  console.log('after:', await toasts());
}
await c.done();
