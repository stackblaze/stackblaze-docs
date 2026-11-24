// Shared steps for the settings-*.mjs flows: open a service's Settings tab,
// commit + deploy the staged change, and read the saved app back.
import { PANEL } from '../lib.mjs';

export const PROJECT = process.env.CAPTURE_PROJECT ?? 'github-demo-kpw0';
export const SERVICE = process.env.CAPTURE_SERVICE ?? 'nginx-unprivileged';
export const PHASE = 'dev';
export { PANEL };
/** The service panel (sheet) over the canvas. */
export const SHEET = '[data-slot=sheet-content]';

export function helpers(c, project = PROJECT, service = SERVICE) {
  const { page } = c;
  const dialog = () => page.locator('[data-slot=dialog-content]').last();
  const section = (id) => page.locator(`[data-settings-section="${id}"]`).first();

  async function openSettings() {
    await c.goto(`/pipeline/${project}/apps?phase=${PHASE}`);
    const card = page.getByText(service, { exact: true }).first();
    await card.waitFor({ timeout: 90000 });
    await card.click();
    await page.locator('button,[role=tab],a').filter({ hasText: /^Settings/ }).first().click();
    await page.locator('nav[aria-label="Settings sections"]').waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500);
  }

  async function rail() {
    return page.locator('nav[aria-label="Settings sections"] button').allInnerTexts();
  }

  async function jump(label) {
    await page.locator('nav[aria-label="Settings sections"] button').filter({ hasText: new RegExp(`^${label}$`) }).click();
    await page.waitForTimeout(900);
  }

  /** The app as the API has it (spec of the saved app). */
  async function spec() {
    return page.evaluate(async ([p, ph, s]) => {
      const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
      const app = (a.phases || []).find((x) => x.name === ph).apps.find((x) => x.name.startsWith(s));
      const d = await (await fetch(`/api/apps/${p}/${ph}/${app.name}`)).json();
      return { name: app.name, ...(d.spec || d) };
    }, [project, PHASE, service]);
  }

  /** Commit → (shot of the review dialog) → Deploy → wait until it is applied. */
  async function commitDeploy(message, shotId) {
    const commit = page.getByRole('button', { name: /^Commit \d+ changes?/ });
    await commit.waitFor({ timeout: 15000 });
    await commit.click();
    await page.getByText(/change(s)? to apply/).first().waitFor();
    await page.getByPlaceholder('How these releases appear in the history').fill(message);
    const items = (await dialog().innerText()).replace(/\s+/g, ' ');
    console.log('   commit dialog:', items.slice(0, 400));
    if (shotId) await c.shot(shotId, { locator: '[data-slot=dialog-content]' });
    await dialog().getByRole('button', { name: /^Deploy \d+ changes?/ }).click();
    await page.getByText(/change(s)? to apply/).first().waitFor({ state: 'hidden', timeout: 120000 });
    await page.waitForTimeout(3000);
    return items;
  }

  /** Discard every staged change (Commit → Discard all). */
  async function discard() {
    const commit = page.getByRole('button', { name: /^Commit \d+ changes?/ });
    if (!(await commit.count())) return;
    await commit.click();
    await page.getByText(/change(s)? to apply/).first().waitFor();
    await dialog().getByRole('button', { name: 'Discard all' }).click();
    await page.waitForTimeout(1500);
    console.log('   discarded; commit button left:', await commit.count());
  }

  /** Wait until the card on the canvas says Running again. */
  async function status() {
    return page.evaluate(async ([p, ph, s]) => {
      const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
      const app = (a.phases || []).find((x) => x.name === ph).apps.find((x) => x.name.startsWith(s));
      const r = await fetch(`/api/apps/${p}/${ph}/${app.name}/status`);
      return r.ok ? r.json() : null;
    }, [project, PHASE, service]).catch(() => null);
  }

  /** Wait until every workload of the app is rolled out and ready. */
  async function waitRunning(timeout = 300000, until = () => true) {
    await page.waitForTimeout(10000);
    const t0 = Date.now();
    let st;
    while (Date.now() - t0 < timeout) {
      st = await status();
      const deps = st?.deployments || [];
      const done = deps.length && deps.every((d) => d.ready === d.desired && d.updated === d.desired && !d.generationLagging && !d.unavailable);
      const pods = (st?.pods || []).filter((p) => p.phase !== 'Succeeded');
      if (done && pods.every((p) => p.ready) && until(st)) {
        // The status can lag a moment behind: confirm it twice.
        await page.waitForTimeout(5000);
        const again = await status();
        if (until(again)) return again;
      }
      await page.waitForTimeout(5000);
    }
    throw new Error(`service did not finish rolling out: ${JSON.stringify(st)?.slice(0, 500)}`);
  }

  /** Turn a switch on or off (no-op when it already is), and check it took. */
  async function setSwitch(sel, on) {
    const sw = typeof sel === 'string' ? page.locator(sel) : sel;
    await sw.scrollIntoViewIfNeeded();
    for (let i = 0; i < 3; i++) {
      if ((await sw.getAttribute('aria-checked')) === String(on)) return;
      await sw.click();
      await page.waitForTimeout(600);
    }
    if ((await sw.getAttribute('aria-checked')) !== String(on)) throw new Error(`switch ${sel} did not turn ${on ? 'on' : 'off'}`);
  }

  return { page, dialog, setSwitch, section, openSettings, rail, jump, spec, status, commitDeploy, discard, waitRunning };
}

/** GET a URL from outside (status + first bytes), never throws. */
export async function probe(url, init) {
  try {
    // A fresh query string each time, so the edge cache never answers.
    const u = new URL(url); u.searchParams.set('nocache', Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    const r = await fetch(u, { redirect: 'manual', cache: 'no-store', ...init });
    return { status: r.status, headers: Object.fromEntries(r.headers), body: (await r.text()).slice(0, 200) };
  } catch (e) {
    return { status: 0, error: e.cause?.code || e.message };
  }
}
