import { resume } from '@/content/resume';

export default function Projects() {
  return (
    <section id="projects" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="eyebrow">Built on my own time</p>
        <h2 className="display-lg mt-4 mb-12">Projects</h2>

        <div className="grid gap-5 md:grid-cols-3">
          {resume.projects.map((project) => (
            <article
              key={project.name}
              className="border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--acc)]"
            >
              <h3 className="font-display text-lg font-extrabold tracking-tight">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${project.name} — source on GitHub (opens in a new tab)`}
                  className="group inline-flex items-baseline gap-1.5 transition-colors hover:text-[var(--acc)]"
                >
                  {project.name}
                  {/* Arrow leans out on hover — the affordance that says "leaves the page". */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3 w-3 shrink-0 self-center text-[var(--faint)] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--acc)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              </h3>
              <p className="mt-1 font-body text-[12.5px] tracking-wide text-[var(--acc2)]">
                {project.tagline}
              </p>
              <p className="mt-4 font-body text-[14px] leading-relaxed text-[var(--dim)]">
                {project.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {project.chips.map((chip) => (
                  <li
                    key={chip}
                    className="border border-[var(--line)] px-2.5 py-1 font-body text-[11px] text-[var(--faint)]"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
