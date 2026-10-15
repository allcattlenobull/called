import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addLocatorHandler(page.getByRole('button', { name: 'Keep going', exact: true }), async (btn) => btn.click());
});

test('a new user can go from onboarding to exploring a path, and it persists', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'You don’t need your whole life figured out.' })).toBeVisible();
  await page.getByRole('link', { name: 'Start your journey' }).first().click();

  // Onboarding
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('What should we call you?').fill('Jordan');
  await page.getByText('In high school').click();
  await page.getByRole('button', { name: /Build my Purpose Compass/ }).click();

  // Interests: answer all 30
  for (let i = 0; i < 30; i++) {
    await page.getByRole('button', { name: i % 3 === 0 ? 'I’d enjoy this' : i % 3 === 1 ? 'Not sure' : 'Not for me' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Here’s what you responded to' })).toBeVisible();

  // Lifestyle: answer the first option of every question
  await page.goto('discover/lifestyle');
  const groups = page.locator('fieldset');
  await expect(groups.first()).toBeVisible();
  const n = await groups.count();
  expect(n).toBe(11);
  for (let i = 0; i < n; i++) await groups.nth(i).locator('label.option').first().click();
  await expect(page.getByRole('link', { name: /Next|See matching careers/ }).first()).toBeVisible();

  // Careers now show matches with visible components
  await page.goto('careers');
  await expect(page.getByLabel('Sort by')).toHaveValue('match');
  await expect(page.locator('.fitstrip').first()).toBeVisible();

  // Career detail: reality check, save, compare
  await page.goto('careers/registered-nurse');
  await expect(page.getByRole('heading', { name: 'How it fits you' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What the work actually looks like' })).toBeVisible();
  await page.locator('.reality-q').getByText('Maybe', { exact: true }).click();
  await expect(page.getByText('Saved to your Purpose Compass.')).toBeVisible();
  await page.getByRole('button', { name: 'Save career' }).click();
  await page.getByRole('button', { name: 'Add to comparison' }).click();

  // Simulation end to end
  await page.goto('try/healthcare');
  await page.getByRole('button', { name: 'Start simulation' }).click();
  for (let step = 0; step < 4; step++) {
    const multi = page.getByRole('button', { name: 'Lock in my choices' });
    const text = page.locator('#sim-text');
    if (await text.isVisible()) {
      await text.fill('Mr. Okafor, 72, in the waiting room says he feels dizzy and has not eaten. Please check on him now.');
      await page.getByRole('button', { name: /Compare with how a professional/ }).click();
    } else if (await multi.isVisible()) {
      const opts = page.locator('.sim-option');
      await opts.nth(0).click();
      await opts.nth(1).click();
      await multi.click();
    } else {
      await page.locator('.sim-option').first().click();
    }
    await page.getByRole('button', { name: step < 3 ? 'Next decision' : 'Reflect on this' }).click();
  }
  await page.locator('fieldset').filter({ hasText: 'Did you enjoy this?' }).getByText('Loved it').click();
  await page.locator('.chip').first().click();
  await page.locator('fieldset').filter({ hasText: 'regularly' }).getByText('Yes', { exact: true }).click();
  await page.getByRole('button', { name: 'Save my reflection' }).click();
  await expect(page.getByRole('heading', { name: 'Here’s what changed' })).toBeVisible();

  // Exploring a path from the career page
  await page.goto('careers/registered-nurse');
  await page.getByRole('button', { name: 'Explore this path' }).click();
  await expect(page.getByRole('heading', { name: 'Registered nurse' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paths I’m testing' })).toBeVisible();
  await expect(page.getByText('Your next best step')).toBeVisible();
  await expect(page.getByLabel('Evidence checklist')).toContainText('Still interested after the reality check');
  // Evidence from elsewhere in Called checks steps off automatically.
  await expect(page.locator('.step__auto', { hasText: 'auto · done' }).first()).toBeVisible();
  const meter = page.locator('.roadmap__meter .small');
  const before = await meter.textContent();
  await page.locator('.step input[type=checkbox]:not([disabled]):not(:checked)').first().check();
  await expect(meter).not.toHaveText(before!);

  // Decision gate feeds the learning loop
  if (!(await page.locator('#gate').isVisible())) await page.getByRole('button', { name: 'Check in now' }).click();
  await page.locator('#gate').getByRole('button', { name: 'Stronger interest' }).click();
  await expect(page.getByRole('heading', { name: 'How your interest has changed' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'your interest grew' })).toBeVisible();

  // Reflection saves to the journal
  await page.getByLabel('What have you learned that changed the way you think about your future?').fill('Helping people in a crisis gives me energy.');
  await page.getByRole('button', { name: 'Save to my journal' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  // A populated My Path stays accessible.
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);

  // Report includes chosen data, then reload proves persistence on this device
  await page.goto('path/report');
  await expect(page.getByRole('heading', { name: 'Jordan’s exploration report' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Jordan’s exploration report' })).toBeVisible();
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Jordan\./ })).toBeVisible();
});

test('export, delete and import a journey', async ({ page }) => {
  await page.goto('purpose/gifts');
  await page.getByRole('button', { name: /Teaching/ }).first().click();
  await page.goto('data');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export my journey' }).click()]);
  const path = await download.path();
  expect(path).toBeTruthy();

  await page.getByRole('button', { name: 'Delete my data' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  // Deleting finishes by returning to the home page.
  await expect(page.getByRole('heading', { name: 'You don’t need your whole life figured out.' })).toBeVisible();
  await page.goto('purpose/gifts');
  await expect(page.getByRole('button', { name: /Teaching/ }).first()).toHaveAttribute('aria-pressed', 'false');

  await page.goto('data');
  await page.locator('input[type=file]').setInputFiles(path!);
  await expect(page.getByText(/Imported your journey/)).toBeVisible();
  await page.goto('purpose/gifts');
  await expect(page.getByRole('button', { name: /Teaching/ }).first()).toHaveAttribute('aria-pressed', 'true');
});

test('compare and education ROI work together', async ({ page }) => {
  await page.goto('compare');
  await page.getByRole('button', { name: 'Nurse, PA, physical therapist' }).click();
  await expect(page.getByRole('table')).toContainText('Physician assistant');
  await expect(page.locator('.best-tag').first()).toBeVisible();
  await page.goto('compare/education?career=electrician');
  await expect(page.getByText('To earn back cost and lost earnings')).toBeVisible();
  await page.getByLabel('Years of training').fill('6');
  await expect(page.locator('.roi-results')).toBeVisible();
});

test('deep links load directly', async ({ page }) => {
  await page.goto('careers/lineworker');
  await expect(page.getByRole('heading', { name: 'Electrical lineworker', level: 1 })).toBeVisible();
  await page.goto('network?career=electrician');
  await expect(page.getByRole('heading', { name: 'Local Connections' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Talk to someone in this field near you' })).toBeVisible();
});

test('the research-backed reasoning pilot records a result without closing career exploration', async ({ page }) => {
  await page.goto('discover/validated-aptitude');
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Element 1', exact: true }).click();
    await page.getByRole('button', { name: i === 9 ? 'Save pilot result' : 'Next item' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Your reasoning pilot' })).toBeVisible();
  await page.goto('careers');
  await expect(page.locator('.ccard').first()).toBeVisible();
});

test('unfinished work is saved and offered on return', async ({ page }) => {
  await page.goto('welcome');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /Start exploring now/ }).click();
  await page.goto('try/software');
  await page.getByRole('button', { name: 'Start simulation' }).click();
  await page.locator('.sim-option').first().click();
  await page.getByRole('button', { name: 'Next decision' }).click();
  await expect(page.getByText('Decision 2 of 4')).toBeVisible();
  // Leave and come back later.
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toBeVisible();
  await page.getByRole('link', { name: /Simulation: The discount bug/ }).click();
  await expect(page.getByText('Picked up where you left off.')).toBeVisible();
  await expect(page.getByText(/Decision 2 of 4/)).toBeVisible();
});

test('a journey code switches between journeys on a shared device', async ({ page }) => {
  await page.goto('welcome');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('What should we call you?').fill('Ana');
  await page.getByRole('button', { name: /Start exploring now/ }).click();
  await page.goto('data');
  const anaCode = (await page.locator('.code-display__code').first().innerText()).trim();
  expect(anaCode).toMatch(/^CALL(-[2-9A-Z]{4}){4}$/);

  await page.getByRole('button', { name: 'Start a new journey on this device' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('What should we call you?').fill('Ben');
  await page.getByRole('button', { name: /Start exploring now/ }).click();
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Ben\./ })).toBeVisible();

  await page.goto('data');
  await page.getByLabel('Enter a journey code').fill(anaCode.toLowerCase().replace(/-/g, ' '));
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByRole('heading', { name: /Ana\./ })).toBeVisible();
});

test('theme toggle cycles auto, light and dark', async ({ page }) => {
  await page.goto('');
  const toggle = page.getByRole('button', { name: /^Theme:/ });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /^Theme:/ }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});
