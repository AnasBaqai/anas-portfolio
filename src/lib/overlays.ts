import { clamp } from './math';
import { CLUSTERS, RAILS } from './formations';
import type { Palette } from './theme';

export interface SubjectState {
  cx: number;
  cy: number;
  scale: number;
  spin: number;
  time: number;
  points: Float32Array;
}

const TAU = Math.PI * 2;

/** Convert a CSS hex custom property to rgba(). Handles #RGB and #RRGGBB. */
export function rgba(hex: string, alpha: number): string {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** How visible a given overlay is, from continuous stage position s (0..4). */
export function stageWeight(s: number, stage: number): number {
  return clamp(1 - Math.abs(s - stage), 0, 1);
}

export function drawEmbedding(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  w: number,
  p: Palette,
  links: Int32Array,
  linkCount: number,
  lit: Float32Array,
): void {
  if (w <= 0.02) return;
  const { points, cx, cy, scale, time } = st;

  ctx.lineWidth = 0.8;
  ctx.strokeStyle = rgba(p.line, w * 0.9);
  ctx.beginPath();
  for (let k = 0; k < linkCount; k++) {
    const i = links[k * 2] * 2;
    const j = links[k * 2 + 1] * 2;
    ctx.moveTo(points[i], points[i + 1]);
    ctx.lineTo(points[j], points[j + 1]);
  }
  ctx.stroke();

  // The query vector: orbits the field, lighting its neighbourhood.
  const qa = time * 0.55;
  const qr = scale * 0.44;
  const qx = cx + Math.cos(qa) * scale * 0.42;
  const qy = cy + Math.sin(qa) * scale * 0.34;

  ctx.strokeStyle = rgba(p.acc, 0.32 * w);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(qx, qy, qr, 0, TAU);
  ctx.stroke();

  const n = points.length / 2;
  ctx.lineWidth = 0.9;
  for (let i = 0; i < n; i++) {
    const dx = points[i * 2] - qx;
    const dy = points[i * 2 + 1] - qy;
    const d = Math.hypot(dx, dy);
    if (d >= qr) continue;
    const strength = (1 - d / qr) * w;
    ctx.strokeStyle = rgba(p.acc2, strength * 0.55);
    ctx.beginPath();
    ctx.moveTo(qx, qy);
    ctx.lineTo(points[i * 2], points[i * 2 + 1]);
    ctx.stroke();
    if (strength > lit[i]) lit[i] = strength;
  }

  ctx.fillStyle = rgba(p.acc, 0.13 * w);
  ctx.beginPath();
  ctx.arc(qx, qy, scale * 0.06, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(p.acc, w);
  ctx.beginPath();
  ctx.arc(qx, qy, 3.4, 0, TAU);
  ctx.fill();
}

export function drawPipeline(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  w: number,
  p: Palette,
): void {
  if (w <= 0.02) return;
  const { cx, cy, scale, time } = st;
  const half = scale * 1.06;

  ctx.lineWidth = 1;
  ctx.strokeStyle = rgba(p.line, w);
  ctx.beginPath();
  for (const rail of RAILS) {
    ctx.moveTo(cx - half, cy + rail * scale);
    ctx.lineTo(cx + half, cy + rail * scale);
  }
  ctx.stroke();

  // Three stage gates: extract, validate, store.
  for (let g = 1; g <= 3; g++) {
    const gx = cx - half + (g * half * 2) / 4;
    ctx.strokeStyle = rgba(p.faint, 0.7 * w);
    ctx.beginPath();
    ctx.moveTo(gx, cy - 0.6 * scale);
    ctx.lineTo(gx, cy + 0.6 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(p.node, w);
    ctx.strokeStyle = rgba(p.faint, w);
    ctx.beginPath();
    ctx.rect(gx - 4, cy - 4, 8, 8);
    ctx.fill();
    ctx.stroke();
  }

  // Packets. Roughly one in seven is flagged and rerouted upward — this is
  // "flags fields the model is unsure about" made visible.
  const PACKETS = 16;
  for (let k = 0; k < PACKETS; k++) {
    const phase = (time * 0.24 + k / PACKETS) % 1;
    const rail = RAILS[k % 3];
    const flagged = k % 7 === 3;
    const divert = flagged ? clamp((phase - 0.5) * 2, 0, 1) * 0.17 : 0;
    const px = cx - half + phase * half * 2;
    const py = cy + rail * scale - divert * scale;
    const edgeFade = phase < 0.07 ? phase / 0.07 : phase > 0.93 ? (1 - phase) / 0.07 : 1;

    ctx.globalAlpha = edgeFade * w;
    ctx.fillStyle = flagged && divert > 0.02 ? p.warn : p.acc;
    ctx.fillRect(px - 6, py - 1.8, 12, 3.6);
    ctx.globalAlpha = 0.2 * w * edgeFade;
    ctx.fillRect(px - 21, py - 1.8, 15, 3.6);
  }
  ctx.globalAlpha = 1;
}

export function drawAgent(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  w: number,
  p: Palette,
): void {
  if (w <= 0.02) return;
  const { cx, cy, scale, spin, time } = st;
  const TOOLS = 7;

  for (let s = 0; s < TOOLS; s++) {
    const a = -Math.PI / 2 + s * (TAU / TOOLS) + spin;
    const ex = cx + Math.cos(a) * scale * 0.78;
    const ey = cy + Math.sin(a) * scale * 0.78;

    ctx.strokeStyle = rgba(p.line, w);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // A call travels out in the primary accent and the result returns in the
    // secondary — the tool-calling loop, literally.
    const phase = (time * 0.42 + s / TOOLS) % 1;
    const outbound = phase < 0.5;
    const f = outbound ? phase * 2 : (1 - phase) * 2;
    ctx.fillStyle = rgba(outbound ? p.acc : p.acc2, w);
    ctx.beginPath();
    ctx.arc(cx + (ex - cx) * f, cy + (ey - cy) * f, 3, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(p.node, w);
    ctx.strokeStyle = rgba(p.acc2, w);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = rgba(p.acc, 0.1 * w);
  ctx.beginPath();
  ctx.arc(cx, cy, scale * 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(p.node, w);
  ctx.strokeStyle = rgba(p.acc, w);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, scale * 0.09, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

export function drawConstellation(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  w: number,
  p: Palette,
): void {
  if (w <= 0.02) return;
  const { cx, cy, scale, spin } = st;

  ctx.setLineDash([3, 5]);
  ctx.strokeStyle = rgba(p.acc2, 0.3 * w);
  ctx.lineWidth = 1;
  for (const [gx, gy] of CLUSTERS) {
    const rx = gx * Math.cos(spin) - gy * Math.sin(spin);
    const ry = gx * Math.sin(spin) + gy * Math.cos(spin);
    ctx.beginPath();
    ctx.arc(cx + rx * scale, cy + ry * scale, scale * 0.33, 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  p: Palette,
  lit: Float32Array,
): void {
  const { points } = st;
  const n = points.length / 2;
  const base = rgba(p.faint, 0.85);

  ctx.fillStyle = base;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (lit[i] > 0.05) continue;
    const x = points[i * 2];
    const y = points[i * 2 + 1];
    ctx.moveTo(x + 1.5, y);
    ctx.arc(x, y, 1.5, 0, TAU);
  }
  ctx.fill();

  for (let i = 0; i < n; i++) {
    if (lit[i] <= 0.05) continue;
    ctx.fillStyle = rgba(p.acc2, 0.35 + lit[i] * 0.65);
    ctx.beginPath();
    ctx.arc(points[i * 2], points[i * 2 + 1], 2.3, 0, TAU);
    ctx.fill();
    lit[i] *= 0.93;
  }
}
