// Run SQL in the CloudBeaver console that a database card links to.
// Opens it from the card's `db.…` link, picks the given connection, runs one
// statement and returns the result grid's text (or the error text).
export async function openConsole(page, instance) {
  const [cb] = await Promise.all([
    page.context().waitForEvent('page', { timeout: 30000 }),
    page.locator(`[data-testid=app-card-cloudbeaver-addon-${instance}]`).click(),
  ]);
  await cb.setViewportSize({ width: 1440, height: 900 });
  await cb.getByText(new RegExp(`/${instance}$`)).first().waitFor({ timeout: 60000 });
  await cb.waitForTimeout(2000);
  if (await cb.getByText('Open SQL Editor').count()) await cb.getByText('Open SQL Editor').click();
  await cb.locator('.cm-content').first().waitFor({ timeout: 30000 });
  let picked = false;
  return {
    cb,
    async run(sql) {
      // Point the editor at this database's connection (once; the menu item
      // is disabled when it is already the editor's connection).
      if (!picked) {
        await cb.getByText(/^(Select connection|my-first.*)$/).first().click();
        const item = cb.getByText(new RegExp(`/${instance}$`)).last();
        if (await item.isEnabled()) await item.click(); else await cb.keyboard.press('Escape');
        await cb.waitForTimeout(1500);
        picked = true;
      }
      const editor = cb.locator('.cm-content').first();
      await editor.click();
      await cb.keyboard.press('Control+A');
      await cb.keyboard.type(sql);
      await cb.keyboard.press('Control+Enter');
      await cb.getByText(/Executed - |Error|ERROR/).first().waitFor({ timeout: 60000 });
      await cb.waitForTimeout(1200);
      const grid = cb.locator('[class*=result], [class*=Result], [role=grid]').last();
      return (await grid.innerText().catch(() => '')) || (await cb.locator('body').innerText());
    },
    close: () => cb.close(),
  };
}
