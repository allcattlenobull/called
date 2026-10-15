import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // Badge celebrations are modal; dismiss them whenever they appear.
  await page.addLocatorHandler(page.getByRole('button', { name: 'Keep going', exact: true }), async (btn) => btn.click());
});

const ROUTES = [
  '',
  'welcome',
  'discover',
  'discover/interests',
  'discover/skills',
  'discover/aptitudes',
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
  'try',
  'try/software',
  'try/experiments',
  'try/experiments/teach-a-skill',
  'compare',
  'compare/education',
  'path',
  'path/report',
  'about',
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
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /Start exploring now/ }).click();
  // Celebrations lead with what was learned, not the reward.
  const dialog = page.getByRole('dialog', { name: 'You started gathering evidence.' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Badge earned: First step');
  const results = await new AxeBuilder({ page }).include('.celebrate').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
  await page.getByRole('button', { name: 'Keep going', exact: true }).click();
  await expect(dialog).toBeHidden();
});
