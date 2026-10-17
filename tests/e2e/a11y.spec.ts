import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // Badge celebrations are modal; dismiss them whenever they appear.
  await page.addLocatorHandler(page.getByRole('button', { name: 'Keep going', exact: true }), async (btn) => btn.click());
});

const ROUTES = [
  '',
  'me',
  'gifts',
  'helping',
  'now',
  'welcome',
  'discover',
  'discover/interests',
  'discover/skills',
  'discover/aptitudes',
  'discover/validated-aptitude',
  'discover/workStyle',
  'discover/values',
  'discover/lifestyle',
  'purpose',
  'purpose/gifts',
  'purpose/serve',
  'purpose/care',
  'purpose/experiences',
  'purpose/feedback',
  'purpose/principles',
  'purpose/journal',
  'purpose/statement',
  'careers',
  'careers/registered-nurse',
  'careers/electrician',
  'careers/registered-nurse/interview',
  'try',
  'try/software',
  'try/experiments',
  'try/experiments/teach-a-skill',
  'compare',
  'compare/education',
  'path',
  'path/report',
  'account',
  'account/ai-export',
  'network?career=electrician',
  'about',
  'research',
  'research/check-in',
  'feedback',
  'counselor',
  'terms',
  'share/not-a-real-id',
  'data',
  'achievements',
  'does-not-exist',
];

for (const route of ROUTES) {
  test(`/${route} renders without errors or serious accessibility violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(route);
    await expect(page.locator('main h1').first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    expect(errors).toEqual([]);
    // No horizontal page scroll at any width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test.describe('dark mode', () => {
  test.use({ colorScheme: 'dark' });
  for (const route of ['', 'careers', 'careers/registered-nurse', 'purpose', 'try/healthcare', 'compare', 'achievements', 'data']) {
    test(`/${route} has sufficient contrast in dark mode`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('main h1').first()).toBeVisible();
      const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect(results.violations.flatMap((v) => v.nodes.map((n) => n.target.join(' '))).slice(0, 5)).toEqual([]);
    });
  }
});

test('the brand page is not public', async ({ page }) => {
  await page.goto('brand');
  await expect(page.getByRole('heading', { name: 'This page doesn’t exist' })).toBeVisible();
});

test('celebration dialog is accessible', async ({ page }) => {
  await page.removeLocatorHandler(page.getByRole('button', { name: 'Keep going', exact: true }));
  await page.goto('welcome');
  await page.getByLabel('I agree to the Guest Terms of Use').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Just let me look around' }).click();
  // Celebrations lead with what was learned, not the reward.
  const dialog = page.getByRole('dialog', { name: 'You started gathering evidence.' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Badge earned: First step');
  const results = await new AxeBuilder({ page }).include('.celebrate').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
  await page.getByRole('button', { name: 'Keep going', exact: true }).click();
  await expect(dialog).toBeHidden();
});

test('the accessibility options panel is keyboard and screen-reader accessible', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Accessibility options' }).click();
  const panel = page.getByRole('dialog', { name: 'Accessibility options' });
  await expect(panel).toBeVisible();
  const results = await new AxeBuilder({ page }).include('#accessibility-panel').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical').map((violation) => violation.id)).toEqual([]);
  // Focus moves into the panel and returns to the toggle on Escape.
  await expect(panel.getByRole('button', { name: 'Auto', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(page.getByRole('button', { name: 'Accessibility options' })).toBeFocused();
});

test('the accessibility panel fits the screen on every device', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Accessibility options' }).click();
  const box = await page.locator('#accessibility-panel').boundingBox();
  const vp = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  if (vp.width <= 700) {
    // A bottom sheet on phones.
    expect(Math.round(box!.y + box!.height)).toBeGreaterThanOrEqual(vp.height - 1);
    expect(box!.width).toBeGreaterThanOrEqual(vp.width - 1);
  } else {
    // A popover under the header on larger screens.
    expect(box!.y).toBeGreaterThan(40);
    expect(box!.y).toBeLessThan(120);
  }
});

test('supported browsers can translate the current page on-device and restore English', async ({ page }) => {
  await page.addInitScript(() => {
    class MockTranslator {
      static async availability() { return 'available'; }
      static async create() { return { translate: async (value: string) => `ES: ${value}`, destroy() {} }; }
    }
    Object.defineProperty(globalThis, 'Translator', { value: MockTranslator, configurable: true });
  });
  await page.goto('');
  await page.getByRole('button', { name: 'Accessibility options' }).click();
  const panel = page.getByRole('dialog', { name: 'Accessibility options' });
  await panel.getByRole('button', { name: 'Español — translate this page' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('main h1')).toContainText('ES:');
  await panel.getByRole('button', { name: 'English — show original' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main h1')).not.toContainText('ES:');
});
