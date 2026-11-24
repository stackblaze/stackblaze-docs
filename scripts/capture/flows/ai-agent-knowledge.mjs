// AI agent Knowledge, Skills and Integrations: every control.
// SECTIONS=knowledge|knowledge-delete|skills|skill-delete|integrations|integration-remove
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'ai-agent-mkgv';
const SECTIONS = (process.env.SECTIONS ?? 'knowledge').split(',');
const c = await open();
const { page } = c;
// Other capture flows share this Chrome and may dismiss a native dialog
// first, so window.confirm answers OK here and logs its question.
await page.addInitScript(() => { window.confirm = (m) => { console.log('confirm: ' + m); return true; }; });
page.on('console', (m) => { if (m.text().startsWith('confirm: ')) console.log('    ' + m.text()); });
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 4000);
const sheet = () => page.locator('[role=dialog]').last();
// The card on the Designer canvas, or in the Apps view (the view the browser last used).
const card = () => page.locator(`[data-id="hub-${AGENT}"], [data-testid="app-card-canvas-group-${AGENT}"] button[aria-label^="Manage "]`).first();
const toasts = async () => (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ');
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-kn-'));

if (SECTIONS.includes('knowledge')) {
  console.log('Knowledge');
  await openAgent('knowledge');
  const k = sheet().getByTestId('ai-agent-knowledge');
  console.log('    empty:', await text(k));
  await c.shot('ai-agent/kn-empty', { locator: '[data-testid=ai-agent-knowledge]' });
  // A file type the agent does not take, and a name it refuses.
  const bad = path.join(tmp, 'logo.png'); fs.writeFileSync(bad, 'x');
  const odd = path.join(tmp, '#notes.md'); fs.writeFileSync(odd, 'x');
  for (const f of [bad, odd]) {
    await sheet().getByTestId('ai-agent-knowledge-input').setInputFiles(f);
    await page.waitForTimeout(2500);
    console.log(`    ${path.basename(f)}:`, await toasts());
    if (f === bad) await c.shot('ai-agent/kn-bad-type');
    await page.locator('[data-sonner-toast]').evaluateAll((ts) => ts.forEach((t) => t.remove()));
  }
  await sheet().getByTestId('ai-agent-knowledge-input').setInputFiles(new URL('../samples/faq.md', import.meta.url).pathname);
  await page.waitForTimeout(6000);
  console.log('    uploaded:', await toasts(), '::', await text(k));
  await c.shot('ai-agent/kn-uploaded', { locator: '[data-testid=ai-agent-knowledge]' });
}

if (SECTIONS.includes('knowledge-delete')) {
  console.log('Knowledge: delete');
  await openAgent('knowledge');
  await sheet().locator('[data-testid^=ai-agent-knowledge-delete-]').first().click();
  await page.waitForTimeout(3000);
  console.log('   ', await toasts(), '::', await text(sheet().getByTestId('ai-agent-knowledge')));
}

if (SECTIONS.includes('skills')) {
  console.log('Skills');
  await openAgent('skills');
  const s = sheet().getByTestId('ai-agent-skills');
  console.log('    empty:', await text(s));
  await sheet().getByTestId('ai-agent-skill-new').click();
  await page.waitForTimeout(1000);
  console.log('    form:', await text(s));
  await sheet().getByTestId('ai-agent-skill-save').click();
  await page.waitForTimeout(800);
  console.log('    empty save:', await text(s));
  await c.shot('ai-agent/sk-errors', { locator: '[data-testid=ai-agent-skills]' });
  await sheet().getByTestId('ai-agent-skill-name').fill('Decaf Orders!');
  await page.waitForTimeout(300);
  console.log('    name typed as:', await sheet().getByTestId('ai-agent-skill-name').inputValue());
  await sheet().getByTestId('ai-agent-skill-name').fill('');
  await sheet().getByTestId('ai-agent-skill-name').pressSequentially('decaf-question');
  await sheet().getByTestId('ai-agent-skill-description').fill('A customer asks whether we sell decaf');
  await sheet().getByTestId('ai-agent-skill-body').fill('1. Read faq.md.\n2. Name the decaf blend.\n3. End the answer with: "Enjoy your coffee!"');
  await page.waitForTimeout(500);
  await c.shot('ai-agent/sk-form', { locator: '[data-testid=ai-agent-skills]' });
  await sheet().getByTestId('ai-agent-skill-save').click();
  await page.waitForTimeout(4000);
  console.log('    saved:', await toasts(), '::', await text(s));
  await c.shot('ai-agent/sk-list', { locator: '[data-testid=ai-agent-skills]' });
  await sheet().getByTestId('ai-agent-skill-edit-decaf-question').click();
  await page.waitForTimeout(1500);
  console.log('    edit:', await text(s), 'name disabled:', await sheet().getByTestId('ai-agent-skill-name').isDisabled());
  await sheet().getByRole('button', { name: 'Cancel', exact: true }).click();
}

if (SECTIONS.includes('skill-delete')) {
  console.log('Skills: delete');
  await openAgent('skills');
  await sheet().getByTestId('ai-agent-skill-delete-decaf-question').click();
  await page.waitForTimeout(3000);
  console.log('   ', await toasts(), '::', await text(sheet().getByTestId('ai-agent-skills')));
}

if (SECTIONS.includes('integrations')) {
  console.log('Integrations');
  await openAgent('integrations');
  const g = sheet().getByTestId('ai-agent-integrations');
  console.log('    empty:', await text(g));
  await sheet().getByTestId('ai-agent-integration-new').click();
  await page.waitForTimeout(1000);
  console.log('    form:', await text(g));
  await sheet().getByTestId('ai-agent-integration-save').click();
  await page.waitForTimeout(800);
  console.log('    empty save:', await text(g));
  await sheet().getByTestId('ai-agent-integration-preset').click();
  await page.waitForTimeout(1000);
  console.log('    services:', await text(page.locator('[role=listbox]').last()));
  await c.shot('ai-agent/in-services');
  await page.getByTestId('ai-agent-integration-preset-github').click();
  await page.waitForTimeout(800);
  console.log('    github:', await text(g));
  await sheet().getByTestId('ai-agent-integration-save').click();
  await page.waitForTimeout(800);
  console.log('    github no token:', await text(g));
  await c.shot('ai-agent/in-github', { locator: '[data-testid=ai-agent-integrations]' });
  await sheet().getByTestId('ai-agent-integration-preset').click();
  await page.waitForTimeout(800);
  await page.getByTestId('ai-agent-integration-preset-custom').click();
  await page.waitForTimeout(800);
  const url = sheet().getByTestId('ai-agent-integration-url');
  for (const u of ['http://mcp.example.com/mcp', 'https://10.0.0.5/mcp', 'https://user:pw@mcp.example.com/mcp']) {
    await url.fill(u);
    await sheet().getByTestId('ai-agent-integration-save').click();
    await page.waitForTimeout(600);
    console.log(`    url ${u.replace(/pw/, 'x')}:`, (await text(g)).match(/Server URL.{0,160}/)?.[0]);
  }
  if (process.env.MCP_URL) {
    await sheet().getByTestId('ai-agent-integration-name').fill('docs');
    await url.fill(process.env.MCP_URL);
    await page.waitForTimeout(500);
    await c.shot('ai-agent/in-custom', { locator: '[data-testid=ai-agent-integrations]' });
    await sheet().getByTestId('ai-agent-integration-save').click();
    await page.waitForTimeout(12000);
    console.log('    added:', await toasts(), '::', await text(g));
    await c.shot('ai-agent/in-list', { locator: '[data-testid=ai-agent-integrations]' });
  } else {
    await sheet().getByRole('button', { name: 'Cancel', exact: true }).click();
  }
}

if (SECTIONS.includes('integration-remove')) {
  console.log('Integrations: remove');
  await openAgent('integrations');
  await sheet().locator('[data-testid^=ai-agent-integration-remove-]').first().click();
  await page.waitForTimeout(4000);
  console.log('   ', await toasts(), '::', await text(sheet().getByTestId('ai-agent-integrations')));
}
fs.rmSync(tmp, { recursive: true, force: true });
await c.done();
