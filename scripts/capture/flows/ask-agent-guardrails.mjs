// Ask Agent: the Check performance entry point on an app's Metrics, and the
// confirmation card for a risky action (a restart), which we decline.
// Project github-demo-kpw0, environment dev, app nginx-unprivileged.
import { open } from '../lib.mjs';
const c = await open(); const { page } = c;
const PROJECT = 'github-demo-kpw0', PHASE = 'dev', APP = 'nginx-unprivileged';
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
const panelOf = async () => {
  const nc = page.locator('[aria-label="New conversation"]').first();
  const p = nc.locator('xpath=ancestor::*[self::aside or @role="complementary"][1]');
  if (await p.count()) return p;
  return page.locator('textarea').first().locator('xpath=ancestor::div[6]');
};

if (!process.env.SKIP_PERF) {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`); await page.waitForTimeout(3500);
  const apps = page.getByRole('button', { name: 'Apps', exact: true }).first(); await apps.waitFor({ timeout: 60000 }).catch(() => {}); await apps.click().catch(() => {}); await page.waitForTimeout(2000);
  await page.getByRole('button', { name: new RegExp(`^Manage ${APP}\\b`) }).first().click(); await page.waitForTimeout(2500);
  // Start from an empty conversation, so the answer is the only one in the panel.
  if (!(await page.locator('[aria-label="New conversation"]').count())) { await page.getByRole('button', { name: /Ask Agent/ }).first().click(); await page.waitForTimeout(3000); }
  await page.locator('[aria-label="New conversation"]').first().click(); await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: /^Metrics/ }).click(); await page.waitForTimeout(7000);
  const btn = page.locator('[role=dialog]').last().getByRole('button', { name: 'Check performance' }).first();
  console.log('check performance visible:', await btn.count());
  await btn.click(); await page.waitForTimeout(3000);
  const toast = page.locator('[data-sonner-toast]').first();
  if (await toast.count()) console.log('toast:', await text(toast));
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(5000); const t = await text(await panelOf()); if (i > 6 && /finding|slow|recommend|healthy|CPU/i.test(t.split('slow?').pop() || '')) break; }
  await page.waitForTimeout(8000);
  const P = await panelOf();
  console.log('perf panel:', (await text(P)).slice(-1500));
  await c.shot('ask-agent/perf-answer', { around: P, pad: 0 });
}

if (!process.env.SKIP_CONFIRM) {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`); await page.waitForTimeout(7000);
  if (!(await page.locator('textarea').count())) { await page.getByRole('button', { name: /Ask Agent/ }).first().click(); await page.waitForTimeout(3000); }
  let P = await panelOf();
  await P.locator('[aria-label="New conversation"]').first().click(); await page.waitForTimeout(2000);
  const box = page.locator('textarea').first();
  await box.click(); await page.keyboard.type('Restart @', { delay: 30 }); await page.waitForTimeout(1500);
  await page.keyboard.type(APP, { delay: 30 }); await page.waitForTimeout(1200);
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  let found = false;
  for (let i = 0; i < 36; i++) {
    await page.waitForTimeout(5000);
    P = await panelOf();
    if (await P.locator('[role=alert]').count()) { found = true; break; }
  }
  await page.waitForTimeout(2000);
  console.log('confirm card found:', found);
  console.log('confirm panel:', (await text(P)).slice(-1200));
  console.log('buttons:', JSON.stringify(await page.locator('button').evaluateAll((els) => els.map((e) => (e.innerText || '').trim()).filter((t) => /^(Restart|Cancel|Yes|No)/.test(t)))));
  await c.shot('ask-agent/confirm-card', { around: P, pad: 0 });
  // Decline.
  const cancel = page.getByText('Keep unchanged', { exact: true }).last();
  console.log('cancel option:', await cancel.count());
  await cancel.click(); await page.waitForTimeout(15000);
  console.log('after cancel:', (await text(await panelOf())).slice(-600));
  await c.shot('ask-agent/confirm-declined', { around: await panelOf(), pad: 0 });
}
await c.done();
