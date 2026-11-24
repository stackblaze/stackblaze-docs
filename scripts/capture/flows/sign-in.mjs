// The signed-out pages: Sign up and Sign in (every method), shot from a
// fresh, signed-out context. Nothing is submitted.
import { open } from '../lib.mjs';
const c = await open();
const ctx = await c.page.context().browser().newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
const p = await ctx.newPage();
const text = async () => (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 900);
const ctl = () => p.locator('button, input, a').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('type') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || e.getAttribute('aria-label') || '').trim().slice(0, 40)}`).filter((x) => !/^A::$/.test(x)));
const D = 'https://dashboard-dev.stackblaze.com';
await p.goto(D + '/login'); await p.waitForTimeout(4000);
console.log('login:', await text()); console.log('   ', JSON.stringify(await ctl()));
await c.shotPage('signin/1-login', p, 'Sign in');
await p.getByRole('button', { name: 'Continue with email' }).click(); await p.waitForTimeout(1500);
console.log('after continue (empty):', (await text()).slice(0, 300));
await p.locator('input').first().fill('you@example.com'); await p.getByRole('button', { name: 'Continue with email' }).click().catch(() => {}); await p.waitForTimeout(2500);
console.log('password step:', (await text()).slice(0, 400));
await c.shotPage('signin/2-password', p, 'Sign in with password');
await p.getByRole('button', { name: /Sign in with SSO/ }).or(p.getByText('Sign in with SSO')).first().click().catch(() => {}); await p.waitForTimeout(2000);
console.log('sso:', (await text()).slice(0, 400));
await c.shotPage('signin/3-sso', p, 'Sign in with SSO');
await p.goto(D + '/signup'); await p.waitForTimeout(4000);
console.log('signup:', await text()); console.log('   ', JSON.stringify(await ctl()));
await c.shotPage('signin/4-signup', p, 'Sign up');
await p.goto(D + '/forgot-password'); await p.waitForTimeout(3000);
console.log('forgot:', (await text()).slice(0, 400));
await c.shotPage('signin/5-forgot', p, 'Forgot password');
await ctx.close();
await c.done();
