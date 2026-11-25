// + Service → Add-on → Kafka: add, review every field, deploy, every tab of
// its panel, topics, connect an app, produce/consume, lifecycle.
// STEP selects what to perform.
import { open } from '../lib.mjs';
import { helpers } from './_settings.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-gv35';
const STEP = process.env.STEP ?? 'add';
const SP = '/tmp/claude-1001/-Users-adam/791e7dd4-162b-45fc-bc64-746b4c84360e/scratchpad/kafka';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
const controls = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], [role=checkbox], input, select, textarea').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.value || '').trim().slice(0, 40)}`));
const top = () => page.locator('[role=menu], [role=dialog], [role=listbox]').last();
if (process.env.NETLOG) page.on('response', async (r) => { const u = r.url(); if (u.includes('/api/') && (r.status() >= 400 || /kafka|db-browser/.test(u))) console.log('   NET', r.request().method(), r.status(), u.replace(/^https:\/\/[^/]+/, ''), r.status() >= 400 ? (await r.text().catch(() => '')).slice(0, 200) : ''); });
const dbg = (n) => page.screenshot({ path: `${SP}/${n}.png` });
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(4000);
await page.getByRole('button', { name: /^Apps$/ }).first().waitFor({ timeout: 45000 });
await page.evaluate(() => { window.confirm = () => true; });
const appsView = async () => { const b = page.getByRole('button', { name: /^Apps$/ }); if (await b.count()) { await b.first().click(); await page.waitForTimeout(1500); } await page.getByRole('button', { name: /^Manage / }).first().waitFor({ timeout: 30000 }).catch(() => {}); };

if (STEP === 'add') {
  // RESUME=1: the card is already on the canvas (Ready to deploy).
  if (!process.env.RESUME) {
  await page.getByTestId('canvas-new-service').click(); await page.waitForTimeout(1500);
  await top().getByText('Kafka, email').first().click(); await page.waitForTimeout(1500);
  console.log('1.', await text(top()));
  await c.shot('kafka/1-menu', { locator: '[role=dialog]' });
  await top().getByText(/^Kafka/).first().click(); await page.waitForTimeout(3000);
  await dbg('after-pick');
  console.log('2.', (await text(page.locator('main').first())).slice(0, 1500));
  console.log('   dialogs', await page.locator('[role=dialog]').count());
  }
  await appsView();
  await page.getByRole('button', { name: /^Manage Kafka/ }).click(); await page.waitForTimeout(3000);
  const sh = page.locator('[role=dialog]').last();
  console.log('3.', await text(sh));
  console.log('   controls', JSON.stringify(await controls(sh)));
  await dbg('review');
  await c.shot('kafka/2-review', { locator: '[role=dialog]' });
  if (process.env.DEPLOY) {
    const t0 = Date.now();
    await sh.getByRole('button', { name: /^Deploy$/ }).first().click(); await page.waitForTimeout(5000);
    console.log('4.', (await text(page.locator('body'))).slice(0, 800));
    await dbg('after-deploy');
    let last = '';
    for (let i = 0; i < 100; i++) {
      await page.waitForTimeout(6000);
      const t = ((await text(page.locator('main').first())).match(/Kafka \(Strimzi\) kafka Add-on [A-Za-z ]+/) ?? [''])[0];
      if (t !== last) { console.log(`   ${Math.round((Date.now() - t0) / 1000)}s:`, t.slice(0, 160)); last = t; }
      if (/Running/.test(t)) break;
      if (i === 5 && process.env.SHOT_RUNNING) await c.shot('kafka/3-deploying', { around: page.getByRole('button', { name: /^Manage Kafka/ }).locator('xpath=..') });
    }
    await page.keyboard.press('Escape').catch(() => {});
    // kafka/4-running is the 3-broker card (taken by STEP=card after HA).
    if (process.env.SHOT_RUNNING) await c.shot('kafka/4-running', { around: page.getByRole('button', { name: /^Manage Kafka/ }).locator('xpath=..') });
  }
}
const openKafka = async (tab) => {
  await appsView();
  await page.getByRole('button', { name: /^Manage Kafka/ }).click(); await page.waitForTimeout(3000);
  const sh = page.locator('[role=dialog]').last();
  if (tab) { await sh.getByRole('tab', { name: tab }).click(); await page.waitForTimeout(4000); }
  return sh;
};
if (STEP === 'settings') {
  const sh = await openKafka('Settings');
  await page.waitForTimeout(8000);
  console.log('S:', await text(sh));
  await dbg('settings');
}
const APP = process.env.APP ?? 'nginx';
if (STEP === 'connect') {
  const sh = await openKafka('Settings');
  await sh.getByRole('button', { name: 'Connection', exact: true }).click(); await page.waitForTimeout(2000);
  console.log('   switches', JSON.stringify(await sh.locator('[role=switch]').evaluateAll((e) => e.map((x) => x.getAttribute('aria-label') + '=' + x.getAttribute('aria-checked')))));
  await sh.locator(`[aria-label="Connect kafka to ${APP}"]`).click(); await page.waitForTimeout(1500);
  console.log('   after toggle:', (await text(sh)).match(/Connections.{0,250}/)?.[0]);
  if (APP === 'nginx') await c.shot('kafka/6-connect', { around: sh.getByText('Link this add-on to a service.').locator('xpath=../..') });
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
  const dl = page.locator('[role=dialog]').last();
  console.log('   commit:', await text(dl));
  if (APP === 'nginx') await c.shot('kafka/6b-commit', { locator: '[role=dialog]' });
  await dl.getByRole('button', { name: /^Deploy \d+ change/ }).click(); await page.waitForTimeout(60000);
  console.log('   after deploy:', (await text(page.locator('main').first())).slice(0, 600));
}
if (STEP === 'helper') {
  // Setup (not on the page as its own section): a short-lived app from the
  // public Kafka image that only sleeps, so its Terminal has the Kafka CLI.
  await page.getByTestId('canvas-new-service').click();
  await page.getByText('Run a public or private image').click(); await page.waitForTimeout(2500);
  const d = page.locator('[role=dialog]').last();
  const input = d.getByPlaceholder(/^Search Docker Hub or paste a reference/);
  await input.fill('apache/kafka:4.2.0'); await page.waitForTimeout(3500);
  await input.press('Enter'); await page.waitForTimeout(4000);
  for (let i = 0; i < 24; i++) {
    await page.getByText('Application', { exact: true }).last().click();
    await page.waitForTimeout(4000);
    if (await page.getByRole('button', { name: /^Deploy/ }).count()) break;
  }
  const rev = () => page.locator('[role=dialog]').last();
  console.log('review:', await text(rev()));
  await rev().getByRole('button', { name: 'Runtime' }).first().click(); await page.waitForTimeout(1500);
  console.log('runtime:', await text(rev()));
  console.log('   controls', JSON.stringify(await controls(rev())));
  await dbg('helper-runtime');
  const cmd = rev().getByPlaceholder(/command|default/i).first();
  await cmd.fill('sleep infinity'); await page.waitForTimeout(800);
  await dbg('helper-runtime-filled');
  await page.waitForTimeout(1500); await rev().getByRole('button', { name: /^kafka(-\d)?$/ }).first().click({ timeout: 10000 }).catch(async () => console.log('   NAME BTN missing:', await text(rev()))); await page.waitForTimeout(1200);
  console.log('   after name click controls', JSON.stringify(await controls(rev())));
  const nm = rev().locator('input').filter({ hasNot: page.locator('xx') });
  const vals = await rev().locator('input').evaluateAll((e) => e.map((x) => x.value));
  console.log('   input values', JSON.stringify(vals));
  const nameIn = rev().locator('input').nth(vals.findIndex((v) => /^kafka-\d$/.test(v)));
  if (vals.some((v) => /^kafka-\d$/.test(v))) { await nameIn.fill('kafka-client'); await nameIn.press('Enter'); await page.waitForTimeout(1000); }
  console.log('   after rename:', await text(rev()));
  if (!process.env.GO) { await c.done(); process.exit(0); }
  await rev().getByRole('button', { name: /^Deploy/ }).first().click();
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(10000);
    await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
    const body = await page.locator('body').innerText();
    if (i % 3 === 0) console.log('   ', body.replace(/\s+/g, ' ').split('Designer').pop().slice(0, 400));
    if (/kafka/i.test(body) && !/Deploying|Updating|Pending|Building|Ready to deploy/.test(body)) break;
  }
}
if (STEP === 'helper-fix') {
  // Drop the leftover staged draft, then make the helper a Worker (no port,
  // so no startup probe against a process that only sleeps).
  await appsView();
  const draft = page.getByRole('button', { name: /^Manage kafka-2/ });
  console.log('   draft cards', await draft.count());
  if (await draft.count()) {
    await draft.first().click(); await page.waitForTimeout(2500);
    const sh = page.locator('[role=dialog]').last();
    console.log('   draft panel:', (await text(sh)).slice(0, 300));
    await sh.getByRole('button', { name: /Remove from canvas/ }).click(); await page.waitForTimeout(2500);
    console.log('   after remove:', (await text(page.locator('main').first())).slice(0, 500));
  }
  const h = helpers(c, PROJECT, 'kafka-client');
  await h.openSettings();
  await page.getByRole('radio', { name: 'Worker' }).click(); await page.waitForTimeout(800);
  await h.commitDeploy('kafka-client as a worker');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(10000);
    const st = await h.status();
    console.log('   ', JSON.stringify(st.deployments?.map((d) => `${d.name} ${d.ready}/${d.desired}`)));
    if (st.deployments?.some((d) => /worker/.test(d.name) && d.ready >= 1)) break;
  }
}
if (STEP === 'terminal') {
  // The helper's Terminal: the Kafka CLI against the add-on.
  await appsView();
  await page.getByRole('button', { name: /^Manage kafka-client/ }).first().click(); await page.waitForTimeout(3000);
  await page.getByRole('tab', { name: /^Terminal/ }).click();
  await page.getByText('Press Connect to open the shell.').waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: 'Connect' }).click();
  for (let i = 0; i < 30; i++) {
    const st = (await page.locator('[role=status]').first().innerText()).trim();
    if (/^Connected/.test(st)) break;
    if (/Failed/.test(st) || i === 29) { await dbg('term-fail'); throw new Error(`terminal: ${st}`); }
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(2500);
  const run = async (cmd, wait = 8000) => {
    await page.locator('.xterm-helper-textarea').focus();
    await page.keyboard.type(cmd, { delay: 25 }); await page.keyboard.press('Enter');
    await page.waitForTimeout(wait);
  };
  const screen = async () => (await page.locator('.xterm-rows').innerText()).split('\n').filter((l) => l.trim()).join('\n');
  await run('cd /opt/kafka/bin', 1000);
  if (process.env.HA) {
    // After Enable HA (and the brokers' roll): a new topic and the old one.
    if (process.env.RESET) await run('./kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --delete --topic audit', 15000);
    await run('clear', 1500);
    await run('./kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --create --topic audit --partitions 3', 15000);
    await run('./kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --describe --topic audit', 12000);
    await run('./kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --describe --topic orders | head -1', 12000);
    console.log('--- screen HA\n' + await screen());
    await c.shot('kafka/11-ha-topics', { locator: '[data-slot=sheet-content]' });
    await c.done(); process.exit(0);
  }
  // A re-run starts from no topic (not part of the page).
  if (process.env.RESET) await run('./kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --delete --topic orders', 15000);
  await run('clear', 1500);
  await run("env | grep -E '^KAFKA_(BROKERS|BOOTSTRAP_SERVERS|URL)=' | cut -d= -f1 | sort", 2500);
  await run('./kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --create --topic orders --partitions 3 --replication-factor 1', 15000);
  await run('./kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --describe --topic orders', 12000);
  console.log('--- screen 1\n' + await screen());
  await c.shot('kafka/7-topic', { locator: '[data-slot=sheet-content]' });
  await run('clear', 1000);
  await run('echo "order 1001 placed" | ./kafka-console-producer.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --topic orders', 15000);
  await run('./kafka-console-consumer.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --topic orders --from-beginning --max-messages 1', 25000);
  console.log('--- screen 2\n' + await screen());
  await c.shot('kafka/8-produce-consume', { locator: '[data-slot=sheet-content]' });
  await page.getByRole('button', { name: 'Disconnect' }).click().catch(() => {});
  await page.waitForTimeout(1500);
}
if (STEP === 'tabs') {
  const SHEET = '[data-slot=sheet-content]';
  const sh = await openKafka();
  for (const t of ['Deployment', 'Logs', 'Metrics']) {
    await sh.getByRole('tab', { name: t }).click(); await page.waitForTimeout(t === 'Metrics' ? 9000 : 5000);
    console.log(`== ${t}:`, (await text(sh)).slice(0, 700));
    await c.shot(`kafka/tab-${t.toLowerCase()}`, { locator: SHEET });
  }
  await sh.getByRole('tab', { name: 'Settings' }).click(); await page.waitForTimeout(9000);
  const secs = await sh.locator('[data-settings-section]').evaluateAll((e) => e.map((x) => x.getAttribute('data-settings-section')));
  console.log('sections', JSON.stringify(secs));
  await c.shot('kafka/tab-settings', { locator: SHEET });
  for (const id of secs) {
    const l = sh.locator(`[data-settings-section="${id}"]`).first();
    await l.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
    console.log(`-- ${id}:`, (await text(l)).slice(0, 600));
    console.log('   controls', JSON.stringify(await controls(l)));
    await c.shot(`kafka/settings-${id}`, { locator: `[data-slot=sheet-content] [data-settings-section="${id}"]` });
  }
}
if (STEP === 'metrics') {
  page.on('response', async (r) => { const u = r.url(); if (/\/api\/.*metric/i.test(u)) console.log('   M', r.status(), u.replace(/^https:\/\/[^/]+/, ''), (await r.text().catch(() => '')).slice(0, 300)); });
  const sh = await openKafka('Metrics'); await page.waitForTimeout(15000);
  console.log('metrics:', (await text(sh)).slice(0, 2500));
  console.log('   controls', JSON.stringify((await controls(sh)).slice(0, 60)));
  await dbg('metrics');
  for (const r of (process.env.RANGES ?? '').split(',').filter(Boolean)) {
    await sh.getByRole('button', { name: r, exact: true }).first().click(); await page.waitForTimeout(8000);
    console.log(`-- ${r}:`, (await text(sh)).slice(0, 600));
  }
  // Host resources (CPU and memory) have data; crop to that section.
  if (process.env.SHOT) {
    const host = sh.getByText('Host resources', { exact: true }).first();
    await host.scrollIntoViewIfNeeded();
    const cpu = sh.getByText('CPU usage', { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    const mem = sh.getByText('Memory usage', { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    await page.mouse.move(5, 5);
    await c.shot('kafka/metrics-host', { around: [host, cpu, mem] });
  }
}
if (STEP === 'ha') {
  const sh = await openKafka('Settings'); await page.waitForTimeout(5000);
  const ha = () => sh.locator('[data-settings-section="ha"]').first();
  await ha().scrollIntoViewIfNeeded();
  await ha().getByRole('button', { name: 'Enable HA' }).click(); await page.waitForTimeout(1500);
  const dl = page.locator('[role=alertdialog], [role=dialog]').last();
  console.log('confirm:', await text(dl));
  console.log('   controls', JSON.stringify(await controls(dl)));
  await c.shot('kafka/9-ha-confirm', { around: dl, pad: 0 });
  if (!process.env.GO) { await dl.getByRole('button', { name: 'Cancel' }).click(); await c.done(); process.exit(0); }
  const t0 = Date.now();
  await dl.getByRole('button', { name: 'Enable HA' }).click(); await page.waitForTimeout(5000);
  console.log('after:', (await text(ha())).slice(0, 600));
  console.log('toasts:', await page.locator('[data-sonner-toast]').allInnerTexts());
  let last = '';
  for (let i = 0; i < 60; i++) {
    const t = (await text(ha())).slice(0, 500);
    if (t !== last) { console.log(`   ${Math.round((Date.now() - t0) / 1000)}s:`, t); last = t; }
    if (/Brokers\s*3/.test(t) && /Ready\s*3|3\s*\/\s*3|3 of 3/.test(t)) break;
    await page.waitForTimeout(10000);
    if (i % 6 === 5) { await openKafka('Settings').catch(() => {}); await page.waitForTimeout(4000); }
  }
  await ha().scrollIntoViewIfNeeded();
  await c.shot('kafka/10-ha-on', { locator: '[data-slot=sheet-content] [data-settings-section="ha"]' });
}
if (STEP === 'console') {
  // Settings → Manage: the console (overview, Topics, Connectors, Groups,
  // Messages) and Settings → Access. SUB picks a part; each is run once.
  const SUB = process.env.SUB ?? 'look';
  const SHEET = '[data-slot=sheet-content]';
  const sh = await openKafka('Settings'); await page.waitForTimeout(8000);
  const m = () => sh.locator('[data-settings-section="manage"]').first();
  const acc = () => sh.locator('[data-settings-section="access"]').first();
  const ktab = async (n) => { await m().getByRole('button', { name: n, exact: true }).click(); await page.waitForTimeout(3000); };
  const writes = async (on) => { const sw = m().getByRole('switch').first(); if ((((await sw.getAttribute('aria-checked')) === 'true') || (await sw.getAttribute('data-state')) === 'checked') !== on) { await sw.click(); await page.waitForTimeout(1000); } };
  const waitToast = async (t0) => { for (let i = 0; i < 90; i++) { const tt = await page.locator('[data-sonner-toast]').allInnerTexts(); if (tt.length) { console.log('   toast after', Math.round((Date.now() - t0) / 1000), 's:', JSON.stringify(tt)); return; } await page.waitForTimeout(500); } console.log('   no toast'); };
  const toasts = async () => console.log('   toasts:', JSON.stringify(await page.locator('[data-sonner-toast]').allInnerTexts()));
  await m().scrollIntoViewIfNeeded();
  await m().getByText('Connecting to Kafka…').waitFor({ state: 'detached', timeout: 90000 }).catch(() => console.log('   still connecting'));
  await sh.getByText('Loading access configuration…').waitFor({ state: 'detached', timeout: 60000 }).catch(() => console.log('   access still loading'));
  await page.waitForTimeout(2000);
  if (SUB === 'look') {
    console.log('manage:', await text(m()));
    console.log('   controls', JSON.stringify(await controls(m())));
    await dbg('con-manage');
    await acc().scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
    console.log('access:', await text(acc()));
    console.log('   controls', JSON.stringify(await controls(acc())));
    await dbg('con-access');
  }
  if (SUB === 'shots') {
    await writes(false);
    await c.shot('kafka/manage-overview', { locator: `${SHEET} [data-settings-section="manage"]` });
    await acc().scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
    await c.shot('kafka/access', { locator: `${SHEET} [data-settings-section="access"]` });
  }
  if (SUB === 'topic') {
    await writes(true);
    console.log('write mode:', await text(m()));
    await c.shot('kafka/manage-write', { locator: `${SHEET} [data-settings-section="manage"]` });
    const form = m().locator('div', { has: page.getByText('Create topic', { exact: true }) }).last();
    const ins = m().locator('input');
    console.log('   inputs', JSON.stringify(await ins.evaluateAll((e) => e.map((x) => `${x.placeholder}|${x.type}|${x.value}`))));
    await m().getByPlaceholder('my-topic').fill(process.env.TOPIC ?? 'orders');
    const nums = m().locator('input[type=number]');
    await nums.nth(0).fill('3'); await nums.nth(1).fill('1');
    const t0 = Date.now();
    await m().getByRole('button', { name: 'Create', exact: true }).click();
    for (let i = 0; i < 60; i++) { const tt = await page.locator('[data-sonner-toast]').allInnerTexts(); if (tt.length) { console.log('   toast after', Math.round((Date.now() - t0) / 1000), 's:', JSON.stringify(tt)); break; } await page.waitForTimeout(500); }
    await m().locator('tr', { hasText: process.env.TOPIC ?? 'orders' }).first().waitFor({ timeout: 30000 }).catch(() => console.log('   row not shown'));
    await page.waitForTimeout(1500);
    console.log('after create:', await text(m()));
    await c.shot('kafka/topic-created', { locator: `${SHEET} [data-settings-section="manage"]` });
    const si = m().getByRole('switch').nth(1);
    await si.click(); await page.waitForTimeout(3000);
    console.log('show internal:', await text(m()));
    await dbg('con-internal');
    await si.click(); await page.waitForTimeout(1500);
  }
  if (SUB === 'produce') {
    await writes(true);
    await ktab('Messages');
    console.log('messages:', await text(m()));
    console.log('   controls', JSON.stringify(await controls(m())));
    const sel = m().locator('select');
    console.log('   selects', await sel.count());
    await sel.last().selectOption(process.env.TOPIC ?? 'orders');
    if (process.env.KEY) await m().getByPlaceholder('(optional)').fill(process.env.KEY);
    await m().getByPlaceholder('message body').fill('order 1001 placed');
    const card = (t) => m().locator('h3', { hasText: t }).locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    await card('Produce message').evaluate((e) => e.scrollIntoView({ block: 'end' })); await page.waitForTimeout(600);
    await page.mouse.move(5, 5);
    await c.shot('kafka/produce', { around: [card('Browse messages'), card('Produce message')] });
    const t0 = Date.now();
    await m().getByRole('button', { name: 'Produce', exact: true }).click();
    await waitToast(t0); await page.waitForTimeout(1500);
    console.log('after produce:', await text(m()));
    await dbg('con-produced');
  }
  if (SUB === 'browse') {
    await ktab('Messages');
    const sel = m().locator('select').first();
    await sel.selectOption(process.env.TOPIC ?? 'orders'); await page.waitForTimeout(2000);
    await m().getByText('Loading topic…').waitFor({ state: 'detached', timeout: 90000 }).catch(() => console.log('   still loading'));
    await m().getByText('Loading messages…').waitFor({ state: 'detached', timeout: 90000 }).catch(() => console.log('   messages still loading'));
    await page.waitForTimeout(3000);
    const viewer = m().locator('div').filter({ has: page.getByText('Total messages') }).filter({ has: page.getByRole('button', { name: 'Configuration' }) }).last();
    console.log('browse:', await text(viewer));
    console.log('   controls', JSON.stringify(await controls(viewer)));
    console.log('   box', JSON.stringify(await viewer.boundingBox()));
    await viewer.scrollIntoViewIfNeeded(); await page.evaluate(() => 0);
    await viewer.evaluate((e) => e.scrollIntoView({ block: 'start' })); await page.waitForTimeout(800);
    await dbg('con-browse');
    // Search filters the fetched rows by key or value.
    await viewer.getByPlaceholder('Search key or value…').fill('order'); await page.waitForTimeout(1500);
    await page.mouse.move(5, 5); await page.waitForTimeout(800);
    console.log('   searched:', (await text(viewer.locator('table'))).slice(0, 600));
    await c.shot('kafka/messages', { around: [viewer.locator('select').first(), viewer.locator('table')] });
    for (const t of ['Partitions', 'Configuration']) {
      await viewer.getByRole('button', { name: t, exact: true }).click(); await page.waitForTimeout(2500);
      console.log(`-- ${t}:`, (await text(viewer)).slice(0, 1200));
      // Partitions: Log end offset shows — (reported bug), so no shot of it.
      if (t === 'Configuration') await c.shot('kafka/topic-configuration', { around: [viewer.getByRole('button', { name: t, exact: true }), viewer.getByText('min.insync.replicas').first()] });
      else await dbg('con-partitions');
    }
    if (process.env.EXPORT) {
      // JSON and CSV download the fetched rows.
      await viewer.getByRole('button', { name: 'Messages', exact: true }).click(); await page.waitForTimeout(1500);
      for (const b of ['JSON', 'CSV']) {
        const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
        await viewer.getByRole('button', { name: b, exact: true }).click();
        const d = await dl;
        console.log(`   ${b} download:`, d ? d.suggestedFilename() : 'none');
        if (d) { const f = `${SP}/export-${b}`; await d.saveAs(f); console.log('   first bytes:', (await import('node:fs')).readFileSync(f, 'utf8').slice(0, 160).replace(/\s+/g, ' ')); }
      }
    }
    // The live-stream button next to the search box.
    await viewer.getByRole('button', { name: 'Messages', exact: true }).click(); await page.waitForTimeout(2000);
    const live = viewer.locator('button[title="Stream latest messages"]');
    console.log('   live btn', await live.count());
    if (await live.count()) { await live.click(); await page.waitForTimeout(8000); console.log('   streaming:', (await text(viewer)).slice(0, 800)); await dbg('con-stream'); await viewer.locator('button[title="Pause live stream"]').click().catch(() => {}); }
  }
  if (SUB === 'viewer') {
    await ktab('Topics');
    // Clicking a topic opens the same viewer as Messages → Browse messages.
    await m().getByRole('button', { name: process.env.TOPIC ?? 'orders' }).first().click(); await page.waitForTimeout(2000);
    await m().getByText('Loading topic…').waitFor({ state: 'detached', timeout: 90000 }).catch(() => console.log('   still loading'));
    await m().getByText('Loading messages…').waitFor({ state: 'detached', timeout: 90000 }).catch(() => console.log('   messages still loading'));
    await page.waitForTimeout(3000);
    console.log('viewer:', await text(m()));
    console.log('   controls', JSON.stringify(await controls(m())));
    await dbg('con-viewer');
    for (const t of (process.env.VTABS ?? '').split(',').filter(Boolean)) {
      await m().getByRole('button', { name: t, exact: true }).first().click(); await page.waitForTimeout(3000);
      console.log(`-- ${t}:`, (await text(m())).slice(0, 1500));
      await dbg(`con-viewer-${t.replace(/\W+/g, '')}`);
    }
  }
  if (SUB === 'groups') {
    await ktab('Groups');
    await m().getByText('Loading…').first().waitFor({ state: 'detached', timeout: 120000 }).catch(() => console.log('   still loading'));
    await page.waitForTimeout(2000);
    console.log('groups:', await text(m()));
    console.log('   controls', JSON.stringify(await controls(m())));
    const g = m().getByRole('button', { name: /^console-consumer-/ }).first();
    if (await g.count()) {
      await g.click(); await page.waitForTimeout(3000);
      await m().getByText('Loading group…').first().waitFor({ state: 'detached', timeout: 90000 }).catch(() => console.log('   group still loading'));
      await page.waitForTimeout(1500);
      const list = m().locator('h3', { hasText: /^Consumer groups$/ }).locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
      const detail = m().locator('h3', { hasText: /^console-consumer-/ }).locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
      console.log('group detail:', await text(detail));
      await detail.evaluate((e) => e.scrollIntoView({ block: 'end' })); await page.waitForTimeout(800);
      await page.mouse.move(5, 5);
      await dbg('con-group-detail');
    } else {
      // No groups (the console's own browse groups expire after a while).
      const list = m().locator('h3', { hasText: /^Consumer groups$/ }).locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
      await page.mouse.move(5, 5);
      await c.shot('kafka/groups', { around: list });
    }
  }
  if (SUB === 'connectors') {
    await writes(true);
    await ktab('Connectors');
    console.log('connectors:', await text(m()));
    console.log('   controls', JSON.stringify(await controls(m())));
    await c.shot('kafka/connectors', { locator: `${SHEET} [data-settings-section="manage"]` });
    await m().getByRole('link', { name: /Add connector/ }).first().click(); await page.waitForTimeout(8000);
    console.log('URL', page.url().replace(/^https:\/\/[^/]+/, ''));
    console.log('catalog:', (await text(page.locator('body'))).slice(0, 3000));
    await page.getByText('Sources', { exact: true }).first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(2000); await page.mouse.move(5, 5);
    await dbg('con-catalog');
    await c.shot('kafka/connector-catalog', { around: [page.getByRole('heading', { name: 'Add connector' }).last(), page.getByText('ClickHouse Sink', { exact: true }).locator('xpath=ancestor::*[self::a or self::button][1]')] });
    // Open one entry and read its form; nothing is submitted (the first
    // connector provisions a Connect cluster).
    await page.getByText('Postgres CDC (Debezium)', { exact: true }).first().click(); await page.waitForTimeout(8000);
    console.log('URL', page.url().replace(/^https:\/\/[^/]+/, ''));
    const form = page.locator('main').first();
    await page.getByText('Loading connector…').waitFor({ state: 'detached', timeout: 120000 }).catch(() => console.log('   form still loading'));
    await page.waitForTimeout(2000); await page.mouse.move(5, 5);
    console.log('form:', (await text(form)).slice(0, 2500));
    console.log('   controls', JSON.stringify((await controls(form)).slice(0, 60)));
    await dbg('con-form');
    // Test connection is a read-only reachability probe of the paired add-on.
    const t0 = Date.now();
    await form.getByRole('button', { name: 'Test connection' }).click();
    await waitToast(t0); await page.waitForTimeout(1500);
    console.log('after test:', (await text(form)).split('Test connection')[0].slice(-400));
    await dbg('con-form-tested');
    await form.getByRole('button', { name: 'Cancel' }).click(); await page.waitForTimeout(3000);
    console.log('after cancel URL', page.url().replace(/^https:\/\/[^/]+/, ''));
  }
  if (SUB === 'deltopic') {
    await writes(true);
    await ktab('Topics');
    const row = m().locator('tr', { hasText: process.env.TOPIC ?? 'orders' });
    // Delete has no confirmation: one click deletes the topic.
    const t0 = Date.now();
    await row.getByRole('button', { name: 'Delete' }).click();
    for (let i = 0; i < 90; i++) { const tt = await page.locator('[data-sonner-toast]').allInnerTexts(); if (tt.length) { console.log('   toast after', Math.round((Date.now() - t0) / 1000), 's:', JSON.stringify(tt)); break; } await page.waitForTimeout(500); }
    await row.first().waitFor({ state: 'detached', timeout: 60000 }).catch(() => console.log('   row still there'));
    console.log('   gone after', Math.round((Date.now() - t0) / 1000), 's');
    console.log('   dialogs open:', await page.locator('[role=alertdialog]').count());
    await toasts();
    console.log('after:', await text(m()));
    await c.shot('kafka/topic-deleted', { locator: `${SHEET} [data-settings-section="manage"]` });
  }
}
if (STEP === 'connect-ui') {
  // Kafka Connect: the Manage card's Connect / Connectors tiles, and the
  // connector catalog route.
  const sh = await openKafka('Settings'); await page.waitForTimeout(6000);
  const m = sh.locator('[data-settings-section="manage"]').first();
  for (const b of ['Connectors', 'Connect', 'Topics']) {
    await m.getByRole('button', { name: b, exact: true }).click().catch((e) => console.log('   no', b));
    await page.waitForTimeout(3000);
    console.log(`-- ${b}:`, (await text(page.locator('[role=dialog]').last())).slice(0, 700));
    await dbg(`cu-${b}`);
  }
  console.log('URL', page.url().replace(/^https:\/\/[^/]+/, ''));
  await c.goto(`/pipeline/${PROJECT}/dev/nginx-9agm/addon/kafka-f9au/kafka/connectors/new`); await page.waitForTimeout(8000);
  console.log('-- catalog:', (await text(page.locator('main').first())).slice(0, 1200));
  await dbg('cu-catalog');
}
if (STEP === 'card') {
  await appsView();
  const card = page.getByRole('button', { name: /^Manage Kafka/ }).first();
  console.log('card:', await text(card));
  await page.waitForTimeout(6000);
  await dbg('canvas');
  console.log('canvas:', (await text(page.locator('main').first())).slice(0, 500));
  await c.shot('kafka/4-running', { around: card, extraBottom: 76 });
  const sh = await openKafka('Deployment');
  const dots = sh.locator('button').filter({ hasText: /^$/ });
  console.log('   empty buttons', await dots.count());
  await sh.getByText('Deploy', { exact: true }).first().locator('xpath=ancestor::*[.//button][1]').locator('button').last().click().catch((e) => console.log('no dots', e.message.slice(0, 80)));
  await page.waitForTimeout(1200);
  console.log('   menu:', await page.locator('[role=menu]').last().innerText().catch(() => 'none'));
  await dbg('deploy-menu');
  await page.keyboard.press('Escape');
}
if (STEP === 'logs') {
  const sh = await openKafka('Logs'); await page.waitForTimeout(5000);
  for (const n of ['Pod', 'Log source', 'Live tail']) {
    const cb = n === 'Live tail' ? sh.getByRole('combobox').filter({ hasText: 'Live tail' }) : sh.locator(`[aria-label="${n}"]`);
    await cb.first().click(); await page.waitForTimeout(1500);
    console.log(`-- ${n}:`, JSON.stringify(await page.locator('[role=option]').allInnerTexts()));
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  }
}
if (STEP === 'disconnect') {
  const sh = await openKafka('Settings'); await page.waitForTimeout(4000);
  const conn = sh.locator('[data-settings-section="connection"]').first();
  await conn.scrollIntoViewIfNeeded();
  for (const a of ['kafka-client', 'nginx']) {
    const sw = conn.locator(`[aria-label="Connect kafka to ${a}"]`);
    if (!(await sw.count())) continue;
    if ((await sw.getAttribute('aria-checked')) === 'true') { await sw.click(); await page.waitForTimeout(1200); }
  }
  console.log('   staged:', await text(conn));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
  const dl = page.locator('[role=dialog]').last();
  console.log('   commit:', await text(dl));
  // kafka/12-disconnect shows both kafka-client and nginx (the page's run).
  if (process.env.SHOT_DISCONNECT) await c.shot('kafka/12-disconnect', { locator: '[role=dialog]' });
  await dl.getByRole('button', { name: /^Deploy \d+ change/ }).click(); await page.waitForTimeout(60000);
}
if (STEP === 'delete') {
  const sh = await openKafka('Settings'); await page.waitForTimeout(4000);
  const del = sh.locator('[data-settings-section="delete"]').first();
  await del.scrollIntoViewIfNeeded();
  console.log('   delete section:', await text(del));
  await c.shot('kafka/13-delete', { locator: '[data-slot=sheet-content] [data-settings-section="delete"]' });
  await del.getByRole('button', { name: 'Delete' }).click(); await page.waitForTimeout(1500);
  const dl = page.locator('[role=alertdialog], [role=dialog]').last();
  console.log('   dialog:', await text(dl));
  console.log('   controls', JSON.stringify(await controls(dl)));
  await c.shot('kafka/14-delete-confirm', { around: dl, pad: 0 });
  if (!process.env.GO) { await dl.getByRole('button', { name: 'Cancel' }).click(); await c.done(); process.exit(0); }
  const inp = dl.locator('input');
  if (await inp.count()) { await inp.fill(process.env.CONFIRM_TEXT ?? 'kafka'); await page.waitForTimeout(500); }
  const t0 = Date.now();
  await dl.getByRole('button', { name: 'Remove' }).click(); await page.waitForTimeout(8000);
  console.log('   after', Math.round((Date.now() - t0) / 1000), 's');
  console.log('   canvas:', (await text(page.locator('main').first())).slice(0, 600));
  // Removal is staged on the canvas until it is committed.
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await appsView();
  const card = page.getByRole('button', { name: /^Manage Kafka/ }).first();
  await c.shot('kafka/15-removes-on-commit', { around: card, extraBottom: 76 });
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(1500);
  const cd = page.locator('[role=dialog]').last();
  console.log('   commit:', await text(cd));
  await cd.getByPlaceholder('sudo delete kafka').fill('sudo delete kafka'); await page.waitForTimeout(600);
  await c.shot('kafka/16-delete-commit', { locator: '[role=dialog]' });
  const t1 = Date.now();
  await cd.getByRole('button', { name: /^Delete \d+ resource/ }).click(); await page.waitForTimeout(10000);
  for (let i = 0; i < 30; i++) {
    await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(4000);
    const t = await text(page.locator('main').first());
    if (!/Kafka \(Strimzi\)/.test(t)) { console.log('   gone after', Math.round((Date.now() - t1) / 1000), 's:', t.slice(0, 500)); break; }
    if (i % 3 === 0) console.log('   ', t.slice(0, 400));
    await page.waitForTimeout(6000);
  }
}
if (STEP === 'inspect') {
  const sh = await openKafka();
  const tabs = await sh.getByRole('tab').allInnerTexts();
  console.log('tabs', JSON.stringify(tabs));
  for (const t of tabs) {
    await sh.getByRole('tab', { name: t }).click(); await page.waitForTimeout(5000);
    console.log(`== ${t}:`, await text(sh));
    console.log('   controls', JSON.stringify((await controls(sh)).slice(0, 80)));
    await dbg(`tab-${t.toLowerCase().replace(/[^a-z]+/g, '-')}`);
  }
}
await c.done();
