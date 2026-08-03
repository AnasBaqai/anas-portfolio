import { resume } from '@/content/resume';

export default function Credentials() {
  return (
    <section id="credentials" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow">Education</p>
          <h2 className="display-lg mt-4 mb-8">Studied</h2>
          <ul className="space-y-6">
            {resume.education.map((entry) => (
              <li key={entry.school} className="border-t border-[var(--line)] pt-4">
                <h3 className="font-display text-base font-extrabold tracking-tight">{entry.school}</h3>
                <p className="mt-1 font-body text-[14px] text-[var(--dim)]">{entry.degree}</p>
                <p className="mt-1 font-body text-[12.5px] text-[var(--faint)]">
                  {entry.location} · {entry.period}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Published</p>
          <h2 className="display-lg mt-4 mb-8">Research</h2>
          <div className="border-t border-[var(--line)] pt-4">
            <h3 className="max-w-[45ch] font-display text-base font-extrabold tracking-tight">
              <a
                href={resume.publication.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${resume.publication.title} — read on IEEE Xplore (opens in a new tab)`}
                className="group inline transition-colors hover:text-[var(--acc)]"
              >
                {resume.publication.title}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="ml-1.5 inline h-3 w-3 shrink-0 align-baseline text-[var(--faint)] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--acc)]"
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
              {resume.publication.venue}
            </p>
            <p className="mt-3 max-w-[60ch] font-body text-[14px] leading-relaxed text-[var(--dim)]">
              {resume.publication.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
