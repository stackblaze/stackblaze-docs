// Settings → SSO & provisioning, performed on dev in the docs test org
// (Business plan) against a throwaway OpenID Connect provider: a
// `ghcr.io/dexidp/dex` Docker image app in github-demo-gv35 / dev with one
// static client and one static test user (prepared outside this flow, see
// the page's report; deleted afterwards).
//   STEP=start    The page with nothing set up, Add provider, the protocol
//                 list and SAML guidance, Create connection (OIDC), the
//                 redirect URI to register at the IdP.
//   STEP=idp      Step 3 for OIDC: Save with nothing filled, Test connection
//                 with a wrong issuer and with the right one, Save; step 4
//                 and its blockers; then the SAML part below.
//   STEP=saml     The SAML form: protocol switched to SAML 2.0 (not saved),
//                 its step 2 values and step 3 fields; a reload drops it.
//   STEP=domains  Login domains: an invalid entry, Add domain, the DNS
//                 record, Verify without the record.
//   STEP=enforce  The Enforcement card (shot only: Require SSO is never
//                 switched on by this flow).
//   STEP=prov     Provisioning: the default role list, a change saved, and
//                 put back.
//   STEP=cleanup  Remove the domain and delete the connection.
// The OIDC client secret is read from SSO_SECRET_FILE and only typed into the
// secret box; it is never printed.
import fs from 'node:fs';
import { open } from '../lib.mjs';

const STEP = process.env.STEP ?? 'start';
const ISSUER = process.env.SSO_ISSUER; // the dex app's public URL
const CLIENT_ID = process.env.SSO_CLIENT_ID ?? 'stackblaze-docs';
const DOMAIN = process.env.SSO_DOMAIN ?? 'example.com';

const c = await open();
const { page } = c;
// Close the Ask Agent side panel (in this capture context only).
const goto0 = c.goto.bind(c);
c.goto = async (p) => {
  await goto0(p);
  const close = page.getByRole('button', { name: 'Close assistant panel' });
  if (await close.isVisible().catch(() => false)) { await close.click(); await page.waitForTimeout(800); }
};
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
const idpCard = () => page.getByTestId('sso-idp-card');
const domainsCard = () => page.getByTestId('sso-domains-card');
const enfCard = () => page.getByTestId('sso-enforcement-card');
const form = () => page.getByTestId('sso-idp-form');
const header = () => page.getByRole('heading', { name: 'SSO & provisioning' }).first();
// Native confirm() dialogs: log the message, then accept or dismiss.
let dialogAnswer = true;
page.on('dialog', async (d) => {
  console.log('    confirm:', d.message());
  if (dialogAnswer) await d.accept(); else await d.dismiss();
});

async function openSso() {
  await c.goto('/');
  await page.getByRole('button', { name: 'Settings' }).or(page.getByRole('link', { name: 'Settings' })).first().click();
  await page.waitForURL(/\/settings\/general/);
  await page.getByText('SSO & provisioning', { exact: true }).first().click();
  await page.waitForURL(/\/settings\/sso/);
  await idpCard().waitFor();
  await page.waitForTimeout(1500);
}
async function pick(triggerId, option) {
  await page.locator(`#${triggerId}`).click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: option, exact: true }).click();
  await page.waitForTimeout(600);
}
async function openSetup() {
  // Nothing set up: Add provider. A saved connection: Edit.
  if (await page.getByTestId('sso-setup').isVisible().catch(() => false)) return;
  const add = page.getByTestId('sso-add-provider').or(page.getByTestId('sso-edit-provider'));
  await add.first().click();
  await page.waitForTimeout(1000);
}

if (STEP === 'start') {
  console.log('1. Settings → SSO & provisioning');
  await openSso();
  console.log('   ', await text(page.locator('main').first()));
  if (await page.getByTestId('sso-locked-overlay').count()) throw new Error('SSO is locked for this org');
  await c.shot('sso/1-page', { clip: { x: 0, y: 0, width: 1440, height: 900 } });

  console.log('2. Add provider');
  await page.getByTestId('sso-add-provider').click();
  await page.waitForTimeout(1200);
  console.log('   ', await text(idpCard()));
  await c.shot('sso/2-step1', { locator: '[data-testid="sso-step-1"]' });
  await c.shot('sso/2-saml-register', { locator: '[data-testid="sso-step-2"]' });

  console.log('3. Protocol list');
  await page.locator('#sso-protocol').click();
  await page.waitForTimeout(600);
  console.log('    options:', await text(page.getByRole('listbox').first()));
  await c.shot('sso/3-protocol', { around: ['#sso-protocol', '[role=listbox]'], pad: 24 });
  await page.getByRole('option', { name: 'OpenID Connect (OIDC)', exact: true }).click();
  await page.waitForTimeout(800);
  await page.locator('#sso-name').fill('Dex test IdP');
  console.log('    after OIDC:', await text(idpCard()));
  await c.shot('sso/4-oidc-register', { locator: '[data-testid="sso-step-2"]' });

  console.log('4. Create connection');
  await page.getByTestId('sso-save').click();
  await page.waitForTimeout(3000);
  console.log('   ', await text(idpCard()));
  const copies = await idpCard().locator('input[readonly], code').evaluateAll((els) => els.map((e) => e.value || e.textContent));
  console.log('    copy values:', copies);
  console.log('    toasts:', await page.locator('[data-sonner-toast]').allInnerTexts());
  await c.shot('sso/5-redirect-uri', { locator: '[data-testid="sso-step-2"]' });
  await c.shot('sso/5-draft-row', { around: ['[data-testid="sso-idp-row"]', '[data-testid="sso-status-detail"]'], pad: 16 });
}

if (STEP === 'idp') {
  if (!ISSUER) throw new Error('set SSO_ISSUER');
  const secret = fs.readFileSync(process.env.SSO_SECRET_FILE, 'utf8').trim();
  await openSso();
  await openSetup();
  console.log('5. Step 3 (OIDC), empty');
  console.log('   ', await text(form()));
  console.log('    fields:', await form().locator('input').evaluateAll((els) => els.map((e) => `${e.id} type=${e.type} ph="${e.placeholder}"`)));
  console.log('    buttons:', await form().locator('button').evaluateAll((els) => els.map((e) => `"${e.innerText.trim()}" ${e.getAttribute('data-testid') || ''} disabled=${e.disabled}`)));
  await c.shot('sso/6-idp-empty', { locator: '[data-testid="sso-step-3"]' });

  console.log('6. Save with nothing filled');
  await form().getByRole('button', { name: /^Save/ }).first().click();
  await page.waitForTimeout(1500);
  console.log('   ', await text(form()));
  console.log('    toasts:', await page.locator('[data-sonner-toast]').allInnerTexts());
  console.log('    invalid:', await form().locator('[aria-invalid=true]').evaluateAll((els) => els.map((e) => e.id)));

  console.log('7. Test connection with a wrong issuer');
  const issuer = form().locator('input').nth(0);
  await issuer.fill('https://nginx-9agm.cloud-dev-central-1.stackblaze.app');
  await form().locator('input').nth(1).fill(CLIENT_ID);
  await form().locator('input[type=password]').first().fill(secret);
  await form().getByRole('button', { name: /Test connection/ }).click();
  await page.waitForTimeout(8000);
  console.log('   ', await text(form()));
  await c.shot('sso/8-test-fail', { locator: '[data-testid="sso-step-3"]' });

  console.log('8. Test connection with the right issuer');
  await issuer.fill(ISSUER);
  await form().getByRole('button', { name: /Test connection/ }).click();
  await page.waitForTimeout(8000);
  console.log('   ', await text(form()));
  await c.shot('sso/9-test-pass', { locator: '[data-testid="sso-step-3"]' });

  console.log('9. Save');
  await form().getByRole('button', { name: /^Save/ }).first().click();
  await page.waitForTimeout(3000);
  console.log('   ', await text(idpCard()));
  console.log('    toasts:', await page.locator('[data-sonner-toast]').allInnerTexts());
  await c.shot('sso/10-saved', { locator: '[data-testid="sso-step-3"]' });
  await c.shot('sso/10-enable-blocked', { locator: '[data-testid="sso-step-4"]' });
  c.checkpoint();

}

if (STEP === 'idp' || STEP === 'saml') {
  console.log('10. The SAML form (protocol switched, not saved)');
  // A fresh page, so step 3 has no OIDC test result under it.
  await openSso();
  await openSetup();
  await pick('sso-protocol', 'SAML 2.0');
  console.log('   ', await text(idpCard()));
  const manual = page.getByText('Manual configuration', { exact: false }).first();
  await manual.click();
  await page.waitForTimeout(600);
  console.log('    saml fields:', await form().locator('input, textarea').evaluateAll((els) => els.map((e) => `${e.id} ph="${e.placeholder}"`)));
  await c.shot('sso/11-saml-switch', { locator: '[data-testid="sso-step-1"]' });
  await c.shot('sso/11-saml-register', { locator: '[data-testid="sso-step-2"]' });
  await page.getByTestId('sso-step-3').evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await c.shot('sso/11-saml-form', { locator: '[data-testid="sso-step-3"]' });
  // Back to OIDC without saving: reload drops the unsaved switch.
  await openSso();
  await openSetup();
  console.log('    protocol after reload:', await text(page.locator('#sso-protocol')));
}

if (STEP === 'domains') {
  await openSso();
  console.log('11. Login domains: an invalid entry');
  const input = domainsCard().locator('input').first();
  console.log('    input:', await input.getAttribute('placeholder'));
  await input.fill('not a domain');
  await page.getByTestId('sso-add-domain').click();
  await page.waitForTimeout(1500);
  console.log('   ', await text(domainsCard()));
  await c.shot('sso/12-domain-invalid', { locator: '[data-testid="sso-domains-card"]' });

  console.log('12. Add domain');
  await input.fill(DOMAIN);
  await page.getByTestId('sso-add-domain').click();
  await page.waitForTimeout(2500);
  console.log('   ', await text(domainsCard()));
  console.log('    buttons:', await domainsCard().locator('button').evaluateAll((els) => els.map((e) => `"${e.innerText.trim() || e.getAttribute('aria-label')}" ${e.getAttribute('data-testid') || ''}`)));
  await c.shot('sso/13-domain-added', { locator: '[data-testid="sso-domains-card"]' });

  console.log('13. Verify without the TXT record');
  await domainsCard().getByRole('button', { name: /^Verify/ }).first().click();
  await page.waitForTimeout(5000);
  console.log('   ', await text(domainsCard()));
  console.log('    toasts:', await page.locator('[data-sonner-toast]').allInnerTexts());
  await c.shot('sso/14-domain-verify', { locator: '[data-testid="sso-domains-card"]' });

  console.log('14. Step 4 with an unverified domain');
  await openSetup();
  const enable = page.getByTestId('sso-enable');
  console.log('    enable switch disabled:', await enable.isDisabled());
  console.log('   ', await text(enable.locator('xpath=ancestor::*[.//*[@data-testid="sso-enable-blockers"]][1]')).catch(() => ''));
  await c.shot('sso/15-enable-blocked', { locator: '[data-testid="sso-step-4"]' });
}

if (STEP === 'enforce') {
  await openSso();
  console.log('15. Enforcement (look only)');
  console.log('   ', await text(enfCard()));
  const sw = page.getByTestId('sso-enforce');
  console.log('    switch checked:', await sw.getAttribute('aria-checked'), 'disabled:', await sw.isDisabled());
  await c.shot('sso/16-enforcement', { locator: '[data-testid="sso-enforcement-card"]' });
}

if (STEP === 'prov') {
  await openSso();
  console.log('16. Provisioning tab');
  await page.getByRole('tab', { name: 'Provisioning' }).click();
  await page.waitForTimeout(1000);
  const card = page.getByTestId('sso-provisioning-card');
  console.log('   ', await text(card));
  await page.locator('#sso-default-role').click();
  await page.waitForTimeout(600);
  console.log('    roles:', await text(page.getByRole('listbox').first()));
  await c.shot('sso/17-default-role', { around: [card, '[role=listbox]'], pad: 24 });
  await page.getByRole('option', { name: 'guest', exact: true }).click();
  await page.waitForTimeout(600);
  await page.getByTestId('sso-provisioning-save').click();
  await page.waitForTimeout(2500);
  console.log('    toasts:', await page.locator('[data-sonner-toast]').allInnerTexts());
  console.log('   ', await text(card));
  await c.shot('sso/18-role-saved', { locator: '[data-testid="sso-provisioning-card"]' });
  console.log('    put back: Member (default)');
  await pick('sso-default-role', 'Member (default)');
  await page.getByTestId('sso-provisioning-save').click();
  await page.waitForTimeout(2500);
  console.log('   ', await text(card));
}

if (STEP === 'cleanup') {
  await openSso();
  console.log('17. Remove the domain');
  console.log('   ', await text(domainsCard()));
  const rm = domainsCard().getByRole('button', { name: /Remove|Delete/ }).first();
  if (await rm.count()) {
    await rm.click();
    await page.waitForTimeout(2500);
    console.log('   ', await text(domainsCard()));
  }
  console.log('18. Delete the connection');
  await openSetup();
  await idpCard().getByRole('button', { name: 'Delete', exact: true }).first().click();
  await page.waitForTimeout(3000);
  console.log('    toasts:', await page.locator('[data-sonner-toast]').allInnerTexts());
  await openSso();
  console.log('   ', await text(page.locator('main').first()));
  await c.shot('sso/19-after-delete', { clip: { x: 0, y: 0, width: 1440, height: 900 } });
}

await c.done();
