import { resume } from '@/content/resume';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { href: '#story', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
];

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1240px] items-center gap-4 px-[6vw] py-3 md:px-8">
        <a href="#hero" className="font-display text-sm font-extrabold tracking-tight uppercase">
          {resume.name}
        </a>
        <ul className="ml-auto hidden items-center gap-5 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="font-body text-[12.5px] text-[var(--dim)] transition-colors hover:text-[var(--ink)]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={resume.contact.cv}
          download
          className="ml-auto rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-body text-[11.5px] transition-colors hover:border-[var(--acc)] md:ml-0"
        >
          CV
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
