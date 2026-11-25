// A worker whose process keeps exiting: what its canvas card and its
// Deployment tab show. Runs on a scratch worker `crashworker` in github-demo-cw8z
// (start command: sh -c 'echo worker starting; sleep 5; echo boom; exit 1').
import { open } from '../lib.mjs';
import { SHEET } from './_settings.mjs';

const PROJECT = process.env.CAPTURE_PROJECT ?? 'github-demo-cw8z';
const SERVICE = process.env.CAPTURE_SERVICE ?? 'crashworker';
const c = await open();
const { page } = c;
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
const apps = page.getByRole('button', { name: 'Apps', exact: true }).first();
await apps.waitFor({ timeout: 60000 }).catch(() => {});
await apps.click().catch(() => {}); await page.waitForTimeout(4000);
const card = page.getByRole('button', { name: new RegExp(`^Manage ${SERVICE}\\b`) }).first();
await card.waitFor({ timeout: 90000 });
console.log('card:', (await card.innerText()).replace(/\s+/g, ' '));
const node = card.locator('xpath=ancestor::*[contains(@class,"vue-flow__node")][1]');
await c.shot('net/worker-crash-card', { around: (await node.count()) ? node : card, pad: 12 });
await card.click();
await page.locator('button,[role=tab],a').filter({ hasText: /^Deployment/ }).first().click().catch(() => {});
await page.waitForTimeout(6000);
console.log('sheet:', (await page.locator(SHEET).innerText()).replace(/\s+/g, ' ').slice(0, 1200));
await c.shot('net/worker-crash-deployment', { locator: SHEET });
await page.locator('button,[role=tab],a').filter({ hasText: /^Logs/ }).first().click();
await page.waitForTimeout(8000);
console.log('logs:', (await page.locator(SHEET).innerText()).replace(/\s+/g, ' ').slice(0, 600));
await c.shot('net/worker-crash-logs', { locator: SHEET });
await c.done();
