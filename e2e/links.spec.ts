import { test, expect } from '@playwright/test';

test.describe('outbound links', () => {
  test('opens every external link in a new tab, safely', async ({ page }) => {
    await page.goto('/');
    const links = await page.$$eval('a[target="_blank"]', (els) =>
      els.map((el) => ({
        href: (el as HTMLAnchorElement).href,
        rel: (el as HTMLAnchorElement).rel,
        name: el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '',
      })),
    );

    expect(links.length, 'expected the project, publication and Boardd links').toBeGreaterThanOrEqual(5);
    for (const l of links) {
      // rel=noopener stops the opened page reaching back via window.opener.
      expect(l.rel, `${l.href} is missing noopener/noreferrer`).toContain('noopener');
      expect(l.rel, `${l.href} is missing noreferrer`).toContain('noreferrer');
      expect(l.href.startsWith('https://'), `${l.href} is not https`).toBe(true);
      // "InsightQL" alone does not tell a screen-reader user where it goes.
      expect(l.name.length, `${l.href} has no accessible name`).toBeGreaterThan(0);
    }
  });

  test('makes the whole project card a click target', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#projects article');
    await expect(cards).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const card = cards.nth(i);
      await card.scrollIntoViewIfNeeded();

      // Exactly one link per card — a stretched overlay, not nested anchors.
      await expect(card.locator('a')).toHaveCount(1);

      // Hit-test the far corners and the middle, away from the title text.
      const hits = await card.evaluate((el) => {
        const a = el.querySelector('a');
        const r = el.getBoundingClientRect();
        const probes: [number, number][] = [
          [r.left + 6, r.top + 6],
          [r.right - 6, r.top + 6],
          [r.left + r.width / 2, r.top + r.height / 2],
          [r.left + 6, r.bottom - 6],
          [r.right - 6, r.bottom - 6],
        ];
        return probes.map(([x, y]) =>
          document.elementFromPoint(Math.round(x), Math.round(y))?.closest('a') === a,
        );
      });
      expect(hits.every(Boolean), `card ${i} is not clickable across its whole area`).toBe(true);
    }
  });

  test('opens the repo when the card is clicked away from the title', async ({ page, context }) => {
    await page.goto('/');
    const card = page.locator('#projects article').first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;

    const popup = context.waitForEvent('page');
    // Bottom-right corner — nowhere near the link text.
    await page.mouse.click(box.x + box.width - 14, box.y + box.height - 14);
    const opened = await popup;
    expect(opened.url()).toBe('https://github.com/AnasBaqai/InsightQL');
    await opened.close();
  });

  test('links Boardd to its live product', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('#experience a[href*="boarddd"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', 'https://boarddd-frontend-murex.vercel.app/');
    await expect(link).toContainText('Boardd');
  });
});
