import { test, expect } from '@playwright/test';

test.describe('accessibility', () => {
  test('hides the decorative canvas from assistive technology', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#subject')).toHaveAttribute('aria-hidden', 'true');
  });

  test('keeps all narrative copy readable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const opacities = await page.$$eval('.act-panel', (els) =>
      els.map((el) => parseFloat(getComputedStyle(el).opacity)),
    );
    // No panel may be hidden behind an animation that will never play.
    for (const o of opacities) expect(o).toBe(1);
  });

  test('starts at h1 and never skips a heading level', async ({ page }) => {
    await page.goto('/');
    const levels = await page.$$eval('h1,h2,h3,h4', (els) =>
      els.map((el) => Number(el.tagName[1])),
    );
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  test('exposes exactly one h1', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('h1').count()).toBe(1);
  });

  test('gives every link an accessible name', async ({ page }) => {
    await page.goto('/');
    const names = await page.$$eval('a', (els) =>
      els.map((el) => (el.textContent ?? '').trim() || el.getAttribute('aria-label') || ''),
    );
    for (const n of names) expect(n.length).toBeGreaterThan(0);
  });

  test('shows a visible focus ring on the theme toggle', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /switch to/i });
    await toggle.focus();
    const outline = await toggle.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });
});
