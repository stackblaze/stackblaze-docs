// + Service → Function: create one, look at every tab, change the code and
// deploy it, call its URL, then explore its Schedule setting.
//   PROJECT (existing project, Dev environment)  STEP (where to stop)
import { open } from '../lib.mjs';

const PROJECT = process.env.PROJECT ?? 'github-demo-83cy';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
const canvas = () => c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await canvas();

const APP = process.env.APP;
if (process.env.DEBUG) page.on('response', async (r) => {
  const u = new URL(r.url());
  if (/\/api\//.test(u.pathname) && r.request().method() !== 'GET') {
    let body = r.request().postData() || '';
    try { const j = JSON.parse(body); body = JSON.stringify({ envVars: j.envVars?.map((v) => v.name), fn: j.function ? Object.keys(j.function) : undefined, keys: Object.keys(j).slice(0, 25) }); } catch {}
    console.log(`    ${r.request().method()} ${u.pathname} ${r.status()} ${body.slice(0, 400)} → ${(await r.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300)}`);
  }
});
const sheet = page.locator('[role=dialog]').last();
const openSheet = async (tab) => {
  await canvas();
  await page.getByText(APP, { exact: true }).first().click();
  await page.getByRole('tab', { name: tab }).first().click();
  await page.waitForTimeout(3000);
};
if (!APP) {
  console.log('1. + Service → Function');
  await page.getByTestId('canvas-new-service').click();
  await page.waitForTimeout(1000);
  const row = page.locator('[role=dialog]').last().getByText('One TypeScript file, no build');
  await row.scrollIntoViewIfNeeded();
  await c.shot('functions/1-menu', { locator: '[role=dialog]' });
  await row.click();

  console.log('2. The function opens on its Code tab');
  const sheet = page.locator('[role=dialog]').last();
  await page.getByRole('tab', { name: 'Code' }).waitFor({ timeout: 120000 });
  await page.waitForTimeout(8000);
  console.log('   ', await text(sheet));
  const tabs = await sheet.getByRole('tab').allInnerTexts();
  console.log('    tabs:', JSON.stringify(tabs));
  await c.shot('functions/2-code');
  console.log(JSON.stringify({ created: true }));
  c.checkpoint(); await c.done(); process.exit(0);
}

const CODE = process.env.CODE_FILE ? (await import('node:fs')).readFileSync(process.env.CODE_FILE, 'utf8') : `// Runs on Bun. Import any npm package: import { Hono } from "hono@4"
Bun.serve({
  port: Number(process.env.PORT ?? 8080),
  fetch(req) {
    const url = new URL(req.url);
    return Response.json({ path: url.pathname, greeting: process.env.GREETING ?? "hello" });
  },
});
`;

const STEPS = (process.env.STEPS ?? 'code,tabs,vars,schedule').split(',');
if (STEPS.includes('code')) {
console.log('3. Change the code → Deploy');
await openSheet('Code');
const ed = sheet.locator('.monaco-editor').first();
await ed.click();
await page.keyboard.press('Control+A');
await page.keyboard.press('Delete');
// Monaco re-indents typed text: paste it, as you would.
await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url()).origin });
await page.evaluate((t) => navigator.clipboard.writeText(t), CODE);
await page.keyboard.press('Control+V');
await page.waitForTimeout(1500);
console.log('    note:', await text(sheet.getByRole('button', { name: 'Deploy', exact: true }).locator('xpath=..')));
await c.shot(process.env.CODE_FILE ? 'functions/3b-job-code' : 'functions/3-edited');
await sheet.getByRole('button', { name: 'Deploy', exact: true }).click();
await page.locator('[data-sonner-toast]').filter({ hasText: /Deployed|Deploy failed/ }).first().waitFor({ timeout: 120000 });
console.log('    toast:', await text(page.locator('[data-sonner-toast]').first()));
if (!process.env.CODE_FILE) await c.shot('functions/4-deployed');
}

if (STEPS.includes('tabs')) for (const tab of ['Variables', 'Deployment', 'Logs', 'Metrics', 'Settings']) {
  console.log(`5. ${tab}`);
  await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).first().click();
  await page.waitForTimeout(5000);
  console.log('   ', (await text(sheet)).split('Settings').slice(1).join('Settings').slice(0, 1400));
  const ctl = await sheet.locator('[role=tabpanel] button, [role=tabpanel] [role=combobox], [role=tabpanel] input, [role=tabpanel] [role=switch]').evaluateAll((els) => els.map((e) => `${e.getAttribute('role') ?? e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || '').trim().slice(0, 30)}`));
  console.log('    controls:', JSON.stringify(ctl).slice(0, 1500));
  await c.shot(`functions/5-${tab.toLowerCase()}`);
}

const commitAndDeploy = async (msg) => {
  await page.getByRole('button', { name: /Commit 1 change/ }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Commit 1 change/ }).click();
  await page.getByText('1 change to apply').waitFor();
  console.log('    commit:', await text(page.locator('[role=dialog]').last()));
  await page.getByPlaceholder('How these releases appear in the history').fill(msg);
  return page.getByRole('button', { name: 'Deploy 1 change' });
};

if (STEPS.includes('vars')) {
  console.log('6. Variables → GREETING → commit → deploy');
  await openSheet('Variables');
  await page.getByText('Environment Variables').waitFor();
  const keys = await page.getByPlaceholder('KEY').evaluateAll((els) => els.map((e) => e.value));
  console.log('    keys:', keys);
  if (keys.includes('GREETING')) await page.getByPlaceholder('value').nth(keys.indexOf('GREETING')).fill('hello from a variable');
  else {
    await page.getByRole('button', { name: 'Add variable' }).click();
    await page.getByPlaceholder('KEY').last().fill('GREETING');
    await page.getByPlaceholder('value').last().fill('hello from a variable');
  }
  await c.shot('functions/6-variable');
  const deploy = await commitAndDeploy('Set GREETING');
  await deploy.click();
  await page.getByText('1 change to apply').waitFor({ state: 'hidden', timeout: 60000 });
  await page.waitForTimeout(25000);
  console.log('    toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
}

if (STEPS.includes('schedule')) {
  console.log('7. Settings → Schedule: every option');
  await openSheet('Settings');
  const sched = sheet.locator('[data-settings-section=schedule]');
  const pick = async (label) => {
    await sched.locator('#function-schedule').click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await page.waitForTimeout(800);
  };
  await sched.locator('#function-schedule').click();
  console.log('    options:', JSON.stringify(await page.getByRole('option').allInnerTexts()));
  await c.shot('functions/7-schedule-options', { locator: '[role=dialog]' });
  await page.keyboard.press('Escape');
  for (const [label, id] of [['Every day', 'daily'], ['Every week', 'weekly'], ['Custom', 'custom']]) {
    await pick(label);
    const ctl = await sched.locator('input, [role=combobox], button[aria-label]').evaluateAll((els) => els.map((e) => `${e.getAttribute('aria-label') ?? e.id}=${e.value ?? e.innerText}`));
    console.log(`    ${label}:`, JSON.stringify(ctl));
    await sched.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await c.shot(`functions/7-schedule-${id}`, { locator: '[data-settings-section=schedule]' });
  }
  await pick('Every 5 minutes');
  const deploy = await commitAndDeploy('Run every 5 minutes');
  await c.shot('functions/8-commit-schedule', { locator: '[role=dialog]' });
  await deploy.click();
  await page.getByText('1 change to apply').waitFor({ state: 'hidden', timeout: 60000 });
  await page.waitForTimeout(25000);
}
const card = () => page.locator('[data-testid^="app-card-"]').filter({ has: page.getByRole('heading', { name: APP, exact: true }) }).first();
if (STEPS.includes('card')) {
  await canvas();
  await page.waitForTimeout(3000);
  console.log('    card:', await text(card()));
  await c.shot('functions/9-scheduled-card');
}
if (STEPS.includes('runs')) {
  console.log('8. Logs of the scheduled runs');
  await openSheet('Logs');
  await page.waitForTimeout(8000);
  console.log('   ', (await text(sheet)).split('Settings').slice(1).join(' ').slice(0, 1200));
  const ctl = await sheet.locator('[role=tabpanel] button, [role=tabpanel] [role=combobox]').evaluateAll((els) => els.map((e) => `${e.getAttribute('aria-label') ?? ''}:${(e.innerText || '').trim().slice(0, 30)}`));
  console.log('    controls:', JSON.stringify(ctl));
  await c.shot('functions/10-runs');
}

if (STEPS.includes('unschedule')) {
  console.log('9. Schedule options, then back to No schedule');
  await openSheet('Settings');
  const sched = sheet.locator('[data-settings-section=schedule]');
  const pick = async (label) => {
    await sched.locator('#function-schedule').click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await page.waitForTimeout(800);
  };
  await sched.locator('#function-schedule').click();
  console.log('    options:', JSON.stringify(await page.getByRole('option').allInnerTexts()));
  await c.shot('functions/7-schedule-options', { locator: '[role=dialog]' });
  await page.keyboard.press('Escape');
  for (const [label, id] of [['Every day', 'daily'], ['Every week', 'weekly'], ['Custom', 'custom']]) {
    await pick(label);
    const ctl = await sched.locator('input, button[role=combobox]').evaluateAll((els) => els.map((e) => `${e.getAttribute('aria-label') ?? e.id}=${e.value || e.innerText}`));
    console.log(`    ${label}:`, JSON.stringify(ctl));
    await c.shot(`functions/7-schedule-${id}`, { locator: '[data-settings-section=schedule]' });
  }
  c.checkpoint();
  await pick('No schedule');
  const deploy = await commitAndDeploy('Serve HTTP again');
  await c.shot('functions/8-commit-unschedule', { locator: '[role=dialog]' });
  await deploy.click();
  await page.getByText('1 change to apply').waitFor({ state: 'hidden', timeout: 60000 });
  await page.waitForTimeout(25000);
}
c.checkpoint();
await c.done();
