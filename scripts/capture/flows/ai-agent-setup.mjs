// Setup for the ai-agent-* pages: + Service → AI agent (FAQ bot) on the AI
// model already in this environment, through Another endpoint, exactly as
// content/docs/ai/agents.mdx describes. Takes no screenshots of its own.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const MODEL = process.env.MODEL ?? 'docs-qwen';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
const m = await page.evaluate(async ([P, N]) => {
  const list = await (await fetch(`/api/ai-models/${P}/dev`)).json();
  const row = list.find((x) => x.name === N);
  const key = (await (await fetch(`/api/ai-models/${P}/dev/${N}/key`)).json()).key;
  return { baseUrl: row.baseUrl, model: row.model ?? row.modelId ?? row.hfId, key };
}, [PROJECT, MODEL]);
console.log('model:', m.model, 'base:', m.baseUrl ? 'ok' : 'missing', 'key:', m.key ? 'ok' : 'missing');
await page.getByTestId('canvas-new-service').click();
await page.getByText('Chatbot or support agent with your instructions').click();
await page.waitForTimeout(4000);
const d = page.locator('[role=dialog]').last();
await d.getByRole('radio', { name: 'FAQ bot', exact: true }).click();
await d.getByTestId('ai-agent-model').click();
await page.getByTestId('ai-agent-other-custom').click();
await page.waitForTimeout(1000);
await d.getByTestId('ai-agent-new-litellm-url').fill(m.baseUrl);
await d.getByTestId('ai-agent-new-litellm-key').fill(m.key);
await d.getByTestId('ai-agent-new-litellm-models').fill(m.model);
await page.waitForTimeout(1000);
await d.getByRole('button', { name: 'Deploy', exact: true }).click();
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(15000);
  const t = (await text(page.locator('body'))).split('Designer').pop().replace(/sbai_\w+|sk-[\w-]+/g, '<key>');
  console.log(`  ${i}: ${t.slice(0, 300)}`);
  if (!(await page.getByText('New AI agent').count())) break;
}
await c.done();
