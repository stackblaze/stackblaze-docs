// A deployed AI agent on the canvas: its card, the card's menu, and every tab
// and Agent section of its panel. SECTIONS=card,menu,tabs,agent  SHOTS=1 to keep shots.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'ai-agent-5m73';
const SECTIONS = (process.env.SECTIONS ?? 'card,menu,tabs,agent').split(',');
const PFX = process.env.PFX ?? 'ai-agent/p';
const c = await open();
const { page } = c;
const SECRET_RE = /\b(sbai|sbak|sbwh|sbag|sk|whsec)_?[A-Za-z0-9_-]{12,}/g;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').replace(SECRET_RE, '<secret>').slice(0, 5000);
const ctrls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=checkbox], input, textarea, select').evaluateAll((els) => els.filter((e) => e.offsetParent).map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('data-testid') ?? ''}:${(e.innerText || e.getAttribute('aria-label') || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 40)}`));
const sheet = () => page.locator('[role=dialog]').last();
const shot = async (id, o) => { if (process.env.SHOTS) await c.shot(`${PFX}-${id}`, o); };
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByRole('button', { name: 'Designer' }).waitFor({ timeout: 90000 });
await page.waitForTimeout(3000);
if (SECTIONS.includes('apps')) {
  // The Apps view: agents sit in one "AI agents" card.
  await page.getByRole('button', { name: 'Apps' }).click();
  await page.waitForTimeout(3000);
  const g = page.getByTestId('app-card-canvas-group-AI agents');
  const tog = page.getByTestId('app-card-services-toggle-canvas-group-AI agents');
  if (await tog.count()) { await tog.click(); await page.waitForTimeout(1500); }
  console.log('apps card:', await text(g));
  await shot('apps-card', { around: [g], pad: 16 });
}
await page.getByRole('button', { name: 'Designer' }).click();
await page.waitForTimeout(6000);
const card = page.locator(`[data-id="hub-${AGENT}"]`).first();
console.log('nodes:', JSON.stringify(await page.locator('[data-id]').evaluateAll((e) => e.map((x) => x.getAttribute('data-id')).filter((x) => !x.includes('->')))));
if (SECTIONS.includes('card')) {
  await card.waitFor({ timeout: 60000 });
  console.log('card:', await text(card));
  await shot('card', { around: [card, page.locator('[data-id^="aimodel-"], [data-id^="addon-"]').first()], pad: 24 });
}
if (SECTIONS.includes('menu')) {
  await card.click({ button: 'right', position: { x: 40, y: 20 } });
  await page.waitForTimeout(1500);
  const m = page.locator('[role=menu]').last();
  console.log('menu:', await text(m));
  await shot('menu', { around: [m], pad: 12 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
}
if (SECTIONS.includes('tabs') || SECTIONS.includes('agent')) {
  await card.click({ position: { x: 40, y: 20 } });
  await page.waitForTimeout(4000);
  console.log('sheet header:', (await text(sheet())).slice(0, 400));
  const tabs = (await sheet().getByRole('tab').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  console.log('tabs:', JSON.stringify(tabs));
  for (const t of tabs.filter((x) => SECTIONS.includes('tabs') || x.startsWith('Agent'))) {
    if (process.env.TABS && !process.env.TABS.split(',').some((o) => t.startsWith(o))) continue;
    await sheet().getByRole('tab', { name: t, exact: true }).click();
    await page.waitForTimeout(4000);
    console.log(`\n== tab ${t}:`, await text(sheet()));
    console.log('   controls:', JSON.stringify(await ctrls(sheet())));
    await shot(`tab-${t.toLowerCase().split(/\s/)[0]}`, { locator: '[role=dialog]' });
    if (t.startsWith('Agent') && SECTIONS.includes('agent')) {
      for (const sub of ['general', 'knowledge', 'skills', 'integrations', 'triggers', 'evals', 'optimizations', 'sessions']) {
        await sheet().getByTestId(`ai-agent-section-${sub}`).click();
        await page.waitForTimeout(3000);
        console.log(`\n  -- ${sub}:`, (await text(sheet().getByTestId('ai-agent-settings'))).slice(0, 2500));
        console.log('     controls:', JSON.stringify(await ctrls(sheet().getByTestId('ai-agent-settings'))));
      }
    }
  }
}
if (SECTIONS.includes('sessions') || SECTIONS.includes('tips') || SECTIONS.includes('section')) {
  await card.click({ position: { x: 40, y: 20 } });
  await page.waitForTimeout(3500);
  await sheet().getByRole('tab', { name: 'Agent', exact: true }).click();
  await page.waitForTimeout(2000);
}
if (SECTIONS.includes('tips')) {
  // The (i) next to each section's title.
  for (const sub of ['knowledge', 'skills', 'integrations', 'triggers', 'evals', 'optimizations', 'sessions']) {
    await sheet().getByTestId(`ai-agent-section-${sub}`).click();
    await page.waitForTimeout(1500);
    const tips = sheet().getByTestId('ai-agent-section-tip');
    for (let i = 0; i < (await tips.count()); i++) {
      await tips.nth(i).click();
      await page.waitForTimeout(900);
      const pop = await page.locator('[role=tooltip], [role=dialog][data-state=open] [data-reka-popper-content-wrapper], [data-reka-popper-content-wrapper]').allInnerTexts();
      console.log(`tip ${sub}/${i}:`, [...new Set(pop)].join(' | ').replace(/\s+/g, ' '));
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
      if (!(await page.locator('[role=dialog]').count())) { await card.click({ position: { x: 40, y: 20 } }); await page.waitForTimeout(3000); await sheet().getByRole('tab', { name: 'Agent', exact: true }).click(); await page.waitForTimeout(1500); await sheet().getByTestId(`ai-agent-section-${sub}`).click(); await page.waitForTimeout(1000); }
    }
  }
}
if (SECTIONS.includes('section')) {
  // SECTION=<name> [TRIGGER=<kind>]: one section's shot.
  await sheet().getByTestId(`ai-agent-section-${process.env.SECTION}`).click();
  await page.waitForTimeout(2500);
  if (process.env.TRIGGER) { await sheet().getByTestId(`ai-agent-trigger-${process.env.TRIGGER}`).click(); await page.waitForTimeout(1500); }
  console.log('section:', await text(sheet().getByTestId('ai-agent-settings')));
  await shot(`sec-${process.env.SECTION}${process.env.TRIGGER ? '-' + process.env.TRIGGER : ''}`, { locator: '[role=dialog]' });
}
if (SECTIONS.includes('sessions')) {
  await sheet().getByTestId('ai-agent-section-sessions').click();
  await page.waitForTimeout(3500);
  const s = sheet().getByTestId('ai-agent-settings');
  console.log('sessions:', await text(s));
  await shot('sessions', { locator: '[role=dialog]' });
  // PICK=0,1: open those rows (newest first) and read them.
  for (const i of (process.env.PICK ?? '').split(',').filter(Boolean)) {
    const rows = s.locator('[data-testid^="ai-agent-session-"]:not([data-testid=ai-agent-session-add-to-eval])');
    console.log('rows:', await rows.count());
    await rows.nth(+i).click();
    await page.waitForTimeout(3500);
    console.log(`session ${i}:`, await text(s));
    await shot(`session-${i}`, { locator: '[role=dialog]' });
  }
}
await c.done();
