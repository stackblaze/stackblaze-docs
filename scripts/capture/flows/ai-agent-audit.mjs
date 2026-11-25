// AI agent depth checks on a throwaway agent (echo model behind its own AI
// Gateway): an eval run's results with abstentions, and an optimization run.
// SECTIONS=eval|optimization  AGENT=<resource name>  EVAL=<eval name>
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'docs-a-aqp2';
const EVAL = process.env.EVAL ?? 'echo-test';
const SECTIONS = (process.env.SECTIONS ?? 'eval').split(',');
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 4000);
const sheet = () => page.locator('[role=dialog]').last();
const card = () => page.locator(`[data-id="hub-${AGENT}"], [data-testid="app-card-canvas-group-${AGENT}"] button[aria-label^="Manage "]`).first();
async function openAgent(sub) {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await card().waitFor({ timeout: 120000 });
  await page.waitForTimeout(2000);
  await card().click({ position: { x: 40, y: 20 } });
  await page.waitForTimeout(3000);
  await sheet().getByRole('tab', { name: /^Agent/ }).click();
  await page.waitForTimeout(1500);
  await sheet().getByTestId(`ai-agent-section-${sub}`).click();
  await page.waitForTimeout(2500);
}

if (SECTIONS.includes('eval')) {
  await openAgent('evals');
  const row = sheet().getByTestId(`ai-agent-eval-${EVAL}`);
  console.log('eval row:', await text(row));
  await row.getByRole('button', { name: 'Results' }).click();
  await page.waitForTimeout(2500);
  const res = sheet().getByTestId('ai-agent-eval-results');
  console.log('results:', await text(res));
  await res.scrollIntoViewIfNeeded();
  await c.shot('ai-agent/ev-abstain-summary', { around: [sheet().getByTestId('ai-agent-eval-summary'), res.locator('p', { hasText: 'Abstained:' })] });
  const sample = sheet().getByTestId('ai-agent-eval-sample-result-no-ref');
  await sample.scrollIntoViewIfNeeded();
  await c.shot('ai-agent/ev-abstain-trial', { around: [sample] });
}

if (SECTIONS.includes('optimization')) {
  await openAgent('optimizations');
  const o = sheet().getByTestId('ai-agent-optimizations');
  console.log('optimizations:', await text(o));
  await c.shot('ai-agent/op-list', { locator: '[data-testid=ai-agent-optimizations]' });
  await o.getByRole('button', { name: 'Open' }).first().click();
  await page.waitForTimeout(2500);
  const run = sheet().getByTestId('ai-agent-optimization-run').first();
  if (await run.count()) {
    await run.scrollIntoViewIfNeeded();
    console.log('run:', await text(run));
    await c.shot('ai-agent/op-run', { around: [run] });
  }
}
await c.done();
