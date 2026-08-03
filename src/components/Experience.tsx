import { resume } from '@/content/resume';

export default function Experience() {
  return (
    <section id="experience" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="eyebrow">Where I have shipped</p>
        <h2 className="display-lg mt-4 mb-12">Experience</h2>

        <ol className="space-y-14">
          {resume.experience.map((role) => (
            <li key={`${role.company}-${role.period}`} className="border-t border-[var(--line)] pt-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-xl font-extrabold tracking-tight">{role.title}</h3>
                <span className="font-body text-[15px] text-[var(--acc)]">{role.company}</span>
                {role.context && (
                  <span className="font-body text-[13px] text-[var(--faint)]">({role.context})</span>
                )}
              </div>
              <p className="mt-1 font-body text-[12.5px] tracking-wide text-[var(--faint)]">
                {role.location} · {role.period}
              </p>
              <ul className="mt-5 space-y-3">
                {role.bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="max-w-[75ch] border-l border-[var(--line)] pl-4 font-body text-[14.5px] leading-relaxed text-[var(--dim)]"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
