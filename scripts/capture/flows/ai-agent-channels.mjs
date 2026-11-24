// AI agent channels: widget, API keys, webhooks, schedules and sessions.
// Run one step at a time: SECTIONS=look|key|revoke-key|hook|revoke-hook|
// schedule|schedule-off|widget|widget-off|sessions. A new key or webhook
// secret is written to $SECRETS_DIR (never printed) for the curl calls, and
// masked on screen before every shot.
import fs from 'node:fs';
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'ai-agent-mkgv';
// The card on the Designer canvas, or in the Apps view (the view the browser last used).
const card = () => page.locator(`[data-id="hub-${AGENT}"], [data-testid="app-card-canvas-group-${AGENT}"] button[aria-label^="Manage "]`).first();
const SECRETS = process.env.SECRETS_DIR;
const SECTIONS = (process.env.SECTIONS ?? 'look').split(',');
const c = await open();
const { page } = c;
// Other capture flows share this Chrome and may dismiss a native dialog
// first, so window.confirm answers OK here and logs its question.
await page.addInitScript(() => { window.confirm = (m) => { console.log('confirm: ' + m); return true; }; });
page.on('console', (m) => { if (m.text().startsWith('confirm: ')) console.log('    ' + m.text()); });
const SECRET_RE = /\b(sbai|sbak|sbwh|sk|whsec|sba)_?[A-Za-z0-9_-]{12,}/g;
const clean = (t) => t.replace(SECRET_RE, '<secret>');
const text = async (l) => clean((await l.innerText()).replace(/\s+/g, ' ').slice(0, 4000));
const sheet = () => page.locator('[role=dialog]').last();
const toasts = async () => clean((await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
// Secrets on screen become dots: the fresh key / webhook secret and the curl example.
async function hideSecrets() {
  await page.evaluate(() => {
    const dots = (s) => s.replace(/(Bearer )[^\s']+/g, '$1••••••••••••').replace(/\b[A-Za-z]+_[A-Za-z0-9_-]{12,}/g, '••••••••••••');
    for (const el of document.querySelectorAll('[data-testid=ai-agent-new-key] code, [data-testid=ai-agent-new-webhook] code, [data-testid=ai-agent-new-webhook] pre')) {
      if (el.closest('[data-testid=ai-agent-new-webhook]') && el.tagName === 'CODE' && /^https?:/.test(el.textContent)) continue;
      el.textContent = dots(el.textContent);
    }
  });
}
async function canvas() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await card().waitFor({ timeout: 120000 });
  await page.waitForTimeout(2000);
}
async function openAgent(sub, trigger) {
  await canvas();
  await card().click({ position: { x: 40, y: 20 } });
  await page.waitForTimeout(3000);
  await sheet().getByRole('tab', { name: /^Agent/ }).click();
  await page.waitForTimeout(1500);
  if (sub) { await sheet().getByTestId(`ai-agent-section-${sub}`).click(); await page.waitForTimeout(2500); }
  if (trigger) { await sheet().getByTestId(`ai-agent-trigger-${trigger}`).click(); await page.waitForTimeout(1500); }
}
// Stage the Agent tab's changes, then Commit → Deploy from the canvas.
async function stageAndCommit(shotPrefix) {
  await sheet().getByTestId('ai-agent-save').click();
  await page.waitForTimeout(3000);
  console.log('    staged:', await toasts());
  if (shotPrefix) await c.shot(`${shotPrefix}-staged`, { locator: '[role=dialog]' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click();
  await page.waitForTimeout(2000);
  const d = page.locator('[role=dialog]').last();
  console.log('    commit dialog:', await text(d));
  const btn = d.getByRole('button', { name: /^Deploy \d+ change/ }).last();
  await btn.click();
  await page.waitForTimeout(5000);
  console.log('    after commit:', await toasts());
}
const agentApi = () => page.evaluate(async ([P, N]) => {
  const list = await (await fetch(`/api/ai-agents/${P}/dev`)).json();
  return list.find((a) => a.name === N);
}, [PROJECT, AGENT]);
async function waitRunning(what) {
  for (let i = 0; i < 40; i++) {
    const a = await agentApi();
    if (what(a)) { console.log('    agent status:', a.status); return a; }
    await page.waitForTimeout(10000);
  }
  throw new Error('agent did not pick up the change');
}

if (SECTIONS.includes('look')) {
  await openAgent('triggers');
  for (const t of ['time', 'webhook', 'api', 'widget']) {
    await sheet().getByTestId(`ai-agent-trigger-${t}`).click();
    await page.waitForTimeout(1500);
    console.log(`triggers/${t}:`, (await text(sheet())).split('Widget').slice(1).join('Widget').slice(0, 1500));
  }
}

if (SECTIONS.includes('key')) {
  console.log('API: create a key');
  await openAgent('triggers', 'api');
  console.log('   ', (await text(sheet())).split('Widget').slice(1).join('Widget').slice(0, 800));
  await c.shot('ai-agent/ch-api-empty', { locator: '[data-testid=ai-agent-keys]' });
  await sheet().getByPlaceholder('What it is for, e.g. Website').fill('Docs test');
  await sheet().getByTestId('ai-agent-create-key').click();
  await sheet().getByTestId('ai-agent-new-key').waitFor({ timeout: 30000 });
  const key = (await sheet().locator('[data-testid=ai-agent-new-key] code').innerText()).trim();
  fs.writeFileSync(`${SECRETS}/agent-key`, key, { mode: 0o600 });
  console.log('    key saved, length', key.length, 'prefix', key.slice(0, 5));
  await hideSecrets();
  console.log('   ', (await text(sheet())).split('API keys').pop().slice(0, 600));
  await c.shot('ai-agent/ch-api-key', { locator: '[data-testid=ai-agent-keys]' });
  await sheet().getByRole('button', { name: 'Done', exact: true }).click();
  await page.waitForTimeout(1000);
  await c.shot('ai-agent/ch-api-list', { locator: '[data-testid=ai-agent-keys]' });
}

if (SECTIONS.includes('revoke-key')) {
  console.log('API: revoke the key');
  await openAgent('triggers', 'api');
  await sheet().locator('[data-testid^=ai-agent-revoke-]').first().click();
  await page.waitForTimeout(3000);
  console.log('    toasts:', await toasts());
  console.log('   ', (await text(sheet())).split('API keys').pop().slice(0, 400));
  await c.shot('ai-agent/ch-api-revoked', { locator: '[data-testid=ai-agent-keys]' });
}

if (SECTIONS.includes('hook')) {
  console.log('Webhook: create');
  await openAgent('triggers', 'webhook');
  await sheet().getByPlaceholder('What calls it, e.g. GitHub').fill('docs-test');
  await sheet().getByTestId('ai-agent-create-webhook').click();
  await sheet().getByTestId('ai-agent-new-webhook').waitFor({ timeout: 30000 });
  const codes = await sheet().locator('[data-testid=ai-agent-new-webhook] code').allInnerTexts();
  fs.writeFileSync(`${SECRETS}/hook-url`, codes[0].trim(), { mode: 0o600 });
  fs.writeFileSync(`${SECRETS}/hook-secret`, codes[1].trim(), { mode: 0o600 });
  console.log('    url host:', new URL(codes[0]).host, 'path:', new URL(codes[0]).pathname.replace(/[A-Za-z0-9_-]{16,}/g, '<id>'));
  await hideSecrets();
  console.log('   ', (await text(sheet())).split('Webhooks').pop().slice(0, 800));
  await c.shot('ai-agent/ch-webhook-new', { locator: '[data-testid=ai-agent-webhooks]' });
  await sheet().getByRole('button', { name: 'Done', exact: true }).click();
  await page.waitForTimeout(1000);
}

if (SECTIONS.includes('revoke-hook')) {
  console.log('Webhook: revoke');
  await openAgent('triggers', 'webhook');
  console.log('   ', (await text(sheet())).split('Webhooks').pop().slice(0, 500));
  await c.shot('ai-agent/ch-webhook-list', { locator: '[data-testid=ai-agent-webhooks]' });
  await sheet().locator('[data-testid^=ai-agent-revoke-webhook-]').first().click();
  await page.waitForTimeout(3000);
  console.log('    toasts:', await toasts());
}

if (SECTIONS.includes('schedule')) {
  console.log('Time: add a schedule');
  await openAgent('triggers', 'time');
  await sheet().getByTestId('ai-agent-add-schedule').click();
  await page.waitForTimeout(1000);
  const row = sheet().getByTestId('ai-agent-schedule-0');
  console.log('    new row:', await text(row));
  await row.getByRole('button', { name: 'Presets' }).click();
  await page.waitForTimeout(1000);
  console.log('    presets:', await text(page.locator('[role=menu]').last()));
  await c.shot('ai-agent/ch-schedule-presets');
  await page.keyboard.press('Escape');
  // Bad values: the errors the row shows.
  const cron = row.locator('input').first();
  await cron.fill('every day');
  await page.waitForTimeout(500);
  console.log('    bad cron:', await text(row));
  // Two minutes from now, in UTC, so the run shows quickly.
  const at = new Date(Date.now() + 3 * 60000);
  await cron.fill(`${at.getUTCMinutes()} ${at.getUTCHours()} * * *`);
  await row.getByRole('combobox').click();
  await page.waitForTimeout(800);
  await page.getByRole('option', { name: 'UTC', exact: true }).click();
  await page.waitForTimeout(500);
  console.log('    no message:', await text(row));
  await row.locator('textarea').fill('Which blend is decaf? Answer in one sentence.');
  await page.waitForTimeout(500);
  console.log('    filled:', await text(row));
  await c.shot('ai-agent/ch-schedule', { locator: '[data-testid=ai-agent-schedules]' });
  await stageAndCommit();
  await waitRunning((a) => a.schedules?.length === 1 && a.status === 'running');
}

if (SECTIONS.includes('schedule-off')) {
  console.log('Time: remove the schedule');
  await openAgent('triggers', 'time');
  console.log('   ', (await text(sheet().getByTestId('ai-agent-schedules'))));
  await sheet().getByTestId('ai-agent-schedule-0').getByRole('button', { name: 'Remove' }).click();
  await page.waitForTimeout(800);
  await stageAndCommit();
  await waitRunning((a) => !a.schedules?.length);
}

if (SECTIONS.includes('widget')) {
  console.log('Widget: turn it on');
  await openAgent('triggers', 'widget');
  await c.shot('ai-agent/ch-widget-off', { locator: '[data-testid=ai-agent-widget]' });
  await sheet().getByTestId('ai-agent-widget-enabled').click();
  await page.waitForTimeout(800);
  const o = sheet().getByTestId('ai-agent-widget-origin-0');
  await o.fill('acme.com');
  await page.waitForTimeout(500);
  console.log('    bad origin:', await text(sheet().getByTestId('ai-agent-widget')));
  await o.fill('https://acme.com/shop');
  await page.waitForTimeout(500);
  console.log('    path origin:', await text(sheet().getByTestId('ai-agent-widget')));
  await o.fill(process.env.ORIGIN ?? 'http://localhost:8765');
  await page.waitForTimeout(500);
  console.log('    ok:', await text(sheet().getByTestId('ai-agent-widget')));
  await c.shot('ai-agent/ch-widget-on', { locator: '[data-testid=ai-agent-widget]' });
  await stageAndCommit();
  await waitRunning((a) => a.widget?.enabled && a.status === 'running');
  await openAgent('triggers', 'widget');
  console.log('    after deploy:', await text(sheet().getByTestId('ai-agent-widget')));
  await c.shot('ai-agent/ch-widget-snippet', { locator: '[data-testid=ai-agent-widget]' });
  // What else the widget changes: General tools, Integrations.
  await sheet().getByTestId('ai-agent-section-integrations').click();
  await page.waitForTimeout(2000);
  console.log('    integrations with widget on:', await text(sheet().getByTestId('ai-agent-integrations')));
}

if (SECTIONS.includes('widget-try')) {
  // A test page on http://localhost:8765 (an allowed site) with the embed code.
  console.log('Widget: on a page');
  const site = process.env.SITE ?? 'http://localhost:8765/';
  await page.goto(site);
  await page.getByRole('button', { name: 'Open chat' }).waitFor({ timeout: 30000 });
  await c.shotPage('ai-agent/ch-widget-bubble', page, site);
  await page.getByRole('button', { name: 'Open chat' }).click();
  await page.waitForTimeout(5000);
  const f = page.frameLocator('iframe').first();
  console.log('    panel:', clean((await f.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 600)));
  const box = f.locator('textarea, input[type=text]').first();
  await box.fill('Do you sell decaf? /no_think');
  await box.press('Enter');
  let t = '';
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(5000);
    t = (await f.locator('body').innerText()).replace(/\s+/g, ' ');
    if (t.split('decaf?').pop().trim().length > 20 && !/thinking|…$/i.test(t)) break;
  }
  console.log('    answer:', t.slice(0, 800));
  await c.shotPage('ai-agent/ch-widget-chat', page, site);
  // The same page on a site that is not on the list.
  if (process.env.OTHER_SITE) {
    await page.goto(process.env.OTHER_SITE);
    await page.waitForTimeout(4000);
    const b = page.getByRole('button', { name: 'Open chat' });
    if (await b.count()) { await b.click(); await page.waitForTimeout(4000); console.log('    other site panel:', (await page.frameLocator('iframe').first().locator('body').innerText().catch((e) => e.message)).replace(/\s+/g, ' ').slice(0, 400)); }
    else console.log('    other site: no bubble');
  }
}

if (SECTIONS.includes('widget-off')) {
  console.log('Widget: turn it off');
  await openAgent('triggers', 'widget');
  await sheet().getByTestId('ai-agent-widget-enabled').click();
  await page.waitForTimeout(800);
  await stageAndCommit();
  await waitRunning((a) => !a.widget?.enabled && a.status === 'running');
}

if (SECTIONS.includes('sessions')) {
  console.log('Sessions');
  await openAgent('sessions');
  console.log('   ', (await text(sheet())).split('Sessions').slice(2).join('Sessions').slice(0, 1500));
  await c.shot('ai-agent/ch-sessions');
  await sheet().getByTestId('ai-agent-sessions-channel').click();
  await page.waitForTimeout(800);
  console.log('    channels:', await text(page.locator('[role=listbox]').last()));
  await c.shot('ai-agent/ch-sessions-channels');
  await page.getByRole('option', { name: process.env.CHANNEL ?? 'API', exact: true }).click();
  await page.waitForTimeout(2500);
  await sheet().locator('[data-testid^=ai-agent-session-]').first().click();
  await page.waitForTimeout(3000);
  console.log('    transcript:', await text(sheet().getByTestId('ai-agent-transcript')));
  await c.shot('ai-agent/ch-session-open');
}
await c.done();
