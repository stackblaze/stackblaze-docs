// Troubleshooting: a deploy whose build failed (an npm "build" script that
// exits 1, deployed with `stackblaze up --ci --wait`), then Diagnose on its
// row in the Deployment tab. Needs that failed row on APP in PROJECT/dev.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const APP = process.env.APP ?? 'ci-demo';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2500);

await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(2500);
const appsBtn = page.getByRole('button', { name: 'Apps', exact: true }).first();
await appsBtn.waitFor({ timeout: 60000 }).catch(() => {}); await appsBtn.click().catch(() => {}); await page.waitForTimeout(2000);
await page.getByRole('button', { name: new RegExp(`^Manage ${APP}\\b`) }).first().click(); await page.waitForTimeout(2500);
await page.getByRole('tab', { name: 'Deployment' }).click(); await page.waitForTimeout(3000);
const sheet = page.locator('[role=dialog]').last();
console.log('1. Deployment tab:', await text(sheet));
await c.shot('troubleshooting/1-failed-row', { around: sheet, pad: 0 });

const diagnose = sheet.getByRole('button', { name: 'Diagnose', exact: true }).first();
await diagnose.waitFor({ timeout: 30000 });
await diagnose.click();
// The analysis loads after the click; wait until the button has turned into Hide diagnosis and text settles.
await sheet.getByRole('button', { name: 'Hide diagnosis' }).first().waitFor({ timeout: 30000 });
let before = '';
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(5000);
  const now = await text(sheet);
  if (now === before && !/Analy[sz]ing|Loading/i.test(now)) break;
  before = now;
}
console.log('2. Diagnosis:', await text(sheet));
await c.shot('troubleshooting/2-diagnose', { around: sheet, pad: 0 });
await c.done();
