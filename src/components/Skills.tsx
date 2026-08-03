import { resume } from '@/content/resume';

export default function Skills() {
  return (
    <section id="skills" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="eyebrow">The toolset</p>
        <h2 className="display-lg mt-4 mb-12">Skills</h2>

        <dl className="grid gap-8 md:grid-cols-2">
          {resume.skills.map((group) => (
            <div key={group.group} className="border-t border-[var(--line)] pt-4">
              <dt className="font-body text-[11px] tracking-[0.18em] uppercase text-[var(--faint)]">
                {group.group}
              </dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-body text-[12px] text-[var(--dim)]"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
