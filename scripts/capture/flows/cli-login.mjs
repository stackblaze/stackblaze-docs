// `stackblaze login`: the one-click browser sign-in. Runs the CLI (an
// isolated install: CLI_BIN, CLI_HOME) against the capture dashboard's API,
// opens the link it prints, captures the approval page, approves, and checks
// the CLI reports it is logged in.
import { spawn } from 'node:child_process';
import { open, DASHBOARD } from '../lib.mjs';

const BIN = process.env.CLI_BIN;
const HOME = process.env.CLI_HOME;
const API = process.env.CLI_API ?? DASHBOARD.replace('dashboard', 'api').replace('.stackblaze.com', '.stackblaze.cloud');
if (!BIN || !HOME) throw new Error('set CLI_BIN and CLI_HOME (an isolated CLI install)');
const env = { ...process.env, HOME, STACKBLAZE_API_URL: API, NO_COLOR: '1' };
const run = (args) => new Promise((res) => {
  const p = spawn(BIN, args, { env });
  let out = '';
  p.stdout.on('data', (d) => (out += d));
  p.stderr.on('data', (d) => (out += d));
  p.on('close', (code) => res({ code, out }));
});

console.log('0. Sign the CLI out (setup)');
await run(['logout']);

console.log('1. stackblaze login --browserless → link');
const login = spawn(BIN, ['login', '--browserless'], { env });
let out = '';
login.stdout.on('data', (d) => (out += d));
login.stderr.on('data', (d) => (out += d));
const done = new Promise((res) => login.on('close', (code) => res(code)));
for (let i = 0; i < 40 && !/activate\?user_code=/.test(out); i++) await new Promise((r) => setTimeout(r, 500));
const link = out.match(/https:\/\/\S+\/activate\?user_code=(\S+)/);
if (!link) throw new Error(`no sign-in link: ${out}`);
const code = link[1];
console.log('    code', code);

const c = await open();
const { page } = c;
console.log('2. Open the link → Authorize CLI');
await c.goto(`/activate?user_code=${code}`);
await page.getByRole('button', { name: 'Approve' }).waitFor();
await c.shot('cli/login-approve', { around: [page.getByText('Authorize CLI'), page.getByRole('button', { name: 'Deny' })], pad: 32 });

console.log('3. Approve → CLI signed in');
await page.getByRole('button', { name: 'Approve' }).click();
await page.getByText('CLI authorized').waitFor({ timeout: 30000 });
await c.shot('cli/login-done', { around: [page.getByText('Authorize CLI'), page.getByText('CLI authorized')], pad: 32 });
const exit = await done;
if (exit !== 0 || !/Logged in to/.test(out)) throw new Error(`CLI did not log in (${exit}): ${out}`);
console.log(out.split('\n').filter((l) => /^(OK|projects)/.test(l)).join('\n'));

await c.done();
