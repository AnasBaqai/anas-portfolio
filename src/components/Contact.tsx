import { resume } from '@/content/resume';

const LINKS = [
  { label: 'Email', value: resume.contact.email, href: `mailto:${resume.contact.email}` },
  { label: 'Phone', value: resume.contact.phone, href: `tel:${resume.contact.phone.replace(/\s/g, '')}` },
  { label: 'LinkedIn', value: 'anas-baqai-bo21', href: resume.contact.linkedin },
  { label: 'GitHub', value: 'AnasBaqai', href: resume.contact.github },
];

export default function Contact() {
  return (
    <section id="contact" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="eyebrow">Open to Full-Stack and AI roles</p>
        <h2 className="display-lg mt-4 mb-10">
          Let&rsquo;s <em className="emphasis">talk</em>
        </h2>

        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.label} className="bg-[var(--bg)]">
              <a
                href={link.href}
                className="group flex items-baseline gap-4 p-6 transition-colors hover:bg-[var(--surface)]"
                {...(link.href.startsWith('http')
                  ? { target: '_blank', rel: 'noreferrer noopener' }
                  : {})}
              >
                <span className="w-20 shrink-0 font-body text-[11px] tracking-[0.18em] uppercase text-[var(--faint)]">
                  {link.label}
                </span>
                <span className="font-display text-lg font-extrabold tracking-tight transition-colors group-hover:text-[var(--acc)]">
                  {link.value}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <a
          href={resume.contact.cv}
          download
          className="mt-6 inline-block border border-[var(--acc)] px-6 py-3 font-body text-[13.5px] font-medium text-[var(--acc)] transition-colors hover:bg-[var(--acc)] hover:text-[var(--bg)]"
        >
          Download CV (PDF)
        </a>
      </div>
    </section>
  );
}
