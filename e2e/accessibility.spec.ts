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

/**
 * Contrast guard for the textured background.
 *
 * The grain + dot layers composite over --bg, so text no longer sits on the
 * flat token — raising a texture opacity silently erodes contrast. This
 * composites the real texture stack and checks every text token against the
 * resulting dominant background in both themes.
 *
 * --warn is excluded: it is used only inside the aria-hidden canvas, never as
 * text, so WCAG text contrast does not apply to it.
 */
test.describe('text contrast over the textured background', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`meets WCAG AA for body text in ${theme} mode`, async ({ page }) => {
      await page.goto('/');
      const result = await page.evaluate(async (mode) => {
        const lum = (r: number, g: number, b: number) => {
          const f = (c: number) => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (a: number[], b: number[]) => {
          const [x, y] = [lum(a[0], a[1], a[2]), lum(b[0], b[1], b[2])];
          const [hi, lo] = x > y ? [x, y] : [y, x];
          return (hi + 0.05) / (lo + 0.05);
        };
        const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

        document.documentElement.dataset.theme = mode;
        const cs = getComputedStyle(document.documentElement);
        const tok = (n: string) => cs.getPropertyValue(n).trim();

        // Reproduce body::before (grain) and body::after (dots) exactly.
        const noise = new Image();
        noise.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E";
        await noise.decode();

        const c = document.createElement('canvas');
        c.width = 200; c.height = 200;
        const x = c.getContext('2d')!;
        x.fillStyle = tok('--bg');
        x.fillRect(0, 0, 200, 200);
        x.globalAlpha = parseFloat(tok('--grain-opacity'));
        x.drawImage(noise, 0, 0);
        x.globalAlpha = parseFloat(tok('--dot-opacity'));
        x.fillStyle = tok('--dot');
        for (let py = 0; py < 200; py += 26) {
          for (let px = 0; px < 200; px += 26) {
            x.beginPath(); x.arc(px, py, 1, 0, Math.PI * 2); x.fill();
          }
        }

        const d = x.getImageData(0, 0, 200, 200).data;
        let sr = 0, sg = 0, sb = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; }
        const bg = [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)];

        const rows: Record<string, number> = {};
        for (const t of ['--ink', '--dim', '--faint', '--acc', '--acc2']) {
          rows[t] = +ratio(hex(tok(t)), bg).toFixed(2);
        }
        return { bg: `rgb(${bg.join(',')})`, rows };
      }, theme);

      for (const [token, r] of Object.entries(result.rows)) {
        expect(
          r,
          `${token} on the composited ${theme} background (${result.bg}) is ${r}:1, below the 4.5:1 AA floor for body text`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
