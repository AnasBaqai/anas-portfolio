'use client';

import { useEffect, useRef } from 'react';
import { panelVisibility, subscribeToFrame } from '@/lib/scroll';
import type { Act as ActData } from '@/content/resume';

export default function Act({ act }: { act: ActData }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    if (!section || !panel) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // copy stays at the CSS default of opacity 1

    const direction = act.side === 'right' ? 1 : -1;

    return subscribeToFrame(() => {
      const rect = section.getBoundingClientRect();
      const v = panelVisibility(rect.top, rect.height, window.innerHeight);
      panel.style.opacity = String(v);
      panel.style.transform =
        `translate3d(${(1 - v) * 70 * direction}px, ${(1 - v) * 26}px, 0)`;
    });
  }, [act.side]);

  const alignment = act.side === 'right' ? 'justify-end text-right' : 'justify-start';

  return (
    <div
      ref={sectionRef}
      className={`relative flex h-[110vh] items-center px-[6vw] ${alignment}`}
    >
      <div ref={panelRef} className="act-panel max-w-[480px] will-change-transform">
        <p className="eyebrow mb-4">{act.kicker}</p>
        <h2 className="display-lg mb-5">
          {act.heading}
          <em className="emphasis">{act.emphasis}</em>
          {act.headingTail}
        </h2>
        <p className="mb-5 font-body text-[15.5px] leading-relaxed text-[var(--dim)]">
          {act.body}
        </p>
        <ul className={`flex flex-wrap gap-2 ${act.side === 'right' ? 'justify-end' : ''}`}>
          {act.chips.map((chip) => (
            <li
              key={chip}
              className="border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-body text-[11.5px] text-[var(--dim)]"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
