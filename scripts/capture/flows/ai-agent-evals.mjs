// AI agent Evals and Optimizations: the editor, one small real run, results.
// SECTIONS=editor|run|from-session|optimizations|delete
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'ai-agent-mkgv';
const SECTIONS = (process.env.SECTIONS ?? 'editor').split(',');
const c = await open();
const { page } = c;
await page.addInitScript(() => { window.confirm = (m) => { console.log('confirm: ' + m); return true; }; });
page.on('console', (m) => { if (m.text().startsWith('confirm: ')) console.log('    ' + m.text()); });
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 4000);
const sheet = () => page.locator('[role=dialog]').last();
// The card on the Designer canvas, or in the Apps view (the view the browser last used).
const card = () => page.locator(`[data-id="hub-${AGENT}"], [data-testid="app-card-canvas-group-${AGENT}"] button[aria-label^="Manage "]`).first();
const toasts = async () => (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ');
const pick = async (trigger, option) => { await trigger.click(); await page.waitForTimeout(700); await page.getByRole('option', { name: option, exact: true }).click(); await page.waitForTimeout(500); };
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
const EVAL = 'decaf';

if (SECTIONS.includes('editor')) {
  console.log('Evals: New eval');
  await openAgent('evals');
  const ev = sheet().getByTestId('ai-agent-evals');
  console.log('    empty:', await text(ev));
  await sheet().getByTestId('ai-agent-eval-new').click();
  await page.waitForTimeout(1500);
  const form = sheet().getByTestId('ai-agent-eval-form');
  console.log('    form:', await text(form));
  await sheet().getByTestId('ai-agent-eval-save').click();
  await page.waitForTimeout(800);
  console.log('    empty save:', await text(form));
  await sheet().getByTestId('ai-agent-eval-name').fill(EVAL);
  await sheet().getByTestId('ai-agent-eval-sample-id-0').fill('decaf');
  await sheet().getByTestId('ai-agent-eval-sample-input-0').fill('Do you sell decaf? /no_think');
  // Every check type and its fields.
  const types = ['Judge response quality', 'Tool was called', 'Tool call contains arguments', 'Output matches text'];
  const row0 = sheet().getByTestId('ai-agent-eval-check-0');
  if (!(await row0.count())) await sheet().getByTestId('ai-agent-eval-add-check').click();
  await sheet().getByTestId('ai-agent-eval-check-type-0').click();
  await page.waitForTimeout(700);
  console.log('    check types:', await text(page.locator('[role=listbox]').last()));
  await c.shot('ai-agent/ev-check-types');
  await page.keyboard.press('Escape');
  for (const t of types) {
    await pick(sheet().getByTestId('ai-agent-eval-check-type-0'), t);
    console.log(`    [${t}]:`, await text(sheet().getByTestId('ai-agent-eval-check-0')));
  }
  // The eval: the reply names the blend, the agent used read, and a judge.
  await pick(sheet().getByTestId('ai-agent-eval-check-type-0'), 'Output matches text');
  const r0 = sheet().getByTestId('ai-agent-eval-check-0');
  await r0.locator('input[type=text], input:not([type])').last().fill('Night Owl');
  console.log('    check 0:', await text(r0));
  await sheet().getByTestId('ai-agent-eval-add-check').click();
  await page.waitForTimeout(500);
  await pick(sheet().getByTestId('ai-agent-eval-check-type-1'), 'Tool was called');
  const r1 = sheet().getByTestId('ai-agent-eval-check-1');
  const toolIn = r1.locator('input').first();
  await toolIn.fill('read');
  console.log('    check 1:', await text(r1));
  await sheet().getByTestId('ai-agent-eval-add-check').click();
  await page.waitForTimeout(500);
  await pick(sheet().getByTestId('ai-agent-eval-check-type-2'), 'Judge response quality');
  const r2 = sheet().getByTestId('ai-agent-eval-check-2');
  await r2.getByLabel('Score name').fill('answered');
  await r2.getByLabel('What should a good result do?').fill('It says yes and names the Night Owl blend.');
  await sheet().getByTestId('ai-agent-eval-epochs').click();
  await page.waitForTimeout(600);
  console.log('    epochs:', await text(page.locator('[role=listbox]').last()));
  await page.keyboard.press('Escape');
  console.log('    run settings:', await text(sheet().getByTestId('ai-agent-eval-run-settings')));
  await sheet().getByTestId('ai-agent-eval-mode-json').click();
  await page.waitForTimeout(1000);
  console.log('    json:', (await sheet().getByTestId('ai-agent-eval-json').inputValue()).replace(/\s+/g, ' ').slice(0, 1200));
  await c.shot('ai-agent/ev-json', { locator: '[data-testid=ai-agent-eval-form]' });
  await sheet().getByTestId('ai-agent-eval-mode-guided').click();
  await page.waitForTimeout(800);
  await sheet().getByTestId('ai-agent-eval-save').click();
  await page.waitForTimeout(4000);
  console.log('    saved:', await toasts(), '::', await text(ev));
  await c.shot('ai-agent/ev-list', { locator: '[data-testid=ai-agent-evals]' });
}

if (SECTIONS.includes('run')) {
  console.log('Evals: Run');
  await openAgent('evals');
  const ev = sheet().getByTestId('ai-agent-evals');
  await sheet().getByTestId(`ai-agent-eval-run-${EVAL}`).click();
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(10000);
    const t = await text(ev);
    console.log(`    ${i}:`, t.split(EVAL).slice(1).join(EVAL).slice(0, 300), '| toasts:', await toasts());
    if ((await sheet().getByTestId('ai-agent-eval-results').count()) && !/running, /.test(t)) break;
  }
  console.log('    results:', await text(sheet().getByTestId('ai-agent-eval-results')));
  await c.shot('ai-agent/ev-results', { locator: '[data-testid=ai-agent-eval-results]' });
}

if (SECTIONS.includes('from-session')) {
  console.log('Sessions → Add to eval');
  await openAgent('sessions');
  await sheet().locator('[data-testid^=ai-agent-session-]').filter({ hasText: 'Which blend is decaf' }).first().click();
  await page.waitForTimeout(3000);
  await sheet().getByRole('button', { name: 'Add to eval' }).click();
  await page.waitForTimeout(2500);
  console.log('    incoming:', await text(sheet().getByTestId('ai-agent-eval-incoming')));
  await sheet().getByTestId('ai-agent-eval-incoming-target').click();
  await page.waitForTimeout(700);
  console.log('    targets:', await text(page.locator('[role=listbox]').last()));
  await page.keyboard.press('Escape');
  await c.shot('ai-agent/ev-incoming', { locator: '[data-testid=ai-agent-evals]' });
  await sheet().getByRole('button', { name: 'Cancel', exact: true }).click();
}

if (SECTIONS.includes('optimizations')) {
  console.log('Optimizations');
  await openAgent('optimizations');
  const o = sheet().getByTestId('ai-agent-optimizations');
  console.log('   ', await text(o));
  await c.shot('ai-agent/ev-optimizations', { locator: '[data-testid=ai-agent-optimizations]' });
  const b = sheet().getByTestId('ai-agent-optimization-budget');
  for (const v of ['0', '1000']) {
    await b.fill(v);
    await page.waitForTimeout(500);
    console.log(`    budget ${v}:`, await text(sheet().getByTestId('ai-agent-optimization-eligible')));
  }
}

if (SECTIONS.includes('delete')) {
  console.log('Evals: delete');
  await openAgent('evals');
  await sheet().getByTestId(`ai-agent-eval-delete-${EVAL}`).click();
  await page.waitForTimeout(3000);
  console.log('   ', await toasts(), '::', await text(sheet().getByTestId('ai-agent-evals')));
}
await c.done();
