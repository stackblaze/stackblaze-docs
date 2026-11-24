// + Service → Import: paste a docker-compose file, answer its prompt,
// add it to the canvas, commit and deploy, then check the result.
import { open } from '../lib.mjs';
import { readFileSync } from 'node:fs';

const FILE = process.env.FILE ?? new URL('../samples/docker-compose.yml', import.meta.url).pathname;
const PROJECT = process.env.PROJECT ?? `import-demo-${Date.now().toString(36).slice(-4)}`;
const STOP = process.env.STOP ?? 'deploy';
const TAG = process.env.TAG ?? '';
const sid = (n) => `import/${TAG ? `${TAG}-` : ''}${n}`;
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
if (!process.env.PROJECT) {
  await c.goto('/');
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder(/^Leave blank to auto-generate/).fill(PROJECT);
  await page.getByRole('button', { name: 'Create Project' }).click();
  await page.getByText('Deploy your first app').waitFor({ timeout: 60000 });
} else await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);

// A change staged by an earlier, interrupted run: discard it first.
if (await page.getByRole('button', { name: /^Commit \d+ change/ }).count()) {
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click();
  await page.getByRole('button', { name: 'Discard all' }).click();
  await page.waitForTimeout(1500);
  const ok = page.locator('[role=alertdialog], [role=dialog]').last().getByRole('button', { name: /^Discard/ });
  if (await ok.count()) await ok.click();
  await page.waitForTimeout(2000);
  console.log('0. discarded the earlier staged change');
}

console.log('1. + Service → Import');
await page.getByTestId('canvas-new-service').click();
await page.getByText('Compose, render.yaml, fly.toml').click();
await page.waitForTimeout(2000);
const d = page.locator('[role=dialog]').last();
await c.shot(sid('1-open'), { locator: '[role=dialog]' });

console.log('2. Paste the file');
if (process.env.UPLOAD) await d.locator('input[type=file]').setInputFiles(FILE);
else await d.getByPlaceholder(/paste the file contents/).fill(readFileSync(FILE, 'utf8'));
if (process.env.FORMAT) await d.locator('select').selectOption(process.env.FORMAT);
await d.getByText(/^Found |Could not|error/i).first().waitFor({ timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
console.log('   ', await text(d));
await c.shot(sid('2-preview'), { locator: '[role=dialog]' });
const answers = await d.locator('input[id^=answer-]').evaluateAll((is) => is.map((i) => i.id.slice(7)));
console.log('    prompts:', answers);
for (const k of answers) await d.locator(`#answer-${k}`).fill(`Hello from ${k.toLowerCase()}`);
if (answers.length) { await page.waitForTimeout(1500); await c.shot(sid('3-answered'), { locator: '[role=dialog]' }); }
if (STOP === 'preview') { await d.getByRole('button', { name: 'Cancel' }).click(); await c.done(); process.exit(0); }

console.log('3. Add to canvas');
await d.getByRole('button', { name: 'Add to canvas' }).click();
await page.waitForTimeout(4000);
console.log('   ', (await text(page.locator('body'))).split('Designer').pop().slice(0, 600));
await c.shot(sid('4-staged'));
c.checkpoint();

console.log('4. Commit → Deploy');
await page.getByRole('button', { name: /^Commit \d+ change/ }).click();
const deployBtn = page.getByRole('button', { name: /^Deploy \d+ change/ });
await deployBtn.waitFor();
console.log('   ', await text(page.locator('[role=dialog]').last()));
await c.shot(sid('5-commit'), { locator: '[role=dialog]' });
await deployBtn.click();

console.log('5. Wait for everything to run');
let st;
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(10000);
  st = await page.evaluate(async (P) => {
    const a = await (await fetch(`/api/pipelines/${P}/apps`)).json();
    const ph = a.phases.find((x) => x.name === 'dev');
    const app = (ph.apps || [])[0];
    if (!app) return { none: true };
    const d = await (await fetch(`/api/apps/${P}/dev/${app.name}`)).json();
    return { app: app.name, shared: app.sharedAddons ?? [], addons: (ph.sharedAddons || []).map((x) => `${x.instance}:${x.kind}`), env: (d.spec.envVars || []).map((v) => v.name), host: d.spec.ingress?.hosts?.[0]?.host };
  }, PROJECT);
  const body = await page.locator('body').innerText();
  if (st.host && /Running/.test(body) && !/Deploying|Updating|Building|Creating|Pending/.test(body)) break;
}
console.log('   ', JSON.stringify(st));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.waitForTimeout(3000);
await c.shot(sid('6-running'));
c.checkpoint();
await c.done();
console.log(JSON.stringify({ project: PROJECT }));
