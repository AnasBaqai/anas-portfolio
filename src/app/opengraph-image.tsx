import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { buildFormations } from '@/lib/formations';
import { resume } from '@/content/resume';

export const alt = `${resume.name} — ${resume.role}, ${resume.location}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const font = (file: string) =>
  readFileSync(join(process.cwd(), 'src/app/_og', file));

/**
 * Agent graph, index 3 — a router core wired to seven typed tools. Chosen over
 * the embedding field because at feed size a scatter of dots reads as noise,
 * while spokes read instantly as "an agent that calls tools", which is the work.
 */
const FORMATION = 3;
const PARTICLES = 120;
const CORE_COUNT = 18; // matches buildFormations: i < 18 is the router core
const TOOLS = 7;
const FIELD = 560;
const CX = 900;
const CY = 315;

export default function Image() {
  // Generated from the site's own animation data, not mocked up: this card is
  // literally a frame of the thing the visitor is about to scroll through.
  const points = buildFormations(PARTICLES, 1)[FORMATION];
  const at = (i: number) => ({
    x: CX + points[i * 2] * (FIELD / 2),
    y: CY + points[i * 2 + 1] * (FIELD / 2),
  });

  const core = Array.from({ length: CORE_COUNT }, (_, i) => at(i));

  // Group the outer particles by their tool index and take each cluster's
  // centroid — that is where the spoke terminates.
  const tools = Array.from({ length: TOOLS }, (_, t) => {
    const members = [];
    for (let i = CORE_COUNT; i < PARTICLES; i++) {
      if ((i - CORE_COUNT) % TOOLS === t) members.push(at(i));
    }
    const x = members.reduce((s, p) => s + p.x, 0) / members.length;
    const y = members.reduce((s, p) => s + p.y, 0) / members.length;
    return { x, y, members };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#0A0A0C',
          fontFamily: 'Archivo',
          overflow: 'hidden',
        }}
      >
        {/* Pool of light the field sits in — the vignette from the site's texture. */}
        <div
          style={{
            position: 'absolute',
            // Satori gives an inset-only box zero size — dimensions must be explicit.
            left: 0,
            top: 0,
            width: size.width,
            height: size.height,
            display: 'flex',
            background:
              'radial-gradient(620px 470px at 75% 50%, rgba(79,124,255,0.30), rgba(10,10,12,0) 70%)',
          }}
        />

        {/* Spokes: core -> each tool cluster. A rotated div per segment, placed
            on the segment's midpoint so the default centre transform-origin
            gives the right result without relying on transformOrigin support. */}
        {tools.map((t, i) => {
          const dx = t.x - CX;
          const dy = t.y - CY;
          const len = Math.sqrt(dx * dx + dy * dy);
          return (
            <div
              key={`spoke-${i}`}
              style={{
                position: 'absolute',
                left: CX + dx / 2 - len / 2,
                top: CY + dy / 2,
                width: len,
                height: 1.5,
                background: '#4F7CFF',
                opacity: 0.42,
                transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`,
              }}
            />
          );
        })}

        {/* Tool clusters — small satellites plus the terminating node. */}
        {tools.map((t, i) => (
          <div key={`tool-${i}`} style={{ display: 'flex' }}>
            {t.members.map((m, j) => (
              <div
                key={j}
                style={{
                  position: 'absolute',
                  left: m.x - 2.5,
                  top: m.y - 2.5,
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  background: '#4F7CFF',
                  opacity: 0.5,
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                left: t.x - 9,
                top: t.y - 9,
                width: 18,
                height: 18,
                borderRadius: 9,
                background: i % 3 === 0 ? '#7CE0C3' : '#4F7CFF',
                boxShadow:
                  i % 3 === 0
                    ? '0 0 22px rgba(124,224,195,0.85)'
                    : '0 0 20px rgba(79,124,255,0.8)',
              }}
            />
          </div>
        ))}

        {/* Router core. */}
        {core.map((p, i) => (
          <div
            key={`core-${i}`}
            style={{
              position: 'absolute',
              left: p.x - 3.5,
              top: p.y - 3.5,
              width: 7,
              height: 7,
              borderRadius: 4,
              background: '#F4F4F5',
              opacity: 0.9,
              boxShadow: '0 0 16px rgba(244,244,245,0.5)',
            }}
          />
        ))}

        {/* Type */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '68px 72px',
            width: 760,
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 21,
                fontWeight: 900,
                letterSpacing: 6,
                color: '#4F7CFF',
                textTransform: 'uppercase',
              }}
            >
              {resume.role}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 26,
                fontSize: 108,
                fontWeight: 900,
                letterSpacing: -6,
                lineHeight: 0.85,
                color: '#F4F4F5',
                textTransform: 'uppercase',
              }}
            >
              <div style={{ display: 'flex' }}>Muhammad</div>
              <div style={{ display: 'flex' }}>Anas</div>
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 26,
                fontFamily: 'Instrument',
                fontStyle: 'italic',
                fontSize: 50,
                color: '#7CE0C3',
                letterSpacing: -1,
              }}
            >
              builds AI systems
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Hairline rule — the site's one decoration. */}
            <div style={{ display: 'flex', width: 132, height: 2, background: '#4F7CFF' }} />
            <div
              style={{
                display: 'flex',
                marginTop: 20,
                fontSize: 27,
                fontWeight: 900,
                color: '#F4F4F5',
                letterSpacing: -0.5,
              }}
            >
              anasm.fyi
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 8,
                fontSize: 19,
                color: '#8A8A94',
                letterSpacing: 1,
              }}
            >
              {resume.location}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Archivo', data: font('archivo-900.ttf'), weight: 900, style: 'normal' },
        { name: 'Instrument', data: font('instrument-italic.ttf'), weight: 400, style: 'italic' },
      ],
    },
  );
}
