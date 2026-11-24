// AI agent: the info (i) text next to each Agent section's title, read by hovering.
import { open } from '../lib.mjs';
const AGENT='ai-agent-mkgv';
const c = await open(); const { page } = c;
const sheet = () => page.locator('[role=dialog]').last();
await c.goto('/pipeline/github-demo-cw8z/apps?phase=dev');
const card = page.locator(`[data-id="hub-${AGENT}"], [data-testid="app-card-canvas-group-${AGENT}"] button[aria-label^="Manage "]`).first();
await card.waitFor({ timeout: 120000 }); await page.waitForTimeout(1500);
await card.click({ position: { x: 40, y: 20 } }); await page.waitForTimeout(3000);
await sheet().getByRole('tab', { name: /^Agent/ }).click(); await page.waitForTimeout(1500);
const tip = async (label) => {
  const icons = sheet().locator('svg').filter({ has: page.locator('circle') });
  const h = sheet().getByText(label, { exact: true }).last();
  const box = await h.boundingBox(); if (!box) return 'no heading';
  await page.mouse.move(box.x + box.width + 12, box.y + box.height / 2); await page.waitForTimeout(1200);
  const t = await page.locator('[role=tooltip], [data-slot=tooltip-content], [data-reka-popper-content-wrapper]').allInnerTexts();
  await page.mouse.move(5, 5); await page.waitForTimeout(400);
  return [...new Set(t)].join(' | ').replace(/\s+/g, ' ');
};
for (const [sec, heads, trig] of [['knowledge',['Knowledge']],['skills',['Skills']],['integrations',['Integrations']],['evals',['Evals']],['optimizations',['Optimizations']],['sessions',['Sessions']],['triggers',['Schedules'],'time'],['triggers',['Webhooks'],'webhook'],['triggers',['API keys'],'api'],['triggers',['Website widget'],'widget']]) {
  await sheet().getByTestId(`ai-agent-section-${sec}`).click(); await page.waitForTimeout(2000);
  if (trig) { await sheet().getByTestId(`ai-agent-trigger-${trig}`).click(); await page.waitForTimeout(1000); }
  for (const h of heads) console.log(`${h}: ${await tip(h)}`);
}
process.exit(0);
