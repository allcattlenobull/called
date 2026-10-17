import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addLocatorHandler(page.getByRole('button', { name: 'Keep going', exact: true }), async (btn) => btn.click());
});

test('a new user can go from onboarding to exploring a path, and it persists', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'You don’t need your whole life figured out.' })).toBeVisible();
  // Front door: “Find careers that fit me” asks one question, then starts the fit journey.
  const doors = page.getByRole('region', { name: 'What brings you here?' });
  await doors.getByRole('button', { name: /Find my fit/ }).click();
  await doors.getByRole('button', { name: 'No, I’m in school or starting out' }).click();

  // Onboarding
  await page.getByLabel('I agree to the Guest Terms of Use').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'You’re starting: Find careers that fit me' })).toBeVisible();
  await page.getByLabel('What should we call you?').fill('Jordan');
  await page.getByText('In high school').click();
  await page.getByRole('button', { name: /Start my journey/ }).click();

  // Journey home: one clear next step.
  await expect(page.getByRole('heading', { name: /Jordan\./, level: 1 })).toBeVisible();
  await expect(page.getByText('Step 1: What you enjoy')).toBeVisible();
  await page.getByRole('link', { name: /Start interests/ }).click();

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

test('career and simulation searches handle misspellings and related terms', async ({ page }) => {
  await page.goto('careers');
  const careerSearch = page.getByLabel('Search', { exact: true });
  await careerSearch.fill('programer');
  await expect(page.getByRole('heading', { name: 'Software developer' })).toBeVisible();
  await careerSearch.fill('nures');
  await expect(page.getByRole('heading', { name: 'Registered nurse' })).toBeVisible();

  await page.goto('try');
  await page.getByLabel('Search simulations').fill('coder');
  await expect(page.getByText('The discount bug', { exact: true })).toBeVisible();

  await page.goto('network');
  await page.getByLabel('Search careers').fill('nures');
  await page.getByRole('button', { name: /Registered nurse/ }).click();
  await expect(page.getByText(/gathering evidence about Registered nurse/)).toBeVisible();
});

test('career pages explain AI change and offer evidence-first interview practice', async ({ page }) => {
  await page.goto('careers/registered-nurse');
  await expect(page.getByRole('heading', { name: 'How AI is changing this work' })).toBeVisible();
  await expect(page.getByText('Task exposure is not a job forecast')).toBeVisible();
  await page.getByRole('link', { name: /Practice an informational interview/ }).click();
  await expect(page.getByRole('heading', { name: 'Practice an interview about Registered nurse' })).toBeVisible();
  await expect(page.getByText(/Practice does not affect your matches/)).toBeVisible();
});

test('the path page finds careers with smart search and has no reflection prompt', async ({ page }) => {
  await page.goto('path');
  await expect(page.getByText('A question worth reflecting on')).toHaveCount(0);
  await expect(page.getByLabel('What have you learned that changed the way you think about your future?')).toHaveCount(0);

  await page.getByLabel('Search for a career path').fill('nures');
  await page.getByRole('button', { name: /Registered nurse.*Explore/ }).click();
  await expect(page.getByRole('heading', { name: 'Registered nurse' })).toBeVisible();
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

test('every career explains how AI is changing the work, and careers can be filtered by it', async ({ page }) => {
  await page.goto('careers/electrician');
  const ai = page.locator('section', { has: page.getByRole('heading', { name: 'How AI is changing this work' }) });
  await expect(ai).toContainText('Low exposure to AI');
  await expect(ai.getByRole('heading', { name: 'Tasks that stay human' })).toBeVisible();
  await expect(ai.getByRole('link', { name: /GPTs are GPTs/ })).toBeVisible();
  await page.goto('careers/accountant');
  await expect(page.getByText('High exposure to AI')).toBeVisible();

  await page.goto('careers');
  const filters = page.locator('details.filters');
  await filters.waitFor();
  if ((await filters.getAttribute('open')) === null) await filters.locator('summary').click();
  await page.getByLabel('Exposure to AI').selectOption('low');
  await expect(page.getByRole('heading', { name: /\d+ careers?/ })).toBeVisible();
  await page.getByRole('link', { name: 'Electrician', exact: true }).first().waitFor();
  await expect(page.getByRole('link', { name: 'Accountant', exact: true })).toHaveCount(0);
});

test('unfinished work is saved and offered on return', async ({ page }) => {
  await page.goto('welcome');
  await page.getByLabel('I agree to the Guest Terms of Use').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Just let me look around' }).click();
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
  await page.getByLabel('I agree to the Guest Terms of Use').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('What should we call you?').fill('Ana');
  await page.getByRole('button', { name: 'Just let me look around' }).click();
  await page.goto('data');
  const anaCode = (await page.locator('.code-display__code').first().innerText()).trim();
  expect(anaCode).toMatch(/^CALL(-[2-9A-Z]{4}){4}$/);

  await page.getByRole('button', { name: 'Start a new journey on this device' }).click();
  await page.getByLabel('I agree to the Guest Terms of Use').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('What should we call you?').fill('Ben');
  await page.getByRole('button', { name: 'Just let me look around' }).click();
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Ben\./ })).toBeVisible();

  await page.goto('data');
  await page.getByLabel('Enter a journey code').fill(anaCode.toLowerCase().replace(/-/g, ' '));
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByRole('heading', { name: /Ana\./ })).toBeVisible();
});

test('an individual account shows identity, results and a stable member ID', async ({ page }) => {
  await page.goto('welcome');
  await page.getByLabel('I agree to the Guest Terms of Use').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('What should we call you?').fill('Jordan');
  await page.getByLabel('Last name').fill('Lee');
  await page.getByRole('button', { name: 'Just let me look around' }).click();
  await page.goto('account');
  await page.getByLabel('I have read and agree to the Individual Account Terms').check();
  await page.getByRole('button', { name: 'Create my individual account' }).click();
  await expect(page.getByRole('heading', { name: 'Jordan Lee’s account' })).toBeVisible();
  await expect(page.getByText(/^CLD(?:-[2-9A-HJ-NP-TV-Z]{4}){3}$/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your results at a glance' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Counselor sharing' })).toBeVisible();
});

test('guest and account terms are distinct and consent is versioned', async ({ page }) => {
  await page.goto('welcome');
  const continueButton = page.getByRole('button', { name: 'Continue' });
  await expect(continueButton).toBeDisabled();
  await page.getByLabel('I agree to the Guest Terms of Use').check();
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await page.goto('terms');
  await expect(page.getByRole('heading', { name: 'Using Called without an account' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Individual account terms' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Counselor account terms' })).toBeVisible();

  await page.goto('account');
  await expect(page.getByRole('heading', { name: 'Create your individual account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create my individual account' })).toBeDisabled();
});

test('navigation uses one responsive menu that reaches every section', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('navigation', { name: 'Quick' })).toHaveCount(0);
  const desktop = (page.viewportSize()?.width ?? 0) >= 1100;
  if (desktop) {
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
    const explore = nav.getByRole('button', { name: 'My plan' });
    await explore.click();
    await expect(explore).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(explore).toHaveAttribute('aria-expanded', 'false');
    await expect(explore).toBeFocused();
    await explore.click();
    await nav.getByRole('link', { name: /Training costs and payoff/ }).click();
    await expect(page).toHaveURL(/compare\/education/);
    await expect(explore).toHaveClass(/active/);
    await nav.getByRole('button', { name: 'Careers' }).click();
    await expect(nav.getByRole('link', { name: /Talk to people near you/ })).toBeVisible();
    await nav.getByRole('button', { name: 'Purpose & gifts' }).click();
    await expect(nav.getByRole('link', { name: /Understanding gifts/ })).toBeVisible();
    // Personal pages live under “About me” on the right.
    const me = page.getByRole('button', { name: /About me/ });
    await me.click();
    await expect(page.getByRole('link', { name: /My assessments/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Privacy and data/ }).first()).toBeVisible();
  } else {
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    for (const name of ['Start here', 'Understanding gifts', 'My gifts', 'Find careers', 'Try a career', 'Talk to people near you', 'Compare careers', 'Paths I’m testing', 'Next moves from where I am', 'Training costs and payoff', 'Places and cost of living', 'My Called report', 'About me', 'My assessments', 'Account']) {
      await expect(menu.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await menu.getByRole('link', { name: 'Places and cost of living', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Places and cost of living', level: 1 })).toBeVisible();
  }
});

test('a working adult gets credit for their job, pay, education and skills', async ({ page }) => {
  await page.goto('now');
  await page.getByLabel('Closest career to what you do now').fill('teacher');
  await page.getByRole('button', { name: /High school teacher/ }).click();
  await page.getByLabel('Yearly pay before taxes').fill('60000');
  await page.getByLabel('Highest education you’ve finished').selectOption('bachelor');
  await page.getByLabel(/Field of study/).fill('Education');
  await page.getByText('No more school than I already have').click();
  await page.getByRole('button', { name: 'Save where I am now' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
  await page.getByRole('button', { name: /Add the skills high school teachers use/ }).click();
  await page.getByRole('group', { name: 'How much more school' }).getByRole('button', { name: 'No more school' }).click();
  const moves = page.locator('.moves');
  await expect(moves.locator('.move').first()).toBeVisible();
  await expect(moves.locator('.tag', { hasText: 'No more school' }).first()).toBeVisible();
  await expect(moves).toContainText('vs. now');
  await expect(moves).not.toContainText('Registered nurse');

  await page.goto('careers/registered-nurse');
  await expect(page.locator('.from-here')).toContainText('bridge or accelerated program');
  await page.goto('careers/hr-specialist');
  await expect(page.locator('.from-here')).toContainText('No more school');

  await page.goto('compare/education?career=physician-assistant');
  await expect(page.locator('.roi-place')).toContainText('From where you are');
  await expect(page.getByLabel('What you’d earn per year instead')).toHaveValue('60000');

  await page.goto('careers');
  const filters = page.locator('details.filters');
  await filters.waitFor();
  if ((await filters.getAttribute('open')) === null) await filters.locator('summary').click();
  await page.getByLabel('More school from where I am').selectOption('none');
  await expect(page.getByRole('link', { name: 'Registered nurse', exact: true })).toHaveCount(0);
});

test('places drive pay, cost of living and study costs', async ({ page }) => {
  await page.goto('places');
  await page.getByLabel('State').first().selectOption('GA');
  await page.locator('#home-metro').selectOption({ label: 'Atlanta-Sandy Springs-Roswell, GA' });
  await page.locator('#consider-0-state').selectOption('TX');
  await page.getByRole('button', { name: 'Save places' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
  const col = page.locator('section', { has: page.getByRole('heading', { name: 'What life costs there' }) });
  await expect(col).toContainText('Atlanta area');
  await expect(col).toContainText('Texas');
  await expect(page.getByText(/To live like \$50,000 in Atlanta area/)).toBeVisible();

  await page.goto('careers/electrician');
  const pay = page.locator('.place-pay');
  await expect(pay).toContainText('Atlanta area');
  await expect(pay).toContainText('Texas');
  await expect(page.locator('.pay-head')).toContainText(/Atlanta area, GA median pay|Georgia median pay/);

  await page.goto('compare/education?career=registered-nurse&study=TX');
  await expect(page.getByLabel('Study or train in')).toHaveValue('TX');
  await expect(page.locator('.roi-place')).toContainText('out of state');
  await expect(page.locator('.roi-place')).toContainText('Many people stay where they study');

  await page.goto('network?career=electrician');
  const looks = page.locator('section', { has: page.getByRole('heading', { name: 'Look in each of your places' }) });
  await expect(looks).toContainText('Atlanta area');
  await expect(looks).toContainText('Texas');
  await expect(looks.getByRole('link', { name: /IBEW near Texas/ })).toHaveAttribute('href', /google\.com\/maps\/search/);
});

test('the accessibility menu controls appearance, text size and Spanish access', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Accessibility options' }).click();
  const panel = page.getByRole('dialog', { name: 'Accessibility options' });
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Light / Claro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await panel.getByRole('button', { name: 'Dark / Oscuro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await panel.getByRole('button', { name: 'Extra large / Muy grande', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xlarge');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(panel.getByRole('link', { name: /Español/ }).or(panel.getByRole('button', { name: /Español/ }))).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xlarge');
  await page.getByRole('button', { name: 'Accessibility options' }).click();
  await page.getByRole('dialog', { name: 'Accessibility options' }).getByRole('button', { name: 'Auto', exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('the front door looks up a career with no setup', async ({ page }) => {
  await page.goto('');
  const doors = page.getByRole('region', { name: 'What brings you here?' });
  await doors.getByRole('searchbox', { name: 'Search careers' }).fill('acountant');
  await doors.getByRole('button', { name: 'Search careers' }).click();
  await expect(page).toHaveURL(/careers\?q=acountant/);
  await expect(page.getByRole('link', { name: 'Accountant', exact: true }).first()).toBeVisible();
});

test('a career changer gets a guided journey with a progress bar on every page', async ({ page }) => {
  await page.goto('');
  const doors = page.getByRole('region', { name: 'What brings you here?' });
  await doors.getByRole('button', { name: /Find my fit/ }).click();
  await doors.getByRole('button', { name: 'Yes, and I want a change' }).click();
  await page.getByLabel('I agree to the Guest Terms of Use').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'You’re starting: Change careers without starting over' })).toBeVisible();
  await page.getByLabel('What should we call you?').fill('Dana');
  await page.getByRole('button', { name: /Start my journey/ }).click();

  const card = page.getByRole('region', { name: 'Change careers without starting over' });
  await expect(card).toContainText('0 of 5 done');
  await expect(card.getByText('Step 1: Tell Called where you are now')).toBeVisible();
  await card.getByRole('link', { name: /Add where I am now/ }).click();
  await expect(page).toHaveURL(/\/now/);

  // The journey bar follows people around the site and links back home.
  await page.goto('careers');
  const bar = page.getByRole('navigation', { name: 'Your journey' });
  await expect(bar).toContainText('Tell Called where you are now');
  await bar.getByRole('link', { name: /Your journey/ }).click();
  await expect(page.getByRole('heading', { name: /Dana\./, level: 1 })).toBeVisible();

  // People can switch journeys at any time.
  await page.getByRole('button', { name: /Change what I’m working on/ }).click();
  await page.getByRole('button', { name: /Start with my gifts/ }).click();
  await expect(page.getByRole('region', { name: 'Discover my gifts and purpose' })).toContainText('Step 1: Learn what gifts are');
  await page.getByRole('link', { name: /Read the guide/ }).click();
  await expect(page.getByRole('heading', { name: 'Understanding gifts', level: 1 })).toBeVisible();
  await page.goto('');
  await expect(page.getByRole('region', { name: 'Discover my gifts and purpose' })).toContainText('1 of 6 done');
});

test('helpers have their own starting page', async ({ page }) => {
  await page.goto('');
  await page.getByRole('region', { name: 'What brings you here?' }).getByRole('link', { name: 'Start here', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Helping someone find their way', level: 1 })).toBeVisible();
});
