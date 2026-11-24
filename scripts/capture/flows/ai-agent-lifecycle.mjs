// An agent's lifecycle from its card's menu: Rename, Restart, Pause (and
// resume), Delete with what it removes. SECTIONS=rename|restart|pause|resume|delete
// AGENT=<resource name> NEWNAME=<display name> (rename) PFX for shots.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'ai-agent-5m73';
const PFX = process.env.PFX ?? 'ai-agent/lc';
const SECTIONS = (process.env.SECTIONS ?? 'rename').split(',');
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2500);
const toasts = async () => (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ');
const card = () => page.locator(`[data-id="hub-${AGENT}"]`).first();
async function canvas() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await page.getByRole('button', { name: 'Designer' }).waitFor({ timeout: 90000 });
  await page.getByRole('button', { name: 'Designer' }).click();
  await page.waitForTimeout(5000);
}
async function menuItem(label) {
  await card().click({ button: 'right', position: { x: 40, y: 20 } });
  await page.waitForTimeout(1500);
  const m = page.locator('[role=menu]').last();
  console.log(`menu (${label}):`, await text(m));
  await m.getByText(label, { exact: true }).click();
  await page.waitForTimeout(2500);
}
const agentApi = () => page.evaluate(async ([P, N]) => (await (await fetch(`/api/ai-agents/${P}/dev`)).json()).find((a) => a.name === N), [PROJECT, AGENT]);
async function commitAll(id) {
  const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
  console.log('commit:', await commit.innerText());
  await commit.click();
  await page.waitForTimeout(2000);
  const d = page.locator('[role=dialog]').last();
  console.log('commit dialog:', await text(d));
  const phrase = (await text(d)).match(/Type (sudo delete .+?) to confirm/)?.[1];
  if (phrase) await d.locator('input').first().fill(phrase);
  await page.waitForTimeout(800);
  if (id) await c.shot(id, { locator: '[role=dialog]' });
  await d.getByRole('button', { name: /^(Deploy \d+ change|Delete \d+ resource|Apply)/ }).last().click();
  await page.waitForTimeout(8000);
  console.log('after commit:', await toasts());
}
await canvas();
if (SECTIONS.includes('rename')) {
  await menuItem('Rename');
  const d = page.locator('[role=dialog], [role=alertdialog]').last();
  console.log('rename ui:', await text(d).catch(() => '?'), '| inputs:', await page.locator('input:focus').count());
  const inp = page.locator('input:focus');
  await inp.fill(process.env.NEWNAME ?? 'bean');
  await c.shot(`${PFX}-rename`, { around: [d], pad: 8 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);
  console.log('after rename:', await toasts(), '| card:', await text(card()));
  const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
  if (await commit.count()) await commitAll(`${PFX}-rename-commit`);
  await page.waitForTimeout(5000);
  const a = await agentApi();
  console.log('api:', a.displayName, a.title, a.url, a.status);
}
if (SECTIONS.includes('title')) {
  // The name at the top of the agent's panel (its display name).
  await card().click({ position: { x: 40, y: 20 } });
  await page.waitForTimeout(3500);
  const sh = page.locator('[role=dialog]').last();
  await sh.getByTestId('sheet-title-rename').click();
  await page.waitForTimeout(1000);
  console.log('title editor:', await text(sh.locator('header, [data-slot=sheet-header]').first()).catch(() => '?'));
  const inp = sh.locator('input').first();
  await inp.fill(process.env.NEWNAME ?? 'bean');
  await c.shot(`${PFX}-title`, { clip: { x: 624, y: 60, width: 816, height: 140 } });
  await inp.press('Enter');
  await page.waitForTimeout(4000);
  console.log('after title rename:', await toasts(), '|', await text(sh).then((t) => t.slice(0, 200)));
  await page.waitForTimeout(3000);
  const a = await agentApi();
  console.log('api:', a.displayName, a.title, a.url, a.status);
}
if (SECTIONS.includes('restart')) {
  await menuItem('Restart');
  console.log('restart dialog:', await text(page.locator('[role=dialog], [role=alertdialog]').last()).catch(() => 'none'));
  const btn = page.locator('[role=alertdialog], [role=dialog]').last().getByRole('button', { name: /Restart/ });
  if (await btn.count()) { await c.shot(`${PFX}-restart`, { locator: '[role=alertdialog], [role=dialog]' }); await btn.last().click(); await page.waitForTimeout(3000); }
  console.log('after restart:', await toasts());
  const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
  if (await commit.count()) await commitAll(`${PFX}-restart-commit`);
}
if (SECTIONS.includes('pause') || SECTIONS.includes('resume')) {
  const label = SECTIONS.includes('pause') ? 'Pause' : 'Resume';
  await menuItem(label);
  console.log(`${label} dialog:`, await text(page.locator('[role=dialog], [role=alertdialog]').last()).catch(() => 'none'));
  const btn = page.locator('[role=alertdialog], [role=dialog]').last().getByRole('button', { name: new RegExp(label) });
  if (await btn.count()) { await c.shot(`${PFX}-${label.toLowerCase()}`, { locator: '[role=alertdialog], [role=dialog]' }); await btn.last().click(); await page.waitForTimeout(3000); }
  console.log(`after ${label}:`, await toasts());
  const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
  if (await commit.count()) await commitAll(`${PFX}-${label.toLowerCase()}-commit`);
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(10000);
    await canvas();
    const t = await text(card());
    console.log(`  ${i}: ${t}`, (await agentApi())?.status);
    if (i > 1 && !/Deploying|Starting|Stopping|Pending/i.test(t)) break;
  }
  await c.shot(`${PFX}-${label.toLowerCase()}d-card`, { around: [card()], pad: 30 });
}
if (SECTIONS.includes('delete') || SECTIONS.includes('commitdel')) {
  if (SECTIONS.includes('delete')) await menuItem('Delete');
  console.log('after Delete:', await toasts(), '| card:', await text(card()).catch(() => 'gone'));
  const dlg = page.locator('[role=alertdialog]');
  if (await dlg.count()) { console.log('dialog:', await text(dlg.last())); await dlg.last().getByRole('button', { name: /^Delete/ }).last().click(); await page.waitForTimeout(2500); }
  await c.shot(`${PFX}-delete-staged`, { around: [card()], pad: 30 });
  await commitAll(`${PFX}-delete-commit`);
  await page.waitForTimeout(20000);
  await canvas();
  console.log('nodes after:', JSON.stringify(await page.locator('[data-id]').evaluateAll((e) => e.map((x) => x.getAttribute('data-id')).filter((x) => !x.includes('->')))));
  await c.shot(`${PFX}-after-delete`, { clip: { x: 0, y: 150, width: 1440, height: 700 } });
}
await c.done();
