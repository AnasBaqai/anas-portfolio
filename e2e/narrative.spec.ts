import { test, expect, type Page } from '@playwright/test';

interface Sample { ink: number; centroidX: number; centroidY: number }

/** Measure what the canvas actually rendered at the current scroll offset. */
async function sampleCanvas(page: Page): Promise<Sample> {
  const { ink, sx, sy, width, height } = await page.evaluate(() => {
    const canvas = document.getElementById('subject') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0, sx = 0, sy = 0;
    for (let i = 0; i < data.length; i += 4 * 7) {
      if (data[i + 3] > 25) {
        const px = (i / 4) % canvas.width;
        const py = Math.floor(i / 4 / canvas.width);
        ink++; sx += px; sy += py;
      }
    }
    return { ink, sx, sy, width: canvas.width, height: canvas.height };
  });
  // A blank canvas would make the centroids NaN and every downstream
  // assertion fail with an opaque NaN comparison. Fail here instead, where
  // the message names the actual problem.
  expect(ink, 'canvas rendered no pixels').toBeGreaterThan(0);
  return { ink, centroidX: sx / ink / width, centroidY: sy / ink / height };
}

/**
 * Headless Chrome throttles requestAnimationFrame to roughly 1fps, so a fixed
 * timeout after scrolling reads stale canvas pixels (confirmed: samples at
 * different scroll fractions came back byte-identical under a 400ms wait).
 * Wait for two genuine rAF callbacks instead, so the canvas has actually
 * redrawn at the new scroll position.
 */
async function waitForTwoFrames(page: Page) {
  await page.evaluate(
    () => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }),
  );
}

/**
 * Scroll to a fraction of the NARRATIVE's scroll range, not of total page
 * height. The page contains ~5000px of content below the narrative (Tasks
 * 10-11: Experience, Projects, Skills, Credentials, Contact, Footer), so a
 * fraction of page height would sample a parked subject and measure no
 * movement. This duplicates the bounds formula from Subject.tsx deliberately
 * — the test asserts against the contract independently rather than
 * importing the component's internals. If Subject.tsx's bounds formula
 * changes, this helper must change with it.
 */
async function scrollToNarrativeFraction(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const hero = document.getElementById('hero')!;
    const story = document.getElementById('story')!;
    const start = hero.offsetHeight * 0.55;
    const end = story.offsetTop + story.offsetHeight - window.innerHeight * 0.5;
    window.scrollTo(0, start + (end - start) * f);
  }, fraction);
  await waitForTwoFrames(page);
}

test.describe('the morphing subject', () => {
  test('renders a different shape in a different place at each scroll depth', async ({ page }) => {
    await page.goto('/');
    await waitForTwoFrames(page);

    const samples: Sample[] = [];
    for (const f of [0.18, 0.32, 0.5, 0.68, 0.85]) {
      await scrollToNarrativeFraction(page, f);
      samples.push(await sampleCanvas(page));
    }

    // Something is always drawn.
    for (const s of samples) expect(s.ink).toBeGreaterThan(100);

    // The subject traverses a long way horizontally. This is the assertion that
    // fails if the animation degenerates into "only the colour changes".
    const xs = samples.map((s) => s.centroidX);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.25);

    // The shape genuinely changes, not just its position.
    const inks = samples.map((s) => s.ink);
    expect(Math.max(...inks) / Math.min(...inks)).toBeGreaterThan(1.3);
  });

  test('scrubs backwards to the same state', async ({ page }) => {
    await page.goto('/');
    await waitForTwoFrames(page);

    await scrollToNarrativeFraction(page, 0.4);
    const forward = await sampleCanvas(page);

    await scrollToNarrativeFraction(page, 0.85);
    await scrollToNarrativeFraction(page, 0.4);
    const returned = await sampleCanvas(page);

    // Only the idle drift differs, so allow a small tolerance: the animation
    // has a legitimate sinusoidal idle drift of ±0.012 local units, and these
    // tolerances (0.03, 20%) are roughly 2.5x that drift, not exact-equality.
    expect(Math.abs(returned.centroidX - forward.centroidX)).toBeLessThan(0.03);
    expect(Math.abs(returned.ink - forward.ink) / forward.ink).toBeLessThan(0.2);
  });

  test('keeps the canvas visible in light mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
    await scrollToNarrativeFraction(page, 0.4);
    const s = await sampleCanvas(page);
    expect(s.ink).toBeGreaterThan(100);
  });

  test('every narrative panel becomes fully readable at some scroll depth', async ({ page }) => {
    // 50 samples * ~2s per rAF-throttled double-frame wait ≈ 100s+ in headless Chrome.
    test.setTimeout(180_000);

    await page.goto('/');
    const peak = [0, 0, 0, 0];
    for (let f = 0; f <= 1; f += 0.02) {
      // Panels live inside #story, so this sweep must run over the narrative
      // range too — same reasoning as scrollToNarrativeFraction above.
      await scrollToNarrativeFraction(page, f);
      const opacities = await page.$$eval('.act-panel', (els) =>
        els.map((el) => parseFloat(getComputedStyle(el).opacity)),
      );
      opacities.forEach((o, i) => { if (o > peak[i]) peak[i] = o; });
    }
    for (const p of peak) expect(p).toBeGreaterThan(0.95);
  });
});
