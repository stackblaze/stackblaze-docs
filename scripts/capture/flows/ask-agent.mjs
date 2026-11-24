// The Ask Agent side panel (header button toggles it): its controls and one
// read-only question.
import { open } from '../lib.mjs';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2500);
await c.goto(process.env.PATH_ ?? '/'); await page.waitForTimeout(6000);
let inp = page.locator('textarea, [contenteditable=true]');
if (!(await inp.count())) { await page.getByRole('button', { name: /Ask Agent/ }).first().click(); await page.waitForTimeout(3000); inp = page.locator('textarea, [contenteditable=true]'); }
console.log('inputs', await inp.count(), await inp.first().getAttribute('placeholder'));
const panel = inp.first().locator('xpath=ancestor::*[self::aside or @role="complementary" or contains(@class,"chat")][1]');
const P = (await panel.count()) ? panel : inp.first().locator('xpath=ancestor::div[6]');
console.log('1.', await text(P));
console.log('controls', JSON.stringify(await P.locator('button').evaluateAll((els) => els.slice(0, 40).map((e) => `${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.title || '').trim().slice(0, 40)}`))));
await c.shot('ask-agent/1-open');
if (process.env.ASK) {
  for (const [lbl, id] of [['Conversation history', 'history'], ['More options', 'more']]) {
    await P.locator(`[aria-label="${lbl}"]`).first().click(); await page.waitForTimeout(1500);
    const m = page.locator('[role=menu], [role=dialog], [data-reka-popper-content-wrapper]').last();
    console.log(`== ${id}:`, (await m.count()) ? (await text(m)).slice(0, 600) : '(none)');
    await c.shot(`ask-agent/2-${id}`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  }
  await P.locator('[aria-label="New conversation"]').first().click(); await page.waitForTimeout(2000);
  console.log('new:', (await text(P)).slice(0, 600));
  await c.shot('ask-agent/3-new');
  const box = page.locator('textarea, [contenteditable=true]').first();
  await box.click(); await page.keyboard.type('How many instances is @', { delay: 30 }); await page.waitForTimeout(1500);
  const pop = page.locator('[role=listbox], [role=menu]').last();
  console.log('mention list:', (await pop.count()) ? (await text(pop)).slice(0, 400) : '(none)');
  await c.shot('ask-agent/4-mention');
  await page.keyboard.type('nginx-w29b', { delay: 30 }); await page.waitForTimeout(1000);
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  await page.keyboard.type(' running? Answer in one sentence.', { delay: 20 });
  await page.waitForTimeout(500);
  await c.shot('ask-agent/5-typed');
  await page.keyboard.press('Enter');
  for (let i = 0; i < 24; i++) { await page.waitForTimeout(5000); const t = await text(P); if (/instance|replica|running/i.test(t.split('one sentence.').pop() || '') && i > 2) break; }
  await page.waitForTimeout(5000);
  console.log('answer:', (await text(P)).split('one sentence.').pop().slice(0, 800));
  await c.shot('ask-agent/6-answer');
}
await c.done();
