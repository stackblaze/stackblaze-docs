// Coroot: open it from the dashboard (Metrics → Open monitoring, and the
// sidebar's Observability), then walk every page a workspace member can
// reach: an app's tabs, Applications, Service Map, Incidents, Alerts and
// Alerting Rules, Logs, Traces, Risks and Dashboards.
//
// STAGE=main (default) does all of that on github-demo-gv35 / dev / nginx.
// STAGE=incident captures an open incident: the project-list badge, the
// phase banner, the canvas badge and the incident in Coroot. It needs a real
// open incident on INCIDENT_PROJECT/INCIDENT_APP (the docs run used an echo
// service in github-demo-kpw0 answering 500 to its own test traffic).
import { open } from '../lib.mjs';

const STAGE = process.env.STAGE ?? 'main';
const PROJECT = process.env.PROJECT ?? 'github-demo-gv35';
const PHASE = process.env.PHASE ?? 'dev';
const APP = process.env.APP ?? 'nginx';
const INCIDENT_PROJECT = process.env.INCIDENT_PROJECT ?? 'github-demo-kpw0';
const INCIDENT_APP = process.env.INCIDENT_APP ?? 'echo';

const c = await open(); const { page } = c;
const ctx = page.context();
const log = async (label, loc) => {
  const t = await (loc ?? page.locator('body')).first().innerText().catch(() => '');
  console.log(`== ${label}:`, t.replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, 'IP').replace(/[\w.+-]+@[\w.-]+/g, '<email>').replace(/\s+/g, ' ').slice(0, 1500));
};

// Pod IPs show up in log lines and Kubernetes events: blank them before a shot.
async function maskIps() {
  await page.evaluate(() => {
    const re = /\b\d{1,3}(\.\d{1,3}){3}\b/g;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (re.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(re, '10.0.0.1');
      re.lastIndex = 0;
    }
  });
}
async function shot(id, opts) { await maskIps(); await c.shot(id, opts); }

async function openCanvas(project) {
  await c.goto(`/pipeline/${project}/apps?phase=${PHASE}`);
  await page.waitForTimeout(4000);
}
async function openService(app) {
  const mg = page.getByRole('button', { name: new RegExp(`^Manage ${app}\\b`) }).first();
  for (let k = 0; k < 4 && !(await mg.isVisible().catch(() => false)); k++) {
    await page.getByRole('button', { name: 'Apps', exact: true }).first().click({ timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(4000);
  }
  await mg.click({ timeout: 60000 });
  await page.waitForTimeout(2500);
}

/** Click something that opens Coroot in a new tab, and return that tab. */
async function handoff(click) {
  const [tab] = await Promise.all([ctx.waitForEvent('page', { timeout: 45000 }), click()]);
  await tab.waitForLoadState('load');
  await tab.waitForTimeout(8000);
  return tab;
}

/** Carry on in the capture page (masked, light, cropped shots): the Coroot
 *  session cookie the handoff set is in this same browser context. */
async function adopt(tab) {
  const url = tab.url();
  await tab.close();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(7000);
  return new URL(url);
}
const main = () => page.locator('main, .v-main').first();
const nav = (label) => page.locator('nav a, .v-navigation-drawer a').filter({ hasText: new RegExp(`^\\s*${label}\\b`) }).first();

if (STAGE === 'main') {
  // 1. Dashboard: the service's Metrics tab → Open monitoring.
  await openCanvas(PROJECT);
  await openService(APP);
  await page.getByRole('tab', { name: /^Metrics/ }).click();
  await page.waitForTimeout(5000);
  const btn = page.getByRole('button', { name: 'Open monitoring' });
  await btn.waitFor({ timeout: 30000 });
  await shot('coroot/open-monitoring', { around: [btn, page.getByRole('button', { name: 'Check performance' })], pad: 24 });
  const tab = await handoff(() => btn.click());
  const u = await adopt(tab);
  const appPath = u.pathname.replace(/\/SLO$/, '');
  const project = u.pathname.split('/').slice(0, 3).join('/');
  const base = u.origin + project;
  console.log('landed on', u.pathname);
  await log('app SLO', main());
  await shot('coroot/app-slo');

  // 2. The app's tabs.
  for (const t of ['Instances', 'CPU', 'Memory', 'Logs', 'Deployments', 'Profiling', 'Tracing']) {
    await page.locator('a').filter({ hasText: new RegExp(`^\\s*${t}\\s*$`) }).last().click();
    await page.waitForTimeout(6000);
    await log(`tab ${t}`, main());
    await shot(`coroot/app-${t.toLowerCase()}`);
  }

  // 3. The time range.
  await page.goto(u.origin + appPath + '/SLO', { waitUntil: 'load' }); await page.waitForTimeout(5000);
  await page.getByText('last hour', { exact: false }).first().click(); await page.waitForTimeout(1500);
  const menu = page.locator('.v-menu__content:visible, .v-overlay__content:visible').last();
  await log('time menu', menu);
  await shot('coroot/time-range', { around: [menu, page.getByText('last hour').first()], pad: 16 });
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);

  // 4. Applications, filtered to this environment's namespace.
  await nav('Applications').click(); await page.waitForTimeout(6000);
  await log('applications', main());
  // An app's handoff only covers its own environment, so the list is
  // already just this environment's apps; the namespaces menu lists it.
  await shot('coroot/applications');
  await page.locator('.v-input').filter({ has: page.locator('label', { hasText: /^namespaces$/ }) }).locator('.v-select__slot').first().click();
  await page.waitForTimeout(1500);
  const nsMenu = page.locator('.v-menu__content:visible').last();
  await log('namespaces menu', nsMenu);
  await shot('coroot/namespaces', { around: [nsMenu, page.locator('label', { hasText: /^namespaces$/ }).first()], pad: 16 });
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);

  // 5. Service Map (same filter carries over in the URL).
  const q = new URL(page.url()).search;
  await page.goto(`${base}/map${q}`, { waitUntil: 'load' }); await page.waitForTimeout(7000);
  await log('map', main());
  await shot('coroot/service-map');

  // 6. Incidents.
  await page.goto(`${base}/incidents${q}`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
  await log('incidents', main());
  await shot('coroot/incidents-empty');

  // 7. Alerts and Alerting Rules.
  await page.goto(`${base}/alerts`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
  await log('alerts', main());
  await shot('coroot/alerts');
  await page.getByText('Alerting Rules', { exact: true }).first().click(); await page.waitForTimeout(4000);
  await log('alerting rules', main());
  await shot('coroot/alerting-rules');
  await page.getByText('Add rule', { exact: true }).first().click(); await page.waitForTimeout(2500);
  const dlg = page.locator('.v-dialog:visible, .v-overlay__content:visible, [role=dialog]').last();
  await log('add rule', dlg);
  await shot('coroot/add-rule', { locator: '.v-dialog:visible >> nth=-1' }).catch(async () => shot('coroot/add-rule'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);

  // 8. Logs, Traces, Risks, Dashboards.
  await page.goto(`${base}/logs${q}`, { waitUntil: 'load' }); await page.waitForTimeout(7000);
  await log('logs', main());
  await shot('coroot/logs');
  await page.goto(`${base}/traces`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
  await log('traces', main());
  await shot('coroot/traces');
  await page.goto(`${base}/risks${q}`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
  await log('risks', main());
  await shot('coroot/risks');
  await page.goto(`${base}/dashboards`, { waitUntil: 'load' }); await page.waitForTimeout(4000);
  await log('dashboards', main());
  await shot('coroot/dashboards');

  // 9. Go to… (ctrl+k).
  await page.getByText('Go to...', { exact: true }).first().click(); await page.waitForTimeout(1500);
  await page.keyboard.type('nginx'); await page.waitForTimeout(2000);
  await log('go to', page.locator('.v-dialog:visible, .v-overlay__content:visible').last());
  await shot('coroot/go-to');
  await page.keyboard.press('Escape');

  // 10. Dashboard home: the sidebar's Observability opens every project.
  await c.goto('/'); await page.waitForTimeout(5000);
  const obs = page.getByText('Observability', { exact: true }).first();
  await shot('coroot/sidebar-observability', { around: obs, pad: 120 });
  const tab2 = await handoff(() => obs.click());
  const u2 = await adopt(tab2);
  console.log('observability landed on', u2.pathname, [...u2.searchParams.keys()]);
  await log('observability', main());
}

if (STAGE === 'incident') {
  // Project list: the project's badge.
  await c.goto('/'); await page.waitForTimeout(8000);
  const name = page.getByTestId('project-name').filter({ hasText: INCIDENT_PROJECT }).first();
  const row = name.locator('xpath=ancestor::*[self::tr or contains(@class,"rounded")][1]');
  await log('project row', row);
  await shot('coroot/incident-project-badge', { around: row, pad: 12 });

  // The environment's canvas: banner and the service's badge.
  await openCanvas(INCIDENT_PROJECT);
  const banner = page.getByRole('alert').first();
  await banner.waitFor({ timeout: 60000 });
  await log('banner', banner);
  await shot('coroot/incident-banner', { around: banner, pad: 12 });
  const badge = page.locator('a, span').filter({ hasText: /^\s*Incident\s*$/ }).first();
  const card = badge.locator('xpath=..');
  await log('card', card);
  await shot('coroot/incident-canvas-badge', { around: card, pad: 24 });
  // The card's badge opens the same incident in a new tab.
  const viaBadge = await handoff(() => badge.click());
  console.log('badge opened', new URL(viaBadge.url()).pathname + new URL(viaBadge.url()).search.replace(/return_url=[^&]*/, 'return_url=…'));
  await viaBadge.close();

  // View in monitoring → the incident in Coroot.
  const tab = await handoff(() => banner.getByRole('button', { name: 'View in monitoring' }).click());
  const u = await adopt(tab);
  console.log('incident landed on', u.pathname);
  await log('incident', main());
  await shot('coroot/incident-detail');
  const base = u.origin + u.pathname.split('/').slice(0, 3).join('/');
  await page.goto(`${base}/incidents`, { waitUntil: 'load' }); await page.waitForTimeout(6000);
  await log('incidents list', main());
  await shot('coroot/incidents');
  // The incident's traces tab.
  await page.getByRole('link', { name: /incident/ }).first().click().catch(() => {});
  await page.locator('a, .v-tab').filter({ hasText: /^\s*i-/ }).first().click().catch(() => {});
  await page.waitForTimeout(5000);
  await page.locator('.v-tab, a').filter({ hasText: /^\s*traces\s*$/ }).first().click(); await page.waitForTimeout(6000);
  await log('incident traces', main());
  await shot('coroot/incident-traces');

  // Back on the canvas: dismiss the banner.
  await openCanvas(INCIDENT_PROJECT);
  const b2 = page.getByRole('alert').first();
  await b2.waitFor({ timeout: 60000 });
  await b2.getByRole('button', { name: 'Dismiss' }).click(); await page.waitForTimeout(2000);
  console.log('banners after dismiss:', await page.getByRole('alert').count());
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(6000);
  console.log('banners after reload:', await page.getByRole('alert').count());
}

if (STAGE === 'probe') {
  // Edit controls a workspace member sees: what happens when used.
  await openCanvas(INCIDENT_PROJECT);
  const tab = await handoff(() => page.getByRole('alert').first().getByRole('button', { name: 'View in monitoring' }).click());
  const u = await adopt(tab);
  const base = u.origin + u.pathname.split('/').slice(0, 3).join('/');
  const resp = [];
  page.on('response', (r) => { if (r.request().method() !== 'GET' && r.url().includes('/api/')) resp.push(`${r.request().method()} ${new URL(r.url()).pathname} -> ${r.status()}`); });
  await page.goto(`${base}/incidents`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
  await page.locator('a').filter({ hasText: /^\s*i-/ }).first().click(); await page.waitForTimeout(5000);
  await page.locator('.mdi-pencil').first().click(); await page.waitForTimeout(2000);
  await log('slo edit', page.locator('.v-dialog:visible').last());
  await shot('coroot/slo-edit', { locator: '.v-dialog:visible >> nth=-1' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
  await page.goto(`${base}/dashboards`, { waitUntil: 'load' }); await page.waitForTimeout(4000);
  await page.getByText('Add dashboard').first().click(); await page.waitForTimeout(2000);
  const d = page.locator('.v-dialog:visible').last();
  await log('add dashboard', d);
  await d.locator('input').first().fill('docs-check');
  await d.getByRole('button', { name: /save|create|add/i }).first().click().catch((e) => console.log('no save', e.message));
  await page.waitForTimeout(3000);
  await log('after add dashboard', page.locator('body'));
  console.log('responses', resp.join(' | '));
}


if (STAGE === 'tracing-on' || STAGE === 'tracing-off') {
  // Setup for the telemetry examples: Tracing on each demo service, with the
  // language its code needs (see observe/tracing-and-log-retention).
  const { helpers } = await import('./_settings.mjs');
  const want = { orders: 'nodejs', inventory: 'python', reports: 'sdk' };
  for (const [svc, language] of Object.entries(want)) {
    const h = helpers(c, INCIDENT_PROJECT, svc);
    await h.openSettings();
    await h.jump('Tracing');
    const sw = page.locator('#app-tracing');
    const on = (await sw.getAttribute('aria-checked')) === 'true' || (await sw.getAttribute('data-state')) === 'checked';
    if (STAGE === 'tracing-on') {
      if (!on) await sw.click();
      await page.waitForTimeout(400);
      await page.locator('#app-tracing-language').selectOption(language);
    } else if (on) await sw.click();
    await page.waitForTimeout(400);
    await h.commitDeploy(`Tracing ${STAGE === 'tracing-on' ? language : 'off'} for ${svc}`).catch((e) => console.log(svc, 'nothing to commit?', e.message));
    await h.waitRunning().catch(() => {});
    console.log(svc, JSON.stringify((await h.spec()).tracing));
  }
}

if (STAGE === 'extras') {
  // Every other control: menus, toggles and links, read and shot.
  await openCanvas(PROJECT);
  await openService(APP);
  await page.getByRole('tab', { name: /^Metrics/ }).click(); await page.waitForTimeout(4000);
  const u = await adopt(await handoff(() => page.getByRole('button', { name: 'Open monitoring' }).click()));
  const appPath = u.origin + u.pathname.replace(/\/SLO$/, '');
  const base = u.origin + u.pathname.split('/').slice(0, 3).join('/');
  const menuNow = () => page.locator('.v-menu__content:visible').last();
  const tryStep = async (label, fn) => { try { await fn(); } catch (e) { console.log(`!! ${label}:`, e.message.split('\n')[0]); } await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(700); };

  await tryStep('app menu', async () => {
    await page.locator('.mdi-dots-vertical').first().click(); await page.waitForTimeout(1200);
    await log('app ⋮ menu', menuNow());
    await shot('coroot/app-menu', { around: [menuNow(), page.locator('.mdi-dots-vertical').first()], pad: 16 });
  });
  await tryStep('help', async () => {
    await page.getByText('Help', { exact: true }).first().click(); await page.waitForTimeout(1200);
    await log('help menu', menuNow());
    console.log('help links', JSON.stringify(await menuNow().locator('a').evaluateAll((as) => as.map((a) => [a.innerText.trim(), a.getAttribute('href')]))));
    await shot('coroot/help-menu', { around: [menuNow(), page.getByText('Help', { exact: true }).first()], pad: 16 });
  });
  await tryStep('user', async () => {
    const who = page.locator('nav, .v-navigation-drawer').getByText(/@/).first();
    await who.click(); await page.waitForTimeout(1200);
    await log('user menu', menuNow());
    console.log('user links', JSON.stringify(await menuNow().locator('a').evaluateAll((as) => as.map((a) => [a.innerText.trim(), a.getAttribute('href')]))));
    await shot('coroot/user-menu', { around: [menuNow(), who], pad: 16 });
  });
  await tryStep('collapse', async () => {
    await page.getByText('Collapse', { exact: true }).first().click(); await page.waitForTimeout(1200);
    await shot('coroot/collapsed', { clip: { x: 0, y: 0, width: 520, height: 900 } });
    await page.locator('.mdi-chevron-right, [class*=chevron-right]').last().click().catch(() => {});
    await page.waitForTimeout(800);
    console.log('expanded again:', await page.getByText('Collapse', { exact: true }).count());
  });
  await tryStep('app logs patterns', async () => {
    await page.goto(appPath + '/Logs', { waitUntil: 'load' }); await page.waitForTimeout(5000);
    await page.getByText('Patterns', { exact: true }).first().click(); await page.waitForTimeout(4000);
    await log('logs patterns', main());
    await shot('coroot/app-logs-patterns');
    console.log('configure link', await page.getByText('configure').first().getAttribute('href').catch(() => null));
  });
  await tryStep('show logs menu', async () => {
    await page.goto(base + '/logs', { waitUntil: 'load' }); await page.waitForTimeout(5000);
    await page.locator('.mdi-chevron-down, .mdi-menu-down').first().click(); await page.waitForTimeout(1000);
    await log('show logs menu', menuNow());
  });
  for (const [path, toggle] of [['incidents', 'Show resolved'], ['alerts', 'Show resolved'], ['risks', 'Show dismissed']]) {
    await tryStep(`${path} ${toggle}`, async () => {
      await page.goto(`${base}/${path}`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
      await page.getByText(toggle, { exact: true }).first().click(); await page.waitForTimeout(3000);
      await log(`${path} + ${toggle}`, main());
      await shot(`coroot/${path}-${toggle.toLowerCase().replace(' ', '-')}`);
    });
  }
  await tryStep('risk row menu', async () => {
    await page.goto(`${base}/risks`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
    const dots = page.locator('main .mdi-dots-vertical, main .mdi-dots-horizontal').first();
    await dots.click(); await page.waitForTimeout(1000);
    await log('risk row menu', menuNow());
    await shot('coroot/risk-menu', { around: [menuNow(), dots], pad: 16 });
  });
  await tryStep('rule selects', async () => {
    await page.goto(`${base}/alerts`, { waitUntil: 'load' }); await page.waitForTimeout(4000);
    await page.getByText('Add rule', { exact: true }).first().click(); await page.waitForTimeout(2500);
    const dlg = page.locator('.v-dialog:visible').last();
    const selects = dlg.locator('.v-select__slot');
    for (let i = 0; i < await selects.count(); i++) {
      await selects.nth(i).click(); await page.waitForTimeout(1000);
      await log(`rule select ${i}`, menuNow());
      if (i === 1) await shot('coroot/rule-inspections', { around: [menuNow()], pad: 8 });
      await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    }
  });
}

if (STAGE === 'telemetry') {
  // The telemetry examples (orders → inventory, reports → inventory in
  // INCIDENT_PROJECT), seen from orders' Open monitoring.
  await openCanvas(INCIDENT_PROJECT);
  await openService('orders');
  await page.getByRole('tab', { name: /^Metrics/ }).click(); await page.waitForTimeout(4000);
  const u = await adopt(await handoff(() => page.getByRole('button', { name: 'Open monitoring' }).click()));
  const appPath = u.origin + u.pathname.replace(/\/[^/]+$/, '');
  const base = u.origin + u.pathname.split('/').slice(0, 3).join('/');
  const tryStep = async (label, fn) => { try { await fn(); } catch (e) { console.log(`!! ${label}:`, e.message.split('\n')[0]); } await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(700); };

  await tryStep('map', async () => {
    await page.goto(`${base}/map`, { waitUntil: 'load' }); await page.waitForTimeout(8000);
    await log('map', main());
    await shot('coroot/service-map-calls');
  });
  await tryStep('alerts', async () => {
    await page.goto(`${base}/alerts`, { waitUntil: 'load' }); await page.waitForTimeout(6000);
    await log('alerts', main());
    await shot('coroot/alerts-list');
  });
  await tryStep('platform-jobs', async () => {
    await page.goto(`${base}/applications`, { waitUntil: 'load' }); await page.waitForTimeout(6000);
    const before = await page.locator('main tbody tr').count();
    await page.getByText('platform-jobs', { exact: true }).first().click(); await page.waitForTimeout(3000);
    console.log('rows before/after platform-jobs:', before, await page.locator('main tbody tr').count());
    await log('apps with platform-jobs', main());
    await page.getByText('application', { exact: true }).first().click(); await page.waitForTimeout(3000);
    await log('apps with only platform-jobs', main());
  });
  for (const [label, kind] of [['otel', 'OpenTelemetry'], ['ebpf', 'OpenTelemetry (eBPF)']]) {
    await tryStep(`tracing ${label}`, async () => {
      await page.goto(appPath + '/Tracing', { waitUntil: 'load' }); await page.waitForTimeout(6000);
      await page.locator('main .v-select__slot').first().click(); await page.waitForTimeout(800);
      await page.locator('.v-menu__content:visible').getByText(kind, { exact: true }).click(); await page.waitForTimeout(7000);
      await log(`orders tracing ${label}`, main());
      await shot(`coroot/telemetry-${label}-list`);
      const first = page.locator('main a').filter({ hasText: /^\s*[0-9a-f]{8}\s*$/ }).first();
      await first.click(); await page.waitForTimeout(7000);
      await log(`trace ${label}`, main());
      await shot(`coroot/telemetry-${label}-trace`);
    });
  }
  await tryStep('traces page', async () => {
    await page.goto(`${base}/traces`, { waitUntil: 'load' }); await page.waitForTimeout(8000);
    await log('traces page', main());
    await shot('coroot/telemetry-traces-page');
  });
}

if (STAGE === 'telemetry2') {
  // The Traces page: the OpenTelemetry spans of the examples.
  await openCanvas(INCIDENT_PROJECT);
  await openService('orders');
  await page.getByRole('tab', { name: /^Metrics/ }).click(); await page.waitForTimeout(4000);
  const u = await adopt(await handoff(() => page.getByRole('button', { name: 'Open monitoring' }).click()));
  const base = u.origin + u.pathname.split('/').slice(0, 3).join('/');
  const tab = (t) => page.getByText(t, { exact: true }).first();
  const toTabs = async (target) => {
    // Coroot's content pane scrolls, not the window: bring `target` (the
    // part the shot is about) to the middle of the screen.
    const el = !target ? tab('compare attributes') : typeof target === 'string' || target instanceof RegExp ? page.getByText(target).first() : target;
    await el.evaluate((e, block) => e.scrollIntoView({ block }), target ? 'center' : 'start');
    await page.waitForTimeout(800);
  };
  for (const svc of ['orders-8i8t', 'reports-y21p']) {
    await page.goto(`${base}/traces`, { waitUntil: 'load' }); await page.waitForTimeout(8000);
    if (svc === 'orders-8i8t') { await log('traces overview', main()); await shot('coroot/telemetry-traces-page'); }
    await page.getByText(svc, { exact: true }).first().click(); await page.waitForTimeout(6000);
    const short = svc.split('-')[0];
    if (svc === 'orders-8i8t') {
      await tab('traces').click(); await page.waitForTimeout(6000);
      await log('traces list', main());
      await toTabs(); await shot(`coroot/telemetry-${short}-traces`);
      await tab('error causes').click(); await page.waitForTimeout(6000);
      await log('error causes', main());
      await toTabs('only 0 pen left'); await shot('coroot/telemetry-error-causes');
    }
    await tab('latency explorer').click(); await page.waitForTimeout(8000);
    await log(`latency explorer ${svc}`, main());
    await toTabs(page.locator('main input').last()); await shot(`coroot/telemetry-${short}-flamegraph`);
    if (svc === 'orders-8i8t') {
      await tab('compare attributes').click(); await page.waitForTimeout(8000);
      await log('compare attributes', main());
      await toTabs(/^order\.qty$/); await shot(`coroot/telemetry-${short}-attributes`);
    }
  }
}

if (STAGE === 'rule') {
  // Add an alerting rule for real (Kubernetes events), see it listed,
  // then delete it again. Plus the platform-jobs category checkbox.
  await openCanvas(INCIDENT_PROJECT);
  await openService('orders');
  await page.getByRole('tab', { name: /^Metrics/ }).click(); await page.waitForTimeout(4000);
  const u = await adopt(await handoff(() => page.getByRole('button', { name: 'Open monitoring' }).click()));
  const base = u.origin + u.pathname.split('/').slice(0, 3).join('/');
  const resp = [];
  page.on('response', (r) => { if (r.request().method() !== 'GET' && r.url().includes('/api/')) resp.push(`${r.request().method()} ${new URL(r.url()).pathname} -> ${r.status()}`); });
  await page.goto(`${base}/applications`, { waitUntil: 'load' }); await page.waitForTimeout(6000);
  const rows = async () => page.locator('main table tbody tr').count();
  const before = await rows();
  await page.locator('.v-input--checkbox, .v-input').filter({ hasText: /^\s*platform-jobs\s*$/ }).locator('input').first().check({ force: true }).catch((e) => console.log('pj', e.message.split('\n')[0]));
  await page.waitForTimeout(4000);
  console.log('rows: application only', before, '+ platform-jobs', await rows());
  await log('with platform-jobs', main());
  await page.locator('.v-input').filter({ hasText: /^\s*platform-jobs\s*$/ }).locator('input').first().uncheck({ force: true }).catch(() => {});

  await page.goto(`${base}/alerts`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
  await page.getByText('Alerting Rules', { exact: true }).first().click(); await page.waitForTimeout(3000);
  await page.getByText('Add rule', { exact: true }).first().click(); await page.waitForTimeout(2500);
  const dlg = page.locator('.v-dialog:visible').last();
  await dlg.locator('input').first().fill('docs-check: back-off');
  await dlg.locator('.v-select__slot').first().click(); await page.waitForTimeout(800);
  await page.locator('.v-menu__content:visible').getByText('Kubernetes events', { exact: true }).click(); await page.waitForTimeout(1500);
  await log('rule form with Kubernetes events', dlg);
  await shot('coroot/add-rule-events', { locator: '.v-dialog:visible >> nth=-1' });
  // Fill any empty required text fields the form shows for this source.
  await dlg.getByRole('button', { name: 'Create' }).click({ timeout: 5000 }).catch((e) => console.log('create disabled?', e.message.split('\n')[0]));
  await page.waitForTimeout(3000);
  await log('after create', page.locator('body'));
  await shot('coroot/alerting-rules-one');
  console.log('responses', resp.join(' | '));
  // Delete it again.
  const row = page.locator('main tr').filter({ hasText: 'docs-check' }).first();
  if (await row.count()) {
    await row.locator('button, .mdi-delete, .mdi-dots-vertical').last().click().catch(() => {}); await page.waitForTimeout(1500);
    await log('row action', page.locator('.v-menu__content:visible, .v-dialog:visible').last());
    await page.getByText(/^\s*Delete\s*$/).last().click().catch(() => {}); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Delete|Yes|Confirm/ }).last().click().catch(() => {}); await page.waitForTimeout(3000);
    await log('rules after delete', main());
  }
  console.log('responses', resp.join(' | '));
}

await c.done();
