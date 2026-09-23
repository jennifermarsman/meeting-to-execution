import { test, expect } from '@playwright/test';

const KEY = 'next-step:v1';

async function start(page, { persist = false, mode = 'habits', unit = 'kg', hide = false } = {}) {
  await page.goto('/');
  await page.locator('#onboard-mode').selectOption(mode);
  await page.locator('#onboard-unit').selectOption(unit);
  if (persist) await page.locator('#onboard-form input[name=persist]').check();
  if (hide) await page.locator('#onboard-form input[name=hideNumbers]').check();
  await page.getByRole('button', { name: 'Start my journey' }).click();
  await expect(page.locator('#dashboard')).toBeVisible();
}

async function addWeight(page, value, date) {
  if (date) await page.locator('#weight-date').fill(date);
  await page.getByLabel('Weight (', { exact: false }).fill(String(value));
  await page.getByRole('button', { name: 'Add check-in', exact: true }).click();
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('onboarding defaults to session-only and can be completed using keyboard', async ({ page }) => {
  await page.goto('/');
  await page.locator('#onboard-mode').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#onboard-unit')).toBeFocused();
  await page.getByRole('button', { name: 'Start my journey' }).click();
  await expect(page.locator('#storage-badge')).toHaveText('Session only / not saved');
  await addWeight(page, 80);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull();
  await page.reload();
  await expect(page.locator('#welcome')).toBeVisible();
  await noOverflow(page);
});

test('opted-in weights persist; duplicates require explicit edit; units preserve kg', async ({ page }) => {
  await start(page, { persist: true });
  await addWeight(page, 80, '2026-01-01');
  await addWeight(page, 81, '2026-01-01');
  await expect(page.getByRole('alert').first()).toContainText('already an entry');
  await page.getByText('View and edit history').click();
  await page.getByRole('button', { name: 'Edit 2026-01-01', exact: true }).click();
  await page.locator('#weight-value').fill('81');
  await page.getByRole('button', { name: 'Save edit', exact: true }).click();
  await expect(page.locator('.weight-summary')).toContainText('81.0 kg');
  await page.reload();
  await expect(page.locator('.weight-summary')).toContainText('81.0 kg');
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  await page.getByLabel('Weight units').filter({ visible: true }).selectOption('lb');
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.locator('.weight-summary')).toContainText('178.6 lb');
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(stored.weights).toEqual([{ date: '2026-01-01', kg: 81 }]);
  await noOverflow(page);
});

test('daily completion, reload, swap and undo do not create extra rewards', async ({ page }) => {
  await start(page, { persist: true });
  const title = await page.locator('#prompt-title').textContent();
  await page.getByRole('button', { name: 'Try a different step' }).click();
  await expect(page.locator('#prompt-title')).not.toHaveText(title);
  await page.getByRole('button', { name: 'I took this step' }).click();
  await expect(page.locator('#journey-count')).toHaveText('1 chosen step taken');
  await page.reload();
  await expect(page.locator('#journey-count')).toHaveText('1 chosen step taken');
  await page.getByRole('button', { name: "Undo today's step" }).click();
  await expect(page.locator('#journey-count')).toHaveText('0 chosen steps taken');
  await expect(page.getByRole('button', { name: 'Try a different step' })).toBeVisible();
});

test('hidden numbers remove values, target inputs, chart and history from DOM', async ({ page }) => {
  await start(page, { mode: 'goal' });
  await addWeight(page, 82.3, '2026-01-01');
  await addWeight(page, 81.2, '2026-01-02');
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  await page.locator('#settings-target').fill('75.7');
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.locator('.chart')).toHaveCount(1);
  await page.getByRole('button', { name: 'Hide numbers', exact: true }).click();
  await expect(page.locator('.chart')).toHaveCount(0);
  await expect(page.locator('#settings-target')).toHaveCount(0);
  await expect(page.locator('#weight-value')).toHaveCount(0);
  const html = await page.locator('body').innerHTML();
  for (const value of ['82.3', '81.2', '75.7']) expect(html).not.toContain(value);
  await page.getByRole('button', { name: 'I took this step' }).click();
  await expect(page.locator('#journey-count')).toHaveText('1 chosen step taken');
  await noOverflow(page);
});

test('maintenance is voluntary and does not lower the target', async ({ page }) => {
  await start(page, { mode: 'goal', persist: true });
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  await page.locator('#settings-target').fill('75');
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await addWeight(page, 80, '2026-01-01');
  await addWeight(page, 75, '2026-01-02');
  await expect(page.getByRole('button', { name: 'Choose maintenance' })).toBeVisible();
  let stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(stored.profile.mode).toBe('goal');
  expect(stored.profile.targetKg).toBe(75);
  await page.getByRole('button', { name: 'Choose maintenance' }).click();
  await expect(page.locator('#focus-title')).toHaveText('Staying here is progress, too');
  stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(stored.profile.mode).toBe('maintenance');
  expect(stored.profile.targetKg).toBe(75);
});

test('export is complete; erase cancellation preserves data; deletion is scoped', async ({ page }) => {
  await start(page, { persist: true });
  await addWeight(page, 80, '2026-01-01');
  await page.evaluate(() => localStorage.setItem('other-app', 'keep'));
  page.once('dialog', dialog => dialog.accept());
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export my data' }).click();
  const download = await downloading;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.version).toBe(1);
  expect(exported.weights).toEqual([{ date: '2026-01-01', kg: 80 }]);
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Erase my data', exact: true }).click();
  await expect(page.locator('#dashboard')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Erase my data', exact: true }).click();
  await expect(page.locator('#welcome')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('other-app'))).toBe('keep');
  await expect(page.locator('#weight-value')).toHaveCount(0);
  await expect(page.locator('.weight-summary')).toHaveCount(0);
  await expect(page.locator('#settings-target')).toHaveCount(0);
});

test('corrupt saved data blocks writes and requires explicit recovery', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(key => localStorage.setItem(key, '{broken'), KEY);
  await page.reload();
  await expect(page.locator('#recovery')).toBeVisible();
  await expect(page.locator('#error')).toContainText('Unable to open saved data');
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe('{broken');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Erase app data and start again' }).click();
  await expect(page.locator('#welcome')).toBeVisible();
});

test('failed persistence does not claim success or replace the previous state', async ({ page }) => {
  await start(page, { persist: true });
  await page.evaluate(() => {
    Storage.prototype.setItem = function () { throw new DOMException('Test quota failure', 'QuotaExceededError'); };
  });
  await addWeight(page, 80);
  await expect(page.locator('#error')).toContainText('Changes were not saved');
  await expect(page.locator('.weight-summary')).toHaveCount(0);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).weights.length, KEY)).toBe(0);
});

test('synthetic demo, status and responsive layouts have no external requests or page errors', async ({ page }) => {
  const external = [];
  const errors = [];
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4173/')) external.push(request.url());
  });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/');
  await noOverflow(page);
  await page.getByRole('button', { name: 'Explore a synthetic sample first' }).click();
  await expect(page.locator('#demo-notice')).toBeVisible();
  await expect(page.locator('.chart')).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button', { name: 'I took this step' }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull();
  await page.screenshot({ path: `test-results/prototype-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('link', { name: 'Team status', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A conversation, put into motion.' })).toBeVisible();
  await noOverflow(page);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('another tab changing saved data blocks edits until reload', async ({ page, context }) => {
  await start(page, { persist: true });
  const second = await context.newPage();
  await second.goto('/');
  await second.getByRole('button', { name: 'I took this step' }).click();
  await expect(page.locator('#recovery')).toBeVisible();
  await expect(page.locator('#error')).toContainText('changed in another tab');
  await page.reload();
  await expect(page.locator('#journey-count')).toHaveText('1 chosen step taken');
});

test('deleting a weight keeps journey progress and disabling persistence removes saved record', async ({ page }) => {
  await start(page, { persist: true });
  await addWeight(page, 80, '2026-01-01');
  await page.getByRole('button', { name: 'I took this step' }).click();
  await page.getByText('View and edit history').click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete 2026-01-01' }).click();
  await expect(page.locator('.weight-summary')).toHaveCount(0);
  await expect(page.locator('#journey-count')).toHaveText('1 chosen step taken');
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  await page.locator('#settings-form input[name=persist]').uncheck();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull();
  await page.reload();
  await expect(page.locator('#welcome')).toBeVisible();
});
