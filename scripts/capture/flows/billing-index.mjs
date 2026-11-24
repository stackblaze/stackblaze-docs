// Billing: Settings → Billing (/billing). Opens every dialog on the page and
// closes it again: the plan is never changed or cancelled, no GPU credit is
// bought, no support add-on is added and the billing details are not saved.
// "Update card" and "Manage in Stripe" leave the dashboard, so they are not
// clicked. The card, invoice numbers and the address are blanked before every
// shot, and the flow refuses to shoot while any of them is still on screen.
import { open } from '../lib.mjs';

// Other clients attached to the shared Chrome can race us on a native dialog.
process.on('uncaughtException', (e) => {
  if (/No dialog is showing/.test(e?.message ?? '')) return;
  console.error(e);
  process.exit(1);
});

const c = await open();
const { page } = c;
const writes = [];
page.on('request', (r) => {
  const u = r.url();
  if (r.method() !== 'GET' && u.includes('/api/') && !u.includes('/api/chat/warmup')) writes.push(`${r.method()} ${new URL(u).pathname}`);
});

/** Blank what is personal to the account: card, invoice numbers, address. */
async function maskBilling() {
  const leak = await page.evaluate(() => {
    const secret = [];
    const pm = document.querySelector('[data-testid=payment-method-summary]');
    if (pm) {
      const m = pm.textContent.match(/ending\s+(\d{4})/); if (m) secret.push(m[1]);
      const e = pm.textContent.match(/(\d{2}\/\d{2})/); if (e) secret.push(e[1]);
      pm.textContent = pm.textContent.replace(/ending\s+\d{4}/, 'ending ••••').replace(/\d{2}\/\d{2}/, '••/••');
    }
    for (const row of document.querySelectorAll('[data-testid=invoice-row]')) {
      const td = row.querySelectorAll('td')[1];
      if (td && td.textContent.trim() !== '—') { secret.push(td.textContent.trim()); td.textContent = '••••••••-••••'; }
    }
    const bd = document.querySelector('[data-testid=billing-details-summary]');
    if (bd) {
      const ps = [...bd.querySelectorAll('p')];
      // First line is the company name; the rest is the street and city.
      for (const p of ps.slice(1)) {
        for (const part of p.textContent.split(/[·,]/).map((s) => s.trim()).filter((s) => s.length > 3)) secret.push(part);
        const country = p.textContent.includes('·') ? p.textContent.split('·').pop().trim() : '';
        p.textContent = country ? `••• ••• · ${country}` : '•••••••';
      }
    }
    for (const id of ['bill-line1', 'bill-line2', 'bill-city', 'bill-postal']) {
      const el = document.getElementById(id);
      if (el && el.value) { secret.push(el.value); el.value = '•••••••'; }
    }
    const text = document.body.innerText;
    return secret.filter((s) => s && !s.includes('•') && text.includes(s));
  });
  if (leak.length) throw new Error(`${leak.length} personal value(s) still on screen`);
}
async function shot(id, opts) {
  await maskBilling();
  await c.shot(id, opts);
}
const lastDialog = () => page.locator('[role=dialog],[role=alertdialog]').last();
async function closeDialog() {
  await lastDialog().getByRole('button', { name: 'Close' }).click();
  await page.locator('[role=dialog],[role=alertdialog]').first().waitFor({ state: 'detached' });
}

console.log('1. Sidebar → Administration → Billing');
await c.goto('/');
// The Administration group in the sidebar can be collapsed.
const navItem = page.getByText('Billing', { exact: true }).first();
if (!(await navItem.isVisible().catch(() => false))) await page.getByTestId('nav-group-administration').click();
await navItem.click();
await page.waitForURL(/\/billing/);
await page.getByTestId('invoices-card').waitFor({ timeout: 30000 });
await page.getByTestId('gpu-credit-card').waitFor();
await page.waitForTimeout(1000);
await shot('billing/1-overview', { around: [page.getByRole('heading', { name: 'Billing' }).first(), page.getByTestId('credits-card'), page.getByTestId('gpu-credit-card')], pad: 16 });

console.log('2. Change plan: the picker, monthly and annual');
await page.getByTestId('change-plan').click();
const dlg = lastDialog();
await page.getByTestId('upgrade-picker-pane').waitFor();
await dlg.getByText("What's included:").waitFor();
await page.waitForTimeout(1500);
// The window scrolls when the downgrade checks are long: shoot its top,
// the plan, the cadence, what's included and the change summary.
await page.waitForTimeout(2500);
await dlg.evaluate((el) => { for (const n of [el, ...el.querySelectorAll('*')]) if (n.scrollTop) n.scrollTop = 0; });
await shot('billing/2-change-plan', { around: [dlg.getByRole('heading').first(), dlg.getByText('Unlimited free build minutes'), dlg.getByText('Downgrade your plan'), dlg.getByText('No refund for the current billing period.')], pad: 24 });
await page.getByTestId('plan-picker-trigger').click();
const list = page.getByTestId('plan-picker-list');
await list.waitFor();
const offered = await list.locator('[data-testid^=plan-option-]').evaluateAll((es) => es.map((e) => e.dataset.testid.replace('plan-option-', '')));
console.log('    offered:', offered.join(', '));
await shot('billing/3-plan-list', { around: [page.getByTestId('plan-picker-trigger'), list], pad: 16 });
for (const slug of offered) {
  if (!(await list.isVisible())) await page.getByTestId('plan-picker-trigger').click();
  await page.getByTestId(`plan-option-${slug}`).click();
  await page.waitForTimeout(800);
  for (const cad of ['Annual', 'Monthly']) {
    await dlg.getByRole('tab', { name: cad }).click();
    await page.waitForTimeout(600);
    console.log(`    ${slug} ${cad}:`, (await page.getByTestId('plan-picker-headline').innerText()).trim());
  }
}
// Back to Pro, annual, for the shot.
await page.getByTestId('plan-picker-trigger').click();
await page.getByTestId('plan-option-pro').click();
await dlg.getByRole('tab', { name: 'Annual' }).click();
await dlg.getByText('Billed once a year, up front').waitFor();
await page.waitForTimeout(800);
await shot('billing/4-change-plan-annual', { around: [page.getByTestId('plan-picker-trigger'), dlg.getByText('Billed once a year, up front')], pad: 16 });
await closeDialog();

console.log('3. Cancel subscription → Keep my plan');
await page.getByTestId('cancel-subscription').click();
const cd = lastDialog();
await cd.getByText('Cancel your subscription?').waitFor();
await page.waitForTimeout(500);
await shot('billing/5-cancel', { around: [cd], pad: 0 });
await cd.getByRole('button', { name: 'Keep my plan' }).click();
await page.locator('[role=dialog],[role=alertdialog]').first().waitFor({ state: 'detached' });
await page.getByTestId('cancel-subscription').waitFor();

console.log('4. GPU credit: presets, a typed amount and its checks (nothing bought)');
const gpu = page.getByTestId('gpu-credit-card');
const custom = page.getByTestId('gpu-credit-custom');
const said = {};
for (const v of ['abc', '5', '2500']) {
  await custom.fill(v);
  said[v] = await page.getByTestId('gpu-credit-amount-error').innerText();
  if (await page.getByTestId('gpu-credit-buy').isEnabled()) throw new Error(`Add credit enabled for ${v}`);
}
console.log('    errors:', JSON.stringify(said));
await custom.fill('5');
await shot('billing/6-gpu-credit-min', { around: [gpu], pad: 8 });
await custom.fill('');
await page.getByTestId('gpu-credit-preset-2500').click();
if (!(await page.getByTestId('gpu-credit-buy').isEnabled())) throw new Error('Add credit disabled with a preset');
await shot('billing/7-gpu-credit', { around: [gpu], pad: 8 });

console.log('5. Payment method and billing details');
const pm = page.getByTestId('payment-method-card');
await pm.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await shot('billing/8-payment-details', { around: [pm, page.getByTestId('billing-details-card')], pad: 8 });
await page.getByTestId('edit-billing-details').click();
const bd = lastDialog();
await bd.locator('#bill-line1').waitFor();
await page.waitForTimeout(800);
await shot('billing/9-billing-details', { around: [bd], pad: 0 });
await closeDialog();

console.log('6. Support → Compare support plans');
const sup = page.getByTestId('support-summary-card');
await sup.scrollIntoViewIfNeeded();
await page.getByTestId('compare-support-plans').click();
const sd = lastDialog();
await sd.getByTestId('support-plan-enterprise').waitFor();
await page.waitForTimeout(600);
await shot('billing/10-support-plans', { around: [sd], pad: 0 });
console.log('    Enterprise → Contact us links to', await sd.getByTestId('support-contact-enterprise').getAttribute('href'));
// Add Standard asks first: read the question, then say no.
await sd.getByTestId('support-buy-standard').click();
const ask = page.locator('[role=dialog],[role=alertdialog]').filter({ hasText: 'Add Standard support?' }).last();
await ask.waitFor();
console.log('    confirm:', (await ask.innerText()).replace(/\s+/g, ' '));
await page.waitForTimeout(400);
await shot('billing/12-support-confirm', { around: [ask], pad: 0 });
await ask.getByRole('button', { name: 'Cancel' }).click();
await ask.waitFor({ state: 'detached' });
await closeDialog();

console.log('7. Invoices and Manage in Stripe');
const inv = page.getByTestId('invoices-card');
await inv.scrollIntoViewIfNeeded();
await page.getByText('Need to cancel your subscription?').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await shot('billing/11-invoices', { around: [inv, page.getByText('Need to cancel your subscription?')], pad: 8 });

if (writes.length) throw new Error(`the flow sent writes: ${writes.join(', ')}`);
await c.done();
