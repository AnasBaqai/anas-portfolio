'use client';

import { useEffect, useRef } from 'react';
import { narrativeProgress, subscribeToFrame } from '@/lib/scroll';
import {
  buildFormations, epilogueAt, interpolateInto, journeyAt, stageAt, FORMATION_COUNT,
} from '@/lib/formations';
import { computeLinks } from '@/lib/neighbors';
import {
  drawAgent, drawConstellation, drawEmbedding, drawParticles, drawPipeline, stageWeight,
} from '@/lib/overlays';
import { readPalette, type Palette } from '@/lib/theme';

const DESKTOP_PARTICLES = 180;
const MOBILE_PARTICLES = 90;
const MOBILE_BREAKPOINT = 768;
const LINK_RADIUS_FACTOR = 0.19;
/** Links are recomputed at ~20fps but drawn every frame — invisible, and far cheaper. */
const LINK_INTERVAL_MS = 50;
const IDLE_DRIFT = 0.012;

function particleCount(width: number): number {
  return width < MOBILE_BREAKPOINT ? MOBILE_PARTICLES : DESKTOP_PARTICLES;
}

export default function Subject() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // No canvas support: the site is fully readable without it.
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let n = 0;
    let formations: Float32Array[] = [];
    let points = new Float32Array(0);
    let lit = new Float32Array(0);
    let links = new Int32Array(0);
    let linkCount = 0;
    let lastLinkAt = -Infinity;
    let palette: Palette = readPalette();

    function rebuild() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      n = particleCount(width);
      formations = buildFormations(n);
      points = new Float32Array(n * 2);
      lit = new Float32Array(n);
      links = new Int32Array(n * 24); // generous cap; computeLinks stops when full
      linkCount = 0;
      lastLinkAt = -Infinity;
    }

    rebuild();

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 150);
    };
    window.addEventListener('resize', onResize);

    // Re-cache canvas colours when the theme flips — one data-theme change must
    // drive DOM and canvas together.
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme'],
    });

    function narrativeBounds() {
      const hero = document.getElementById('hero');
      const story = document.getElementById('story');
      const heroHeight = hero?.offsetHeight ?? window.innerHeight;
      const start = heroHeight * 0.55;
      const end = story
        ? story.offsetTop + story.offsetHeight - window.innerHeight * 0.5
        : start + window.innerHeight * 4;
      return { start, end };
    }

    /** Furthest scrollY the document allows — the end of the epilogue. */
    function maxScroll() {
      return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    }

    const unsubscribe = subscribeToFrame((scrollY, time) => {
      if (document.hidden) return;

      const { start, end } = narrativeBounds();
      const progress = narrativeProgress(scrollY, start, end);
      const { index, frac: rawFrac } = stageAt(progress);
      // Reduced motion: snap to the nearest formation instead of morphing
      // between them, so the shape is still meaningful but never in transit.
      const frac = reduced ? Math.round(rawFrac) : rawFrac;
      const s = progress * (FORMATION_COUNT - 1);

      // Past the narrative the formation stops changing, so the subject would
      // sit frozen through Experience, Projects, Skills and Contact — over half
      // the page. The epilogue keeps it travelling, still purely scroll-driven.
      const epilogue = narrativeProgress(scrollY, end, maxScroll());
      const { cx, cy, scale } = epilogue > 0
        ? epilogueAt(epilogue, width, height)
        : journeyAt(index, frac, width, height);
      const spin = reduced ? 0 : (progress + epilogue * 0.85) * 0.9;

      interpolateInto(formations, index, frac, points);

      // Local space -> viewport pixels, with rotation and a breathing idle drift.
      const cos = Math.cos(spin);
      const sin = Math.sin(spin);
      for (let i = 0; i < n; i++) {
        let lx = points[i * 2];
        let ly = points[i * 2 + 1];
        if (!reduced) {
          lx += Math.sin(time * 0.5 + i) * IDLE_DRIFT;
          ly += Math.cos(time * 0.42 + i) * IDLE_DRIFT;
        }
        points[i * 2] = cx + (lx * cos - ly * sin) * scale;
        points[i * 2 + 1] = cy + (lx * sin + ly * cos) * scale;
      }

      const state = { cx, cy, scale, spin, time: reduced ? 0 : time, points };

      const wEmbed = stageWeight(s, 1);
      if (wEmbed > 0.02) {
        const nowMs = time * 1000;
        if (nowMs - lastLinkAt > LINK_INTERVAL_MS) {
          linkCount = computeLinks(points, scale * LINK_RADIUS_FACTOR, links);
          lastLinkAt = nowMs;
        }
      }

      ctx!.clearRect(0, 0, width, height);
      drawEmbedding(ctx!, state, wEmbed, palette, links, linkCount, lit);
      drawPipeline(ctx!, state, stageWeight(s, 2), palette);
      drawAgent(ctx!, state, stageWeight(s, 3), palette);
      drawConstellation(ctx!, state, stageWeight(s, 4), palette);
      drawParticles(ctx!, state, palette, lit);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="subject"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen"
    />
  );
}
