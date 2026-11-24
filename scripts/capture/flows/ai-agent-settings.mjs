// Agent → General: change the instructions, the model or the tools, stage
// it, and deploy it from the canvas. Then chat (ai-agent-chat.mjs) to see the
// effect. INSTRUCTIONS="…" | TOOLS=read,grep (empty = none) | MODEL=<option text>
// PFX=ai-agent/st-<name> for the shots. DISCARD=1: change, Discard, no deploy.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'ai-agent-5m73';
const PFX = process.env.PFX ?? 'ai-agent/st';
const c = await open();
const { page } = c;
const SECRET_RE = /\b(sbai|sbak|sbwh|sbag|sk|whsec)_?[A-Za-z0-9_-]{12,}/g;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').replace(SECRET_RE, '<secret>').slice(0, 3000);
const sheet = () => page.locator('[role=dialog]').last();
const toasts = async () => (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ');
const shot = async (id, o) => { if (!process.env.NOSHOTS) await c.shot(`${PFX}-${id}`, o); };
async function canvas() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await page.getByRole('button', { name: 'Designer' }).waitFor({ timeout: 90000 });
  await page.getByRole('button', { name: 'Designer' }).click();
  await page.waitForTimeout(5000);
}
await canvas();
await page.locator(`[data-id="hub-${AGENT}"]`).click({ position: { x: 40, y: 20 } });
await page.waitForTimeout(3000);
await sheet().getByRole('tab', { name: 'Agent', exact: true }).click();
await page.waitForTimeout(2500);
const g = sheet();
if (process.env.INSTRUCTIONS !== undefined) await g.getByTestId('ai-agent-instructions').fill(process.env.INSTRUCTIONS);
if (process.env.MODEL) {
  await g.getByTestId('ai-agent-model').click();
  await page.waitForTimeout(1200);
  const m = page.locator('[role=listbox]').last();
  console.log('model list:', await text(m));
  await shot('models', { around: [m, g.getByTestId('ai-agent-model')] });
  await m.getByRole('option').filter({ hasText: process.env.MODEL }).first().click();
  await page.waitForTimeout(1000);
}
if (process.env.TOOLS !== undefined) {
  const want = process.env.TOOLS.split(',').filter(Boolean);
  for (const t of ['read', 'grep', 'glob', 'web_search', 'todo', 'bash', 'edit', 'write']) {
    const cur = (await g.getByTestId('ai-agent-tools').innerText()).split(',').map((x) => x.trim());
    if (cur.includes(t) === want.includes(t)) continue;
    await g.getByTestId('ai-agent-tools').click();
    await page.waitForTimeout(700);
    await page.getByTestId(`ai-agent-tool-${t}`).click();
    await page.waitForTimeout(500);
    if (await page.getByTestId('ai-agent-tool-read').isVisible()) await page.keyboard.press('Escape');
  }
}
await page.waitForTimeout(800);
console.log('general:', (await text(g.getByTestId('ai-agent-settings'))).slice(0, 1500));
await shot('edited', { locator: '[role=dialog]' });
if (process.env.DISCARD) {
  await g.getByRole('button', { name: 'Discard', exact: true }).click();
  await page.waitForTimeout(1000);
  console.log('after Discard:', (await text(g.getByTestId('ai-agent-settings'))).slice(0, 600));
  await c.done();
  process.exit(0);
}
await g.getByTestId('ai-agent-save').click();
await page.waitForTimeout(3000);
console.log('staged toast:', await toasts());
console.log('sheet after stage:', (await text(g.getByTestId('ai-agent-settings'))).slice(0, 600));
await shot('staged', { locator: '[role=dialog]' });
await page.keyboard.press('Escape');
await page.waitForTimeout(1500);
const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
console.log('commit button:', await commit.innerText());
await commit.click();
await page.waitForTimeout(2000);
const d = page.locator('[role=dialog]').last();
console.log('commit dialog:', await text(d));
await shot('commit', { locator: '[role=dialog]' });
await d.getByRole('button', { name: /^Deploy \d+ change/ }).last().click();
await page.waitForTimeout(5000);
console.log('after commit:', await toasts());
// Wait for the agent to pick it up (restarted, running).
for (let i = 0; i < 40; i++) {
  const a = await page.evaluate(async ([P, N]) => (await (await fetch(`/api/ai-agents/${P}/dev`)).json()).find((x) => x.name === N), [PROJECT, AGENT]);
  console.log(`  ${i}: ${a.status} tools=${a.tools} model=${JSON.stringify(a.model)} ins=${a.instructions.slice(0, 60)}`);
  if (i > 2 && a.status === 'running') break;
  await page.waitForTimeout(10000);
}
await c.done();
