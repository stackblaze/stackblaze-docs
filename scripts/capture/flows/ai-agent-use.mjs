// Use a deployed AI agent: knowledge file, a chat, its session, triggers.
import { open } from '../lib.mjs';
const PROJECT = 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'ai-agent';
const SECTIONS = (process.env.SECTIONS ?? 'knowledge,chat,sessions,triggers,new').split(',');
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
const sheet = () => page.locator('[role=dialog]').last();
async function openAgent(sub) {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await page.locator(`button[aria-label="Manage ${AGENT}"]`).first().waitFor({ timeout: 90000 });
  await page.locator(`button[aria-label="Manage ${AGENT}"]`).first().click();
  await page.waitForTimeout(3000);
  await sheet().getByRole('tab', { name: /^Agent/ }).click();
  await page.waitForTimeout(1500);
  if (sub) { await sheet().getByRole('button', { name: sub, exact: true }).click(); await page.waitForTimeout(2500); }
}
if (SECTIONS.includes('knowledge')) {
  console.log('knowledge: upload faq.md');
  await openAgent('Knowledge');
  await sheet().locator('input[type=file]').setInputFiles(new URL('../samples/faq.md', import.meta.url).pathname);
  await page.waitForTimeout(6000);
  console.log('   ', (await text(sheet())).split('Knowledge').pop().slice(0, 500));
  await c.shot('ai-agent/u-knowledge');
}
if (SECTIONS.includes('chat')) {
  console.log('chat: open chat from the card');
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  const card = page.locator(`button[aria-label="Manage ${AGENT}"]`).first();
  await card.waitFor({ timeout: 90000 });
  const before = page.context().pages().length;
  await card.locator('xpath=ancestor::*[.//*[normalize-space()="open chat"]][1]').getByText('open chat').first().click();
  await page.waitForTimeout(8000);
  const chat = page.context().pages().slice(before)[0];
  await chat.waitForLoadState('load').catch(() => {});
  await chat.waitForTimeout(4000);
  console.log('    url:', new URL(chat.url()).origin + new URL(chat.url()).pathname, '|', (await chat.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400));
  await c.shotPage('ai-agent/u-chat-empty', chat, chat.url());
  const box = chat.locator('textarea, [contenteditable=true], input[type=text]').first();
  await box.fill(process.env.Q ?? 'Do you sell decaf? /no_think');
  await box.press('Enter');
  let answer = '';
  for (let i = 0; i < 24; i++) {
    await chat.waitForTimeout(10000);
    answer = (await chat.locator('body').innerText()).replace(/\s+/g, ' ');
    if (/Night Owl/i.test(answer)) break;
  }
  console.log('    answer:', answer.split('decaf?').pop().slice(0, 600));
  await c.shotPage(process.env.SHOT ?? 'ai-agent/u-chat-answer', chat, chat.url());
  await chat.close();
}
if (SECTIONS.includes('sessions')) {
  await openAgent('Sessions');
  console.log('sessions:', (await text(sheet())).split('Sessions').pop().slice(0, 600));
  await c.shot('ai-agent/u-sessions');
}
if (SECTIONS.includes('session')) {
  await openAgent('Sessions');
  await sheet().getByText('Do you sell decaf?').first().click();
  await page.waitForTimeout(3000);
  console.log('session:', (await text(sheet())).split('Pick a chat').join('').split('Sessions').pop().slice(0, 2500));
  await c.shot('ai-agent/u-session-detail');
}
if (SECTIONS.includes('triggers')) {
  await openAgent('Triggers');
  for (const t of ['Time', 'Webhook', 'API', 'Widget']) {
    const tb = sheet().getByRole('tab', { name: t, exact: true }).or(sheet().getByRole('button', { name: t, exact: true })).first();
    await tb.click();
    await page.waitForTimeout(2000);
    console.log(`triggers/${t}:`, (await text(sheet())).split('Widget').slice(1).join('Widget').replace(/sbai_\w+|sk-[\w-]+/g, '<key>').slice(0, 1200));
    await c.shot(`ai-agent/u-trigger-${t.toLowerCase()}`);
  }
}
if (SECTIONS.includes('new')) {
  for (const [sub, btn] of [['Skills', 'New skill'], ['Integrations', 'Add integration'], ['Evals', 'New eval']]) {
    await openAgent(sub);
    await sheet().getByRole('button', { name: btn }).first().click();
    await page.waitForTimeout(2500);
    console.log(`${sub} → ${btn}:`, (await text(page.locator('[role=dialog]').last())).split(sub).pop().slice(0, 1000));
    await c.shot(`ai-agent/u-${sub.toLowerCase()}-new`);
    await page.keyboard.press('Escape');
  }
}
await c.done();
