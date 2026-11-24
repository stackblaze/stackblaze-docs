// Team and account → Members and roles: Settings → Access control (Users,
// Invitations, Teams, Roles). The SSO page is team-sso.mjs.
//
// READ ONLY by default. Membership, team and role changes bump the test
// user's session version and sign the capture browser out, so this flow only
// opens dialogs and cancels them.
// SEND_INVITE=1 sends ONE invitation (to the test mailbox's own alias, shown
// as teammate@example.com) and revokes it: shots 8-10. That was done once
// (2026-11-24) and must not be repeated without asking.
// A team (docs-demo) was created in that run too (shot 12); creating it is
// no longer part of the flow, the dialog is filled and cancelled.
//   CAPTURE_REPLACE="adam.mkk+101@gmail.com=>teammate@example.com"
import { open } from '../lib.mjs';

const INVITEE = process.env.INVITEE ?? 'teammate@example.com'; // the test mailbox's alias, never committed
const TEAM = 'docs-demo';
const ROLE = 'docs-viewer';
const TEAM_SHOWN = 'admin'; // an existing team, for the read-only dialogs
if (!(process.env.CAPTURE_REPLACE ?? '').includes(INVITEE)) throw new Error('set CAPTURE_REPLACE for the invitee address');

const c = await open();
const { page } = c;
const tab = (name) => page.getByRole('tab', { name, exact: true });
const card = (title) => page.locator('div').filter({ has: page.getByText(title, { exact: true }) }).filter({ hasText: '/ page' }).last();
const popover = () => page.locator('[data-reka-popper-content-wrapper]').last();
const dialog = () => page.locator('[role=dialog]').last();
const head = () => page.getByRole('heading', { name: 'Access control' }).first();
// The settings content column, from the page title down to `bottom`.
async function pageShot(id, bottom = page.getByText('/ page').first()) {
  const b = await bottom.boundingBox();
  await c.shot(id, { clip: { x: 344, y: 60, width: 994, height: Math.min(900, b.y + b.height + 40) - 60 } });
}

console.log('1. Settings → Access control');
await c.goto('/');
await page.getByRole('button', { name: 'Settings' }).or(page.getByRole('link', { name: 'Settings' })).first().click();
await page.waitForURL(/\/settings\/general/);
await page.getByRole('link', { name: 'Access control' }).first().click();
await page.getByTestId('users-invite').waitFor();
await page.waitForFunction(() => !document.querySelector('[data-testid=users-invite]')?.disabled);
await pageShot('team/1-users');

console.log('2. Users: role filter and row menu');
await page.getByRole('button', { name: /filter/i }).first().click();
await popover().waitFor();
await c.shot('team/2-users-filter', { around: [page.getByRole('button', { name: /filter/i }).first(), popover()], pad: 16 });
await page.keyboard.press('Escape');
await page.getByTestId('user-row-menu').click();
await page.getByRole('menuitem', { name: 'Edit member' }).waitFor();
await c.shot('team/3-user-menu', { around: [page.getByTestId('user-row-menu'), page.locator('[role=menu]')], pad: 16 });
await page.keyboard.press('Escape');

console.log('3. Invite: the sheet, its role and team choices');
await page.getByTestId('users-invite').click();
const sheet = page.getByTestId('invite-sheet');
await sheet.waitFor();
await page.waitForTimeout(800);
await page.getByTestId('invite-role').click();
await page.getByRole('option', { name: 'member' }).waitFor();
await c.shot('team/4-invite-roles', { around: [sheet], pad: 0 });
await page.getByRole('option', { name: 'member' }).click();
await page.getByTestId('invite-team').click();
await page.getByRole('option', { name: 'None' }).waitFor();
await c.shot('team/5-invite-teams', { around: [page.getByTestId('invite-team'), page.locator('[role=listbox]')], pad: 16 });
await page.getByRole('option', { name: 'None' }).click();
await page.getByTestId('invite-emails').fill(`teammate ${INVITEE}`);
await page.getByTestId('invite-invalid').waitFor();
await c.shot('team/6-invite-invalid', { around: [page.getByText('Emails', { exact: true }), page.getByTestId('invite-invalid')], pad: 16 });
await page.getByTestId('invite-emails').fill(INVITEE);
await page.getByTestId('invite-invalid').waitFor({ state: 'detached' });
await c.shot('team/7-invite-filled', { around: [sheet], pad: 0 });

console.log('4. Send the invitation → Invitations');
if (!process.env.SEND_INVITE) {
  await sheet.getByRole('button', { name: 'Cancel' }).click();
  await sheet.waitFor({ state: 'detached' });
} else {
  await page.getByTestId('invite-submit').click();
  await page.getByText(`Invitation sent to ${INVITEE}`).waitFor({ timeout: 20000 });
  await sheet.waitFor({ state: 'detached' });
  await tab('Invitations').click();
  // The shot masks the address in the page, so match either spelling.
  const SHOWN = /adam\.mkk\+101@gmail\.com|teammate@example\.com/;
  const row = page.getByTestId('invitation-row').filter({ hasText: SHOWN }).filter({ hasText: /pending/i });
  await row.waitFor();
  await page.waitForTimeout(800);
  await pageShot('team/8-invitations');

  console.log('5. Revoke it');
  await row.getByRole('button', { name: /Actions for invitation/ }).click();
  await page.getByRole('menuitem', { name: 'Revoke invitation' }).click();
  await page.getByText(/Revoke invitation to .*\?/).waitFor();
  await c.shot('team/9-revoke-confirm', { around: [dialog()], pad: 16 });
  await dialog().getByRole('button', { name: 'Revoke', exact: true }).click();
  await row.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: /filter/i }).first().click();
  await popover().getByRole('switch').click();
  await page.keyboard.press('Escape');
  const revoked = page.getByTestId('invitation-row').filter({ hasText: SHOWN }).filter({ hasText: /revoked/i }).first();
  await revoked.waitFor();
  await pageShot('team/10-invitations-history');
  await page.getByRole('button', { name: /filter/i }).first().click();
  await popover().getByRole('switch').click();
  await page.keyboard.press('Escape');
  c.checkpoint();
}

console.log('6. Teams: list, members of a team');
await tab('Teams').click();
await page.getByRole('button', { name: `Show members of ${TEAM_SHOWN}` }).click();
const teamBox = page.locator('div.border-border').filter({ has: page.getByText(TEAM_SHOWN, { exact: true }) }).filter({ hasText: 'Members' }).last();
await teamBox.getByRole('button', { name: /Assign role to/ }).first().waitFor();
await pageShot('team/11-teams');

console.log('7. Create team: fill the dialog, Cancel');
await page.getByRole('button', { name: 'Create team' }).click();
await dialog().getByLabel('Team name').fill(TEAM);
await dialog().getByLabel('Description').fill('Temporary team for these docs');
await page.waitForTimeout(300);
if (process.env.RECAPTURE_TEAM_CREATE) await c.shot('team/12-team-create', { around: [dialog()], pad: 16 });
await dialog().getByRole('button', { name: 'Cancel' }).click();
await dialog().waitFor({ state: 'detached' }).catch(() => {});

console.log('8. A team\'s members: Add member, Assign role, Remove (all cancelled)');
await teamBox.getByRole('button', { name: 'Add member' }).click();
await dialog().getByRole('combobox').nth(1).click();
await page.getByRole('option', { name: 'guest' }).waitFor();
await c.shot('team/13-team-add-member', { around: [dialog(), page.locator('[role=listbox]')], pad: 16 });
await page.keyboard.press('Escape');
await dialog().getByRole('button', { name: 'Cancel' }).click();
await dialog().waitFor({ state: 'detached' }).catch(() => {});
await teamBox.getByRole('button', { name: /Assign role to/ }).first().click();
await dialog().getByRole('combobox').click();
await page.getByRole('option', { name: 'member' }).waitFor();
await c.shot('team/15-team-assign-role', { around: [dialog(), page.locator('[role=listbox]')], pad: 16 });
await page.keyboard.press('Escape');
await dialog().getByRole('button', { name: 'Cancel' }).click();
await dialog().waitFor({ state: 'detached' }).catch(() => {});
await teamBox.getByRole('button', { name: /from team$/ }).first().click();
await dialog().getByRole('button', { name: 'Cancel' }).waitFor();
await c.shot('team/16-team-remove-member', { around: [dialog()], pad: 16 });
await dialog().getByRole('button', { name: 'Cancel' }).click();
await dialog().waitFor({ state: 'detached' }).catch(() => {});

console.log('9. A team\'s menu: Edit team, Delete team (both cancelled)');
const teamMenu = page.locator(`button[aria-label="Actions for team ${TEAM_SHOWN}"]`);
await teamMenu.click();
await page.getByRole('menuitem', { name: 'Edit team' }).waitFor();
await c.shot('team/17-team-menu', { around: [teamMenu, page.locator('[role=menu]')], pad: 16 });
await page.getByRole('menuitem', { name: 'Edit team' }).click();
await dialog().getByLabel('Description').waitFor();
await c.shot('team/18-team-edit', { around: [dialog()], pad: 16 });
await dialog().getByRole('button', { name: 'Cancel' }).click();
await dialog().waitFor({ state: 'detached' }).catch(() => {});
await teamMenu.click();
await page.getByRole('menuitem', { name: 'Delete team' }).click();
await dialog().getByRole('button', { name: 'Cancel' }).waitFor();
await c.shot('team/19-team-delete', { around: [dialog()], pad: 16 });
await dialog().getByRole('button', { name: 'Cancel' }).click();
await dialog().waitFor({ state: 'detached' }).catch(() => {});
c.checkpoint();

console.log('10. Roles: built-in roles, the type filter');
await tab('Roles').click();
await page.getByText('Tenant guest — read-only').waitFor();
await pageShot('team/20-roles');
await page.getByRole('button', { name: /filter/i }).first().click();
await popover().waitFor();
await c.shot('team/21-roles-filter', { around: [page.getByRole('button', { name: /filter/i }).first(), popover()], pad: 16 });
await page.keyboard.press('Escape');

console.log('11. Create role: the permission table, filled in, Cancel');
await page.getByRole('button', { name: 'Create role' }).click();
await dialog().getByText('Reboot').waitFor();
await c.shot('team/22-role-create-empty', { around: [dialog()], pad: 16 });
await dialog().getByLabel('Role name').fill(ROLE);
await dialog().getByLabel('Description').fill('Can look at apps and logs');
await dialog().locator('#perm-0-read').click();
await dialog().locator('#perm-1-read').click();
const logsRow = dialog().locator('div.grid').filter({ has: page.getByText('Logs', { exact: true }) }).last();
await logsRow.getByRole('switch').click();
await c.shot('team/23-role-create', { around: [dialog()], pad: 16 });
await dialog().getByRole('button', { name: 'Cancel' }).click();
await dialog().waitFor({ state: 'detached' }).catch(() => {});
if (await page.getByText(ROLE, { exact: true }).count()) throw new Error('a role was created');

await c.done();
