// + Service → Backups (environment snapshots) and + Service → Add-on, explored.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-gv35';
const STEP = process.env.STEP ?? 'explore';
const STEP_COMMIT = !!process.env.COMMIT;
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2000);
const ctl = (l) => l.locator('button, [role=tab], [role=combobox], [role=switch], input, textarea, select, a').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role') ?? ''}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || '').trim().slice(0, 40)}`));
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await page.waitForTimeout(2000);
const menu = async () => { await page.getByTestId('canvas-new-service').click(); await page.waitForTimeout(1200); return page.locator('[role=dialog]').last(); };

if (STEP === 'addon-menu') {
  const d = await menu();
  await d.getByText('Kafka, email, and more').click();
  await page.waitForTimeout(2500);
  const a = page.locator('[role=dialog]').last();
  console.log('ADDON:', await text(a));
  await c.shot('addons/1-menu', { locator: '[role=dialog]' });
}
if (STEP === 'setup') {
  // Setup (not captured): one nginx app so the environment is not empty.
  const d = await menu();
  await d.getByText('Run a public or private image').click();
  const search = page.getByPlaceholder(/^Search Docker Hub or paste a reference/);
  await search.waitFor();
  await search.fill('nginx');
  await page.getByText('Official build of Nginx.').waitFor({ timeout: 20000 });
  await page.locator('div', { has: page.getByText('Official build of Nginx.') }).getByRole('button', { name: 'Use' }).first().click();
  await page.getByText('Ready to deploy').first().waitFor({ timeout: 30000 });
  for (let i = 0; i < 20; i++) {
    const box = await page.getByText('Application', { exact: true }).first().boundingBox();
    await page.mouse.click(box.x + 60, box.y);
    await page.waitForTimeout(3000);
    if (await page.getByRole('button', { name: 'Deploy', exact: true }).count()) break;
  }
  await page.getByRole('button', { name: 'Deploy', exact: true }).click();
  await page.getByText('Running', { exact: true }).first().waitFor({ timeout: 240000 });
  console.log('nginx running');
}
if (STEP === 'backups-open') {
  const d = await menu();
  await c.shot('env-backups/1-menu', { locator: '[role=dialog]' });
  await d.getByText('Snapshots and restore for this environment').click();
  await page.waitForTimeout(4000);
  const b = page.locator('[role=dialog]').last();
  console.log('BACKUPS:', await text(b));
  console.log('controls:', JSON.stringify(await ctl(b)));
  await c.shot('env-backups/2-sheet');
}
if (STEP === 'setup-pg') {
  // Setup (not captured): a PostgreSQL database (no volume on any app yet).
  await page.getByTestId('canvas-new-service').click();
  await page.getByText('PostgreSQL, MariaDB, Valkey, and more').click();
  await page.getByText('Reliable open-source relational database').click();
  await page.getByText('Ready to deploy').waitFor({ timeout: 20000 });
  await page.getByText('Database', { exact: true }).click();
  await page.getByText('Deploys with the catalog defaults').waitFor();
  await page.getByRole('button', { name: 'Deploy', exact: true }).click();
  await page.locator('text=/^db\\..*stackblaze\\.cloud$/').first().waitFor({ timeout: 300000 });
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(10000);
    await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
    const t = await page.locator('body').innerText();
    if (!/Ready to deploy|Updating|Deploying/.test(t) && (t.match(/^Running$/gm) || []).length >= 2) break;
  }
  console.log('state:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 300));
}
const openSheet = async () => {
  const d = await menu();
  await d.getByText('Snapshots and restore for this environment').click({ timeout: 10000 }).catch(async (e) => {
    console.log('MENU NOW:', await text(page.locator('body')).catch(() => ''));
    await page.screenshot({ path: '/tmp/claude-1001/-Users-adam/791e7dd4-162b-45fc-bc64-746b4c84360e/scratchpad/eb-fail.png' });
    throw e;
  });
  await page.waitForTimeout(4000);
  return page.locator('[role=dialog]').last();
};
if (STEP === 'edit-explore') {
  let sh = await openSheet();
  await c.shot('env-backups/3-backups-tab');
  await sh.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.waitForTimeout(2000);
  const e = page.locator('[role=dialog]').last();
  console.log('EDIT:', await text(e));
  console.log('controls:', JSON.stringify(await ctl(e)));
  await c.shot('env-backups/4-edit');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  sh = page.locator('[role=dialog]').last();
  if (!(await sh.getByRole('tab', { name: 'Restore' }).count())) sh = await openSheet();
  await sh.getByRole('tab', { name: 'Restore' }).click();
  await page.waitForTimeout(2500);
  console.log('RESTORE:', await text(page.locator('[role=dialog]').last()));
  console.log('controls:', JSON.stringify(await ctl(page.locator('[role=dialog]').last())));
  await c.shot('env-backups/5-restore-empty');
}
if (STEP === 'backup-now') {
  const sh = await openSheet();
  await sh.getByRole('button', { name: 'Back up now', exact: true }).first().click();
  await page.waitForTimeout(2500);
  console.log('AFTER CLICK:', (await text(page.locator('body'))).split('Designer').pop());
  const toasts = await page.locator('[data-sonner-toast]').allInnerTexts();
  console.log('toasts:', toasts.join(' | ').replace(/\s+/g, ' '));
  await c.shot('env-backups/6-backup-now');
}
if (STEP === 'commit' || STEP === 'backup-now') {
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click();
  await page.waitForTimeout(2000);
  const d = page.locator('[role=dialog]').last();
  console.log('COMMIT:', await text(d));
  console.log('controls:', JSON.stringify(await ctl(d)));
  await c.shot('env-backups/7-commit');
  const btn = d.getByRole('button', { name: /^(Deploy|Commit|Apply)/ }).last();
  console.log('pressing:', await btn.innerText());
  await btn.click();
  await page.waitForTimeout(5000);
  console.log('AFTER:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 500));
  console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
}
if (STEP === 'points') {
  let sh;
  for (let i = 0; i < 30; i++) {
    sh = await openSheet();
    const t = await text(sh);
    if (!/No recovery points yet/.test(t) && !/In progress|Running|Pending|Queued/i.test(t)) break;
    console.log('   waiting:', t.split('Recovery points').pop().slice(0, 200));
    await page.keyboard.press('Escape'); await page.waitForTimeout(20000);
  }
  console.log('BACKUPS TAB:', await text(sh));
  console.log('controls:', JSON.stringify(await ctl(sh)));
  await c.shot('env-backups/8-point');
  await sh.getByRole('tab', { name: 'Restore' }).click();
  await page.waitForTimeout(2500);
  console.log('RESTORE TAB:', await text(page.locator('[role=dialog]').last()));
  console.log('controls:', JSON.stringify(await ctl(page.locator('[role=dialog]').last())));
  await c.shot('env-backups/9-restore');
}
if (STEP === 'storage-explore') {
  await page.getByText('nginx', { exact: true }).first().click();
  await page.waitForTimeout(3000);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.waitForTimeout(3000);
  const st = page.locator('[data-settings-section=storage]').first();
  await st.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await st.getByRole('button', { name: 'Add volume' }).click();
  await page.waitForTimeout(2000);
  const v = page.locator('[role=dialog]').last();
  console.log('ADD VOLUME:', await text(v));
  console.log('controls:', JSON.stringify(await ctl(v)));
  const ins = st.locator('input');
  await ins.nth(0).fill('data');
  const mp = ins.nth(1);
  if (!(await mp.inputValue())) await mp.fill('/data');
  await page.waitForTimeout(2500);
  console.log('mount value:', await mp.inputValue());
  const body = await text(page.locator('body'));
  console.log('save buttons:', JSON.stringify(await page.getByRole('button', { name: /Save|Commit|Apply|Deploy/ }).allInnerTexts()));
  if (STEP_COMMIT) {
    await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /^Commit \d+ change/ }).click();
    await page.waitForTimeout(2000);
    console.log('COMMIT:', await text(page.locator('[role=dialog]').last()));
    await page.locator('[role=dialog]').last().getByRole('button', { name: /^Deploy \d+ change/ }).click();
    await page.waitForTimeout(8000);
    console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  }
}
if (STEP === 'schedule-on') {
  await page.waitForTimeout(20000);
  const sh = await openSheet();
  await sh.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.waitForTimeout(2000);
  const box = page.locator('[role=dialog]').last();
  console.log('EDIT:', (await text(box)).split('Schedule').slice(1).join('Schedule').slice(0, 500));
  // The three cadence toggles: report their kind before touching.
  const toggles = await box.locator('input[type=checkbox], [role=switch], [role=checkbox]').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('role')}:${e.getAttribute('aria-checked') ?? e.checked}:${e.closest('label,div')?.innerText?.trim().slice(0, 30)}`));
  console.log('toggles:', JSON.stringify(toggles));
  await c.shot('env-backups/10-edit');
  const daily = box.locator('input[type=checkbox], [role=switch], [role=checkbox]').first();
  await daily.click();
  await page.waitForTimeout(1000);
  await box.getByRole('combobox').first().click();
  await page.waitForTimeout(1200);
  console.log('retention options:', await text(page.locator('[role=listbox]').last()));
  await c.shot('env-backups/11-retention');
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  console.log('daily checked:', await daily.isChecked());
  await c.shot('env-backups/12-daily-on');
  await box.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(3000);
  console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
  if (await commit.count()) {
    await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
    await commit.click(); await page.waitForTimeout(2000);
    console.log('COMMIT:', await text(page.locator('[role=dialog]').last()));
    await c.shot('env-backups/13-schedule-commit');
    await page.locator('[role=dialog]').last().getByRole('button', { name: /^Deploy \d+ change/ }).click();
    await page.waitForTimeout(6000);
    console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  }
  const sh2 = await openSheet();
  console.log('SHEET:', (await text(sh2)).slice(0, 600));
  await c.shot('env-backups/14-schedule-on');
}
if (STEP === 'point-volume') {
  let sh = await openSheet();
  await sh.getByRole('button', { name: 'Back up now', exact: true }).first().click();
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(2000);
  await page.locator('[role=dialog]').last().getByRole('button', { name: /^Deploy \d+ change/ }).click();
  await page.waitForTimeout(6000);
  for (let i = 0; i < 30; i++) {
    sh = await openSheet();
    const t = await text(sh);
    if (/volume/.test(t.split('Recovery points').pop()) && !/In progress|Pending|Queued|Running/i.test(t)) break;
    console.log('   waiting:', t.split('Recovery points').pop().slice(0, 160));
    await page.keyboard.press('Escape'); await page.waitForTimeout(20000);
  }
  console.log('POINTS:', (await text(sh)).split('Recovery points').pop());
  await c.shot('env-backups/15-points');
  await sh.getByRole('button', { name: /Expand recovery point/ }).first().click();
  await page.waitForTimeout(2000);
  console.log('EXPANDED:', (await text(sh)).split('Recovery points').pop());
  console.log('controls:', JSON.stringify(await ctl(sh)));
  await c.shot('env-backups/16-point-open');
}
if (STEP === 'restore-volume') {
  const sh = await openSheet();
  await sh.getByRole('tab', { name: 'Restore' }).click();
  await page.waitForTimeout(2500);
  const opts = await sh.locator('select option').allInnerTexts();
  console.log('points:', JSON.stringify(opts));
  await sh.locator('select').first().selectOption({ index: 0 });
  await page.getByText('Choose…', { exact: true }).click();
  await page.waitForTimeout(1500);
  console.log('CHOOSE:', (await text(sh)).split('What').slice(1).join('What'));
  console.log('controls:', JSON.stringify(await ctl(sh)));
  await c.shot('env-backups/17-restore-choose');
  // Only the volume: untick the database.
  const boxes = sh.locator('input[type=checkbox]');
  const labels = await boxes.evaluateAll((els) => els.map((e) => `${e.checked}:${e.closest('label,div')?.innerText?.trim().slice(0, 40)}`));
  console.log('boxes:', JSON.stringify(labels));
  for (let i = 0; i < labels.length; i++) {
    const isDb = /postgres/i.test(labels[i]);
    const checked = await boxes.nth(i).isChecked();
    if (isDb === checked) await boxes.nth(i).click();
  }
  await page.waitForTimeout(1000);
  console.log('SUMMARY:', (await text(sh)).split('What').slice(1).join('What').slice(-300));
  await c.shot('env-backups/18-restore-volume');
  await sh.getByRole('button', { name: 'Stage restore' }).click();
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(2000);
  const cd = page.locator('[role=dialog]').last();
  console.log('COMMIT:', await text(cd));
  const confirm = cd.locator('input').filter({ hasNot: page.getByPlaceholder(/How these releases/) });
  const ph = await cd.locator('input').evaluateAll((is) => is.map((i) => i.placeholder));
  console.log('inputs:', JSON.stringify(ph));
  const typed = cd.locator('input:not([placeholder^="How these"])').first();
  const want = (await typed.getAttribute('placeholder')) || 'copy';
  await typed.fill(want);
  await c.shot('env-backups/19-restore-commit');
  await cd.getByRole('button', { name: /^Deploy \d+ change/ }).click();
  await page.waitForTimeout(10000);
  console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  for (let i = 0; i < 20; i++) {
    await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
    const t = await text(page.locator('body'));
    console.log('   canvas:', t.split('Designer').pop().slice(0, 300));
    if (/restored/i.test(t) && !/Restoring|Updating|Pending/i.test(t)) break;
    await page.waitForTimeout(20000);
  }
  await c.shot('env-backups/20-restored');
  await page.getByTestId('app-card-unit-vol-data-restored').click();
  await page.waitForTimeout(3000);
  const d = page.locator('[role=dialog]').last();
  console.log('OPENED:', await text(d).catch(() => 'no dialog'));
  console.log('controls:', JSON.stringify(await ctl(d).catch(() => [])));
  await c.shot('env-backups/21-volume-open');
}
if (STEP === 'restored-card') {
  await page.waitForTimeout(3000);
  const card = page.locator('[data-testid*="data-restored"]').first();
  console.log('testids:', JSON.stringify(await page.locator('[data-testid^=app-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))));
  console.log('CARD:', await text(page.locator('body')).then((t) => t.split('Designer').pop().slice(0, 400)));
  await c.shot('env-backups/20-restored');
}
const ADDONS = [
  ['kafka', 'Event streaming platform for real-time data pipelines.'],
  ['memcached', 'Simple in-memory cache to speed up your app.'],
  ['proxysql', 'Connection pooling and read/write split for MariaDB.'],
  ['rabbitmq', 'Message broker for queues and background jobs.'],
  ['email', /^Outbound email with no setup/],
  ['waf', 'Web application firewall (OWASP rules) in front of one of your services.'],
  ['scheduled', 'Cron jobs as their own node — connect them to a service afterwards.'],
];
if (STEP === 'addons-explore') {
  const only = (process.env.ONLY ?? '').split(',').filter(Boolean);
  for (const [id, blurb] of ADDONS) {
    if (only.length && !only.includes(id)) continue;
    console.log(`== ${id}`);
    const d = await menu();
    await d.getByText('Kafka, email, and more').click();
    await page.waitForTimeout(1500);
    await page.locator('[role=dialog]').last().getByText(blurb).first().click();
    await page.waitForTimeout(3500);
    const top = page.locator('[role=dialog]').last();
    const hasDialog = await top.count();
    console.log('  view:', hasDialog ? (await text(top)).slice(0, 900) : (await text(page.locator('body'))).split('Designer').pop().slice(0, 600));
    if (hasDialog) console.log('  controls:', JSON.stringify(await ctl(top)));
    console.log('  toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ').slice(0, 300));
    await c.shot(`addons/${id}-1`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  }
  const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
  if (await commit.count()) {
    await commit.click(); await page.waitForTimeout(2000);
    console.log('STAGED:', await text(page.locator('[role=dialog]').last()));
    await c.shot('addons/x-staged-all');
    await page.locator('[role=dialog]').last().getByRole('button', { name: 'Discard all' }).click();
    await page.waitForTimeout(2000);
    const conf = page.locator('[role=alertdialog], [role=dialog]').last();
    console.log('DISCARD:', await text(conf).catch(() => ''));
    const btn = conf.getByRole('button', { name: /Discard/ }).last();
    if (await btn.count()) await btn.click();
    await page.waitForTimeout(2000);
    console.log('after discard:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 300));
  }
}
const addAddon = async (blurb) => {
  const d = await menu();
  await d.getByText('Kafka, email, and more').click();
  await page.waitForTimeout(1500);
  await page.locator('[role=dialog]').last().getByText(blurb).first().click();
  await page.waitForTimeout(3000);
};
const openCard = async (title) => {
  const ids = await page.locator('[data-testid^=app-card-canvas-group-], [data-testid^=app-card-addon-], [data-testid^=app-card-unit-]').evaluateAll((els) => els.filter((e) => /^app-card-(canvas-group|addon|unit)-/.test(e.dataset.testid) && !/-(footer|status|subtitle|services-toggle|cloudbeaver)-/.test(e.dataset.testid)).map((e) => [e.dataset.testid, e.innerText.split('\n')[0]]));
  const hit = ids.find(([, t]) => t.trim() === title);
  for (let i = 0; i < 15; i++) {
    if (hit) await page.getByTestId(hit[0]).click({ position: { x: 40, y: 20 } });
    else await page.getByText(title, { exact: true }).first().click();
    await page.waitForTimeout(3000);
    if (await page.locator('[role=dialog]').count()) return page.locator('[role=dialog]').last();
  }
  throw new Error(`card ${title} did not open`);
};
if (STEP === 'email-review') {
  await addAddon(/^Outbound email with no setup/);
  await c.shot('addons/email-1-ready');
  const r = await openCard('Email (SMTP)');
  console.log('REVIEW:', await text(r));
  console.log('controls:', JSON.stringify(await ctl(r)));
  await c.shot('addons/email-2-review');
}
if (STEP === 'email-deploy') {
  await addAddon(/^Outbound email with no setup/);
  const r = await openCard('Email (SMTP)');
  await r.getByRole('button', { name: 'Deploy', exact: true }).click();
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(10000);
    await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
    const t = await text(page.locator('body'));
    const seg = t.split('Email (SMTP)')[1] ?? '';
    console.log('   ', seg.slice(0, 80));
    if (/^\s*\S*\s*(Add-on)?\s*Running/.test(seg) || /Email \(SMTP\)[^]*?Running/.test(t.split('DATABASES')[0])) break;
  }
  await c.shot('addons/email-3-running');
  const sh = await openCard('Email (SMTP)');
  console.log('SHEET:', await text(sh));
  console.log('controls:', JSON.stringify(await ctl(sh)));
  await c.shot('addons/email-4-sheet');
  for (const tab of await sh.getByRole('tab').allInnerTexts()) {
    await sh.getByRole('tab', { name: tab.trim(), exact: true }).click();
    await page.waitForTimeout(2500);
    console.log(`TAB ${tab.trim()}:`, (await text(sh)).slice(0, 900));
    console.log('  controls:', JSON.stringify(await ctl(sh)));
    await c.shot(`addons/email-tab-${tab.trim().toLowerCase().replace(/\W+/g, '-')}`);
  }
}
if (STEP === 'email-more') {
  let sh = await openCard('Email (SMTP)');
  await sh.getByRole('button', { name: 'Credentials', exact: true }).click();
  await page.waitForTimeout(2000);
  const cr = page.locator('[role=dialog]').last();
  // Labels only: values are secrets.
  console.log('CREDENTIALS labels:', (await text(cr)).replace(/[A-Za-z0-9+/=_-]{20,}/g, '<redacted>').slice(0, 700));
  console.log('controls:', JSON.stringify(await ctl(cr)));
  await c.shot('addons/email-5-credentials');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  sh = page.locator('[role=dialog]').last();
  if (!(await sh.getByRole('button', { name: 'Send a test email' }).count())) sh = await openCard('Email (SMTP)');
  await sh.getByRole('button', { name: 'Send a test email' }).click();
  await page.waitForTimeout(2000);
  const te = page.locator('[role=dialog]').last();
  console.log('TEST EMAIL:', (await text(te)).slice(0, 700));
  console.log('controls:', JSON.stringify(await ctl(te)));
  await c.shot('addons/email-6-test');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
}
if (STEP === 'email-full') {
  const TO = process.env.TEST_TO;
  if (!TO) throw new Error('TEST_TO');
  let sh = await openCard('Email (SMTP)');
  await c.shot('addons/email-4-sheet');
  await sh.getByRole('button', { name: 'Credentials', exact: true }).click();
  await page.waitForTimeout(2000);
  // The SMTP user is a credential and the relay host names a vendor: blank
  // both values before the shot (labels stay).
  const blanked = await page.evaluate(() => {
    let n = 0;
    for (const label of ['SMTP_USER', 'SMTP_HOST']) {
      const el = [...document.querySelectorAll('[role=dialog] *')].find((e) => e.childElementCount === 0 && e.textContent.trim() === label);
      if (!el) continue;
      let row = el.parentElement;
      while (row && row.innerText.trim() === label) row = row.parentElement;
      for (const leaf of row.querySelectorAll('*')) {
        if (leaf.childElementCount === 0 && leaf.textContent.trim() && leaf.textContent.trim() !== label) { leaf.textContent = '••••••••'; n++; }
      }
    }
    return n;
  });
  console.log('blanked values:', blanked);
  await c.shot('addons/email-5-credentials');
  await sh.getByRole('button', { name: 'Send a test email' }).click();
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('you@example.com').fill(TO);
  await c.shot('addons/email-6-test');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.waitForTimeout(6000);
  console.log('send toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ').replace(TO, '<to>'));
  console.log('after send:', (await text(sh)).split('Send a test email').pop().replace(TO, '<to>').slice(0, 300));
  await c.shot('addons/email-7-sent');

  await sh.getByRole('tab', { name: 'Provider' }).click();
  await page.waitForTimeout(1500);
  await c.shot('addons/email-8-provider');
  await sh.getByRole('tab', { name: 'Connected apps' }).click();
  await page.waitForTimeout(1500);
  await c.shot('addons/email-9-connections');
  await sh.getByRole('switch', { name: 'Connect email to nginx' }).click();
  await page.waitForTimeout(3000);
  console.log('after switch:', (await text(sh)).split('Connections').pop().slice(0, 300));
  console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
  if (await commit.count()) {
    await commit.click(); await page.waitForTimeout(2000);
    console.log('COMMIT:', await text(page.locator('[role=dialog]').last()));
    await c.shot('addons/email-10-commit');
    await page.locator('[role=dialog]').last().getByRole('button', { name: /^Deploy \d+ change/ }).click();
    await page.waitForTimeout(8000);
  }
  const vars = await page.evaluate(async (P) => {
    const a = await (await fetch(`/api/pipelines/${P}/apps`)).json();
    const app = a.phases.find((x) => x.name === 'dev').apps.find((x) => x.name.startsWith('nginx'));
    const d = await (await fetch(`/api/apps/${P}/dev/${app.name}`)).json();
    return { refs: app.sharedAddons, env: (d.spec.envVars || []).map((v) => v.name) };
  }, PROJECT);
  console.log('nginx:', JSON.stringify(vars));
}
if (STEP === 'cron-add') {
  await addAddon('Cron jobs as their own node — connect them to a service afterwards.');
  await c.shot('addons/cron-1-ready');
  const r = await openCard('Scheduled tasks');
  console.log('REVIEW:', await text(r));
  console.log('controls:', JSON.stringify(await ctl(r)));
  await c.shot('addons/cron-2-review');
  await r.getByRole('button', { name: 'Deploy', exact: true }).click();
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(10000);
    await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
    const seg = (await text(page.locator('body'))).split('Scheduled tasks')[1] ?? '';
    console.log('   ', seg.slice(0, 60));
    if (/^\s*(Add-on)?\s*Running/.test(seg)) break;
  }
  await c.shot('addons/cron-3-running');
  const sh = await openCard('Scheduled tasks');
  for (const tab of await sh.getByRole('tab').allInnerTexts()) {
    await sh.getByRole('tab', { name: tab.trim(), exact: true }).click();
    await page.waitForTimeout(2500);
    console.log(`TAB ${tab.trim()}:`, (await text(sh)).slice(0, 1100));
    console.log('  controls:', JSON.stringify(await ctl(sh)));
    await c.shot(`addons/cron-tab-${tab.trim().toLowerCase().replace(/\W+/g, '-')}`);
  }
}
if (STEP === 'cron-task') {
  const sh = await openCard('Scheduled tasks');
  await sh.getByRole('tab', { name: 'Scheduled tasks', exact: true }).click();
  await page.waitForTimeout(1500);
  await sh.getByRole('button', { name: 'Add task' }).first().click();
  await page.waitForTimeout(2000);
  const ed = page.locator('[role=dialog]').last();
  console.log('EDITOR:', await text(ed));
  console.log('controls:', JSON.stringify(await ctl(ed)));
  const fields = await ed.locator('input, textarea, select, [role=combobox]').evaluateAll((els) => els.map((e) => `${e.tagName}|${e.getAttribute('placeholder') ?? ''}|${e.getAttribute('aria-label') ?? ''}|${e.value ?? e.innerText}|${e.closest('label,div')?.querySelector('label')?.innerText ?? ''}`));
  console.log('fields:', JSON.stringify(fields));
  await c.shot('addons/cron-4-editor');
  if (process.env.CREATE) {
  await ed.getByPlaceholder('nightly-cleanup').fill('hello');
  await ed.getByPlaceholder('0 2 * * *').fill('*/30 * * * *');
  await ed.locator('select').first().selectOption({ label: 'nginx-9agm' });
  await page.waitForTimeout(800);
  console.log('runs-in hint:', (await text(ed)).split('Runs in').pop().split('Command')[0]);
  await ed.getByPlaceholder("/bin/sh -c 'echo hello'").fill("/bin/sh -c 'echo hello from nginx; nginx -v'");
  await c.shot('addons/cron-5-filled');
  await ed.getByRole('button', { name: 'Stage', exact: true }).click();
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(2000);
  console.log('COMMIT:', await text(page.locator('[role=dialog]').last()));
  await c.shot('addons/cron-6-commit');
  await page.locator('[role=dialog]').last().getByRole('button', { name: /^Deploy \d+ change/ }).click();
  await page.waitForTimeout(10000);
  const sh2 = await openCard('Scheduled tasks');
  await sh2.getByRole('tab', { name: 'Scheduled tasks', exact: true }).click();
  await page.waitForTimeout(2000);
  console.log('TASKS:', await text(sh2));
  console.log('controls:', JSON.stringify(await ctl(sh2)));
  await c.shot('addons/cron-7-task');
  }
}
if (STEP === 'cron-run') {
  await page.waitForTimeout(5000);
  const sh = await openCard('Scheduled tasks');
  console.log('OPENED:', (await text(sh)).slice(0, 700));
  console.log('tabs:', JSON.stringify(await sh.getByRole('tab').allInnerTexts()));
  await sh.getByRole('tab', { name: /Scheduled tasks|Tasks/ }).first().click();
  await page.waitForTimeout(2500);
  console.log('TASKS:', await text(sh));
  console.log('controls:', JSON.stringify(await ctl(sh)));
  await c.shot('addons/cron-7-task');
  const run = sh.getByRole('button', { name: /Run now|Trigger|Run/ }).first();
  if (await run.count()) {
    console.log('pressing:', await run.innerText(), await run.getAttribute('aria-label'));
    await run.click();
    await page.waitForTimeout(3000);
    const conf = page.locator('[role=alertdialog]');
    if (await conf.count()) { console.log('CONFIRM:', await text(conf.last())); await conf.last().getByRole('button').last().click(); }
    console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  }
  await sh.getByRole('tab', { name: 'Deployment', exact: true }).click();
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(10000);
    const r = sh.getByRole('button', { name: 'Refresh' });
    if (await r.count()) await r.click();
    await page.waitForTimeout(2000);
    const t = await text(sh);
    console.log('   runs:', t.split('Refresh').pop().slice(0, 200));
    if (/Succeeded|Completed|Failed|Success/i.test(t)) break;
  }
  console.log('RUNS:', await text(sh));
  console.log('controls:', JSON.stringify(await ctl(sh)));
  await c.shot('addons/cron-8-runs');
}
if (STEP === 'cron-more') {
  const sh = await openCard('Scheduled tasks');
  await page.waitForTimeout(2000);
  const rowBtn = sh.locator('button:not([role=tab])').filter({ hasText: /^$/ }).first();
  await rowBtn.click(); await page.waitForTimeout(3000);
  console.log('RUN OPEN:', (await text(page.locator('[role=dialog]').last())).slice(0, 900));
  await c.shot('addons/cron-9-run-log');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  const sh2 = page.locator('[role=dialog]').last().getByRole('tab').count().then((n) => n) ? page.locator('[role=dialog]').last() : await openCard('Scheduled tasks');
  const s2 = (await sh2.getByRole('tab', { name: /Scheduled tasks/ }).count()) ? sh2 : await openCard('Scheduled tasks');
  await s2.getByRole('tab', { name: /Scheduled tasks/ }).first().click(); await page.waitForTimeout(2000);
  const icon = s2.locator('button:not([role=tab])').filter({ hasText: /^$/ }).first();
  console.log('icon aria/title:', await icon.getAttribute('aria-label'), await icon.getAttribute('title'));
  await icon.click(); await page.waitForTimeout(2000);
  const top = page.locator('[role=menu], [role=dialog]').last();
  console.log('ICON OPEN:', (await text(top)).slice(0, 900));
  console.log('controls:', JSON.stringify(await ctl(top)));
  await c.shot('addons/cron-10-task-menu');
  await page.getByRole('menuitem', { name: 'View logs' }).click();
  await page.waitForTimeout(6000);
  const lg = page.locator('[role=dialog]').last();
  const t = await text(lg);
  console.log('LOGS:', t.slice(0, 900));
  console.log('has output:', /hello from nginx/.test(t), /nginx version/.test(t));
  await c.shot('addons/cron-11-logs');
}
if (STEP === 'waf') {
  await addAddon('Web application firewall (OWASP rules) in front of one of your services.');
  await page.waitForTimeout(2000);
  console.log('CANVAS:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 400));
  let sh = page.locator('[role=dialog]').last();
  if (!(await sh.count())) sh = await openCard('App Shield (WAF)');
  console.log('tabs:', JSON.stringify(await sh.getByRole('tab').allInnerTexts()));
  for (const tab of await sh.getByRole('tab').allInnerTexts()) {
    await sh.getByRole('tab', { name: tab.trim(), exact: true }).click();
    await page.waitForTimeout(2500);
    console.log(`TAB ${tab.trim()}:`, (await text(sh)).slice(0, 1400));
    console.log('  controls:', JSON.stringify(await ctl(sh)));
    await c.shot(`addons/waf-tab-${tab.trim().toLowerCase().replace(/\W+/g, '-')}`);
  }
}
if (STEP === 'waf-on') {
  await addAddon('Web application firewall (OWASP rules) in front of one of your services.');
  await page.waitForTimeout(2000);
  const sh = page.locator('[role=dialog]').last();
  await sh.getByRole('tab', { name: 'Protection', exact: true }).click();
  await page.waitForTimeout(1500);
  await sh.getByRole('switch').first().click();
  await page.waitForTimeout(1500);
  console.log('after switch:', (await text(sh)).split('Rules').slice(1).join('Rules').slice(0, 300));
  const dlg = page.locator('[role=dialog]').last();
  if ((await text(dlg)) !== (await text(sh))) console.log('NEW DIALOG:', await text(dlg));
  await sh.getByRole('button', { name: /^Blocking/ }).click();
  await page.waitForTimeout(800);
  await c.shot('addons/waf-protection-on');
  await sh.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(4000);
  console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  console.log('after save:', (await text(page.locator('[role=dialog]').last())).slice(0, 600));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  const commit = page.getByRole('button', { name: /^Commit \d+ change/ });
  if (await commit.count()) {
    await commit.click(); await page.waitForTimeout(2000);
    console.log('COMMIT:', await text(page.locator('[role=dialog]').last()));
    await c.shot('addons/waf-commit');
    await page.locator('[role=dialog]').last().getByRole('button', { name: /^Deploy \d+ change/ }).click();
    await page.waitForTimeout(10000);
    console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  }
  console.log('CANVAS:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 500));
}
const KINDS = {
  memcached: ['Memcached', 'Simple in-memory cache to speed up your app.'],
  rabbitmq: ['RabbitMQ', 'Message broker for queues and background jobs.'],
  proxysql: ['ProxySQL', 'Connection pooling and read/write split for MariaDB.'],
  kafka: ['Kafka (Strimzi)', 'Event streaming platform for real-time data pipelines.'],
};
if (STEP === 'kind') {
  const [title, blurb] = KINDS[process.env.KIND];
  const id = process.env.KIND;
  await addAddon(blurb);
  await c.shot(`addons/${id}-1-ready`);
  const r = await openCard(title);
  console.log('REVIEW:', await text(r));
  await c.shot(`addons/${id}-2-review`);
  await r.getByRole('button', { name: 'Deploy', exact: true }).click();
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(10000);
    await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
    const seg = (await text(page.locator('body'))).split(title)[1] ?? '';
    if (i % 3 === 0) console.log('   ', seg.slice(0, 70));
    if (/^\s*\S*\s*(Add-on|Database)\s*Running/.test(seg)) break;
  }
  await c.shot(`addons/${id}-3-running`);
  const sh = await openCard(title);
  for (const tab of await sh.getByRole('tab').allInnerTexts()) {
    await sh.getByRole('tab', { name: tab.trim(), exact: true }).click();
    await page.waitForTimeout(2500);
    console.log(`TAB ${tab.trim()}:`, (await text(sh)).replace(/[A-Za-z0-9+/=_-]{24,}/g, '<redacted>').slice(0, 1200));
    console.log('  controls:', JSON.stringify(await ctl(sh)));
    await c.shot(`addons/${id}-tab-${tab.trim().toLowerCase().replace(/\W+/g, '-')}`);
  }
  const conn = sh.getByRole('switch', { name: /to nginx/ });
  if (await conn.count()) {
    await conn.click(); await page.waitForTimeout(2500);
    await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
    await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(2000);
    console.log('COMMIT:', await text(page.locator('[role=dialog]').last()));
    await page.locator('[role=dialog]').last().getByRole('button', { name: /^Deploy \d+ change/ }).click();
    await page.waitForTimeout(8000);
    const vars = await page.evaluate(async (P) => {
      const a = await (await fetch(`/api/pipelines/${P}/apps`)).json();
      const app = a.phases.find((x) => x.name === 'dev').apps.find((x) => x.name.startsWith('nginx'));
      const d = await (await fetch(`/api/apps/${P}/dev/${app.name}`)).json();
      return { refs: app.sharedAddons, env: (d.spec.envVars || []).map((v) => v.name) };
    }, PROJECT);
    console.log('nginx:', JSON.stringify(vars));
  } else console.log('no connect switch');
}
if (STEP === 'schedule-off') {
  const sh = await openSheet();
  await sh.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.waitForTimeout(1500);
  const box = page.locator('[role=dialog]').last();
  const cbs = box.locator('input[type=checkbox]');
  for (let i = 0; i < await cbs.count(); i++) if (await cbs.nth(i).isChecked()) await cbs.nth(i).click();
  await c.shot('env-backups/22-schedule-off-edit');
  await box.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(3000);
  console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click(); await page.waitForTimeout(2000);
  console.log('COMMIT:', await text(page.locator('[role=dialog]').last()));
  await page.locator('[role=dialog]').last().getByRole('button', { name: /^Deploy \d+ change/ }).click();
  await page.waitForTimeout(6000);
  const sh2 = await openSheet();
  console.log('SHEET:', (await text(sh2)).slice(0, 300));
  await c.shot('env-backups/23-schedule-off');
}
if (STEP === 'kind-try') {
  const [title, blurb] = KINDS[process.env.KIND];
  await addAddon(blurb);
  const r = await openCard(title);
  await r.getByRole('button', { name: 'Deploy', exact: true }).click();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(2500);
    const t = (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ');
    if (t) console.log('toasts:', t);
  }
  console.log('canvas:', (await text(page.locator('body'))).split('Designer').pop().slice(0, 500));
  await c.shot(`addons/${process.env.KIND}-deploy-result`);
}
await c.done();
