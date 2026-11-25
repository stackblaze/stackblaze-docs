// Preview environments, end to end, on the project that deploys the public
// starter repository (react-vite-starter, branch main, in Dev).
// Run one stage at a time, in order (STAGE=…):
//   on      Project settings → Preview environments: switch on → Save changes
//   open    push a branch with a changed heading, open a pull request, watch
//           pr-<n> appear in the project, build and answer on its address
//   push    push a second commit to the pull request: the preview rebuilds
//   panel   the preview's bar: Sync dialog (cancelled), Delete dialog (cancelled)
//   close   close the pull request (not merged), delete the branch, watch the
//           preview go away
//   off     switch previews off again → Save changes
// Needs the isolated dev CLI (CLI_BIN, CLI_HOME) and `gh` signed in with
// write access to the repository. The pull request is never merged.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { open, DASHBOARD } from '../lib.mjs';

const PROJECT = process.env.PREVIEW_PROJECT ?? 'github-demo-587h';
const REPO = process.env.PREVIEW_REPO ?? 'stackblaze/react-vite-starter';
const BRANCH = 'docs/preview-environment-test';
const STAGE = process.env.STAGE;
const BIN = process.env.CLI_BIN;
const HOME = process.env.CLI_HOME;
if (!BIN || !HOME) throw new Error('set CLI_BIN and CLI_HOME (an isolated CLI install)');
const API = DASHBOARD.replace('dashboard', 'api').replace('.stackblaze.com', '.stackblaze.cloud');
const cli = (...args) => execFileSync(BIN, args, { env: { ...process.env, HOME, STACKBLAZE_API_URL: API, NO_COLOR: '1' }, encoding: 'utf8' });
const project = () => JSON.parse(cli('api', 'GET', `/api/pipelines/${PROJECT}`));
const previewPhases = () => (project().phases ?? []).filter((p) => /^pr-\d+$/.test(p.name));
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();
const sh = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8' }).trim();
const STATE = path.join(os.tmpdir(), `preview-environments-${PROJECT}.json`);
const state = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {});
const save = (s) => fs.writeFileSync(STATE, JSON.stringify({ ...state(), ...s }, null, 2));
const t0 = Date.now();
const elapsed = () => `${Math.round((Date.now() - t0) / 1000)}s`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COMMIT_TRAILERS = '\n\nAgent: claude-code\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>';
function commitHeading(dir, text, message) {
  const f = path.join(dir, 'src/App.tsx');
  const src = fs.readFileSync(f, 'utf8').replace(/<h1>[^<]*<\/h1>/, `<h1>${text}</h1>`);
  fs.writeFileSync(f, src);
  sh('git', ['add', 'src/App.tsx'], dir);
  sh('git', ['-c', 'user.name=Adam', '-c', 'user.email=adam@stackblaze.com', 'commit', '-q', '-m', message + COMMIT_TRAILERS], dir);
  sh('git', ['push', '-q', 'origin', BRANCH], dir);
  return sh('git', ['rev-parse', '--short', 'HEAD'], dir);
}
function checkout() {
  const dir = path.join(os.tmpdir(), 'preview-environments-repo');
  if (!fs.existsSync(dir)) sh('gh', ['repo', 'clone', REPO, dir, '--', '-q'], os.tmpdir());
  return dir;
}
/** The preview's app address, from the project's apps. */
function previewHost(phase) {
  const apps = JSON.parse(cli('api', 'GET', `/api/pipelines/${PROJECT}/apps`));
  const ph = (apps.phases ?? []).find((p) => p.name === phase);
  const app = ph?.apps?.[0];
  if (!app) return null;
  const spec = JSON.parse(cli('api', 'GET', `/api/apps/${PROJECT}/${phase}/${app.name}`));
  return { app: app.name, host: (spec.spec ?? spec).ingress?.hosts?.[0]?.host, tag: (spec.spec ?? spec).image?.tag };
}
/** Does the address serve a bundle containing `text`? */
function serves(host, text) {
  try {
    const html = execFileSync('curl', ['-s', '-L', '--max-time', '15', `https://${host}/`], { encoding: 'utf8' });
    const js = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
    if (!js) return false;
    const bundle = execFileSync('curl', ['-s', '-L', '--max-time', '15', `https://${host}${js}`], { encoding: 'utf8' });
    return bundle.includes(text);
  } catch { return false; }
}
function prComment(n) {
  const list = JSON.parse(gh('api', `repos/${REPO}/issues/${n}/comments`));
  return list.find((x) => x.body?.includes('stackblaze-preview')) ?? null;
}

const c = await open();
const { page } = c;
page.on('dialog', (d) => { console.log(`    dialog (${d.type()}): ${d.message()}`); d.dismiss().catch(() => {}); });
const center = (sel) => page.locator(sel).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
const menu = () => page.getByRole('menu').first();
async function openSwitcher() {
  await page.getByTestId('phase-switcher').click();
  await menu().waitFor();
  await page.waitForTimeout(500);
}
/** Open the preview's canvas; a first load can hang on the loader, so try again. */
async function gotoPreview(phase) {
  for (let i = 0; ; i++) {
    await c.goto(`/pipeline/${PROJECT}/apps?phase=${phase}`);
    try { await page.getByTestId('preview-bar').waitFor({ timeout: 30000 }); return; } catch (e) {
      if (i >= 2) throw e;
      console.log('    canvas still loading after 30s; loading it again');
    }
  }
}
async function savePreview(expectEnabled) {
  const put = page.waitForResponse((r) => r.url().includes(`/api/pipelines/${PROJECT}`) && r.request().method() === 'PUT', { timeout: 90000 });
  await page.getByTestId('save-preview').click();
  const r = await put;
  console.log('    PUT', r.status());
  if (r.status() >= 300) throw new Error((await r.text()).slice(0, 300));
  await page.locator('#previews').getByText('Saved.').waitFor({ timeout: 10000 });
  for (let i = 0; i < 20 && project().preview?.enabled !== expectEnabled; i++) await sleep(1500);
  if (project().preview?.enabled !== expectEnabled) throw new Error('preview setting not saved');
}

if (STAGE === 'on') {
  if (project().preview?.enabled) throw new Error('previews are already on');
  console.log('1. Project settings → General → Preview environments (off)');
  await c.goto(`/pipeline/${PROJECT}/settings/general`);
  await page.getByTestId('preview-switch').waitFor();
  await center('#previews');
  await c.shot('projects/prev-1-off', { locator: '#previews' });
  c.checkpoint();
  console.log('2. Switch on → Save changes');
  await page.getByTestId('preview-switch').click();
  await page.getByTestId('preview-mode').waitFor();
  console.log('    card:', (await page.locator('#previews').innerText()).replace(/\n+/g, ' | '));
  await savePreview(true);
  await center('#previews');
  await c.shot('projects/prev-2-on', { locator: '#previews' });
  c.checkpoint();
  console.log('    stored:', JSON.stringify(project().preview));
}

if (STAGE === 'open') {
  if (!project().preview?.enabled) throw new Error('turn previews on first (STAGE=on)');
  if (previewPhases().length) throw new Error('a preview already exists');
  const dir = checkout();
  sh('git', ['fetch', '-q', 'origin'], dir);
  sh('git', ['checkout', '-q', '-B', BRANCH, 'origin/main'], dir);
  const sha = commitHeading(dir, 'Hello from a preview', 'docs: change the heading for a preview environment test');
  const url = gh('pr', 'create', '-R', REPO, '--base', 'main', '--head', BRANCH,
    '--title', 'docs: preview environment test',
    '--body', 'Test pull request for the preview environments documentation. Changes the heading text only. Not to be merged.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)');
  const n = Number(url.split('/').pop());
  save({ pr: n, url, phase: `pr-${n}`, openedAt: new Date().toISOString(), sha1: sha });
  console.log(`3. Pull request #${n} opened (${sha}) at ${elapsed()}`);

  let phase;
  for (let i = 0; i < 60 && !phase; i++) { phase = previewPhases().find((p) => p.name === `pr-${n}`); if (!phase) await sleep(5000); }
  if (!phase) throw new Error(`no pr-${n} after 5 minutes`);
  console.log(`    pr-${n} exists at ${elapsed()}:`, JSON.stringify(phase.preview));

  console.log('4. The environment menu lists the preview');
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await openSwitcher();
  console.log('    menu:', (await menu().innerText()).replace(/\n+/g, ' | '));
  await c.shot('projects/prev-3-switcher', { around: ['[data-testid=phase-switcher]', '[role=menu]'], pad: 12 });
  c.checkpoint();
  await menu().getByRole('menuitem').filter({ hasText: `#${n}` }).first().click();
  await page.waitForURL(new RegExp(`phase=pr-${n}`));
  await page.getByTestId('preview-bar').waitFor({ timeout: 30000 }).catch(() => gotoPreview(`pr-${n}`));
  // Right after it is made, the preview can still be empty: its app copy
  // shows up a few seconds later.
  for (let i = 0; i < 10 && !(await page.getByText('react-vite-starter').count()); i++) {
    console.log(`    no app on the canvas yet at ${elapsed()}`);
    await sleep(6000);
    await gotoPreview(`pr-${n}`);
  }
  await page.waitForTimeout(3000);
  console.log('    bar:', await page.getByTestId('preview-bar-text').innerText());

}

if (STAGE === 'open' || STAGE === 'ready') {
  const { pr: n, sha1: sha } = state();
  console.log('5. Wait for the build and the address');
  let info;
  for (let i = 0; i < 120; i++) {
    info = previewHost(`pr-${n}`);
    if (info?.host && serves(info.host, 'Hello from a preview')) break;
    info = null;
    await sleep(10000);
  }
  if (!info) throw new Error('the preview never served the new heading');
  save({ host: info.host, app: info.app, readyAt: new Date().toISOString() });
  console.log(`    ${info.host} serves the new heading at ${elapsed()} (image ${info.tag})`);
  // The card's status follows a little later than the address.
  for (let i = 0; i < 12; i++) {
    await gotoPreview(`pr-${n}`);
    await page.waitForTimeout(4000);
    const building = await page.getByText('Building', { exact: true }).count();
    console.log(`    card at ${elapsed()}: ${building ? 'Building' : 'not building'}`);
    if (!building) break;
    await sleep(15000);
  }
  await c.shot('projects/prev-5-ready', { clip: { x: 0, y: 0, width: 1440, height: 900 } });
  c.checkpoint();

  console.log('7. The comment on the pull request');
  let com;
  for (let i = 0; i < 30; i++) { com = prComment(n); if (com?.body?.includes('Ready')) break; await sleep(10000); }
  console.log('    comment by', com?.user?.login, ':\n' + (com?.body ?? '(none)'));
  const checks = gh('api', `repos/${REPO}/commits/${sha}/status`, '--jq', '.statuses | map(.context + " " + .state) | join(", ")');
  console.log('    commit statuses:', checks || '(none)');
  const runs = gh('api', `repos/${REPO}/commits/${sha}/check-runs`, '--jq', '.check_runs | map(.name + " " + (.conclusion // .status)) | join(", ")');
  console.log('    check runs:', runs || '(none)');
}

if (STAGE === 'push') {
  const s = state();
  const before = previewHost(s.phase);
  const dir = checkout();
  sh('git', ['checkout', '-q', BRANCH], dir);
  sh('git', ['pull', '-q', '--ff-only', 'origin', BRANCH], dir);
  const sha = commitHeading(dir, 'Hello from a preview, again', 'docs: change the heading again');
  save({ sha2: sha, pushedAt: new Date().toISOString() });
  console.log(`8. Second commit ${sha} pushed; image before: ${before?.tag}`);
  await gotoPreview(s.phase);
  await page.waitForTimeout(15000);
  await c.shot('projects/prev-7-rebuild', { clip: { x: 0, y: 0, width: 1440, height: 900 } });
  c.checkpoint();
  let ok = false;
  for (let i = 0; i < 120 && !ok; i++) { ok = serves(before.host, 'Hello from a preview, again'); if (!ok) await sleep(10000); }
  if (!ok) throw new Error('the preview did not update');
  console.log(`    the preview serves the second heading at ${elapsed()} (image ${previewHost(s.phase)?.tag})`);
  const com = prComment(s.pr);
  console.log('    comment now:\n' + (com?.body ?? '(none)'));
  console.log('    phase meta:', JSON.stringify(previewPhases().find((p) => p.name === s.phase)?.preview));
}

if (STAGE === 'panel') {
  const s = state();
  await gotoPreview(s.phase);
  await page.waitForTimeout(2000);
  console.log('    card says Building:', (await page.getByText('Building', { exact: true }).count()) > 0, '| canvas:', (await page.locator('main').innerText()).replace(/\n+/g, ' | ').slice(0, 300));
  await c.shot('projects/prev-8-bar', { locator: '[data-testid=preview-bar]', pad: 8 });
  c.checkpoint();
  console.log('9. Sync dialog (cancelled)');
  await page.getByTestId('preview-sync').click();
  const dlg = page.getByRole('dialog').last();
  await page.getByTestId('preview-sync-dialog').waitFor();
  await page.waitForTimeout(4000);
  console.log('    sync dialog:', (await dlg.innerText()).replace(/\n+/g, ' | '));
  await c.shot('projects/prev-9-sync', { locator: '[role=dialog]' });
  c.checkpoint();
  await page.getByTestId('preview-sync-opt-data').click();
  await page.waitForTimeout(4000);
  console.log('    with Data:', (await dlg.innerText()).replace(/\n+/g, ' | '));
  await c.shot('projects/prev-10-sync-data', { locator: '[role=dialog]' });
  c.checkpoint();
  await dlg.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(800);
  console.log('10. Delete dialog (cancelled)');
  await page.getByTestId('preview-delete').click();
  const del = page.getByRole('dialog').or(page.getByRole('alertdialog')).last();
  await del.waitFor();
  await page.waitForTimeout(600);
  console.log('    delete dialog:', (await del.innerText()).replace(/\n+/g, ' | '));
  await c.shot('projects/prev-11-delete', { locator: '[role=dialog],[role=alertdialog]' });
  c.checkpoint();
  await del.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(800);
  if (!previewPhases().some((p) => p.name === s.phase)) throw new Error('the preview is gone');
}

if (STAGE === 'close') {
  const s = state();
  gh('pr', 'close', String(s.pr), '-R', REPO, '--delete-branch', '--comment', 'Closing without merging: preview environment docs test done.');
  const closedAt = Date.now();
  save({ closedAt: new Date(closedAt).toISOString() });
  console.log(`11. Pull request #${s.pr} closed, branch deleted`);
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${s.phase}`);
  await page.waitForTimeout(3000);
  let gone = false;
  for (let i = 0; i < 90 && !gone; i++) { gone = !previewPhases().some((p) => p.name === s.phase); if (!gone) await sleep(10000); }
  const took = Math.round((Date.now() - closedAt) / 1000);
  if (!gone) throw new Error(`pr-${s.pr} still there after ${took}s`);
  save({ goneAfterSeconds: took });
  console.log(`    pr-${s.pr} removed ${took}s after closing`);
  await page.waitForTimeout(15000);
  console.log('    open page, 15s after removal: bar still shown =', await page.getByTestId('preview-bar').isVisible(), '| header:', (await page.getByTestId('phase-switcher').innerText()).replace(/\n+/g, ' '));
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${s.phase}`);
  await page.waitForTimeout(3000);
  console.log('    reloaded:', page.url(), '| bar shown =', await page.getByTestId('preview-bar').isVisible(), '| header:', (await page.getByTestId('phase-switcher').innerText()).replace(/\n+/g, ' '));
  await c.shot('projects/prev-12-removed', { clip: { x: 0, y: 0, width: 1440, height: 900 } });
  c.checkpoint();
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await openSwitcher();
  console.log('    menu:', (await menu().innerText()).replace(/\n+/g, ' | '));
  await c.shot('projects/prev-13-switcher-after', { around: ['[data-testid=phase-switcher]', '[role=menu]'], pad: 12 });
  c.checkpoint();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  console.log('    notifications');
  await page.getByTestId('header-notifications-button').click();
  const items = page.getByTestId('header-notification-item');
  await items.first().waitFor({ timeout: 15000 });
  for (const t of (await items.allInnerTexts()).slice(0, 6)) console.log('      -', t.replace(/\n+/g, ' | '));
  await c.shot('projects/prev-14-notifications', { around: ['[data-testid=header-notifications-button]', '[role=menu],[role=dialog],[data-radix-popper-content-wrapper]'], pad: 12 });
  c.checkpoint();
  await page.keyboard.press('Escape');
  let ok = false;
  for (let i = 0; i < 30 && !ok; i++) { ok = !s.host || !serves(s.host, 'Hello from a preview'); if (!ok) await sleep(10000); }
  console.log('    preview address still serves:', !ok);
  const com = prComment(s.pr);
  console.log('    comment now:\n' + (com?.body ?? '(none)'));
}

if (STAGE === 'off') {
  await c.goto(`/pipeline/${PROJECT}/settings/general`);
  await page.getByTestId('preview-switch').waitFor();
  await page.getByTestId('preview-switch').click();
  await savePreview(false);
  console.log('    stored:', JSON.stringify(project().preview));
}

await c.done();
