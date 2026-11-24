// The agent's team chat page, opened with "open chat" on its card: every
// control, and one chat. Q="question" (sent as is), SHOT=<id suffix> for the answer.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const AGENT = process.env.AGENT ?? 'ai-agent-5m73';
const SECTIONS = (process.env.SECTIONS ?? 'look,ask').split(',');
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 4000);
const ctrls = (l) => l.locator('button, a, [role=tab], [role=combobox], [role=switch], input, textarea, select').evaluateAll((els) => els.filter((e) => e.offsetParent).map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${e.getAttribute('title') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 40)}`));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.getByRole('button', { name: 'Designer' }).waitFor({ timeout: 90000 });
await page.getByRole('button', { name: 'Designer' }).click();
await page.waitForTimeout(6000);
const card = page.locator(`[data-id="hub-${AGENT}"]`).first();
const before = page.context().pages().length;
await card.getByText('open chat').first().click();
await page.waitForTimeout(8000);
const chat = page.context().pages().slice(before)[0];
await chat.setViewportSize({ width: 1440, height: 900 }).catch(() => {});
await chat.waitForLoadState('load').catch(() => {});
await chat.waitForTimeout(4000);
const u = new URL(chat.url());
console.log('url:', u.origin + u.pathname);
// Mask the account on the chat page too.
const MASK = (process.env.CAPTURE_MASK ?? '').split(',').filter(Boolean);
const mask = () => chat.evaluate((words) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) for (const x of words) if (n.nodeValue.includes(x)) n.nodeValue = n.nodeValue.split(x).join('you@example.com'); }, MASK);
const shotChat = async (id) => { await mask(); await c.shotPage(`ai-agent/${id}`, chat, u.pathname); };
if (SECTIONS.includes('look')) {
  console.log('page:', await text(chat.locator('body')));
  console.log('controls:', JSON.stringify(await ctrls(chat.locator('body'))));
  await shotChat('chat-empty');
}
if (process.env.SYSPROMPT) {
  // The chat page's own Controls → System Prompt: does it reach the agent?
  await chat.getByRole('button', { name: 'Model controls' }).click();
  await chat.waitForTimeout(1500);
  await chat.getByPlaceholder('Enter system prompt').fill(process.env.SYSPROMPT);
  await chat.waitForTimeout(800);
  await chat.keyboard.press('Escape');
}
if (SECTIONS.includes('ask')) {
  for (const q of (process.env.Q ?? 'Hi! Who are you and what can you do? /no_think').split('||')) {
    const box = chat.locator('textarea, [contenteditable=true], input[type=text]').first();
    await box.fill(q);
    const t0 = Date.now();
    // Done when a new answer gets its action row (Regenerate).
    const n0 = await chat.getByRole('button', { name: 'Copy', exact: true }).count();
    let last = '';
    await box.press('Enter').catch(() => {});
    for (let i = 0; i < 45; i++) {
      await chat.waitForTimeout(4000);
      if ((await chat.getByRole('button', { name: 'Copy', exact: true }).count()) >= n0 + 2) break;
    }
    await chat.waitForTimeout(1500);
    last = await text(chat.locator('main, body').first());
    console.log(`\nQ: ${q}  (${Math.round((Date.now() - t0) / 1000)}s)\n  page: ${last.slice(-1500)}`);
  }
  console.log('controls now:', JSON.stringify(await ctrls(chat.locator('body'))));
  if (process.env.SHOT) await shotChat(process.env.SHOT);
}
if (SECTIONS.includes('controls')) {
  // Try each control of the page header / sidebar, read what it does.
  for (const name of (process.env.CLICK ?? '').split('||').filter(Boolean)) {
    const el = chat.getByRole('button', { name }).or(chat.getByTitle(name)).or(chat.getByText(name, { exact: true })).first();
    await el.click();
    await chat.waitForTimeout(2500);
    console.log(`\nclick "${name}":`, (await text(chat.locator('body'))).slice(0, 1500));
    if (process.env.SHOTS) await shotChat(`chat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
  }
}
await chat.close();
await c.done();
